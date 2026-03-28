import { NextRequest, NextResponse } from 'next/server';
import { generateTrendHistory } from '@/lib/mock-data';
import { TrendHistory } from '@/lib/types';

async function getTrendHistory(soundId: string): Promise<TrendHistory[]> {
  if (!process.env.DATABASE_URL) {
    return generateTrendHistory(soundId);
  }

  const pool = (await import('@/lib/db')).default;
  const result = await pool.query<TrendHistory>(
    `SELECT * FROM trends_history
     WHERE sound_id = $1
     ORDER BY timestamp ASC
     LIMIT 90`,
    [soundId]
  );
  return result.rows;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { sound_id: string } }
) {
  try {
    const history = await getTrendHistory(params.sound_id);
    return NextResponse.json({ history });
  } catch (err) {
    console.error(`[GET /api/trends/${params.sound_id}]`, err);
    return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 });
  }
}
