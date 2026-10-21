import type Highcharts from 'highcharts/highstock';
import type { ChartType, OhlcvBar } from './chartTypes';

export const CHART_THEME = {
  canvas: '#1E293B',
  surface: '#0F172A',
  surfaceLight: '#1E293B',
  border: '#334155',
  borderHover: '#475569',
  grid: 'rgba(51, 65, 85, 0.45)',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  positive: '#059669',
  positiveMuted: 'rgba(5, 150, 105, 0.65)',
  negative: '#DC2626',
  negativeMuted: 'rgba(220, 38, 38, 0.65)',
  focusSurface: '#F8FAFC',
  focusText: '#0F172A',
  indicators: {
    sma: '#60A5FA',
    ema: '#A78BFA',
    bb: '#FBBF24',
    rsi: '#F472B6',
    macd: '#38BDF8',
    macdSignal: '#F97316',
    atr: '#34D399',
    volume: '#64748B',
  },
};

/**
 * Transforms OhlcvBar[] into Highcharts Stock data arrays.
 */
export function transformBarsForHighcharts(bars: OhlcvBar[]) {
  const ohlcData: [number, number, number, number, number][] = [];
  const lineData: [number, number][] = [];
  const volumeData: { x: number; y: number; color: string }[] = [];

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const isUp = bar.close >= bar.open;
    ohlcData.push([bar.timestamp, bar.open, bar.high, bar.low, bar.close]);
    lineData.push([bar.timestamp, bar.close]);

    if (bar.volume !== null && bar.volume !== undefined) {
      volumeData.push({
        x: bar.timestamp,
        y: bar.volume,
        color: isUp ? CHART_THEME.positiveMuted : CHART_THEME.negativeMuted,
      });
    }
  }

  return { ohlcData, lineData, volumeData, hasVolume: volumeData.length > 0 };
}

export interface BuildChartOptionsParams {
  symbol: string;
  currency?: string;
  chartType: ChartType;
  bars: OhlcvBar[];
  height?: number | string;
}

/**
 * Builds institutional Highcharts Stock options conforming to Phase 2A design tokens.
 */
export function buildStockChartOptions({
  symbol,
  currency = 'USD',
  chartType,
  bars,
  height = 540,
}: BuildChartOptionsParams): Highcharts.Options {
  const { ohlcData, lineData, volumeData, hasVolume } = transformBarsForHighcharts(bars);

  // Y-axis layout: if volume is present, main price pane takes 75%, volume pane takes 22%
  const yAxes: Highcharts.YAxisOptions[] = [
    {
      labels: {
        align: 'right',
        x: -3,
        style: {
          color: CHART_THEME.textSecondary,
          fontSize: '11px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        formatter: function () {
          const val = Number(this.value);
          if (currency === 'POINTS' || currency === 'PTS') {
            return `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts`;
          }
          return `${currency === 'USD' ? '$' : ''}${val.toFixed(2)}`;
        },
      },
      title: {
        text: undefined,
      },
      height: hasVolume ? '74%' : '100%',
      lineWidth: 1,
      lineColor: CHART_THEME.border,
      gridLineColor: CHART_THEME.grid,
      gridLineWidth: 1,
      opposite: true,
      resize: {
        enabled: true,
      },
    },
  ];

  if (hasVolume) {
    yAxes.push({
      labels: {
        align: 'right',
        x: -3,
        style: {
          color: CHART_THEME.textMuted,
          fontSize: '10px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        formatter: function () {
          const val = Number(this.value);
          if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
          if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
          if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
          return String(val);
        },
      },
      title: {
        text: undefined,
      },
      top: '78%',
      height: '22%',
      offset: 0,
      lineWidth: 1,
      lineColor: CHART_THEME.border,
      gridLineColor: CHART_THEME.grid,
      gridLineWidth: 1,
      opposite: true,
    });
  }

  // Main series definition depending on chart type
  const series: Highcharts.SeriesOptionsType[] = [];

  if (chartType === 'candlestick') {
    series.push({
      type: 'candlestick',
      id: 'main-series',
      name: symbol,
      data: ohlcData,
      color: CHART_THEME.negative,
      upColor: CHART_THEME.positive,
      lineColor: CHART_THEME.negative,
      upLineColor: CHART_THEME.positive,
      dataGrouping: {
        enabled: false,
      },
      tooltip: {
        pointFormatter: function () {
          const point = this as any;
          const open = point.open?.toFixed(2) ?? '—';
          const high = point.high?.toFixed(2) ?? '—';
          const low = point.low?.toFixed(2) ?? '—';
          const close = point.close?.toFixed(2) ?? '—';
          const diff = point.close && point.open ? point.close - point.open : 0;
          const pct = point.open ? (diff / point.open) * 100 : 0;
          const sign = diff >= 0 ? '+' : '';
          const diffColor = diff >= 0 ? CHART_THEME.positive : CHART_THEME.negative;

          return `
            <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; line-height: 1.5; color: ${CHART_THEME.textPrimary};">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: ${CHART_THEME.textPrimary};">
                ${symbol} · Candlestick
              </div>
              <div style="display: grid; grid-template-columns: auto auto; gap: 4px 16px; color: ${CHART_THEME.textSecondary};">
                <span>Open:</span><span style="color: ${CHART_THEME.textPrimary}; font-weight: 500; text-align: right;">${open}</span>
                <span>High:</span><span style="color: ${CHART_THEME.textPrimary}; font-weight: 500; text-align: right;">${high}</span>
                <span>Low:</span><span style="color: ${CHART_THEME.textPrimary}; font-weight: 500; text-align: right;">${low}</span>
                <span>Close:</span><span style="color: ${CHART_THEME.textPrimary}; font-weight: 500; text-align: right;">${close}</span>
                <span>Change:</span><span style="color: ${diffColor}; font-weight: 600; text-align: right;">${sign}${diff.toFixed(2)} (${sign}${pct.toFixed(2)}%)</span>
              </div>
            </div>
          `;
        },
      },
    } as any);
  } else if (chartType === 'ohlc') {
    series.push({
      type: 'ohlc',
      id: 'main-series',
      name: symbol,
      data: ohlcData,
      color: CHART_THEME.negative,
      upColor: CHART_THEME.positive,
      dataGrouping: {
        enabled: false,
      },
    } as any);
  } else if (chartType === 'area') {
    series.push({
      type: 'area',
      id: 'main-series',
      name: symbol,
      data: lineData,
      color: CHART_THEME.positive,
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [
          [0, 'rgba(5, 150, 105, 0.35)'],
          [1, 'rgba(5, 150, 105, 0.0)'],
        ],
      },
      lineWidth: 2,
      dataGrouping: {
        enabled: false,
      },
    } as any);
  } else {
    series.push({
      type: 'line',
      id: 'main-series',
      name: symbol,
      data: lineData,
      color: '#38BDF8',
      lineWidth: 2,
      dataGrouping: {
        enabled: false,
      },
    } as any);
  }

  // Volume series if data is available
  if (hasVolume) {
    series.push({
      type: 'column',
      id: 'volume-series',
      name: 'Volume',
      data: volumeData,
      yAxis: 1,
      dataGrouping: {
        enabled: false,
      },
      tooltip: {
        pointFormatter: function () {
          const point = this as any;
          const val = Number(point.y);
          return `<div style="font-size: 11px; color: ${CHART_THEME.textSecondary};">Volume: <b style="color: ${CHART_THEME.textPrimary};">${val.toLocaleString()}</b></div>`;
        },
      },
    } as any);
  }

  return {
    chart: {
      backgroundColor: CHART_THEME.surface,
      plotBackgroundColor: CHART_THEME.surface,
      plotBorderColor: CHART_THEME.border,
      plotBorderWidth: 1,
      style: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      },
      height,
      spacing: [10, 10, 15, 10],
      panning: {
        enabled: true,
        type: 'x',
      },
      panKey: 'shift',
      zooming: {
        type: 'x',
      },
    },
    credits: {
      enabled: false,
    },
    title: {
      text: undefined,
    },
    subtitle: {
      text: undefined,
    },
    rangeSelector: {
      enabled: false, // We supply custom Phase 2A styled range buttons in ChartToolbar
    },
    navigator: {
      enabled: true,
      height: 35,
      margin: 12,
      maskFill: 'rgba(51, 65, 85, 0.35)',
      outlineColor: CHART_THEME.border,
      outlineWidth: 1,
      handles: {
        backgroundColor: CHART_THEME.borderHover,
        borderColor: CHART_THEME.textSecondary,
      },
      series: {
        color: '#60A5FA',
        lineWidth: 1,
        fillOpacity: 0.1,
      },
      xAxis: {
        gridLineColor: CHART_THEME.grid,
        labels: {
          style: {
            color: CHART_THEME.textMuted,
            fontSize: '9px',
          },
        },
      },
    },
    scrollbar: {
      enabled: false,
    },
    xAxis: {
      type: 'datetime',
      lineColor: CHART_THEME.border,
      lineWidth: 1,
      tickColor: CHART_THEME.border,
      gridLineColor: CHART_THEME.grid,
      gridLineWidth: 1,
      crosshair: {
        color: 'rgba(148, 163, 184, 0.4)',
        dashStyle: 'Dash',
        width: 1,
      },
      labels: {
        style: {
          color: CHART_THEME.textSecondary,
          fontSize: '11px',
        },
      },
    },
    yAxis: yAxes,
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: CHART_THEME.border,
      borderRadius: 6,
      borderWidth: 1,
      shadow: false,
      padding: 10,
      style: {
        color: CHART_THEME.textPrimary,
      },
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        animation: false,
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
      },
      candlestick: {
        lineColor: CHART_THEME.negative,
        upLineColor: CHART_THEME.positive,
        color: CHART_THEME.negative,
        upColor: CHART_THEME.positive,
      },
      column: {
        borderWidth: 0,
        pointPadding: 0.05,
        groupPadding: 0.05,
      },
    },
    series,
    exporting: {
      enabled: false, // Export actions triggered from custom toolbar
      fallbackToExportServer: false,
    },
  };
}
