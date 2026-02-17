import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize database tables on first API call
export async function GET() {
    try {
        await initializeDatabase();
        return NextResponse.json({ success: true, message: 'Database initialized' });
    } catch (error) {
        console.error('Init error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
