'use client';

import { Zap, Gauge, Tag, Folder, Music } from 'lucide-react';
import { ClipAnalysis } from '@/lib/types';
import { clsx } from 'clsx';

interface AnalysisPanelProps {
  analysis: ClipAnalysis;
}

const PACE_LABEL: Record<string, string> = {
  slow: 'Slow', medium: 'Medium', fast: 'Fast',
};

const PACE_COLOR: Record<string, string> = {
  slow:   'text-blue-400 bg-blue-900/30 border-blue-800/50',
  medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
  fast:   'text-red-400 bg-red-900/30 border-red-800/50',
};

function EnergyBar({ value }: { value: number }) {
  const bars = 10;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'h-3 flex-1 rounded-sm transition-all duration-300',
            i < value
              ? value >= 8 ? 'bg-[#ff4444]'
              : value >= 6 ? 'bg-[#fbbf24]'
              : 'bg-[#00ff88]'
              : 'bg-[#222]'
          )}
          style={{ height: `${8 + (i / bars) * 8}px` }}
        />
      ))}
    </div>
  );
}

export default function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  const paceColor = PACE_COLOR[analysis.pace] ?? 'text-[#888] bg-[#1a1a1a] border-[#222]';

  return (
    <div className="rounded-xl border border-[#00ff8820] bg-[#0d1a12] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#00ff8815] pb-3">
        <div className="w-7 h-7 rounded-lg bg-[#00ff8815] flex items-center justify-center">
          <Zap size={14} className="text-[#00ff88]" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#00ff88] font-mono">AI Analysis</p>
          <p className="text-[10px] text-[#444] font-mono">Claude Haiku</p>
        </div>
      </div>

      {/* Energy */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-[11px] text-[#555] font-mono uppercase tracking-wider">
            <Zap size={11} />
            Energy
          </span>
          <span className="font-mono font-bold text-sm text-[#f0f0f0]">{analysis.energy}/10</span>
        </div>
        <EnergyBar value={analysis.energy} />
      </div>

      {/* Row: Pace / BPM / Category / Mood */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge size={10} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-wider text-[#444] font-mono">Pace</span>
          </div>
          <span className={clsx('text-xs font-mono font-semibold px-2 py-0.5 rounded border', paceColor)}>
            {PACE_LABEL[analysis.pace] ?? analysis.pace}
          </span>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Music size={10} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-wider text-[#444] font-mono">Target BPM</span>
          </div>
          <span className="text-sm font-mono font-bold text-[#00e5ff]">{analysis.tempo}</span>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Folder size={10} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-wider text-[#444] font-mono">Category</span>
          </div>
          <span className="text-xs font-mono text-[#f0f0f0] font-semibold">{analysis.category}</span>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={10} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-wider text-[#444] font-mono">Mood</span>
          </div>
          <span className="text-xs font-mono text-[#f0f0f0] font-semibold capitalize">{analysis.mood}</span>
        </div>
      </div>

      {/* Tags */}
      {analysis.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={10} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-wider text-[#444] font-mono">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#111] border border-[#222] text-[#666]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
