import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SOUNDS } from '@/lib/mock-data';
import { Sound } from '@/lib/types';

async function getSound(id: string): Promise<Sound | null> {
  if (!process.env.DATABASE_URL) {
    return MOCK_SOUNDS.find(s => s.id === id) ?? null;
  }

  const pool = (await import('@/lib/db')).default;
  const result = await pool.query<Sound>('SELECT * FROM sounds WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sound = await getSound(params.id);
    if (!sound) {
      return NextResponse.json({ error: 'Sound not found' }, { status: 404 });
    }
    return NextResponse.json({ sound });
  } catch (err) {
    console.error(`[GET /api/sounds/${params.id}]`, err);
    return NextResponse.json({ error: 'Failed to fetch sound' }, { status: 500 });
  }
}
