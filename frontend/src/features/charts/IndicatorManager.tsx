import React, { useState } from 'react';
import type { IndicatorConfig, IndicatorType } from './chartTypes';
import { CHART_THEME } from './chartOptions';

interface IndicatorManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicators: IndicatorConfig[];
  onAddIndicator: (config: IndicatorConfig) => void;
  onRemoveIndicator: (id: string) => void;
  onClearAll: () => void;
  totalBarsCount: number;
}

const DEFAULT_COLORS: Record<IndicatorType, string> = {
  sma: CHART_THEME.indicators.sma,
  ema: CHART_THEME.indicators.ema,
  bb: CHART_THEME.indicators.bb,
  rsi: CHART_THEME.indicators.rsi,
  macd: CHART_THEME.indicators.macd,
  atr: CHART_THEME.indicators.atr,
};

export const IndicatorManager: React.FC<IndicatorManagerProps> = ({
  isOpen,
  onClose,
  activeIndicators,
  onAddIndicator,
  onRemoveIndicator,
  onClearAll,
  totalBarsCount,
}) => {
  const [selectedType, setSelectedType] = useState<IndicatorType>('sma');
  const [period, setPeriod] = useState<number>(20);
  const [stdDev, setStdDev] = useState<number>(2);
  const [fastPeriod, setFastPeriod] = useState<number>(12);
  const [slowPeriod, setSlowPeriod] = useState<number>(26);
  const [signalPeriod, setSignalPeriod] = useState<number>(9);
  const [color, setColor] = useState<string>(DEFAULT_COLORS.sma);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (type: IndicatorType) => {
    setSelectedType(type);
    setColor(DEFAULT_COLORS[type]);
    setErrorMessage(null);
    if (type === 'sma' || type === 'ema') setPeriod(20);
    else if (type === 'bb') {
      setPeriod(20);
      setStdDev(2);
    } else if (type === 'rsi') setPeriod(14);
    else if (type === 'atr') setPeriod(14);
  };

  const handleAdd = () => {
    setErrorMessage(null);

    // Validation checks
    if (selectedType === 'sma' || selectedType === 'ema' || selectedType === 'bb' || selectedType === 'rsi' || selectedType === 'atr') {
      if (!Number.isInteger(period) || period < 2 || period > 500) {
        setErrorMessage('Period must be an integer between 2 and 500.');
        return;
      }
      if (period >= totalBarsCount && totalBarsCount > 0) {
        setErrorMessage(`Period (${period}) exceeds available data bars (${totalBarsCount}).`);
        return;
      }
    }

    if (selectedType === 'bb') {
      if (!Number.isFinite(stdDev) || stdDev <= 0 || stdDev > 10) {
        setErrorMessage('Standard deviation multiplier must be between 0.1 and 10.');
        return;
      }
    }

    if (selectedType === 'macd') {
      if (!Number.isInteger(fastPeriod) || fastPeriod < 2) {
        setErrorMessage('Fast period must be an integer >= 2.');
        return;
      }
      if (!Number.isInteger(slowPeriod) || slowPeriod <= fastPeriod) {
        setErrorMessage('Slow period must be greater than fast period.');
        return;
      }
      if (!Number.isInteger(signalPeriod) || signalPeriod < 1) {
        setErrorMessage('Signal period must be an integer >= 1.');
        return;
      }
      if (slowPeriod + signalPeriod > totalBarsCount && totalBarsCount > 0) {
        setErrorMessage(`MACD warmup (${slowPeriod + signalPeriod}) exceeds available data (${totalBarsCount}).`);
        return;
      }
    }

    let id = '';
    let name = '';

    if (selectedType === 'sma') {
      id = `sma-${period}-${Date.now()}`;
      name = `SMA (${period})`;
    } else if (selectedType === 'ema') {
      id = `ema-${period}-${Date.now()}`;
      name = `EMA (${period})`;
    } else if (selectedType === 'bb') {
      id = `bb-${period}-${stdDev}-${Date.now()}`;
      name = `Bollinger Bands (${period}, ${stdDev})`;
    } else if (selectedType === 'rsi') {
      id = `rsi-${period}-${Date.now()}`;
      name = `RSI (${period})`;
    } else if (selectedType === 'macd') {
      id = `macd-${fastPeriod}-${slowPeriod}-${signalPeriod}-${Date.now()}`;
      name = `MACD (${fastPeriod}, ${slowPeriod}, ${signalPeriod})`;
    } else if (selectedType === 'atr') {
      id = `atr-${period}-${Date.now()}`;
      name = `ATR (${period})`;
    }

    onAddIndicator({
      id,
      type: selectedType,
      name,
      period,
      stdDev,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      color,
    });
  };

  const addQuickPreset = (type: IndicatorType, p: number, nameSuffix = '') => {
    setErrorMessage(null);
    if (p >= totalBarsCount && totalBarsCount > 0) {
      setErrorMessage(`Period (${p}) exceeds available data bars (${totalBarsCount}).`);
      return;
    }
    const id = `${type}-${p}-${Date.now()}`;
    const name = `${type.toUpperCase()}${nameSuffix ? ` ${nameSuffix}` : ''} (${p})`;
    onAddIndicator({
      id,
      type,
      name,
      period: p,
      color: DEFAULT_COLORS[type],
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="indicator-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }} id="indicator-modal-title">
              Technical Indicators & Overlays
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(51, 65, 85, 0.8)',
                color: '#94A3B8',
              }}
            >
              {totalBarsCount} bars loaded
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close indicator modal"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', marginBottom: '8px' }}>
              Quick Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => addQuickPreset('sma', 20)}
                style={presetBtnStyle}
              >
                + SMA 20
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('sma', 50)}
                style={presetBtnStyle}
              >
                + SMA 50
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('sma', 200)}
                style={presetBtnStyle}
              >
                + SMA 200
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('ema', 20)}
                style={presetBtnStyle}
              >
                + EMA 20
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('ema', 50)}
                style={presetBtnStyle}
              >
                + EMA 50
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddIndicator({
                    id: `bb-20-2-${Date.now()}`,
                    type: 'bb',
                    name: 'Bollinger Bands (20, 2)',
                    period: 20,
                    stdDev: 2,
                    color: DEFAULT_COLORS.bb,
                  });
                }}
                style={presetBtnStyle}
              >
                + BB (20, 2)
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('rsi', 14)}
                style={presetBtnStyle}
              >
                + RSI 14
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddIndicator({
                    id: `macd-12-26-9-${Date.now()}`,
                    type: 'macd',
                    name: 'MACD (12, 26, 9)',
                    fastPeriod: 12,
                    slowPeriod: 26,
                    signalPeriod: 9,
                    color: DEFAULT_COLORS.macd,
                  });
                }}
                style={presetBtnStyle}
              >
                + MACD (12, 26, 9)
              </button>
              <button
                type="button"
                onClick={() => addQuickPreset('atr', 14)}
                style={presetBtnStyle}
              >
                + ATR 14
              </button>
            </div>
          </div>

          {/* Custom Indicator Builder */}
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
              Custom Indicator
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <div>
                <label style={labelStyle}>Indicator Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value as IndicatorType)}
                  style={inputStyle}
                >
                  <option value="sma">SMA (Simple Moving Avg)</option>
                  <option value="ema">EMA (Exponential Moving Avg)</option>
                  <option value="bb">Bollinger Bands</option>
                  <option value="rsi">RSI (Relative Strength Index)</option>
                  <option value="macd">MACD (Moving Avg Convergence)</option>
                  <option value="atr">ATR (Average True Range)</option>
                </select>
              </div>

              {(selectedType === 'sma' || selectedType === 'ema' || selectedType === 'bb' || selectedType === 'rsi' || selectedType === 'atr') && (
                <div>
                  <label style={labelStyle}>Period (candles)</label>
                  <input
                    type="number"
                    min={2}
                    max={500}
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value, 10) || 0)}
                    style={inputStyle}
                  />
                </div>
              )}

              {selectedType === 'bb' && (
                <div>
                  <label style={labelStyle}>Std Dev Multiplier</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={10}
                    value={stdDev}
                    onChange={(e) => setStdDev(parseFloat(e.target.value) || 2)}
                    style={inputStyle}
                  />
                </div>
              )}

              {selectedType === 'macd' && (
                <>
                  <div>
                    <label style={labelStyle}>Fast Period</label>
                    <input
                      type="number"
                      min={2}
                      value={fastPeriod}
                      onChange={(e) => setFastPeriod(parseInt(e.target.value, 10) || 12)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Slow Period</label>
                    <input
                      type="number"
                      min={fastPeriod + 1}
                      value={slowPeriod}
                      onChange={(e) => setSlowPeriod(parseInt(e.target.value, 10) || 26)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Signal Period</label>
                    <input
                      type="number"
                      min={1}
                      value={signalPeriod}
                      onChange={(e) => setSignalPeriod(parseInt(e.target.value, 10) || 9)}
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>Accent Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      width: '36px',
                      height: '32px',
                      padding: 0,
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{color}</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#DC2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                }}
              >
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdd}
              style={{
                alignSelf: 'flex-start',
                padding: '6px 14px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Indicator
            </button>
          </div>

          {/* Active Indicators List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>
                Active Indicators ({activeIndicators.length})
              </span>
              {activeIndicators.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {activeIndicators.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic', padding: '8px 0' }}>
                No active indicators on chart.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeIndicators.map((ind) => (
                  <div
                    key={ind.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: ind.color || '#60A5FA',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#FFFFFF' }}>{ind.name}</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                        {ind.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveIndicator(ind.id)}
                      title="Remove indicator"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#1E293B',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#94A3B8',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '4px',
  color: '#FFFFFF',
  fontSize: '12px',
  outline: 'none',
};

const presetBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '4px',
  color: '#FFFFFF',
  fontSize: '11px',
  fontWeight: 500,
  cursor: 'pointer',
};
