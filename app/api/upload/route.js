import { NextResponse } from 'next/server';
import path from 'path';
import mammoth from 'mammoth';
import { uploadToS3 } from '@/lib/s3';
import { pool } from '@/lib/db';

// Disable body parsing, we'll handle it manually
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Extract text from different file types
async function extractText(buffer, filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.pdf') {
        // Dynamic import for CommonJS module
        const pdfParse = (await import('pdf-parse')).default;
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

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('resume');
        
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalname = file.name;
        const mimetype = file.type;
        
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

        return NextResponse.json({
            success: true,
            resumeId: resume.id,
            filename: resume.filename,
            s3Url: resume.s3_url,
            message: 'Resume uploaded and saved to database'
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Provide more helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('signature')) {
            errorMessage = 'AWS credentials error. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel environment variables.';
        } else if (error.message.includes('bucket')) {
            errorMessage = 'S3 bucket error. Please check your S3_BUCKET_NAME and AWS_REGION in Vercel environment variables.';
        }
        
        return NextResponse.json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
