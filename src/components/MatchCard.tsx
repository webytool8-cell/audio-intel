'use client';

import { useState } from 'react';
import { TrendingUp, Clock, Music2, Upload, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { MatchResult } from '@/lib/types';
import { clsx } from 'clsx';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
  clipFile: File | null;
  onRenderComplete?: (url: string) => void;
}

const RANK_COLORS = ['text-[#00ff88]', 'text-[#00e5ff]', 'text-[#fbbf24]'];
const RANK_BORDERS = ['border-[#00ff8825]', 'border-[#00e5ff25]', 'border-[#fbbf2425]'];
const RANK_BG     = ['bg-[#0d1a12]', 'bg-[#0a1a20]', 'bg-[#1a160a]'];

type RenderState = 'idle' | 'selecting' | 'rendering' | 'done' | 'error';

export default function MatchCard({ match, rank, clipFile, onRenderComplete }: MatchCardProps) {
  const [renderState, setRenderState] = useState<RenderState>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const { sound, score, start_time, end_time } = match;
  const pct = Math.round(score * 100);
  const rankColor  = RANK_COLORS[rank]  ?? 'text-[#888]';
  const rankBorder = RANK_BORDERS[rank] ?? 'border-[#222]';
  const rankBg     = RANK_BG[rank]      ?? 'bg-[#111]';

  async function handleRender(audioFile: File) {
    if (!clipFile) return;
    setRenderState('rendering');
    setRenderError(null);

    try {
      const fd = new FormData();
      fd.append('clip',       clipFile);
      fd.append('audio',      audioFile);
      fd.append('start_time', String(start_time));
      fd.append('end_time',   String(end_time));

      const res = await fetch('/api/render', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRenderState('done');
      onRenderComplete?.(url);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Render failed');
      setRenderState('error');
    }
  }

  function openAudioPicker() {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'audio/mpeg,audio/mp3,audio/wav,audio/aac';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleRender(file);
    };
    input.click();
  }

  return (
    <div className={clsx('rounded-xl border p-5 transition-all duration-200', rankBorder, rankBg)}>
      {/* Rank + score header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={clsx('text-lg font-black font-mono', rankColor)}>#{rank + 1}</span>
          <div>
            <p className="text-[#f0f0f0] text-sm font-semibold leading-tight">{sound.title}</p>
            <p className="text-[#555] text-xs mt-0.5">{sound.artist}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-[#444] font-mono block mb-0.5 uppercase tracking-wider">Match</span>
          <span className={clsx('text-xl font-bold font-mono', rankColor)}>{pct}%</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: rank === 0 ? '#00ff88' : rank === 1 ? '#00e5ff' : '#fbbf24',
          }}
        />
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-[#555] font-mono">
          <Clock size={10} />
          Segment {start_time}s–{end_time}s
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#555] font-mono">
          <TrendingUp size={10} />
          Score {Math.round(sound.trend_score)}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#555] font-mono">
          <Music2 size={10} />
          {sound.bpm ?? '?'} BPM
        </div>
      </div>

      {/* Mood / Category badges */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#111] border border-[#1e1e1e] text-[#666]">
          {sound.mood}
        </span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#111] border border-[#1e1e1e] text-[#666]">
          {sound.category}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={sound.sound_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#111] text-xs text-[#666] hover:text-[#999] hover:border-[#333] transition-all font-mono"
        >
          Preview <ExternalLink size={11} />
        </a>

        {renderState === 'idle' || renderState === 'selecting' ? (
          <button
            onClick={openAudioPicker}
            disabled={!clipFile}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
              clipFile
                ? `border ${rankBorder} ${rankColor} hover:opacity-80`
                : 'border border-[#222] text-[#333] cursor-not-allowed'
            )}
          >
            <Upload size={11} />
            Generate Video
          </button>
        ) : renderState === 'rendering' ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#555]">
            <Loader2 size={11} className="animate-spin" />
            Rendering…
          </span>
        ) : renderState === 'done' && downloadUrl ? (
          <a
            href={downloadUrl}
            download={`audio-intel-${sound.title.replace(/\s+/g, '-')}.mp4`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88] text-[#0a0a0a] text-xs font-semibold font-mono hover:bg-[#00dd77] transition-colors"
          >
            <CheckCircle size={11} />
            Download MP4
          </a>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400">
            {renderError ?? 'Error'}
          </span>
        )}
      </div>

      {/* Copyright notice on render */}
      {(renderState === 'selecting' || renderState === 'idle') && clipFile && (
        <p className="mt-3 text-[10px] text-[#333] font-mono leading-relaxed">
          You will be prompted to upload your own rights-cleared audio file.
        </p>
      )}
    </div>
  );
}
