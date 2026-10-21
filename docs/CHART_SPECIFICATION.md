# Market Lab — Chart Specification & Visualization Design

## Phase 2A — Institutional Recharts Design Tokens & Contracts

This specification defines the visualization guidelines, mathematical data models, color palettes, scaling rules, and interaction behaviors for all charts rendered across Market Lab.

---

## 1. Centralized Institutional Design Tokens

The visualization system uses an institutional midnight-slate palette designed for clarity, high contrast, and reduced visual fatigue. Neon cyan, purple, and distracting rainbow gradients have been completely eliminated.

| Element | Hex / Token Value | Purpose / Notes |
| :--- | :--- | :--- |
| **Primary Price Line** | `#FFFFFF` | Solid 2px line with low-opacity (12% -> 0%) white area fill |
| **SMA 20 Line** | `#94A3B8` | 1.5px dashed (`4 3`) moving average overlay |
| **EMA 20 Line** | `#64748B` | 1.5px dotted (`2 2`) exponential moving average overlay |
| **Positive Histogram** | `#059669` | Positive MACD histogram intervals and bullish momentum |
| **Negative Histogram** | `#DC2626` | Negative MACD histogram intervals and bearish momentum |
| **Grid Lines** | `rgba(51, 65, 85, 0.45)` | Subtle Cartesian grid lines (`#334155` at 45% opacity) |
| **Axis Labels** | `#94A3B8` | 11px font size, clean numeric formatting |
| **Axis Border Lines** | `#334155` | 1px solid container rule |
| **Tooltip Surface** | `#0F172A` | High-contrast card surface |
| **Tooltip Border** | `#334155` | 1px border matching card styling |
| **Tooltip Text** | `#FFFFFF` | Primary numeric values in bold |

---

## 2. Visualization Components Specification

### A. Primary Historical Price Chart (`ChartComponent` / `EnhancedChart`)
- **Container**: Responsive `<ResponsiveContainer width="100%" height={288}>`.
- **Chart Type**: Recharts `<ComposedChart>`.
- **X-Axis**: Formatted date strings (`MMM DD, YYYY` or `MM/DD`), tick gap of 40px, non-overlapping.
- **Y-Axis**: Auto-domain (`['auto', 'auto']`) fitted to historical minimum and maximum with tick formatting (`$XXX`).
- **Overlay Toggles**: Interactive pills for SMA(20) and EMA(20) allowing dynamic series toggling.
- **Tooltip**: `InstitutionalTooltip` displaying date, price, and active moving averages with colored dot keys.
- **Data Contract**:
  ```typescript
  interface HistoryPoint {
    date: string | Date;
    formattedDate?: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    sma?: number | null;
    ema?: number | null;
  }
  ```

### B. Relative Strength Index Panel (`RsiChart`)
- **Height**: 192px fixed height (`h-48`).
- **Y-Axis Domain**: Strictly clamped between `0` and `100`, with static ticks at `[0, 30, 70, 100]`.
- **Reference Levels**:
  - Overbought (OB 70): Horizontal dashed line at `70`, colored `#DC2626`.
  - Oversold (OS 30): Horizontal dashed line at `30`, colored `#059669`.
- **Series Line**: Solid 1.75px white line (`#FFFFFF`).
- **Data Integrity Rule**: Requires minimum 15 historical periods. If insufficient data is present, renders an accessible empty notice rather than synthesizing a fake waveform.

### C. Moving Average Convergence Divergence Panel (`MacdChart`)
- **Height**: 192px fixed height (`h-48`).
- **Zero Reference**: Horizontal reference line at `y=0` colored `#475569`.
- **Histogram Bars**: `<Bar dataKey="histogram">` with dynamic `<Cell>` filling:
  - If `histogram >= 0`: `#059669` (Positive divergence).
  - If `histogram < 0`: `#DC2626` (Negative divergence).
- **MACD Line**: Solid 1.5px white line (`#FFFFFF`), representing 12-day EMA minus 26-day EMA.
- **Signal Line**: Dashed 1.5px slate line (`#94A3B8`), representing 9-day EMA of MACD line.
- **Data Integrity Rule**: Requires minimum 26 historical periods.

### D. Equal-Weighted Basket Index Chart (`MarketIndexChart`)
- **Purpose**: Displays the aggregate historical movement across all 21 tracked equities.
- **Base Level**: Baseline set to 100 index points with a horizontal dashed reference line.
- **Series Line**: Solid 2px white line with subtle 12% opacity area fill.
- **Labeling Standard**: Prominently documented as an equal-weighted aggregate of database symbols, explicitly distinguished from commercial exchange indexes.

### E. Compact Sparklines (`MiniSparkline`)
- **Height**: 40px fixed height (`h-10`).
- **Window**: Renders the trailing 30 historical closing prices.
- **Styling**: Minimalist SVG path with gradient area fill. Zero axis labels, ticks, or borders for clean inline card presentation.
- **Color Coding**: Dynamic based on net price change: `#059669` for positive sessions, `#DC2626` for negative sessions.

---

## 3. Mathematical Indicator Formulas

All technical calculations in `frontend/src/utils/technicals.ts` and `backend/src/indicator/indicator.service.ts` follow standard quantitative definitions:

### Simple Moving Average (SMA)
$$\text{SMA}_n = \frac{1}{n} \sum_{i=0}^{n-1} \text{Close}_{t-i}$$

### Exponential Moving Average (EMA)
$$\alpha = \frac{2}{n + 1}$$
$$\text{EMA}_t = (\text{Close}_t \times \alpha) + (\text{EMA}_{t-1} \times (1 - \alpha))$$

### Relative Strength Index (RSI)
$$\text{RS} = \frac{\text{Smoothed Average Gain}}{\text{Smoothed Average Loss}}$$
$$\text{RSI} = 100 - \left(\frac{100}{1 + \text{RS}}\right)$$

### MACD
$$\text{MACD Line} = \text{EMA}_{12}(\text{Close}) - \text{EMA}_{26}(\text{Close})$$
$$\text{Signal Line} = \text{EMA}_9(\text{MACD Line})$$
$$\text{Histogram} = \text{MACD Line} - \text{Signal Line}$$

---

## 4. Accessibility & Performance Safeguards

1. **Responsive Reflow**: All charts dynamically resize using Recharts `ResponsiveContainer` without horizontal page overflow on mobile devices (tested down to 320px).
2. **Animation Budget**: Chart enter transitions are constrained to `<= 400ms` with linear/ease-out curves. Continuous looped animations and excessive bouncing have been disabled.
3. **Contrast Compliance**: All text labels (`#94A3B8`), reference line labels, and tooltips meet WCAG AA contrast standards (minimum 4.5:1 ratio against `#0F172A` and `#1E293B`).
