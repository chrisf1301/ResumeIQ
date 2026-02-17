import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(request) {
    try {
        const { resumeId, jobDescription } = await request.json();

        if (!resumeId || !jobDescription) {
            return NextResponse.json({ error: 'Resume ID and job description required' }, { status: 400 });
        }

        // Get resume from database
        const resumeQuery = 'SELECT * FROM resumes WHERE id = $1';
        const resumeResult = await pool.query(resumeQuery, [resumeId]);
        
        if (resumeResult.rows.length === 0) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
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

        return NextResponse.json({
            success: true,
            score,
            resumeId,
            matchId: matchResult.rows[0].id,
            analyzedAt: matchResult.rows[0].analyzed_at
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
