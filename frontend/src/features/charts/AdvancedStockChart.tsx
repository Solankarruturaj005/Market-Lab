import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import exporting from 'highcharts/modules/exporting';
import exportData from 'highcharts/modules/export-data';
import accessibility from 'highcharts/modules/accessibility';
import indicatorsAll from 'highcharts/indicators/indicators-all';
import annotationsAdvanced from 'highcharts/modules/annotations-advanced';

import type { ChartType, DataSourceType, DrawingAnnotation, DrawingToolType, IndicatorConfig, OhlcvBar, TimeframeRange } from './chartTypes';
import { buildStockChartOptions, CHART_THEME } from './chartOptions';
import { fetchStockHistory, filterBarsByTimeframe } from './stockHistoryAdapter';
import { ChartToolbar } from './ChartToolbar';
import { IndicatorManager } from './IndicatorManager';
import { clearAnnotations, loadAnnotations, saveAnnotations } from './chartPersistence';
import { useAuthStore } from '../../store/authStore';
import { isIndexSymbol } from '../../utils/formatters';

// Module initialization singleton
let modulesInitialized = false;
function initHighcharts() {
  if (modulesInitialized || typeof window === 'undefined') return;
  (window as any)._Highcharts = Highcharts;
  const init = (mod: any) => {
    if (typeof mod === 'function') {
      try {
        mod(Highcharts);
      } catch {
        // Module might already be bound
      }
    }
  };
  init(exporting);
  init(exportData);
  init(accessibility);
  init(indicatorsAll);
  init(annotationsAdvanced);
  modulesInitialized = true;
}

export interface AdvancedStockChartProps {
  symbol: string;
  currency?: string;
  height?: number | string;
  initialChartType?: ChartType;
  initialTimeframe?: TimeframeRange;
  onDataLoaded?: (bars: OhlcvBar[]) => void;
}

export const AdvancedStockChart: React.FC<AdvancedStockChartProps> = ({
  symbol,
  currency = 'USD',
  height = 560,
  initialChartType = 'candlestick',
  initialTimeframe = '1Y',
  onDataLoaded,
}) => {
  // Ensure modules initialized once
  initHighcharts();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Highcharts.Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Data state
  const [allBars, setAllBars] = useState<OhlcvBar[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceType>('database');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive controls state
  const [timeframe, setTimeframe] = useState<TimeframeRange>(initialTimeframe);
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorConfig[]>([]);
  const [isIndicatorManagerOpen, setIsIndicatorManagerOpen] = useState<boolean>(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([]);

  // Current user for drawing persistence
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  // Load drawings from persistence on mount or symbol switch
  useEffect(() => {
    const saved = loadAnnotations(userId, symbol);
    setAnnotations(saved);
  }, [userId, symbol]);

  // Fetch full stock history on symbol change
  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    setIsLoading(true);
    setErrorMessage(null);

    fetchStockHistory(symbol, 'All', abortController.signal)
      .then((res) => {
        if (isCancelled) return;
        setAllBars(res.bars);
        setDataSource(res.dataSource);
        setLastUpdated(res.lastUpdated);
        setIsLoading(false);
        if (onDataLoaded) {
          onDataLoaded(res.bars);
        }
      })
      .catch((err) => {
        if (isCancelled || abortController.signal.aborted) return;
        console.error(`[AdvancedStockChart] Failed to load history for ${symbol}:`, err);
        setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to load stock price history');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [symbol, onDataLoaded]);

  // Client-side filtered bars based on active timeframe
  const displayedBars = useMemo(() => {
    return filterBarsByTimeframe(allBars, timeframe);
  }, [allBars, timeframe]);

  // Check which pane indicators are active
  const hasRsi = useMemo(() => activeIndicators.some((i) => i.type === 'rsi'), [activeIndicators]);
  const hasMacd = useMemo(() => activeIndicators.some((i) => i.type === 'macd'), [activeIndicators]);
  const hasAtr = useMemo(() => activeIndicators.some((i) => i.type === 'atr'), [activeIndicators]);

  // Construct chart options with dynamic panes and indicators
  const chartOptions = useMemo<Highcharts.Options>(() => {
    const base = buildStockChartOptions({
      symbol,
      currency,
      chartType,
      bars: displayedBars,
      height: isFullscreen ? '100%' : height,
    });

    const hasVolume = displayedBars.some((b) => b.volume !== null && b.volume !== undefined && b.volume > 0);

    // Calculate sub-pane slots
    const subPanes: { id: string; heightPct: number }[] = [];
    if (hasVolume) subPanes.push({ id: 'volume', heightPct: 18 });
    if (hasRsi) subPanes.push({ id: 'rsi', heightPct: 18 });
    if (hasMacd) subPanes.push({ id: 'macd', heightPct: 18 });
    if (hasAtr) subPanes.push({ id: 'atr', heightPct: 18 });

    const totalSubHeight = subPanes.reduce((acc, p) => acc + p.heightPct, 0);
    const mainHeightPct = Math.max(38, 100 - totalSubHeight - (subPanes.length * 3));

    const isIndex = isIndexSymbol(symbol);
    const activeCurrency = isIndex ? 'POINTS' : currency;

    // Construct Y-Axes
    const yAxes: Highcharts.YAxisOptions[] = [
      {
        id: 'price-axis',
        labels: {
          align: 'right',
          x: -3,
          style: { color: CHART_THEME.textSecondary, fontSize: '11px' },
          formatter: function () {
            const val = Number(this.value);
            if (activeCurrency === 'POINTS' || activeCurrency === 'PTS') {
              return `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts`;
            }
            return `${activeCurrency === 'USD' ? '$' : ''}${val.toFixed(2)}`;
          },
        },
        height: `${mainHeightPct}%`,
        lineWidth: 1,
        lineColor: CHART_THEME.border,
        gridLineColor: CHART_THEME.grid,
        opposite: true,
      },
    ];

    let currentTop = mainHeightPct + 3;

    // Helper to add sub-axis
    const axisIndexMap: Record<string, number> = { price: 0 };

    subPanes.forEach((pane) => {
      const idx = yAxes.length;
      axisIndexMap[pane.id] = idx;

      if (pane.id === 'volume') {
        yAxes.push({
          id: 'volume-axis',
          labels: {
            align: 'right',
            x: -3,
            style: { color: CHART_THEME.textMuted, fontSize: '10px' },
            formatter: function () {
              const val = Number(this.value);
              if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
              if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
              if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
              return String(val);
            },
          },
          top: `${currentTop}%`,
          height: `${pane.heightPct}%`,
          offset: 0,
          lineWidth: 1,
          lineColor: CHART_THEME.border,
          gridLineColor: CHART_THEME.grid,
          opposite: true,
        });
      } else if (pane.id === 'rsi') {
        yAxes.push({
          id: 'rsi-axis',
          title: { text: 'RSI', style: { color: CHART_THEME.indicators.rsi, fontSize: '10px' } },
          labels: { align: 'right', x: -3, style: { color: CHART_THEME.textMuted, fontSize: '10px' } },
          top: `${currentTop}%`,
          height: `${pane.heightPct}%`,
          offset: 0,
          min: 0,
          max: 100,
          plotLines: [
            { value: 70, color: 'rgba(220, 38, 38, 0.4)', dashStyle: 'Dot', width: 1 },
            { value: 30, color: 'rgba(5, 150, 105, 0.4)', dashStyle: 'Dot', width: 1 },
          ],
          lineWidth: 1,
          lineColor: CHART_THEME.border,
          gridLineColor: CHART_THEME.grid,
          opposite: true,
        });
      } else if (pane.id === 'macd') {
        yAxes.push({
          id: 'macd-axis',
          title: { text: 'MACD', style: { color: CHART_THEME.indicators.macd, fontSize: '10px' } },
          labels: { align: 'right', x: -3, style: { color: CHART_THEME.textMuted, fontSize: '10px' } },
          top: `${currentTop}%`,
          height: `${pane.heightPct}%`,
          offset: 0,
          plotLines: [{ value: 0, color: 'rgba(148, 163, 184, 0.4)', width: 1 }],
          lineWidth: 1,
          lineColor: CHART_THEME.border,
          gridLineColor: CHART_THEME.grid,
          opposite: true,
        });
      } else if (pane.id === 'atr') {
        yAxes.push({
          id: 'atr-axis',
          title: { text: 'ATR', style: { color: CHART_THEME.indicators.atr, fontSize: '10px' } },
          labels: { align: 'right', x: -3, style: { color: CHART_THEME.textMuted, fontSize: '10px' } },
          top: `${currentTop}%`,
          height: `${pane.heightPct}%`,
          offset: 0,
          lineWidth: 1,
          lineColor: CHART_THEME.border,
          gridLineColor: CHART_THEME.grid,
          opposite: true,
        });
      }

      currentTop += pane.heightPct + 3;
    });

    base.yAxis = yAxes;

    // Update volume series yAxis index
    if (hasVolume && base.series) {
      const volSeries = base.series.find((s) => s.id === 'volume-series') as any;
      if (volSeries) {
        volSeries.yAxis = axisIndexMap.volume;
      }
    }

    // Add indicator series
    const additionalSeries: Highcharts.SeriesOptionsType[] = [];

    activeIndicators.forEach((ind) => {
      if (ind.type === 'sma') {
        additionalSeries.push({
          type: 'sma',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          color: ind.color || CHART_THEME.indicators.sma,
          lineWidth: 1.5,
          params: {
            period: ind.period || 20,
          },
        } as any);
      } else if (ind.type === 'ema') {
        additionalSeries.push({
          type: 'ema',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          color: ind.color || CHART_THEME.indicators.ema,
          lineWidth: 1.5,
          params: {
            period: ind.period || 20,
          },
        } as any);
      } else if (ind.type === 'bb') {
        additionalSeries.push({
          type: 'bb',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          color: ind.color || CHART_THEME.indicators.bb,
          lineWidth: 1,
          params: {
            period: ind.period || 20,
            standardDeviation: ind.stdDev || 2,
          },
        } as any);
      } else if (ind.type === 'rsi' && axisIndexMap.rsi !== undefined) {
        additionalSeries.push({
          type: 'rsi',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          yAxis: axisIndexMap.rsi,
          color: ind.color || CHART_THEME.indicators.rsi,
          lineWidth: 1.5,
          params: {
            period: ind.period || 14,
          },
        } as any);
      } else if (ind.type === 'macd' && axisIndexMap.macd !== undefined) {
        additionalSeries.push({
          type: 'macd',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          yAxis: axisIndexMap.macd,
          color: ind.color || CHART_THEME.indicators.macd,
          params: {
            shortPeriod: ind.fastPeriod || 12,
            longPeriod: ind.slowPeriod || 26,
            signalPeriod: ind.signalPeriod || 9,
            period: ind.slowPeriod || 26,
          },
        } as any);
      } else if (ind.type === 'atr' && axisIndexMap.atr !== undefined) {
        additionalSeries.push({
          type: 'atr',
          id: ind.id,
          name: ind.name,
          linkedTo: 'main-series',
          yAxis: axisIndexMap.atr,
          color: ind.color || CHART_THEME.indicators.atr,
          lineWidth: 1.5,
          params: {
            period: ind.period || 14,
          },
        } as any);
      }
    });

    base.series = [...(base.series || []), ...additionalSeries];

    // Chart click handling for interactive drawing tools
    base.chart = {
      ...base.chart,
      events: {
        click: function (e: any) {
          if (!activeDrawingTool) return;
          const chart = this;
          const xVal = Math.round(e.xAxis[0]?.value);
          const yVal = Number(e.yAxis[0]?.value);

          if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) return;

          let newAnnotation: DrawingAnnotation | null = null;

          if (activeDrawingTool === 'horizontal-line') {
            const annotationOptions = {
              id: `hline-${Date.now()}`,
              shapes: [
                {
                  type: 'path',
                  points: [
                    { x: chart.xAxis[0].min, y: yVal, xAxis: 0, yAxis: 0 },
                    { x: chart.xAxis[0].max, y: yVal, xAxis: 0, yAxis: 0 },
                  ],
                  stroke: '#FBBF24',
                  strokeWidth: 1.5,
                  dashStyle: 'Dash',
                },
              ],
              labels: [
                {
                  point: { x: chart.xAxis[0].max, y: yVal, xAxis: 0, yAxis: 0 },
                  text: isIndexSymbol(symbol) ? `${yVal.toFixed(1)} pts` : `$${yVal.toFixed(2)}`,
                  backgroundColor: '#FBBF24',
                  style: { color: '#0F172A', fontSize: '10px', fontWeight: 'bold' },
                  align: 'right' as const,
                },
              ],
            };
            (chart as any).addAnnotation(annotationOptions);
            newAnnotation = {
              id: annotationOptions.id,
              type: 'horizontal-line',
              options: annotationOptions,
              createdAt: Date.now(),
            };
          } else if (activeDrawingTool === 'vertical-line') {
            const annotationOptions = {
              id: `vline-${Date.now()}`,
              shapes: [
                {
                  type: 'path',
                  points: [
                    { x: xVal, y: chart.yAxis[0].min ?? 0, xAxis: 0, yAxis: 0 },
                    { x: xVal, y: chart.yAxis[0].max ?? 100, xAxis: 0, yAxis: 0 },
                  ],
                  stroke: '#38BDF8',
                  strokeWidth: 1.5,
                  dashStyle: 'Dot',
                },
              ],
              labels: [
                {
                  point: { x: xVal, y: chart.yAxis[0].max ?? 100, xAxis: 0, yAxis: 0 },
                  text: new Date(xVal).toLocaleDateString(),
                  backgroundColor: '#38BDF8',
                  style: { color: '#0F172A', fontSize: '10px', fontWeight: 'bold' },
                },
              ],
            };
            (chart as any).addAnnotation(annotationOptions);
            newAnnotation = {
              id: annotationOptions.id,
              type: 'vertical-line',
              options: annotationOptions,
              createdAt: Date.now(),
            };
          } else if (activeDrawingTool === 'label') {
            const text = window.prompt('Enter callout text for this candle / level:');
            if (text && text.trim()) {
              const annotationOptions = {
                id: `label-${Date.now()}`,
                labels: [
                  {
                    point: { x: xVal, y: yVal, xAxis: 0, yAxis: 0 },
                    text: text.trim(),
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#60A5FA',
                    borderWidth: 1,
                    style: { color: '#FFFFFF', fontSize: '11px' },
                  },
                ],
              };
              (chart as any).addAnnotation(annotationOptions);
              newAnnotation = {
                id: annotationOptions.id,
                type: 'label',
                options: annotationOptions,
                createdAt: Date.now(),
              };
            }
          }

          if (newAnnotation) {
            setAnnotations((prev) => {
              const updated = [...prev, newAnnotation!];
              saveAnnotations(userId, symbol, updated);
              return updated;
            });
            setActiveDrawingTool(null); // Return to pan
          }
        },
      },
    };

    return base;
  }, [symbol, currency, chartType, displayedBars, isFullscreen, height, hasRsi, hasMacd, hasAtr, activeIndicators, activeDrawingTool, userId]);

  // Mount or update Highcharts Stock chart instance
  useEffect(() => {
    if (!chartContainerRef.current || displayedBars.length === 0) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = Highcharts.stockChart(chartContainerRef.current, chartOptions);
    } else {
      chartInstanceRef.current.update(chartOptions, true, true);
    }
  }, [chartOptions, displayedBars.length]);

  // Clean up on unmount or symbol switch
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [symbol]);

  // Restore saved annotations after chart mounts/updates
  useEffect(() => {
    const chart = chartInstanceRef.current as any;
    if (!chart || annotations.length === 0) return;

    // Add each annotation if not already present
    annotations.forEach((anno) => {
      const existing = (chart.annotations || []).find((a: any) => a.options.id === anno.id);
      if (!existing && anno.options) {
        try {
          chart.addAnnotation(anno.options);
        } catch (e) {
          console.warn('[AdvancedStockChart] Failed to render saved annotation', e);
        }
      }
    });
  }, [annotations, chartOptions]);

  // Toolbar Actions
  const handleResetZoom = useCallback(() => {
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.zoomOut();
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen to fullscreenchange
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      chartInstanceRef.current?.reflow();
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleClearDrawings = useCallback(() => {
    const chart = chartInstanceRef.current as any;
    if (chart && chart.annotations) {
      while (chart.annotations.length > 0) {
        chart.removeAnnotation(chart.annotations[0]);
      }
    }
    clearAnnotations(userId, symbol);
    setAnnotations([]);
  }, [userId, symbol]);

  const handleExport = useCallback(
    (format: 'png' | 'svg' | 'csv') => {
      const chart = chartInstanceRef.current as any;
      if (!chart) return;

      if (format === 'csv') {
        const headers = ['Date', 'Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'];
        const rows = displayedBars.map((b) => [
          new Date(b.timestamp).toISOString().split('T')[0],
          b.timestamp,
          b.open,
          b.high,
          b.low,
          b.close,
          b.volume ?? '',
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${symbol}_OHLCV_${timeframe}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        chart.exportChart({ type: 'image/png', filename: `${symbol}_chart_${timeframe}` }, {});
      } else if (format === 'svg') {
        chart.exportChart({ type: 'image/svg+xml', filename: `${symbol}_chart_${timeframe}` }, {});
      }
    },
    [displayedBars, symbol, timeframe],
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
      }}
    >
      {/* Top Interactive Toolbar */}
      <ChartToolbar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        chartType={chartType}
        onChartTypeChange={setChartType}
        activeIndicatorsCount={activeIndicators.length}
        onOpenIndicators={() => setIsIndicatorManagerOpen(true)}
        activeDrawingTool={activeDrawingTool}
        onDrawingToolChange={setActiveDrawingTool}
        onClearDrawings={handleClearDrawings}
        hasDrawings={annotations.length > 0}
        onResetZoom={handleResetZoom}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onExport={handleExport}
        dataSource={dataSource}
        lastUpdated={lastUpdated}
        totalBarsCount={allBars.length}
      />

      {/* Main Chart Area with Loading / Error / Empty states */}
      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '440px', backgroundColor: '#0F172A' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '3px solid #334155',
                borderTopColor: '#60A5FA',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>Loading {symbol} OHLCV database records...</div>
          </div>
        )}

        {errorMessage && !isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '24px' }}>⚠️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Unable to display chart</div>
            <div style={{ fontSize: '12px', color: '#DC2626', maxWidth: '400px' }}>{errorMessage}</div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setErrorMessage(null);
                fetchStockHistory(symbol, 'All')
                  .then((res) => {
                    setAllBars(res.bars);
                    setDataSource(res.dataSource);
                    setLastUpdated(res.lastUpdated);
                    setIsLoading(false);
                  })
                  .catch((err) => {
                    setErrorMessage(err?.message || 'Failed again');
                    setIsLoading(false);
                  });
              }}
              style={{
                marginTop: '12px',
                padding: '6px 14px',
                backgroundColor: '#334155',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && displayedBars.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>No historical bars available</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              No OHLCV price history records found in database for ticker {symbol}.
            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 45px)' : `${height}px`,
            display: displayedBars.length > 0 ? 'block' : 'none',
          }}
        />
      </div>

      {/* Indicator Manager Modal */}
      <IndicatorManager
        isOpen={isIndicatorManagerOpen}
        onClose={() => setIsIndicatorManagerOpen(false)}
        activeIndicators={activeIndicators}
        onAddIndicator={(config) => {
          setActiveIndicators((prev) => [...prev, config]);
        }}
        onRemoveIndicator={(id) => {
          setActiveIndicators((prev) => prev.filter((i) => i.id !== id));
        }}
        onClearAll={() => setActiveIndicators([])}
        totalBarsCount={displayedBars.length}
      />
    </div>
  );
};
