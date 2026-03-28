export type Platform = 'tiktok' | 'youtube' | 'instagram';

export type Category = 'NBA' | 'Meme' | 'Cinematic' | 'Hype' | 'Chill' | 'Viral' | 'Other';

export type Mood = 'Energetic' | 'Hype' | 'Chill' | 'Dramatic' | 'Funny' | 'Emotional' | 'Dark';

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
