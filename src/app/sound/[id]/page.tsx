'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, TrendingUp, Clock, Tag, Music2, BarChart2 } from 'lucide-react';
import TrendChart from '@/components/TrendChart';
import StatBadge from '@/components/StatBadge';
import { Sound, TrendHistory } from '@/lib/types';
import { clsx } from 'clsx';

type MetricKey = 'views' | 'uses' | 'growth_rate';

const METRIC_TABS: { key: MetricKey; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'uses', label: 'Uses' },
  { key: 'growth_rate', label: 'Growth %' },
];

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

export default function SoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sound, setSound] = useState<Sound | null>(null);
  const [history, setHistory] = useState<TrendHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricKey>('views');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [soundRes, historyRes] = await Promise.all([
          fetch(`/api/sounds/${id}`),
          fetch(`/api/trends/${id}`),
        ]);
        if (!soundRes.ok) throw new Error('Sound not found');
        const soundData = await soundRes.json();
        const historyData = await historyRes.json();
        setSound(soundData.sound);
        setHistory(historyData.history ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-10 space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-[#111] rounded" />
        <div className="h-48 bg-[#111] rounded-xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#111] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !sound) {
    return (
      <div className="pt-20 text-center">
        <p className="text-[#666] font-mono text-sm">{error ?? 'Sound not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-[#00ff88] text-sm hover:underline"
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const score = Math.round(sound.trend_score);
  const velocity = Math.round(sound.velocity_score);
  const isHot = score >= 85;

  // Latest trend snapshot
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const viewsDelta =
    latest && prev ? Math.round(((latest.views - prev.views) / Math.max(prev.views, 1)) * 100) : 0;

  return (
    <div className="pt-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-[#444] hover:text-[#888] text-sm mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center flex-shrink-0">
            <Music2 size={22} className="text-[#00ff88]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isHot && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#00ff88] bg-[#00ff8812] border border-[#00ff8830] px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#00ff88] animate-pulse" />
                  HOT
                </span>
              )}
              <span className="text-[11px] text-[#444] font-mono border border-[#222] px-2 py-0.5 rounded-full">
                {PLATFORM_LABELS[sound.platform] ?? sound.platform}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f0f0] leading-tight">
              {sound.title}
            </h1>
            <p className="text-[#555] mt-0.5">{sound.artist}</p>
          </div>
        </div>
        <a
          href={sound.sound_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#222] bg-[#111] text-sm text-[#888] hover:text-[#f0f0f0] hover:border-[#333] transition-all"
        >
          View Original
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBadge label="Trend Score" value={score} accent />
        <StatBadge label="Velocity" value={velocity} />
        <StatBadge label="Reuse Count" value={sound.reuse_count.toLocaleString()} />
        <StatBadge
          label="24h Change"
          value={viewsDelta >= 0 ? `+${viewsDelta}%` : `${viewsDelta}%`}
          className={viewsDelta >= 0 ? 'border-[#00ff8820]' : 'border-[#ff444420]'}
        />
      </div>

      {/* Embed Player */}
      {sound.embed_url && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest font-mono mb-3">
            Player
          </h2>
          <div className="rounded-xl overflow-hidden border border-[#1e1e1e] bg-[#111]">
            <iframe
              src={sound.embed_url}
              title={`${sound.title} by ${sound.artist}`}
              width="100%"
              height="315"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="block"
              loading="lazy"
            />
          </div>
          <p className="text-[#333] text-xs font-mono mt-2">
            Embedded from {PLATFORM_LABELS[sound.platform]}. All rights belong to the original creator.
          </p>
        </div>
      )}

      {/* Trend Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-[#444]" />
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest font-mono">
              14-Day Trend
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {METRIC_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setMetric(tab.key)}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs font-mono transition-colors',
                  metric === tab.key
                    ? 'bg-[#00ff8815] text-[#00ff88] border border-[#00ff8830]'
                    : 'text-[#444] hover:text-[#888]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
          {history.length > 0 ? (
            <TrendChart data={history} metric={metric} />
          ) : (
            <div className="h-52 flex items-center justify-center text-[#333] text-sm font-mono">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag size={13} className="text-[#444]" />
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest font-mono">
              Tags
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(sound.tags as string[]).map(tag => (
              <span
                key={tag}
                className="text-xs font-mono px-3 py-1 rounded-full bg-[#111] border border-[#1e1e1e] text-[#666]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-[#444]" />
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-widest font-mono">
              Details
            </h2>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Category', value: sound.category },
              { label: 'Mood', value: sound.mood },
              { label: 'Platform', value: PLATFORM_LABELS[sound.platform] ?? sound.platform },
              {
                label: 'Duration',
                value: (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {sound.duration}s
                  </span>
                ),
              },
              {
                label: 'Last Updated',
                value: new Date(sound.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#111]">
                <span className="text-[#444] font-mono text-xs uppercase tracking-wider">{label}</span>
                <span className="text-[#888] font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
