'use client';

import { useState } from 'react';
import { Sparkles, ChevronRight, RotateCcw, Info } from 'lucide-react';
import ClipUploader from '@/components/ClipUploader';
import AnalysisPanel from '@/components/AnalysisPanel';
import MatchCard from '@/components/MatchCard';
import { ClipAnalysis, MatchResult } from '@/lib/types';
import { clsx } from 'clsx';

type Step = 'upload' | 'analysing' | 'results' | 'error';

export default function MatchPage() {
  const [step, setStep]         = useState<Step>('upload');
  const [clipFile, setClipFile] = useState<File | null>(null);
  const [title, setTitle]       = useState('');
  const [tags, setTags]         = useState('');
  const [duration, setDuration] = useState('15');
  const [analysis, setAnalysis] = useState<ClipAnalysis | null>(null);
  const [matches, setMatches]   = useState<MatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  function reset() {
    setStep('upload');
    setClipFile(null);
    setTitle('');
    setTags('');
    setDuration('15');
    setAnalysis(null);
    setMatches([]);
    setErrorMsg(null);
    setProgress('');
  }

  async function handleAnalyse() {
    if (!clipFile && !title.trim()) {
      setErrorMsg('Enter a title or upload a clip to continue.');
      return;
    }
    setErrorMsg(null);
    setStep('analysing');

    try {
      // ── Step 1: Upload clip (if file provided) ─────────────────────────────
      let analysisResult: ClipAnalysis;

      if (clipFile) {
        setProgress('Uploading clip…');
        const fd = new FormData();
        fd.append('clip',     clipFile);
        fd.append('title',    title || clipFile.name.replace(/\.[^.]+$/, ''));
        fd.append('tags',     tags);
        fd.append('duration', duration);

        const uploadRes = await fetch('/api/clips', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body.error ?? 'Upload failed');
        }
        const uploadData = await uploadRes.json();
        analysisResult = uploadData.analysis as ClipAnalysis;
      } else {
        // ── Step 1b: Text-only analysis ────────────────────────────────────
        setProgress('Analysing clip…');
        const matchRes = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:    title.trim(),
            duration: parseInt(duration, 10),
            tags:     tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          }),
        });
        if (!matchRes.ok) {
          const body = await matchRes.json().catch(() => ({}));
          throw new Error(body.error ?? 'Analysis failed');
        }
        const data = await matchRes.json();
        setAnalysis(data.analysis);
        setMatches(data.matches);
        setStep('results');
        return;
      }

      // ── Step 2: Match ──────────────────────────────────────────────────────
      setProgress('Finding top matches…');
      const matchRes = await fetch('/api/match', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    title || clipFile?.name,
          duration: parseInt(duration, 10),
          tags:     tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          // Forward AI analysis so the server skips re-calling the LLM
          energy:   analysisResult.energy,
          tempo:    analysisResult.tempo,
          category: analysisResult.category,
          mood:     analysisResult.mood,
          pace:     analysisResult.pace,
        }),
      });
      if (!matchRes.ok) {
        const body = await matchRes.json().catch(() => ({}));
        throw new Error(body.error ?? 'Matching failed');
      }
      const matchData = await matchRes.json();

      setAnalysis(matchData.analysis ?? analysisResult);
      setMatches(matchData.matches);
      setStep('results');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    }
  }

  return (
    <div className="pt-8 animate-fade-in">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#00e5ff] border border-[#00e5ff25] bg-[#00e5ff08] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
            Clip Matcher · Phase 2
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f0f0f0] mb-2">
          Match Audio to Clips
          <span className="text-[#00e5ff]">.</span>
        </h1>
        <p className="text-[#555] text-sm max-w-xl">
          Upload your video clip, let AI analyse its energy and mood, then get the top trending
          audio matches — ready to render into a short-form video.
        </p>
      </div>

      {/* Flow steps indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs font-mono">
        {(['Upload', 'Analyse', 'Match', 'Render'] as const).map((s, i) => {
          const active =
            (s === 'Upload'  && (step === 'upload' || step === 'analysing')) ||
            (s === 'Analyse' && step === 'analysing') ||
            (s === 'Match'   && step === 'results') ||
            (s === 'Render'  && step === 'results');
          const done =
            (s === 'Upload'  && step === 'results') ||
            (s === 'Analyse' && step === 'results');
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={clsx(
                'px-2.5 py-1 rounded-full border transition-colors',
                done    ? 'border-[#00ff8840] text-[#00ff88] bg-[#00ff8808]' :
                active  ? 'border-[#00e5ff40] text-[#00e5ff] bg-[#00e5ff08]' :
                          'border-[#1e1e1e] text-[#333]'
              )}>
                {i + 1}. {s}
              </span>
              {i < 3 && <ChevronRight size={12} className="text-[#333]" />}
            </div>
          );
        })}
      </div>

      {/* ── Upload / Form ─────────────────────────────────────────────────── */}
      {(step === 'upload' || step === 'error') && (
        <div className="max-w-xl space-y-5">
          <ClipUploader
            onFileSelected={f => { setClipFile(f); setTitle(t => t || f.name.replace(/\.[^.]+$/, '')); }}
            disabled={step === 'analysing'}
          />

          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#444] font-mono mb-1.5 block">
                Clip Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. NBA Highlights Reel"
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#333] outline-none focus:border-[#00e5ff40] transition-colors font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[#444] font-mono mb-1.5 block">
                  Duration (s)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#00e5ff40] transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[#444] font-mono mb-1.5 block">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="nba, highlights, hype"
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#333] outline-none focus:border-[#00e5ff40] transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-4 py-3">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleAnalyse}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00e5ff] text-[#0a0a0a] font-semibold text-sm hover:bg-[#00ccee] transition-colors"
          >
            <Sparkles size={16} />
            Analyse &amp; Find Matches
          </button>
        </div>
      )}

      {/* ── Analysing ─────────────────────────────────────────────────────── */}
      {step === 'analysing' && (
        <div className="max-w-xl">
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#00e5ff] border-t-transparent animate-spin" />
            <div>
              <p className="text-[#f0f0f0] font-semibold">{progress || 'Processing…'}</p>
              <p className="text-[#444] text-xs font-mono mt-1">Claude Haiku is analysing your clip</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {step === 'results' && analysis && (
        <div className="animate-slide-up space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#f0f0f0]">Results</h2>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#888] font-mono transition-colors"
            >
              <RotateCcw size={12} />
              New clip
            </button>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Left: AI analysis */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest text-[#444] font-mono">
                Clip Analysis
              </p>
              <AnalysisPanel analysis={analysis} />

              {/* Render note */}
              <div className="rounded-lg border border-[#1e1e1e] bg-[#111] px-4 py-3">
                <p className="text-[10px] text-[#444] font-mono leading-relaxed">
                  <span className="text-[#555] font-semibold">To generate a video:</span> click
                  "Generate Video" on any match. You'll be prompted to upload your own
                  rights-cleared audio file. Platform audio is not served or downloaded.
                </p>
              </div>
            </div>

            {/* Right: Match cards */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest text-[#444] font-mono">
                Top {matches.length} Audio Matches
              </p>
              {matches.map((match, i) => (
                <MatchCard
                  key={match.sound_id}
                  match={match}
                  rank={i}
                  clipFile={clipFile}
                />
              ))}
              {matches.length === 0 && (
                <p className="text-[#444] text-sm font-mono py-8 text-center">No matches found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
