import Anthropic from '@anthropic-ai/sdk';
import { ClipAnalysis, Pace } from './types';

// ─── Deterministic fallback (no API key) ─────────────────────────────────────

const CATEGORY_HINTS: Record<string, string> = {
  nba: 'NBA', basketball: 'NBA', dunk: 'NBA', highlight: 'NBA',
  meme: 'Meme', funny: 'Meme', comedy: 'Meme',
  cinematic: 'Cinematic', film: 'Cinematic', movie: 'Cinematic', drama: 'Cinematic',
  hype: 'Hype', hypebeast: 'Hype', fire: 'Hype',
  chill: 'Chill', relax: 'Chill', vibe: 'Chill', sunset: 'Chill', travel: 'Chill',
  viral: 'Viral', trending: 'Viral',
  dance: 'Hype', street: 'Hype',
};

export function mockAnalyzeClip(metadata: {
  title: string;
  duration: number;
  tags?: string[];
}): ClipAnalysis {
  const combined = [metadata.title, ...(metadata.tags ?? [])].join(' ').toLowerCase();

  // Derive category from keywords
  let category = 'Other';
  for (const [kw, cat] of Object.entries(CATEGORY_HINTS)) {
    if (combined.includes(kw)) { category = cat; break; }
  }

  // Derive energy/pace from category
  const energyMap: Record<string, number> = {
    NBA: 9, Hype: 8, Meme: 7, Viral: 7, Cinematic: 5, Chill: 3, Other: 5,
  };
  const paceMap: Record<string, Pace> = {
    NBA: 'fast', Hype: 'fast', Meme: 'fast', Viral: 'medium',
    Cinematic: 'medium', Chill: 'slow', Other: 'medium',
  };
  const moodMap: Record<string, string> = {
    NBA: 'intense', Hype: 'intense', Meme: 'funny', Viral: 'energetic',
    Cinematic: 'dramatic', Chill: 'chill', Other: 'neutral',
  };
  const bpmMap: Record<string, number> = {
    NBA: 140, Hype: 150, Meme: 130, Viral: 120,
    Cinematic: 80, Chill: 75, Other: 100,
  };

  const energy = energyMap[category] ?? 5;
  const pace = paceMap[category] ?? 'medium';
  const mood = moodMap[category] ?? 'neutral';
  const tempo = bpmMap[category] ?? 100;
  const tags = [...(metadata.tags ?? []), category.toLowerCase()].slice(0, 5);

  return { energy, pace, mood, category, tempo, tags };
}

// ─── Live analysis via Anthropic ─────────────────────────────────────────────

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'submit_clip_analysis',
  description: 'Submit the structured analysis for a video clip based on provided metadata.',
  input_schema: {
    type: 'object' as const,
    properties: {
      energy:   { type: 'number',  description: 'Overall energy level from 1 (very calm) to 10 (extremely intense)' },
      pace:     { type: 'string',  enum: ['slow', 'medium', 'fast'], description: 'Visual pacing of the clip' },
      mood:     { type: 'string',  description: 'Dominant mood (e.g. intense, chill, funny, dramatic, emotional)' },
      category: { type: 'string',  enum: ['NBA', 'Meme', 'Cinematic', 'Hype', 'Chill', 'Viral', 'Other'], description: 'Best content category' },
      tempo:    { type: 'number',  description: 'Estimated ideal audio BPM for this clip' },
      tags:     { type: 'array',   items: { type: 'string' }, description: 'Up to 5 descriptive tags' },
    },
    required: ['energy', 'pace', 'mood', 'category', 'tempo', 'tags'],
  },
};

export async function analyzeClipWithAI(
  metadata: { title: string; duration: number; tags?: string[] },
  frameBase64?: string,
): Promise<ClipAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return mockAnalyzeClip(metadata);

  const client = new Anthropic({ apiKey });

  const contextText =
    `Analyze the following video clip metadata and determine its content characteristics.\n\n` +
    `Title: ${metadata.title}\n` +
    `Duration: ${metadata.duration}s\n` +
    (metadata.tags?.length ? `Tags: ${metadata.tags.join(', ')}\n` : '') +
    `\nBased on the title and context, classify the clip and estimate the ideal audio characteristics.`;

  const contentBlocks: Anthropic.MessageParam['content'] = frameBase64
    ? [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: frameBase64 },
        },
        { type: 'text', text: contextText },
      ]
    : contextText;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const toolUse = response.content.find(b => b.type === 'tool_use') as
    | Anthropic.ToolUseBlock
    | undefined;

  if (!toolUse) return mockAnalyzeClip(metadata);

  const input = toolUse.input as ClipAnalysis;
  return {
    energy:   Math.min(10, Math.max(1, Math.round(input.energy))),
    pace:     (['slow', 'medium', 'fast'] as Pace[]).includes(input.pace) ? input.pace : 'medium',
    mood:     input.mood || 'neutral',
    category: input.category || 'Other',
    tempo:    Math.min(220, Math.max(40, Math.round(input.tempo))),
    tags:     Array.isArray(input.tags) ? input.tags.slice(0, 5) : [],
  };
}
