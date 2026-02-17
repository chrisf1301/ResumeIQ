import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = 'SELECT id, filename, s3_url, uploaded_at FROM resumes ORDER BY uploaded_at DESC';
        const result = await pool.query(query);
        
        return NextResponse.json({ resumes: result.rows });
    } catch (error) {
        console.error('List error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
