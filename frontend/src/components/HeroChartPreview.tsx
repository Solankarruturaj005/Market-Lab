import { Activity, CandlestickChart as CandleIcon, LineChart as LineIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Bar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const FALLBACK_AAPL_BARS: Bar[] = [
  { timestamp: 1773014400000, open: 298.4, high: 302.5, low: 296.8, close: 301.2, volume: 76000000 },
  { timestamp: 1773100800000, open: 301.5, high: 305.8, low: 300.1, close: 304.5, volume: 81000000 },
  { timestamp: 1773187200000, open: 304.0, high: 308.2, low: 302.9, close: 307.8, volume: 88000000 },
  { timestamp: 1773273600000, open: 307.2, high: 310.5, low: 305.0, close: 306.4, volume: 74000000 },
  { timestamp: 1773360000000, open: 306.8, high: 311.2, low: 305.5, close: 310.5, volume: 85000000 },
  { timestamp: 1773619200000, open: 311.0, high: 314.8, low: 309.2, close: 313.4, volume: 79000000 },
  { timestamp: 1773705600000, open: 313.8, high: 317.0, low: 311.9, close: 312.6, volume: 71000000 },
  { timestamp: 1773792000000, open: 312.5, high: 316.4, low: 310.8, close: 315.8, volume: 84000000 },
  { timestamp: 1773878400000, open: 316.0, high: 319.5, low: 314.2, close: 318.9, volume: 90000000 },
  { timestamp: 1773964800000, open: 319.2, high: 323.0, low: 317.5, close: 320.1, volume: 86000000 },
  { timestamp: 1774224000000, open: 320.5, high: 325.4, low: 319.0, close: 324.2, volume: 94000000 },
  { timestamp: 1774310400000, open: 324.0, high: 327.8, low: 322.1, close: 323.0, volume: 82000000 },
  { timestamp: 1774396800000, open: 323.5, high: 328.6, low: 321.9, close: 327.4, volume: 89000000 },
  { timestamp: 1774483200000, open: 327.8, high: 332.1, low: 326.0, close: 331.5, volume: 102000000 },
  { timestamp: 1774569600000, open: 331.0, high: 334.5, low: 328.9, close: 330.2, volume: 88000000 },
  { timestamp: 1774828800000, open: 330.8, high: 335.2, low: 329.5, close: 334.6, volume: 91000000 },
  { timestamp: 1774915200000, open: 335.0, high: 339.8, low: 333.4, close: 338.9, volume: 105000000 },
  { timestamp: 1775001600000, open: 339.2, high: 343.5, low: 337.0, close: 341.2, volume: 114000000 },
  { timestamp: 1775088000000, open: 341.5, high: 346.0, low: 339.8, close: 340.5, volume: 98000000 },
  { timestamp: 1775174400000, open: 340.8, high: 345.6, low: 328.8, close: 339.5, volume: 95800000 },
];

const FALLBACK_NVDA_BARS: Bar[] = [
  { timestamp: 1773014400000, open: 178.2, high: 182.4, low: 176.5, close: 181.0, volume: 145000000 },
  { timestamp: 1773100800000, open: 181.5, high: 186.2, low: 180.0, close: 185.3, volume: 160000000 },
  { timestamp: 1773187200000, open: 185.0, high: 189.4, low: 183.5, close: 187.9, volume: 152000000 },
  { timestamp: 1773273600000, open: 187.4, high: 191.0, low: 185.2, close: 186.8, volume: 138000000 },
  { timestamp: 1773360000000, open: 186.9, high: 192.5, low: 185.8, close: 191.2, volume: 172000000 },
  { timestamp: 1773619200000, open: 191.5, high: 196.0, low: 189.5, close: 194.8, volume: 180000000 },
  { timestamp: 1773705600000, open: 194.2, high: 198.3, low: 192.0, close: 193.5, volume: 142000000 },
  { timestamp: 1773792000000, open: 193.0, high: 197.5, low: 191.2, close: 196.2, volume: 155000000 },
  { timestamp: 1773878400000, open: 196.5, high: 202.0, low: 195.0, close: 200.4, volume: 198000000 },
  { timestamp: 1773964800000, open: 201.0, high: 205.5, low: 199.2, close: 202.8, volume: 185000000 },
  { timestamp: 1774224000000, open: 203.2, high: 208.0, low: 201.5, close: 206.5, volume: 192000000 },
  { timestamp: 1774310400000, open: 206.0, high: 210.2, low: 204.0, close: 205.1, volume: 168000000 },
  { timestamp: 1774396800000, open: 205.4, high: 211.5, low: 203.8, close: 209.7, volume: 177000000 },
  { timestamp: 1774483200000, open: 210.0, high: 215.8, low: 208.5, close: 214.2, volume: 210000000 },
  { timestamp: 1774569600000, open: 213.8, high: 217.4, low: 211.0, close: 212.5, volume: 165000000 },
  { timestamp: 1774828800000, open: 212.8, high: 218.0, low: 210.5, close: 216.9, volume: 182000000 },
  { timestamp: 1774915200000, open: 217.0, high: 222.5, low: 215.2, close: 221.4, volume: 225000000 },
  { timestamp: 1775001600000, open: 221.8, high: 226.0, low: 219.5, close: 223.8, volume: 205000000 },
  { timestamp: 1775088000000, open: 224.2, high: 228.4, low: 221.0, close: 222.1, volume: 175000000 },
  { timestamp: 1775174400000, open: 222.5, high: 226.8, low: 218.4, close: 224.5, volume: 188000000 },
];

type Timeframe = '5D' | '1M' | '3M';

export function HeroChartPreview() {
  const [symbol, setSymbol] = useState<'AAPL' | 'NVDA'>('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rawBars, setRawBars] = useState<Bar[]>(FALLBACK_AAPL_BARS);
  const [dataSource, setDataSource] = useState<'seeded' | 'fixture'>('fixture');

  // Load backend history dynamically with graceful fallback
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch(`http://localhost:5000/stocks/${symbol}/history?range=3m`);
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        if (active && Array.isArray(data.bars) && data.bars.length > 0) {
          const formatted: Bar[] = data.bars.map((b: any) => ({
            timestamp: Number(b.timestamp),
            open: Number(b.open),
            high: Number(b.high),
            low: Number(b.low),
            close: Number(b.close),
            volume: Number(b.volume) || 50000000,
          }));
          setRawBars(formatted);
          setDataSource(data.dataSource === 'seeded' ? 'seeded' : 'fixture');
        }
      } catch {
        if (active) {
          setRawBars(symbol === 'AAPL' ? FALLBACK_AAPL_BARS : FALLBACK_NVDA_BARS);
          setDataSource('fixture');
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [symbol]);

  // Filter bars according to active timeframe
  const visibleBars = useMemo(() => {
    if (!rawBars.length) return FALLBACK_AAPL_BARS;
    if (timeframe === '5D') {
      return rawBars.slice(-5);
    }
    if (timeframe === '1M') {
      return rawBars.slice(-20);
    }
    return rawBars.slice(-45);
  }, [rawBars, timeframe]);

  // Calculate Highs, Lows, Volume, SMA, and EMA
  const { minPrice, maxPrice, maxVol, smaPoints, emaPoints } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxV = 0;

    visibleBars.forEach((b) => {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (b.volume > maxV) maxV = b.volume;
    });

    const padding = (max - min) * 0.1 || 5;
    min -= padding;
    max += padding;

    // 5-period SMA for preview
    const smaPeriod = 5;
    const sma: { x: number; y: number }[] = [];
    for (let i = 0; i < visibleBars.length; i++) {
      if (i >= smaPeriod - 1) {
        const slice = visibleBars.slice(i - smaPeriod + 1, i + 1);
        const avg = slice.reduce((sum, item) => sum + item.close, 0) / smaPeriod;
        sma.push({ x: i, y: avg });
      }
    }

    // 8-period EMA for preview
    const emaPeriod = 8;
    const ema: { x: number; y: number }[] = [];
    const multiplier = 2 / (emaPeriod + 1);
    let prevEma: number | null = null;
    for (let i = 0; i < visibleBars.length; i++) {
      if (i === 0) {
        prevEma = visibleBars[0].close;
      } else if (prevEma !== null) {
        prevEma = (visibleBars[i].close - prevEma) * multiplier + prevEma;
      }
      if (i >= 3 && prevEma !== null) {
        ema.push({ x: i, y: prevEma });
      }
    }

    return { minPrice: min, maxPrice: max, maxVol: maxV, smaPoints: sma, emaPoints: ema };
  }, [visibleBars]);

  const width = 560;
  const height = 260;
  const priceHeight = 185;
  const volHeight = 50;
  const volTop = 205;

  const getX = (index: number) => {
    const step = width / (visibleBars.length + 1);
    return (index + 1) * step;
  };

  const getY = (val: number) => {
    const range = maxPrice - minPrice || 1;
    return priceHeight - ((val - minPrice) / range) * priceHeight + 10;
  };

  const getVolY = (vol: number) => {
    const ratio = maxVol > 0 ? vol / maxVol : 0;
    return height - ratio * volHeight;
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : visibleBars.length - 1;
  const currentBar = visibleBars[activeIndex] ?? visibleBars[visibleBars.length - 1];
  const prevBar = activeIndex > 0 ? visibleBars[activeIndex - 1] : currentBar;
  const changeValue = currentBar.close - prevBar.close;
  const changePercent = prevBar.close > 0 ? (changeValue / prevBar.close) * 100 : 0;
  const isPositive = changeValue >= 0;

  const formattedDate = useMemo(() => {
    if (!currentBar) return '';
    const date = new Date(currentBar.timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [currentBar]);

  const linePath = useMemo(() => {
    return visibleBars
      .map((b, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(b.close).toFixed(1)}`)
      .join(' ');
  }, [visibleBars, minPrice, maxPrice]);

  const smaPath = useMemo(() => {
    if (!smaPoints.length) return '';
    return smaPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.x).toFixed(1)} ${getY(p.y).toFixed(1)}`)
      .join(' ');
  }, [smaPoints, minPrice, maxPrice]);

  const emaPath = useMemo(() => {
    if (!emaPoints.length) return '';
    return emaPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.x).toFixed(1)} ${getY(p.y).toFixed(1)}`)
      .join(' ');
  }, [emaPoints, minPrice, maxPrice]);

  return (
    <div
      role="region"
      aria-label="Interactive Stock Chart Preview"
      className="rounded-xl border border-[#334155] bg-[#0F172A]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3 transition-all hover:border-slate-500/60"
    >
      {/* Chart Preview Top Bar: Symbol, Provenance Pill, and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#334155]/80 pb-3">
        {/* Symbol Selector & Provenance Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex rounded-md border border-[#334155] bg-[#1E293B] p-0.5">
            <button
              type="button"
              onClick={() => {
                setSymbol('AAPL');
                setHoveredIndex(null);
              }}
              className={`rounded px-2 py-0.5 font-mono text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                symbol === 'AAPL'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              aria-label="Select Apple Inc. (AAPL)"
            >
              AAPL
            </button>
            <button
              type="button"
              onClick={() => {
                setSymbol('NVDA');
                setHoveredIndex(null);
              }}
              className={`rounded px-2 py-0.5 font-mono text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                symbol === 'NVDA'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              aria-label="Select NVIDIA Corp (NVDA)"
            >
              NVDA
            </button>
          </div>

          <span className="hidden text-xs text-[#94A3B8] sm:inline">
            {symbol === 'AAPL' ? 'Apple Inc.' : 'NVIDIA Corp.'}
          </span>

          <span
            className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-950/40 px-2 py-0.5 text-[10px] font-semibold text-sky-400"
            title="Data origin verification badge"
          >
            <Activity size={10} />
            <span>
              {dataSource === 'seeded'
                ? `Seeded Demo (${timeframe})`
                : `Mathematical Fixture (${timeframe})`}
            </span>
          </span>
        </div>

        {/* Timeframe & Chart Type Switches */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Timeframe selector */}
          <div className="flex rounded border border-[#334155] bg-[#1E293B] p-0.5 text-[10px] font-semibold">
            {(['5D', '1M', '3M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredIndex(null);
                }}
                className={`rounded px-1.5 py-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  timeframe === tf
                    ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
                aria-pressed={timeframe === tf}
                aria-label={`Timeframe ${tf}`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Candle vs Line */}
          <div className="flex rounded border border-[#334155] bg-[#1E293B] p-0.5">
            <button
              type="button"
              onClick={() => setChartType('candle')}
              className={`rounded px-2 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                chartType === 'candle'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Candlestick Chart View"
              aria-pressed={chartType === 'candle'}
              aria-label="Candlestick View"
            >
              <CandleIcon size={12} className="inline mr-1" />
              Candle
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`rounded px-2 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                chartType === 'line'
                  ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Line Trend View"
              aria-pressed={chartType === 'line'}
              aria-label="Line View"
            >
              <LineIcon size={12} className="inline mr-1" />
              Line
            </button>
          </div>

          {/* Indicator toggles */}
          <button
            type="button"
            onClick={() => setShowSMA((s) => !s)}
            className={`rounded px-2 py-1 text-[10px] font-mono transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              showSMA
                ? 'border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold'
                : 'border-[#334155] text-[#64748B] hover:text-[#94A3B8]'
            }`}
            title="Toggle Simple Moving Average (SMA 20)"
            aria-pressed={showSMA}
            aria-label="Toggle SMA 20"
          >
            SMA 20
          </button>
          <button
            type="button"
            onClick={() => setShowEMA((s) => !s)}
            className={`rounded px-2 py-1 text-[10px] font-mono transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              showEMA
                ? 'border-purple-500/50 bg-purple-950/40 text-purple-300 font-bold'
                : 'border-[#334155] text-[#64748B] hover:text-[#94A3B8]'
            }`}
            title="Toggle Exponential Moving Average (EMA 20)"
            aria-pressed={showEMA}
            aria-label="Toggle EMA 20"
          >
            EMA 20
          </button>
        </div>
      </div>

      {/* Dynamic Numerical Snapshot HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#334155]/60 pb-2.5">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="font-mono text-lg font-extrabold text-white">
            ${currentBar.close.toFixed(2)}
          </span>
          <span
            className={`font-mono text-xs font-semibold ${
              isPositive ? 'text-[#059669]' : 'text-[#DC2626]'
            }`}
          >
            {isPositive ? '+' : ''}
            {changeValue.toFixed(2)} ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
          <span className="text-[11px] text-[#64748B] pl-1 font-sans">{formattedDate}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-[#94A3B8]">
          <span>
            O: <span className="text-white">${currentBar.open.toFixed(2)}</span>
          </span>
          <span>
            H: <span className="text-[#059669]">${currentBar.high.toFixed(2)}</span>
          </span>
          <span>
            L: <span className="text-[#DC2626]">${currentBar.low.toFixed(2)}</span>
          </span>
          <span className="hidden sm:inline">
            Vol: <span className="text-white">{(currentBar.volume / 1000000).toFixed(1)}M</span>
          </span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full overflow-hidden rounded-lg bg-[#1E293B]/40 p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIndex(null)}
          role="img"
          aria-label={`${symbol} chart displaying ${visibleBars.length} daily bars`}
        >
          {/* Horizontal Gridlines */}
          <line
            x1="0"
            y1={priceHeight * 0.25}
            x2={width}
            y2={priceHeight * 0.25}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
          <line
            x1="0"
            y1={priceHeight * 0.5}
            x2={width}
            y2={priceHeight * 0.5}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
          <line
            x1="0"
            y1={priceHeight * 0.75}
            x2={width}
            y2={priceHeight * 0.75}
            stroke="#334155"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
          <line x1="0" y1={volTop} x2={width} y2={volTop} stroke="#334155" strokeOpacity="0.7" />

          {/* Synchronized Volume Bars */}
          {visibleBars.map((bar, i) => {
            const x = getX(i);
            const isGreen = bar.close >= bar.open;
            const y = getVolY(bar.volume);
            const barHeight = Math.max(3, height - y);
            const barWidth = Math.max(4, (width / visibleBars.length) * 0.55);

            return (
              <rect
                key={`vol-${bar.timestamp}-${i}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={isGreen ? '#059669' : '#DC2626'}
                fillOpacity={hoveredIndex === i ? 0.75 : 0.35}
                className="transition-opacity duration-200"
              />
            );
          })}

          {/* Candlesticks or Line Representation */}
          {chartType === 'candle' ? (
            visibleBars.map((bar, i) => {
              const x = getX(i);
              const isGreen = bar.close >= bar.open;
              const color = isGreen ? '#059669' : '#DC2626';
              const yHigh = getY(bar.high);
              const yLow = getY(bar.low);
              const yOpen = getY(bar.open);
              const yClose = getY(bar.close);
              const top = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const candleWidth = Math.max(6, (width / visibleBars.length) * 0.55);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`candle-${bar.timestamp}-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onFocus={() => setHoveredIndex(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Candle ${i + 1}: Close $${bar.close.toFixed(2)}`}
                >
                  {/* High-Low Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth={isHovered ? '2' : '1.5'}
                    strokeOpacity={isHovered ? 1 : 0.85}
                  />
                  {/* Real Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={top}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                    stroke={isHovered ? '#FFFFFF' : 'none'}
                    strokeWidth={isHovered ? 1 : 0}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })
          ) : (
            <path
              d={linePath}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )}

          {/* SMA 20 Overlay Line */}
          {showSMA && smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeDasharray="4 2"
              className="transition-all duration-300"
            />
          )}

          {/* EMA 20 Overlay Line */}
          {showEMA && emaPath && (
            <path
              d={emaPath}
              fill="none"
              stroke="#A78BFA"
              strokeWidth="1.8"
              strokeDasharray="2 2"
              className="transition-all duration-300"
            />
          )}

          {/* Responsive Hover Crosshair */}
          {hoveredIndex !== null && visibleBars[hoveredIndex] && (
            <g className="pointer-events-none">
              <line
                x1={getX(hoveredIndex)}
                y1="0"
                x2={getX(hoveredIndex)}
                y2={height}
                stroke="#F8FAFC"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.75"
              />
              <line
                x1="0"
                y1={getY(visibleBars[hoveredIndex].close)}
                x2={width}
                y2={getY(visibleBars[hoveredIndex].close)}
                stroke="#F8FAFC"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.4"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(visibleBars[hoveredIndex].close)}
                r="4"
                fill="#F8FAFC"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Chart Footer Indicator Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#059669] inline-block" /> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#DC2626] inline-block" /> Bearish
          </span>
          {showSMA && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-0.5 w-3 bg-amber-400 inline-block" /> SMA 20
            </span>
          )}
          {showEMA && (
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-0.5 w-3 bg-purple-400 inline-block" /> EMA 20
            </span>
          )}
        </div>
        <span className="text-[#94A3B8]">Hover candles for date &amp; OHLC metrics</span>
      </div>
    </div>
  );
}
