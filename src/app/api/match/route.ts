import { NextRequest, NextResponse } from 'next/server';
import { analyzeClipWithAI } from '@/lib/ai-analyze';
import { topMatches } from '@/lib/matcher';
import { MOCK_SOUNDS } from '@/lib/mock-data';
import { Sound, ClipAnalysis } from '@/lib/types';

export const maxDuration = 30;

/**
 * POST /api/match
 *
 * Body (JSON):
 *   clip_id?   string  — ID of a previously uploaded clip (loads from DB)
 *   title?     string  — clip title (used when no clip_id)
 *   duration?  number  — clip duration in seconds
 *   tags?      string[]
 *   energy?    number  — 1–10 (skip AI if provided)
 *   tempo?     number  — BPM (skip AI if provided)
 *   category?  string
 *   mood?      string
 *   pace?      string
 *
 * Returns: { analysis, matches: MatchResult[top 3] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clip_id,
      title = 'Unknown Clip',
      duration = 15,
      tags = [],
      energy,
      tempo,
      category,
      mood,
      pace,
    } = body as {
      clip_id?: string;
      title?: string;
      duration?: number;
      tags?: string[];
      energy?: number;
      tempo?: number;
      category?: string;
      mood?: string;
      pace?: string;
    };

    // ── Load clip from DB if clip_id provided ────────────────────────────────
    let analysis: ClipAnalysis;

    if (clip_id && process.env.DATABASE_URL) {
      const pool = (await import('@/lib/db')).default;
      const result = await pool.query('SELECT * FROM clips WHERE id = $1', [clip_id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
      }
      const clip = result.rows[0];
      analysis = {
        energy:   clip.energy ?? 5,
        tempo:    clip.tempo ?? 100,
        mood:     clip.ai_mood ?? 'neutral',
        category: clip.ai_category ?? 'Other',
        pace:     clip.ai_pace ?? 'medium',
        tags:     typeof clip.tags === 'string' ? JSON.parse(clip.tags) : (clip.tags ?? []),
      };
    } else if (energy && tempo && category && mood && pace) {
      // All fields provided — skip AI call
      analysis = {
        energy,
        tempo,
        category,
        mood,
        pace: pace as ClipAnalysis['pace'],
        tags,
      };
    } else {
      // Run AI analysis from metadata
      analysis = await analyzeClipWithAI({ title, duration, tags });
    }

    // ── Load sounds ──────────────────────────────────────────────────────────
    let sounds: Sound[];
    if (process.env.DATABASE_URL) {
      const pool = (await import('@/lib/db')).default;
      const result = await pool.query<Sound>('SELECT * FROM sounds ORDER BY trend_score DESC');
      sounds = result.rows.map(row => ({
        ...row,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
        best_segments:
          typeof row.best_segments === 'string'
            ? JSON.parse(row.best_segments)
            : (row.best_segments ?? []),
      }));
    } else {
      sounds = MOCK_SOUNDS;
    }

    // ── Score and rank ───────────────────────────────────────────────────────
    const matches = topMatches(analysis, sounds, duration, 3);

    // ── Persist matches (if DB available) ────────────────────────────────────
    if (clip_id && process.env.DATABASE_URL) {
      const pool = (await import('@/lib/db')).default;
      // Delete stale matches for this clip, then insert fresh ones
      await pool.query('DELETE FROM matches WHERE clip_id = $1', [clip_id]);
      for (const m of matches) {
        await pool.query(
          'INSERT INTO matches (clip_id, sound_id, score, start_time, end_time) VALUES ($1,$2,$3,$4,$5)',
          [clip_id, m.sound_id, m.score, m.start_time, m.end_time]
        );
      }
    }

    return NextResponse.json({ analysis, matches });
  } catch (err) {
    console.error('[POST /api/match]', err);
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 });
  }
}
