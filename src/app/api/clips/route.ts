import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { analyzeClipWithAI } from '@/lib/ai-analyze';
import { Clip } from '@/lib/types';

// Max upload size: 100 MB
export const maxDuration = 60;

/**
 * POST /api/clips
 *
 * Accepts multipart/form-data:
 *   clip      File    — video file (mp4, mov, webm)
 *   title     string  — display name
 *   tags      string  — comma-separated tags (optional)
 *   duration  number  — clip length in seconds (optional; ffprobe if omitted)
 *   tempo     number  — estimated BPM (optional; AI will derive if omitted)
 *   energy    number  — 1–10 (optional; AI will derive if omitted)
 *
 * Returns: { clip }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file     = formData.get('clip') as File | null;
    const title    = (formData.get('title') as string) || 'Untitled Clip';
    const tagsRaw  = (formData.get('tags') as string) || '';
    const duration = parseInt((formData.get('duration') as string) || '15', 10);
    const tempo    = parseInt((formData.get('tempo') as string) || '0', 10);
    const energy   = parseInt((formData.get('energy') as string) || '0', 10);

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    // ── AI analysis ──────────────────────────────────────────────────────────
    let frameBase64: string | undefined;

    // If a video file was uploaded, save it temporarily and extract a keyframe
    let file_url = '';
    if (file && file.size > 0) {
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Unsupported file type. Use mp4, mov, or webm.' }, { status: 400 });
      }
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Max 100 MB.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const tmpDir = path.join('/tmp', 'audio-intel-clips');
      await mkdir(tmpDir, { recursive: true });

      const id = crypto.randomUUID();
      const ext = file.name.split('.').pop() ?? 'mp4';
      const filePath = path.join(tmpDir, `${id}.${ext}`);
      await writeFile(filePath, buffer);
      file_url = filePath;

      // Try to extract a keyframe for richer AI analysis
      frameBase64 = await extractKeyframe(filePath).catch(() => undefined);
    }

    const analysis = await analyzeClipWithAI({ title, duration, tags }, frameBase64);

    // ── Persist to DB (or build in-memory record) ─────────────────────────────
    const clipId = crypto.randomUUID();
    const now = new Date().toISOString();

    const clip: Clip = {
      id: clipId,
      title,
      tags,
      tempo: tempo || analysis.tempo,
      energy: energy || analysis.energy,
      duration,
      file_url,
      ai_mood: analysis.mood,
      ai_pace: analysis.pace,
      ai_category: analysis.category,
      created_at: now,
    };

    if (process.env.DATABASE_URL) {
      const pool = (await import('@/lib/db')).default;
      await pool.query(
        `INSERT INTO clips (id, title, tags, tempo, energy, duration, file_url, ai_mood, ai_pace, ai_category, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          clip.id, clip.title, JSON.stringify(clip.tags), clip.tempo, clip.energy,
          clip.duration, clip.file_url, clip.ai_mood, clip.ai_pace, clip.ai_category, now,
        ]
      );
    }

    return NextResponse.json({ clip, analysis });
  } catch (err) {
    console.error('[POST /api/clips]', err);
    return NextResponse.json({ error: 'Failed to process clip' }, { status: 500 });
  }
}

/** Extract the first keyframe of a video as a JPEG base64 string using FFmpeg. */
async function extractKeyframe(videoPath: string): Promise<string> {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  const { readFile, unlink } = await import('fs/promises');
  const outputPath = videoPath.replace(/\.[^.]+$/, '_frame.jpg');

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({ count: 1, timemarks: ['00:00:01'], filename: path.basename(outputPath), folder: path.dirname(outputPath) });
  });

  const data = await readFile(outputPath);
  await unlink(outputPath).catch(() => undefined);
  return data.toString('base64');
}
