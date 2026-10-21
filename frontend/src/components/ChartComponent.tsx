import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
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

export const CHART_THEME = {
  price: '#FFFFFF',
  sma: '#94A3B8',
  ema: '#64748B',
  positive: '#059669',
  negative: '#DC2626',
  grid: 'rgba(51, 65, 85, 0.45)',
  axis: '#94A3B8',
  tooltipBg: '#0F172A',
  tooltipBorder: '#334155',
  tooltipText: '#FFFFFF',
};

interface ChartComponentProps {
  data: HistoryPoint[];
  currentPrice?: number | null;
  color?: string;
  showSMA?: boolean;
  showEMA?: boolean;
}

function normalizeChartHistory(
  history: HistoryPoint[],
  currentPrice?: number | null,
): HistoryPoint[] {
  const normalizedData = history.map((h) => ({
    ...h,
    close: Number(h.close),
  }));

  const latestPrice = Number(currentPrice);
  const last = normalizedData[normalizedData.length - 1];

  if (last && Number.isFinite(latestPrice) && latestPrice > 0) {
    last.close = latestPrice;
  }

  return normalizedData.filter((point) => Number.isFinite(point.close) && point.close > 0);
}

function InstitutionalTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        border: `1px solid ${CHART_THEME.tooltipBorder}`,
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '12px',
        color: CHART_THEME.tooltipText,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ color: CHART_THEME.axis, marginBottom: '6px', fontWeight: 500 }}>{label}</div>
      {payload.map((entry: any) => {
        const val = Number(entry.value);
        const isHist = entry.dataKey === 'histogram';
        const itemColor = isHist
          ? val >= 0
            ? CHART_THEME.positive
            : CHART_THEME.negative
          : entry.color || CHART_THEME.price;

        let displayName = entry.name;
        if (entry.dataKey === 'close') displayName = 'Price';
        else if (entry.dataKey === 'sma') displayName = 'SMA (20)';
        else if (entry.dataKey === 'ema') displayName = 'EMA (20)';
        else if (entry.dataKey === 'rsi') displayName = 'RSI (14)';
        else if (entry.dataKey === 'macd') displayName = 'MACD (12,26)';
        else if (entry.dataKey === 'signal') displayName = 'Signal (9)';
        else if (entry.dataKey === 'histogram') displayName = 'Histogram';

        return (
          <div
            key={entry.dataKey}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: itemColor,
                display: 'inline-block',
              }}
            />
            <span style={{ color: CHART_THEME.axis }}>{displayName}:</span>
            <span style={{ color: itemColor, fontWeight: 600 }}>
              {Number.isFinite(val)
                ? entry.dataKey === 'rsi'
                  ? val.toFixed(1)
                  : `$${val.toFixed(2)}`
                : 'N/A'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Historical Price Chart with SMA / EMA overlays
 */
export function ChartComponent({
  data,
  currentPrice,
  color = CHART_THEME.price,
  showSMA = false,
  showEMA = false,
}: ChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#94A3B8]">
        No historical price series available.
      </div>
    );
  }

  const normalizedData = normalizeChartHistory(data, currentPrice);

  if (normalizedData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#94A3B8]">
        No valid price points available.
      </div>
    );
  }

  const chartData = buildTechnicalChartData(normalizedData, 20);
  const fillId = 'institutional-price-gradient';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />

          <XAxis
            dataKey="formattedDate"
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
            minTickGap={40}
          />

          <YAxis
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            width={56}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<InstitutionalTooltip />} />

          {(showSMA || showEMA) && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: CHART_THEME.axis, paddingTop: 8 }}
              formatter={(value) => {
                if (value === 'close') return 'Price';
                if (value === 'sma') return 'SMA (20)';
                if (value === 'ema') return 'EMA (20)';
                return value;
              }}
            />
          )}

          {/* Area fill under price line */}
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive
            animationDuration={400}
            activeDot={{ r: 4, fill: '#FFFFFF', stroke: '#0F172A', strokeWidth: 2 }}
          />

          {/* SMA 20 Overlay (Muted Slate) */}
          {showSMA && (
            <Line
              type="monotone"
              dataKey="sma"
              stroke={CHART_THEME.sma}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
              connectNulls={false}
              isAnimationActive
              animationDuration={400}
            />
          )}

          {/* EMA 20 Overlay (Darker Slate) */}
          {showEMA && (
            <Line
              type="monotone"
              dataKey="ema"
              stroke={CHART_THEME.ema}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 2"
              connectNulls={false}
              isAnimationActive
              animationDuration={400}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export const EnhancedChart = ChartComponent;

/**
 * Compact Sparkline for Cards
 */
export function MiniSparkline({
  data,
  currentPrice,
  color = CHART_THEME.price,
}: {
  data: HistoryPoint[];
  currentPrice?: number | null;
  color?: string;
}) {
  if (!data || data.length < 2) return null;

  const slice = buildTechnicalChartData(normalizeChartHistory(data, currentPrice)).slice(-30);
  const fillId = `spark-${Math.abs(color.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`;

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={slice} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.16} />
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
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * RSI Panel with 30 and 70 Reference Levels
 */
export function RsiChart({ data }: { data: HistoryPoint[] }) {
  const chartData = buildTechnicalChartData(data).filter((point) => point.rsi != null);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-[#94A3B8]">
        Insufficient history for RSI (requires minimum 15 periods).
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            width={36}
            ticks={[0, 30, 70, 100]}
          />
          {/* Overbought Level 70 */}
          <ReferenceLine
            y={70}
            stroke={CHART_THEME.negative}
            strokeDasharray="4 4"
            label={{ value: 'OB 70', fill: CHART_THEME.negative, fontSize: 10, position: 'right' }}
          />
          {/* Oversold Level 30 */}
          <ReferenceLine
            y={30}
            stroke={CHART_THEME.positive}
            strokeDasharray="4 4"
            label={{ value: 'OS 30', fill: CHART_THEME.positive, fontSize: 10, position: 'right' }}
          />
          <Tooltip content={<InstitutionalTooltip />} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#FFFFFF"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive
            animationDuration={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * MACD Panel with MACD Line, Signal Line, and Positive/Negative Colored Histogram
 */
export function MacdChart({ data }: { data: HistoryPoint[] }) {
  const chartData = buildTechnicalChartData(data).filter(
    (point) => point.macd != null || point.signal != null || point.histogram != null,
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-[#94A3B8]">
        Insufficient history for MACD (requires minimum 26 periods).
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            width={44}
          />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
          <Tooltip content={<InstitutionalTooltip />} />

          {/* Histogram Bars colored by positive/negative value */}
          <Bar
            dataKey="histogram"
            radius={[2, 2, 0, 0]}
            isAnimationActive
            animationDuration={400}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`hist-${index}`}
                fill={(entry.histogram ?? 0) >= 0 ? CHART_THEME.positive : CHART_THEME.negative}
              />
            ))}
          </Bar>

          {/* MACD Line (White) */}
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive
            animationDuration={400}
          />

          {/* Signal Line (Muted Slate) */}
          <Line
            type="monotone"
            dataKey="signal"
            stroke={CHART_THEME.sma}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="3 2"
            isAnimationActive
            animationDuration={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Tracked Basket Equal-Weighted Aggregate Chart
 */
export function MarketIndexChart({
  data,
}: {
  data: Array<{ formattedDate: string; index: number }>;
}) {
  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-[#94A3B8]">
        Aggregate tracked basket data unavailable.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="basket-index-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: CHART_THEME.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            width={44}
          />
          <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 4" />
          <Tooltip content={<InstitutionalTooltip />} />
          <Area
            type="monotone"
            dataKey="index"
            stroke="#FFFFFF"
            strokeWidth={2}
            fill="url(#basket-index-fill)"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
