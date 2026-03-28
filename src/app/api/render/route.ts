import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

export const maxDuration = 120; // 2 minutes for FFmpeg processing

/**
 * POST /api/render
 *
 * Accepts multipart/form-data:
 *   clip        File    — user's video file (mp4, mov, webm)
 *   audio       File    — user-provided audio file (mp3, wav, aac)
 *                         ⚠️  Must be user-owned / rights-cleared audio.
 *                             Do NOT pass platform audio URLs here.
 *   start_time  number  — audio trim start (seconds)
 *   end_time    number  — audio trim end (seconds)
 *
 * Returns: video/mp4 stream — the rendered output.
 *
 * ─── Copyright note ──────────────────────────────────────────────────────────
 * This endpoint only processes files the caller uploads directly.
 * It does NOT fetch, proxy, or re-serve any audio from third-party platforms.
 * The caller is responsible for ensuring they have rights to the audio they supply.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(request: NextRequest) {
  const tmpDir = path.join('/tmp', 'audio-intel-render');
  const jobId  = crypto.randomUUID();
  const jobDir = path.join(tmpDir, jobId);

  try {
    await mkdir(jobDir, { recursive: true });

    const formData   = await request.formData();
    const clipFile   = formData.get('clip')  as File | null;
    const audioFile  = formData.get('audio') as File | null;
    const startTime  = parseFloat((formData.get('start_time')  as string) || '0');
    const endTime    = parseFloat((formData.get('end_time')    as string) || '15');

    if (!clipFile || clipFile.size === 0) {
      return NextResponse.json({ error: 'clip file is required' }, { status: 400 });
    }
    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        {
          error:   'audio file is required',
          message: 'Provide your own rights-cleared audio file. Platform audio cannot be processed.',
        },
        { status: 400 }
      );
    }
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'end_time must be greater than start_time' }, { status: 400 });
    }

    // ── Validate types ────────────────────────────────────────────────────────
    const allowedVideo = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/x-m4a', 'audio/mp4'];

    if (!allowedVideo.includes(clipFile.type)) {
      return NextResponse.json({ error: 'Video must be mp4, mov, or webm' }, { status: 400 });
    }
    if (!allowedAudio.includes(audioFile.type)) {
      return NextResponse.json({ error: 'Audio must be mp3, wav, or aac' }, { status: 400 });
    }
    if (clipFile.size > 100 * 1024 * 1024 || audioFile.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'Files too large. Video max 100 MB, Audio max 30 MB.' }, { status: 400 });
    }

    // ── Write to tmp ──────────────────────────────────────────────────────────
    const clipExt  = clipFile.name.split('.').pop() ?? 'mp4';
    const audioExt = audioFile.name.split('.').pop() ?? 'mp3';
    const clipPath   = path.join(jobDir, `clip.${clipExt}`);
    const audioPath  = path.join(jobDir, `audio.${audioExt}`);
    const outputPath = path.join(jobDir, 'output.mp4');

    await writeFile(clipPath,  Buffer.from(await clipFile.arrayBuffer()));
    await writeFile(audioPath, Buffer.from(await audioFile.arrayBuffer()));

    // ── FFmpeg render ─────────────────────────────────────────────────────────
    await renderWithFFmpeg({ clipPath, audioPath, outputPath, startTime, endTime });

    // ── Stream output back ────────────────────────────────────────────────────
    const outputBuffer = await readFile(outputPath);

    // Fire-and-forget cleanup after a short delay
    setTimeout(() => cleanupDir(jobDir), 10_000);

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'video/mp4',
        'Content-Disposition': `attachment; filename="audio-intel-output-${jobId.slice(0, 8)}.mp4"`,
        'Content-Length':      String(outputBuffer.byteLength),
        'Cache-Control':       'no-store',
      },
    });
  } catch (err) {
    cleanupDir(jobDir);
    console.error('[POST /api/render]', err);

    if (err instanceof FFmpegNotFoundError) {
      return NextResponse.json(
        {
          error:  'FFmpeg not installed',
          detail: 'Install FFmpeg on the server: sudo apt-get install ffmpeg',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Render failed', detail: String(err) }, { status: 500 });
  }
}

// ─── FFmpeg helpers ───────────────────────────────────────────────────────────

class FFmpegNotFoundError extends Error {}

interface RenderOptions {
  clipPath:   string;
  audioPath:  string;
  outputPath: string;
  startTime:  number;
  endTime:    number;
}

function renderWithFFmpeg({
  clipPath, audioPath, outputPath, startTime, endTime,
}: RenderOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let ffmpeg: typeof import('fluent-ffmpeg');
    try {
      ffmpeg = (await import('fluent-ffmpeg')).default;
    } catch {
      return reject(new FFmpegNotFoundError('fluent-ffmpeg not available'));
    }

    // Build filter_complex to trim the audio segment
    // [1]atrim=start=<s>:end=<e>,asetpts=PTS-STARTPTS[a]
    // Map video from input 0, trimmed audio [a], take shortest stream
    const audioDur = endTime - startTime;
    const filter = `[1:a]atrim=start=${startTime}:end=${endTime},asetpts=PTS-STARTPTS[a]`;

    ffmpeg(clipPath)
      .input(audioPath)
      .complexFilter(filter)
      .outputOptions([
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        `-t`, String(audioDur),
        '-movflags', '+faststart',
        '-y',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => {
        if (err.message.includes('ENOENT') || err.message.includes('spawn')) {
          reject(new FFmpegNotFoundError(err.message));
        } else {
          reject(err);
        }
      })
      .run();
  });
}

async function cleanupDir(dir: string) {
  try {
    const { rm } = await import('fs/promises');
    await rm(dir, { recursive: true, force: true });
  } catch { /* silent */ }
}
