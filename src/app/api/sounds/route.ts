import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SOUNDS } from '@/lib/mock-data';
import { Sound } from '@/lib/types';

// Try to use DB; fall back to mock data if DATABASE_URL is not configured
async function getSounds(category?: string, search?: string): Promise<Sound[]> {
  if (!process.env.DATABASE_URL) {
    let sounds = [...MOCK_SOUNDS];
    if (category && category !== 'All') {
      sounds = sounds.filter(s => s.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      sounds = sounds.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.mood.toLowerCase().includes(q) ||
          (s.tags as string[]).some(t => t.toLowerCase().includes(q))
      );
    }
    return sounds.sort((a, b) => b.trend_score - a.trend_score);
  }

  const pool = (await import('@/lib/db')).default;
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (category && category !== 'All') {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(title ILIKE $${values.length} OR artist ILIKE $${values.length} OR mood ILIKE $${values.length})`
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query<Sound>(
    `SELECT * FROM sounds ${where} ORDER BY trend_score DESC LIMIT 100`,
    values
  );
  return result.rows.map(row => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const sounds = await getSounds(category, search);
    return NextResponse.json({ sounds });
  } catch (err) {
    console.error('[GET /api/sounds]', err);
    return NextResponse.json({ error: 'Failed to fetch sounds' }, { status: 500 });
  }
}
