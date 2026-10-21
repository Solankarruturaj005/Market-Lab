import React, { useState } from 'react';
import type { ChartType, DataSourceType, DrawingToolType, TimeframeRange } from './chartTypes';

interface ChartToolbarProps {
  timeframe: TimeframeRange;
  onTimeframeChange: (tf: TimeframeRange) => void;
  chartType: ChartType;
  onChartTypeChange: (ct: ChartType) => void;
  activeIndicatorsCount: number;
  onOpenIndicators: () => void;
  activeDrawingTool: DrawingToolType;
  onDrawingToolChange: (tool: DrawingToolType) => void;
  onClearDrawings: () => void;
  hasDrawings: boolean;
  onResetZoom: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onExport: (format: 'png' | 'svg' | 'csv') => void;
  dataSource?: DataSourceType;
  lastUpdated?: string | null;
  totalBarsCount: number;
}

const TIMEFRAMES: TimeframeRange[] = ['5D', '1M', '3M', '6M', '1Y', '3Y', 'All'];

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  activeIndicatorsCount,
  onOpenIndicators,
  activeDrawingTool,
  onDrawingToolChange,
  onClearDrawings,
  hasDrawings,
  onResetZoom,
  onToggleFullscreen,
  isFullscreen,
  onExport,
  dataSource = 'database',
  lastUpdated,
  totalBarsCount,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDrawingsMenu, setShowDrawingsMenu] = useState(false);

  const formatSourceBadge = (source: DataSourceType) => {
    switch (source) {
      case 'database':
      case 'seeded':
        return { label: 'SEEDED DEMO', bg: 'rgba(96, 165, 250, 0.15)', color: '#60A5FA', border: 'rgba(96, 165, 250, 0.4)' };
      case 'live':
        return { label: 'LIVE FEED', bg: 'rgba(5, 150, 105, 0.15)', color: '#10B981', border: 'rgba(5, 150, 105, 0.4)' };
      case 'cached':
        return { label: 'CACHED FEED', bg: 'rgba(148, 163, 184, 0.15)', color: '#CBD5E1', border: 'rgba(148, 163, 184, 0.4)' };
      case 'fallback':
        return { label: 'FALLBACK DATA', bg: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: 'rgba(234, 179, 8, 0.4)' };
      default:
        return { label: 'HISTORICAL', bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.4)' };
    }
  };

  const badge = formatSourceBadge(dataSource);

  const DRAWING_TOOLS: { type: DrawingToolType; label: string; icon: string }[] = [
    { type: null, label: 'Cursor / Pan', icon: '✋' },
    { type: 'horizontal-line', label: 'Price Level Line', icon: '—' },
    { type: 'vertical-line', label: 'Timeline Marker', icon: '|' },
    { type: 'label', label: 'Text Callout Note', icon: 'T' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #334155',
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        fontSize: '12px',
      }}
    >
      {/* Left controls: Timeframes & Chart Type */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        {/* Timeframe selector */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '4px', padding: '2px', border: '1px solid #334155' }}>
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                style={{
                  padding: '3px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: isActive ? '#334155' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Chart type switcher */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: '4px', padding: '2px', border: '1px solid #334155' }}>
          {(['candlestick', 'ohlc', 'line', 'area'] as ChartType[]).map((ct) => {
            const isActive = chartType === ct;
            const labels: Record<ChartType, string> = {
              candlestick: '🕯 Candle',
              ohlc: '📊 OHLC',
              line: '📈 Line',
              area: '🏔 Area',
            };
            return (
              <button
                key={ct}
                type="button"
                onClick={() => onChartTypeChange(ct)}
                style={{
                  padding: '3px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: isActive ? '#334155' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {labels[ct]}
              </button>
            );
          })}
        </div>

        {/* Indicators Manager Trigger */}
        <button
          type="button"
          onClick={onOpenIndicators}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: activeIndicatorsCount > 0 ? 'rgba(96, 165, 250, 0.15)' : '#0F172A',
            border: `1px solid ${activeIndicatorsCount > 0 ? '#60A5FA' : '#334155'}`,
            borderRadius: '4px',
            color: activeIndicatorsCount > 0 ? '#60A5FA' : '#FFFFFF',
            fontWeight: 500,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          <span>Indicators</span>
          {activeIndicatorsCount > 0 && (
            <span
              style={{
                backgroundColor: '#60A5FA',
                color: '#0F172A',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '0 5px',
                lineHeight: '16px',
                height: '16px',
              }}
            >
              {activeIndicatorsCount}
            </span>
          )}
        </button>

        {/* Drawing Tools Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDrawingsMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: activeDrawingTool ? 'rgba(251, 191, 36, 0.15)' : '#0F172A',
              border: `1px solid ${activeDrawingTool ? '#FBBF24' : '#334155'}`,
              borderRadius: '4px',
              color: activeDrawingTool ? '#FBBF24' : '#FFFFFF',
              fontWeight: 500,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <span>Tools: {activeDrawingTool ? activeDrawingTool : 'Cursor'}</span>
            <span style={{ fontSize: '9px' }}>▼</span>
          </button>

          {showDrawingsMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px',
                zIndex: 100,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                minWidth: '160px',
              }}
            >
              {DRAWING_TOOLS.map((tool) => (
                <button
                  key={String(tool.type)}
                  type="button"
                  onClick={() => {
                    onDrawingToolChange(tool.type);
                    setShowDrawingsMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 8px',
                    textAlign: 'left',
                    background: activeDrawingTool === tool.type ? '#334155' : 'none',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: '16px', textAlign: 'center' }}>{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}

              {hasDrawings && (
                <>
                  <div style={{ height: '1px', backgroundColor: '#334155', margin: '4px 0' }} />
                  <button
                    type="button"
                    onClick={() => {
                      onClearDrawings();
                      setShowDrawingsMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 8px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#DC2626',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear All Drawings
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls: Zoom, Fullscreen, Export, Metadata Badges */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        {/* Reset Zoom */}
        <button
          type="button"
          onClick={onResetZoom}
          title="Reset Zoom"
          style={{
            padding: '4px 8px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94A3B8',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Reset Zoom
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          style={{
            padding: '4px 8px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: isFullscreen ? '#F8FAFC' : '#94A3B8',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {isFullscreen ? '⤢ Exit' : '⤢ Fullscreen'}
        </button>

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowExportMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#94A3B8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <span>Export</span>
            <span style={{ fontSize: '9px' }}>▼</span>
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px',
                zIndex: 100,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                minWidth: '120px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onExport('png');
                  setShowExportMenu(false);
                }}
                style={exportItemStyle}
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport('svg');
                  setShowExportMenu(false);
                }}
                style={exportItemStyle}
              >
                Download SVG
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport('csv');
                  setShowExportMenu(false);
                }}
                style={exportItemStyle}
              >
                Download CSV Data
              </button>
            </div>
          )}
        </div>

        {/* Data Source & Freshness Metadata Badge */}
        <div
          title={`Total historical candles: ${totalBarsCount}${lastUpdated ? ` · Last updated: ${lastUpdated}` : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: badge.bg,
            border: `1px solid ${badge.border}`,
            fontSize: '10px',
            fontWeight: 600,
            color: badge.color,
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.color }} />
          <span>{badge.label}</span>
          <span style={{ color: '#94A3B8', fontWeight: 400 }}>({totalBarsCount}D)</span>
        </div>
      </div>
    </div>
  );
};

const exportItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 10px',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  borderRadius: '4px',
  color: '#FFFFFF',
  fontSize: '11px',
  cursor: 'pointer',
};
