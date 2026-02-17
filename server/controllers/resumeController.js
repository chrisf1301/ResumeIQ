const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { uploadToS3, getFromS3, deleteFromS3 } = require('../config/s3');
const { pool } = require('../config/db');

// Extract text from different file types
async function extractText(buffer, filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.pdf') {
        const data = await pdfParse(buffer);
        return data.text;
    } 
    else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } 
    else if (ext === '.doc') {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch {
            return 'Unable to extract text from .doc file. Please use .docx format.';
        }
    } 
    else if (ext === '.txt') {
        return buffer.toString('utf-8');
    }
    
    throw new Error('Unsupported file type');
}

// Calculate match score between resume and job description
function calculateMatchScore(resumeText, jobDescription) {
    const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    const normalizedResume = normalize(resumeText);
    const normalizedJob = normalize(jobDescription);
    
    const jobWords = normalizedJob.split(/\s+/).filter(word => word.length >= 3);
    const uniqueJobWords = [...new Set(jobWords)];
    
    let matchCount = 0;
    for (const word of uniqueJobWords) {
        if (normalizedResume.includes(word)) {
            matchCount++;
        }
    }
    
    const score = uniqueJobWords.length > 0 
        ? Math.round((matchCount / uniqueJobWords.length) * 100) 
        : 0;
    
    return Math.min(100, Math.max(0, score));
}

// Upload resume
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, buffer, mimetype } = req.file;
        
        // Extract text from the file
        const text = await extractText(buffer, originalname);
        
        // Upload to S3
        const s3Result = await uploadToS3(buffer, originalname, mimetype);
        
        // Save to database
        const query = `
            INSERT INTO resumes (filename, s3_key, s3_url, extracted_text)
            VALUES ($1, $2, $3, $4)
            RETURNING id, filename, s3_url, uploaded_at
        `;
        const values = [originalname, s3Result.key, s3Result.url, text];
        const result = await pool.query(query, values);
        const resume = result.rows[0];

        res.json({
            success: true,
            resumeId: resume.id,
            filename: resume.filename,
            s3Url: resume.s3_url,
            message: 'Resume uploaded and saved to database'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Analyze match between resume and job description
exports.analyzeMatch = async (req, res) => {
    try {
        const { resumeId, jobDescription } = req.body;

        if (!resumeId || !jobDescription) {
            return res.status(400).json({ error: 'Resume ID and job description required' });
        }

        // Get resume from database
        const resumeQuery = 'SELECT * FROM resumes WHERE id = $1';
        const resumeResult = await pool.query(resumeQuery, [resumeId]);
        
        if (resumeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resume = resumeResult.rows[0];
        const score = calculateMatchScore(resume.extracted_text, jobDescription);

        // Save match result to database
        const insertQuery = `
            INSERT INTO match_results (resume_id, job_description, score)
            VALUES ($1, $2, $3)
            RETURNING id, analyzed_at
        `;
        const matchResult = await pool.query(insertQuery, [resumeId, jobDescription, score]);

        res.json({
            success: true,
            score,
            resumeId,
            matchId: matchResult.rows[0].id,
            analyzedAt: matchResult.rows[0].analyzed_at
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
};

// List all resumes
exports.listResumes = async (req, res) => {
    try {
        const query = 'SELECT id, filename, s3_url, uploaded_at FROM resumes ORDER BY uploaded_at DESC';
        const result = await pool.query(query);
        
        res.json({ resumes: result.rows });
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a resume
exports.deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get resume first
        const selectQuery = 'SELECT s3_key FROM resumes WHERE id = $1';
        const selectResult = await pool.query(selectQuery, [id]);
        
        if (selectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // Delete from S3
        await deleteFromS3(selectResult.rows[0].s3_key);
        
        // Delete from database (cascades to match_results)
        const deleteQuery = 'DELETE FROM resumes WHERE id = $1';
        await pool.query(deleteQuery, [id]);

        res.json({ success: true, message: 'Resume deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get match history for a resume
exports.getMatchHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT id, job_description, score, analyzed_at 
            FROM match_results 
            WHERE resume_id = $1 
            ORDER BY analyzed_at DESC
        `;
        const result = await pool.query(query, [id]);
        
        res.json({ matches: result.rows });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: error.message });
    }
};
