'use client';

import { clsx } from 'clsx';

const CATEGORIES = ['All', 'NBA', 'Meme', 'Hype', 'Cinematic', 'Chill', 'Viral'];

interface FilterTabsProps {
  active: string;
  onChange: (category: string) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={clsx(
            'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border',
            active === cat
              ? 'bg-[#00ff88] text-[#0a0a0a] border-[#00ff88] font-semibold shadow-glow'
              : 'bg-transparent text-[#666] border-[#222] hover:border-[#333] hover:text-[#999]'
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
