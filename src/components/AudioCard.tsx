'use client';

import Link from 'next/link';
import { TrendingUp, Music2, Clock } from 'lucide-react';
import { Sound } from '@/lib/types';
import { clsx } from 'clsx';

interface AudioCardProps {
  sound: Sound;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'text-red-400',
  tiktok: 'text-pink-400',
  instagram: 'text-purple-400',
};

const MOOD_COLORS: Record<string, string> = {
  Energetic: 'bg-yellow-900/40 text-yellow-300',
  Hype: 'bg-orange-900/40 text-orange-300',
  Chill: 'bg-blue-900/40 text-blue-300',
  Dramatic: 'bg-purple-900/40 text-purple-300',
  Funny: 'bg-green-900/40 text-green-300',
  Emotional: 'bg-pink-900/40 text-pink-300',
  Dark: 'bg-gray-900/60 text-gray-300',
};

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct >= 85 ? '#00ff88' : pct >= 65 ? '#00e5ff' : pct >= 45 ? '#fbbf24' : '#666';
  return (
    <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function AudioCard({ sound }: AudioCardProps) {
  const score = Math.round(sound.trend_score);
  const isHot = score >= 85;
  const moodStyle = MOOD_COLORS[sound.mood] ?? 'bg-gray-800 text-gray-400';
  const platformColor = PLATFORM_COLORS[sound.platform] ?? 'text-gray-400';

  return (
    <Link href={`/sound/${sound.id}`}>
      <div
        className={clsx(
          'group relative rounded-xl border bg-[#111] p-5 cursor-pointer',
          'transition-all duration-200',
          'hover:bg-[#161616] hover:border-[#333]',
          isHot
            ? 'border-[#1a3a2a] hover:shadow-glow'
            : 'border-[#1e1e1e] hover:shadow-[0_0_16px_rgba(255,255,255,0.04)]'
        )}
      >
        {/* Hot badge */}
        {isHot && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono font-semibold text-[#00ff88] bg-[#00ff8815] border border-[#00ff8830] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            HOT
          </span>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#222] flex items-center justify-center flex-shrink-0">
            <Music2 size={18} className={platformColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#f0f0f0] text-sm leading-tight truncate pr-12">
              {sound.title}
            </h3>
            <p className="text-[#666] text-xs mt-0.5 truncate">{sound.artist}</p>
          </div>
        </div>

        {/* Trend score */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-[11px] text-[#555] font-mono uppercase tracking-wider">
              <TrendingUp size={11} />
              Trend Score
            </span>
            <span
              className={clsx(
                'font-mono font-bold text-sm',
                isHot ? 'text-[#00ff88]' : score >= 65 ? 'text-[#00e5ff]' : 'text-[#f0f0f0]'
              )}
            >
              {score}
            </span>
          </div>
          <ScoreBar value={score} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'text-[11px] font-medium px-2 py-0.5 rounded-md',
                moodStyle
              )}
            >
              {sound.mood}
            </span>
            <span className="text-[11px] text-[#444] font-mono bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#222]">
              {sound.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#444] font-mono">
            <Clock size={10} />
            {sound.duration}s
          </div>
        </div>

        {/* Reuse count */}
        <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
          <span className="text-[11px] text-[#444] font-mono">
            {sound.reuse_count.toLocaleString()} uses
          </span>
        </div>
      </div>
    </Link>
  );
}
