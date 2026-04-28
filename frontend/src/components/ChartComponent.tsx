import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryPoint } from '../types/stock';
import { buildTechnicalChartData } from '../utils/technicals';

interface ChartComponentProps {
  data: HistoryPoint[];
  color?: string;
  showSMA?: boolean;
  showEMA?: boolean;
}

// Custom tooltip for the price chart
function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        borderRadius: '12px',
        padding: '10px 14px',
        fontSize: '12px',
        color: '#e2e8f0',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
          <span style={{ color: '#94a3b8' }}>
            {entry.name === 'close'
              ? 'Price'
              : entry.dataKey === 'ema'
                ? 'EMA(20)'
                : 'SMA(20)'}
            :
          </span>
          <span style={{ color: entry.color, fontWeight: 600 }}>
            {Number.isFinite(Number(entry.value))
              ? `$${Number(entry.value).toFixed(2)}`
              : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Main chart component used across the app.
 * Supports area fill + optional SMA overlay line.
 */
export function ChartComponent({
  data,
  color = '#22d3ee',
  showSMA = false,
  showEMA = false,
}: ChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No chart data available.
      </div>
    );
  }

  const chartData = buildTechnicalChartData(data, 20);
  const fillId = `gradient-${color.replace('#', '')}`;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />

          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />

          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            width={56}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<PriceTooltip />} />

          {(showSMA || showEMA) && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
              formatter={(value) => {
                if (value === 'close') return 'Price';
                if (value === 'sma') return 'SMA(20)';
                if (value === 'ema') return 'EMA(20)';
                return value;
              }}
            />
          )}

          {/* Area fill under price line */}
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive
            animationDuration={500}
            activeDot={{ r: 5, fill: color, stroke: 'rgba(15,23,42,0.9)', strokeWidth: 2 }}
          />

          {/* Optional SMA overlay */}
          {showSMA && (
            <Line
              type="monotone"
              dataKey="sma"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 3"
              connectNulls={false}
              isAnimationActive
              animationDuration={500}
            />
          )}

          {showEMA && (
            <Line
              type="monotone"
              dataKey="ema"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              connectNulls={false}
              isAnimationActive
              animationDuration={500}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Alias for backward compatibility & new usage
export const EnhancedChart = ChartComponent;

/**
 * Compact mini sparkline chart for cards (no axes, no labels).
 */
export function MiniSparkline({
  data,
  color = '#22d3ee',
}: {
  data: HistoryPoint[];
  color?: string;
}) {
  if (!data || data.length < 2) return null;

  // Use last 30 data points for sparkline
  const slice = buildTechnicalChartData(data).slice(-30);
  const fillId = `spark-${color.replace('#', '')}`;

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={slice} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive
            animationDuration={450}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RsiChart({ data }: { data: HistoryPoint[] }) {
  const chartData = buildTechnicalChartData(data).filter((point) => point.rsi != null);

  if (chartData.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Not enough history for RSI.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ReferenceLine y={70} stroke="#f87171" strokeDasharray="5 4" />
          <ReferenceLine y={30} stroke="#34d399" strokeDasharray="5 4" />
          <Tooltip />
          <Line type="monotone" dataKey="rsi" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacdChart({ data }: { data: HistoryPoint[] }) {
  const chartData = buildTechnicalChartData(data).filter(
    (point) => point.macd != null || point.signal != null || point.histogram != null,
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Not enough history for MACD.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.4)" />
          <Tooltip />
          <Bar
            dataKey="histogram"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={500}
          />
          <Line type="monotone" dataKey="macd" stroke="#38bdf8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.6} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarketIndexChart({
  data,
}: {
  data: Array<{ formattedDate: string; index: number }>;
}) {
  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-500">
        Composite index unavailable.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="market-index-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ReferenceLine y={100} stroke="rgba(148, 163, 184, 0.4)" strokeDasharray="5 4" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="index"
            stroke="#22d3ee"
            strokeWidth={2.5}
            fill="url(#market-index-fill)"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
