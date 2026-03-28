import { Sound, ClipAnalysis, MatchResult } from './types';

/**
 * Compute a 0–1 energy compatibility score.
 * Both values are on a 1–10 scale; we penalise large gaps.
 */
function energyMatch(clipEnergy: number, soundEnergy: number | null): number {
  if (soundEnergy === null) return 0.5; // neutral when unknown
  const diff = Math.abs(clipEnergy - soundEnergy);
  return Math.max(0, 1 - diff / 9);
}

/**
 * Compute a 0–1 tempo compatibility score.
 * Uses a tolerance window: within ±10 BPM is perfect, >±60 BPM is zero.
 */
function tempoMatch(clipTempo: number, soundBpm: number | null): number {
  if (soundBpm === null) return 0.5;
  const diff = Math.abs(clipTempo - soundBpm);
  if (diff <= 10) return 1;
  if (diff >= 60) return 0;
  return 1 - (diff - 10) / 50;
}

/**
 * Normalize trend_score (0–100) to 0–1.
 */
function normalisedTrendScore(score: number): number {
  return Math.min(1, Math.max(0, score / 100));
}

/**
 * Select the best audio segment for a given clip duration.
 * Prefers the first best_segment whose length is ≥ clip duration.
 * Falls back to trimming from the start of the sound.
 */
function pickSegment(
  sound: Sound,
  clipDuration: number,
): { start_time: number; end_time: number } {
  const segments = sound.best_segments ?? [];
  const segLen = Math.min(clipDuration, sound.duration);

  for (const seg of segments) {
    const len = seg.end - seg.start;
    if (len >= segLen) {
      return { start_time: seg.start, end_time: seg.start + segLen };
    }
  }

  // Fallback: start from 0
  return { start_time: 0, end_time: Math.min(segLen, sound.duration) };
}

/**
 * Compute a composite match score for one sound against the clip analysis.
 *
 * match_score = (energy_match * 0.4) + (tempo_match * 0.3) + (trend_score * 0.3)
 */
export function scoreSound(analysis: ClipAnalysis, sound: Sound): number {
  const em = energyMatch(analysis.energy, sound.energy_level);
  const tm = tempoMatch(analysis.tempo, sound.bpm);
  const ts = normalisedTrendScore(sound.trend_score);

  // Bonus: category alignment (+0.1 boost, capped at 1)
  const categoryBonus =
    sound.category.toLowerCase() === analysis.category.toLowerCase() ? 0.08 : 0;

  const raw = em * 0.4 + tm * 0.3 + ts * 0.3 + categoryBonus;
  return Math.min(1, raw);
}

/**
 * Return the top-N sound matches for a clip analysis.
 */
export function topMatches(
  analysis: ClipAnalysis,
  sounds: Sound[],
  clipDuration: number,
  topN = 3,
): MatchResult[] {
  return sounds
    .map(sound => {
      const score = scoreSound(analysis, sound);
      const { start_time, end_time } = pickSegment(sound, clipDuration);
      return { sound_id: sound.id, score, start_time, end_time, sound };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
