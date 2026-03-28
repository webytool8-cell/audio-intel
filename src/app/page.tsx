'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Zap, Music } from 'lucide-react';
import AudioCard from '@/components/AudioCard';
import FilterTabs from '@/components/FilterTabs';
import SearchInput from '@/components/SearchInput';
import { Sound } from '@/lib/types';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function DashboardPage() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const fetchSounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/sounds?${params}`);
      if (!res.ok) throw new Error('Failed to load sounds');
      const data = await res.json();
      setSounds(data.sounds);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  const topSound = sounds[0];
  const hotCount = sounds.filter(s => s.trend_score >= 85).length;
  const avgScore =
    sounds.length > 0
      ? Math.round(sounds.reduce((acc, s) => acc + s.trend_score, 0) / sounds.length)
      : 0;

  return (
    <div className="pt-8 animate-fade-in">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#00ff88] border border-[#00ff8825] bg-[#00ff8808] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            Trend Intelligence Core
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f0f0f0] mb-2">
          Trending Audio
          <span className="text-[#00ff88]">.</span>
        </h1>
        <p className="text-[#555] text-sm max-w-xl">
          Real-time signal on what audio is dominating short-form content. Ranked by trend score,
          updated continuously.
        </p>
      </div>

      {/* Stats strip */}
      {!loading && sounds.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Music size={11} className="text-[#444]" />
              <span className="text-[10px] uppercase tracking-widest text-[#444] font-mono">Sounds</span>
            </div>
            <span className="text-2xl font-bold font-mono text-[#f0f0f0]">{sounds.length}</span>
          </div>
          <div className="bg-[#111] border border-[#00ff8825] rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-[#00ff88]" />
              <span className="text-[10px] uppercase tracking-widest text-[#00ff88] font-mono">Hot</span>
            </div>
            <span className="text-2xl font-bold font-mono text-[#00ff88]">{hotCount}</span>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} className="text-[#444]" />
              <span className="text-[10px] uppercase tracking-widest text-[#444] font-mono">Avg Score</span>
            </div>
            <span className="text-2xl font-bold font-mono text-[#f0f0f0]">{avgScore}</span>
          </div>
        </div>
      )}

      {/* #1 trending highlight */}
      {!loading && topSound && (
        <div className="mb-8 p-5 rounded-xl border border-[#00ff8820] bg-[#0d1a12] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ff8805] to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">
                #1 Trending
              </span>
              <h2 className="text-lg font-bold text-[#f0f0f0] mt-0.5">{topSound.title}</h2>
              <p className="text-sm text-[#555]">{topSound.artist}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] text-[#444] font-mono uppercase block">Score</span>
                <span className="text-3xl font-bold font-mono text-[#00ff88]">
                  {Math.round(topSound.trend_score)}
                </span>
              </div>
              <a
                href={`/sound/${topSound.id}`}
                className="px-4 py-2 rounded-lg bg-[#00ff88] text-[#0a0a0a] text-sm font-semibold hover:bg-[#00dd77] transition-colors"
              >
                View →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <FilterTabs active={category} onChange={setCategory} />
        <div className="sm:ml-auto">
          <SearchInput value={search} onChange={setSearch} />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-[#111] border border-[#1a1a1a] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-[#666] text-sm font-mono">{error}</p>
          <button
            onClick={fetchSounds}
            className="mt-4 text-[#00ff88] text-sm hover:underline"
          >
            Retry
          </button>
        </div>
      ) : sounds.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#444] text-sm font-mono">No sounds found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up">
          {sounds.map(sound => (
            <AudioCard key={sound.id} sound={sound} />
          ))}
        </div>
      )}
    </div>
  );
}
