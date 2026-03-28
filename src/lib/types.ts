export type Platform = 'tiktok' | 'youtube' | 'instagram';

export type Category = 'NBA' | 'Meme' | 'Cinematic' | 'Hype' | 'Chill' | 'Viral' | 'Other';

export type Mood = 'Energetic' | 'Hype' | 'Chill' | 'Dramatic' | 'Funny' | 'Emotional' | 'Dark';

export type Pace = 'slow' | 'medium' | 'fast';

// ─── Phase 1 ────────────────────────────────────────────────────────────────

export interface Sound {
  id: string;
  platform: Platform;
  sound_url: string;
  embed_url: string;
  title: string;
  artist: string;
  duration: number;
  trend_score: number;
  velocity_score: number;
  reuse_count: number;
  category: string;
  mood: string;
  tags: string[];
  // Phase 2 extensions (nullable for backwards compat)
  bpm: number | null;
  energy_level: number | null;
  best_segments: Array<{ start: number; end: number }> | null;
  created_at: string;
  updated_at: string;
}

export interface TrendHistory {
  id: number;
  sound_id: string;
  timestamp: string;
  views: number;
  uses: number;
  growth_rate: number;
}

export interface SoundWithTrend extends Sound {
  trend_history?: TrendHistory[];
}

// ─── Phase 2 ────────────────────────────────────────────────────────────────

export interface Clip {
  id: string;
  title: string;
  tags: string[];
  tempo: number;
  energy: number;
  duration: number;
  file_url: string;
  // AI-derived (set after analysis)
  ai_mood: string | null;
  ai_pace: Pace | null;
  ai_category: string | null;
  created_at: string;
}

export interface Match {
  id: number;
  clip_id: string;
  sound_id: string;
  score: number;
  start_time: number;
  end_time: number;
}

export interface MatchWithSound extends Match {
  sound: Sound;
}

export interface ClipAnalysis {
  energy: number;       // 1–10
  pace: Pace;
  mood: string;
  category: string;
  tempo: number;        // estimated BPM
  tags: string[];
}

export interface MatchResult {
  sound_id: string;
  score: number;
  start_time: number;
  end_time: number;
  sound: Sound;
}
