import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SOUNDS } from '@/lib/mock-data';

/**
 * POST /api/cron/fetch-trends
 *
 * Ingestion pipeline:
 * 1. Fetch or simulate trending audio metadata
 * 2. Compute trend_score = (recent_views * 0.4) + (reuse_count * 0.3) + (growth_rate * 0.3)
 * 3. Upsert into `sounds`
 * 4. Insert time-series snapshot into `trends_history`
 *
 * Secured with CRON_SECRET header when deployed.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret when set
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      message: 'No DATABASE_URL configured — running in mock mode. No data persisted.',
      sounds_processed: MOCK_SOUNDS.length,
    });
  }

  const pool = (await import('@/lib/db')).default;

  let upserted = 0;
  let snapshots = 0;

  for (const sound of MOCK_SOUNDS) {
    // Simulate live fetch: add minor variance to scores
    const variance = 0.97 + Math.random() * 0.06; // ±3%
    const recent_views = Math.floor(sound.reuse_count * 8 * variance * 0.05);
    const growth_rate = Math.round((variance - 1) * 1000) / 10; // -1.5 to +1.5 %

    const trend_score =
      Math.round(
        (recent_views / 10000) * 0.4 * 100 +
          (sound.reuse_count / 200000) * 0.3 * 100 +
          ((growth_rate + 2) / 4) * 0.3 * 100
      ) / 1;

    const velocity_score = Math.min(100, Math.round(trend_score * variance));

    await pool.query(
      `INSERT INTO sounds (
        id, platform, sound_url, embed_url, title, artist, duration,
        trend_score, velocity_score, reuse_count, category, mood, tags,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE SET
        trend_score    = EXCLUDED.trend_score,
        velocity_score = EXCLUDED.velocity_score,
        reuse_count    = $10,
        updated_at     = NOW()`,
      [
        sound.id,
        sound.platform,
        sound.sound_url,
        sound.embed_url,
        sound.title,
        sound.artist,
        sound.duration,
        trend_score,
        velocity_score,
        sound.reuse_count,
        sound.category,
        sound.mood,
        JSON.stringify(sound.tags),
      ]
    );
    upserted++;

    await pool.query(
      `INSERT INTO trends_history (sound_id, timestamp, views, uses, growth_rate)
       VALUES ($1, NOW(), $2, $3, $4)`,
      [sound.id, recent_views, Math.floor(sound.reuse_count * variance * 0.001), growth_rate]
    );
    snapshots++;
  }

  return NextResponse.json({
    message: 'Trend pipeline complete',
    sounds_upserted: upserted,
    snapshots_inserted: snapshots,
    timestamp: new Date().toISOString(),
  });
}

// Also allow GET so Vercel Cron (which sends GET) works out of the box
export async function GET(request: NextRequest) {
  return POST(request);
}
