'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendHistory } from '@/lib/types';

interface TrendChartProps {
  data: TrendHistory[];
  metric?: 'views' | 'uses' | 'growth_rate';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatValue(value: number, metric: string) {
  if (metric === 'growth_rate') return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const METRIC_CONFIG = {
  views: { label: 'Views', color: '#00ff88', gradient: 'gradientGreen' },
  uses: { label: 'Uses', color: '#00e5ff', gradient: 'gradientCyan' },
  growth_rate: { label: 'Growth %', color: '#fbbf24', gradient: 'gradientYellow' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  const cfg = METRIC_CONFIG[metric as keyof typeof METRIC_CONFIG];
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[#666] text-xs font-mono mb-1">{label}</p>
      <p className="font-mono font-semibold text-sm" style={{ color: cfg.color }}>
        {cfg.label}: {formatValue(payload[0].value, metric)}
      </p>
    </div>
  );
}

export default function TrendChart({ data, metric = 'views' }: TrendChartProps) {
  const cfg = METRIC_CONFIG[metric];
  const chartData = data.map(d => ({
    date: formatDate(d.timestamp),
    value: d[metric],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientYellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#444', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => formatValue(v, metric)}
          tick={{ fill: '#444', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={cfg.color}
          strokeWidth={2}
          fill={`url(#${cfg.gradient})`}
          dot={false}
          activeDot={{ r: 4, fill: cfg.color, stroke: '#0a0a0a', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
