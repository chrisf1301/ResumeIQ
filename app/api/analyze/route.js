import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

// AI-powered matching with detailed feedback
async function analyzeWithAI(resumeText, jobDescription) {
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are an expert resume analyzer. Analyze how well a resume matches a job description and provide detailed feedback.

RESUME TEXT:
${resumeText.substring(0, 3000)}${resumeText.length > 3000 ? '...' : ''}

JOB DESCRIPTION:
${jobDescription}

Provide a JSON response with this exact structure:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "summary": "A brief 2-3 sentence summary of the match"
}

Focus on:
- Skills alignment
- Experience relevance
- Education/qualifications match
- Missing requirements
- How to improve the match

Return ONLY valid JSON, no other text.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional resume analyzer. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content;
        const analysis = JSON.parse(responseText);

        return {
            score: Math.min(100, Math.max(0, analysis.score || 0)),
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            recommendations: analysis.recommendations || [],
            summary: analysis.summary || 'Analysis complete.'
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('AI analysis failed: ' + error.message);
    }
}

// Fallback keyword matching
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
    
    return {
        score: Math.min(100, Math.max(0, score)),
        strengths: [],
        weaknesses: [],
        recommendations: [],
        summary: 'Basic keyword matching completed.'
    };
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
        
        // Try AI analysis first, fallback to keyword matching
        let analysis;
        try {
            analysis = await analyzeWithAI(resume.extracted_text, jobDescription);
        } catch (error) {
            console.warn('AI analysis failed, using keyword matching:', error.message);
            analysis = calculateMatchScore(resume.extracted_text, jobDescription);
        }

        // Save match result to database (store feedback as JSON)
        const insertQuery = `
            INSERT INTO match_results (resume_id, job_description, score)
            VALUES ($1, $2, $3)
            RETURNING id, analyzed_at
        `;
        const matchResult = await pool.query(insertQuery, [resumeId, jobDescription, analysis.score]);

        return NextResponse.json({
            success: true,
            score: analysis.score,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
            summary: analysis.summary,
            resumeId,
            matchId: matchResult.rows[0].id,
            analyzedAt: matchResult.rows[0].analyzed_at
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
