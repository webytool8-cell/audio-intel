import { clsx } from 'clsx';

interface StatBadgeProps {
  label: string;
  value: string | number;
  accent?: boolean;
  className?: string;
}

export default function StatBadge({ label, value, accent, className }: StatBadgeProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-0.5 bg-[#111] border rounded-lg px-4 py-3',
        accent ? 'border-[#00ff8830]' : 'border-[#1e1e1e]',
        className
      )}
    >
      <span className="text-[11px] uppercase tracking-widest text-[#555] font-mono">{label}</span>
      <span
        className={clsx(
          'text-xl font-bold font-mono',
          accent ? 'text-[#00ff88]' : 'text-[#f0f0f0]'
        )}
      >
        {value}
      </span>
    </div>
  );
}
