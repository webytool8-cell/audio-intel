'use client';

import { Search, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search sounds, artists, moods…',
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`
        relative flex items-center gap-2 w-full max-w-sm
        border rounded-lg px-3 py-2 transition-all duration-150
        ${focused ? 'border-[#00ff88]/40 bg-[#111] shadow-[0_0_0_1px_rgba(0,255,136,0.1)]' : 'border-[#222] bg-[#0f0f0f]'}
      `}
      onClick={() => inputRef.current?.focus()}
    >
      <Search size={14} className={focused ? 'text-[#00ff88]' : 'text-[#444]'} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-[#f0f0f0] placeholder:text-[#444] outline-none"
      />
      {value && (
        <button
          onClick={e => {
            e.stopPropagation();
            onChange('');
          }}
          className="text-[#444] hover:text-[#888] transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
