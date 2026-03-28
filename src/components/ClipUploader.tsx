'use client';

import { useRef, useState, DragEvent } from 'react';
import { Upload, Film, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ClipUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_MB    = 100;

export default function ClipUploader({ onFileSelected, disabled }: ClipUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState<{ name: string; sizeMB: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Unsupported format. Use MP4, MOV, or WebM.';
    if (file.size > MAX_MB * 1024 * 1024) return `File too large. Max ${MAX_MB} MB.`;
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) { setError(err); setPreview(null); return; }
    setError(null);
    setPreview({ name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(1) });
    onFileSelected(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center gap-3 text-center',
          'min-h-[180px] px-6 py-8',
          disabled         ? 'opacity-50 cursor-not-allowed border-[#222]' :
          dragging         ? 'border-[#00ff88] bg-[#00ff8808] shadow-glow' :
          preview          ? 'border-[#00ff8840] bg-[#0d1a12]' :
                             'border-[#222] bg-[#111] hover:border-[#333] hover:bg-[#141414]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          disabled={disabled}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {preview ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#00ff8815] border border-[#00ff8830] flex items-center justify-center">
              <Film size={22} className="text-[#00ff88]" />
            </div>
            <div>
              <p className="text-[#f0f0f0] text-sm font-medium truncate max-w-[220px]">{preview.name}</p>
              <p className="text-[#555] text-xs font-mono mt-0.5">{preview.sizeMB} MB</p>
            </div>
            <button
              onClick={clear}
              className="absolute top-3 right-3 p-1 rounded-full bg-[#1a1a1a] border border-[#222] text-[#555] hover:text-[#888] transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
              <Upload size={20} className="text-[#555]" />
            </div>
            <div>
              <p className="text-[#888] text-sm font-medium">
                {dragging ? 'Drop to upload' : 'Drop clip here or click to browse'}
              </p>
              <p className="text-[#444] text-xs font-mono mt-1">MP4 · MOV · WebM · max {MAX_MB} MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-mono">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
