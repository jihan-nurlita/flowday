import React, { useState, useId } from 'react';
import {
  TrendBucket,
  ProductivityScoreResult,
} from '../../../data/services/analytics_service';
import { BarChart3, Table2, HelpCircle, Sparkles } from 'lucide-react';

// ============================================================================
// 1. TREND LINE CHART (SVG + HOVER TOOLTIP + TABLE FALLBACK)
// ============================================================================

interface TrendLineChartProps {
  data: TrendBucket[];
  color?: string;
  unitLabel?: string;
  emptyMessage?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  color = '#A995D8',
  unitLabel = '',
  emptyMessage = 'No recorded activity in this time range.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const gradientId = useId();

  const hasNonZero = data.some((d) => d.value > 0);
  if (data.length === 0 || !hasNonZero) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-center rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838] px-4">
        <BarChart3 className="w-6 h-6 text-[#898493]/50 mb-2" />
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  const width = 620;
  const height = 195;
  const padLeft = 34;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const coords = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (data.length - 1)) * plotW;
    const y = padTop + plotH - (d.value / maxVal) * plotH;
    return { x, y, bucket: d };
  });

  const linePath = coords
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(
          1
        )} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] px-2 py-1 rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#17151D] transition-colors cursor-pointer"
        >
          {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
          <span>{showTable ? 'Chart View' : 'Table Summary'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-[#EEEAF2] dark:border-[#2D2838]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] dark:text-[#9E99A8] sticky top-0">
              <tr>
                <th className="py-2 px-3 font-semibold">Period</th>
                <th className="py-2 px-3 font-semibold text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAF2] dark:divide-[#2D2838]">
              {data.map((row) => (
                <tr key={row.key}>
                  <td className="py-2 px-3 text-[#34313D] dark:text-[#F4F2F7]">{row.fullLabel}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                    {row.value}
                    {unitLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-52 overflow-visible select-none"
            role="img"
            aria-label="Trend line chart"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines & Y axis labels */}
            {yTicks.map((tick, idx) => {
              const y = padTop + plotH - (tick / maxVal) * plotH;
              return (
                <g key={`y-${idx}-${tick}`}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    className="stroke-[#EEEAF2] dark:stroke-[#2D2838]"
                    strokeDasharray={tick === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-[#898493] dark:fill-[#9E99A8] text-[10px] font-mono tabular-nums"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

            {/* Main Line */}
            {coords.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points & Interactive Hit Targets */}
            {coords.map((pt, i) => {
              const isHovered = hoveredIdx === i;
              const showXLabel = i % labelStep === 0 || i === coords.length - 1;
              return (
                <g key={pt.bucket.key}>
                  {showXLabel && (
                    <text
                      x={pt.x}
                      y={height - 6}
                      textAnchor="middle"
                      className="fill-[#898493] dark:fill-[#9E99A8] text-[10px]"
                    >
                      {pt.bucket.label}
                    </text>
                  )}

                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + plotH}
                      stroke={color}
                      strokeOpacity="0.35"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}

                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : coords.length <= 14 ? 3.5 : 2.5}
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150"
                  />

                  <rect
                    x={pt.x - Math.max(10, plotW / Math.max(2, coords.length) / 2)}
                    y={padTop}
                    width={Math.max(20, plotW / Math.max(1, coords.length))}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onFocus={() => setHoveredIdx(i)}
                    onBlur={() => setHoveredIdx(null)}
                    tabIndex={0}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredIdx !== null && coords[hoveredIdx] && (
            <div
              className="pointer-events-none absolute top-1 z-10 px-2.5 py-1.5 rounded-xl bg-[#34313D] dark:bg-[#F4F2F7] text-white dark:text-[#34313D] text-[11px] font-medium shadow-sm whitespace-nowrap -translate-x-1/2"
              style={{
                left: `${(coords[hoveredIdx].x / width) * 100}%`,
              }}
            >
              <span className="opacity-80">{coords[hoveredIdx].bucket.fullLabel}: </span>
              <span className="font-mono font-bold tabular-nums">
                {coords[hoveredIdx].bucket.value}
                {unitLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. PASTEL BAR CHART (SVG + HOVER TOOLTIP + TABLE FALLBACK)
// ============================================================================

interface PastelBarChartProps {
  data: TrendBucket[];
  color?: string;
  unitLabel?: string;
  emptyMessage?: string;
}

export const PastelBarChart: React.FC<PastelBarChartProps> = ({
  data,
  color = '#F1B8CC',
  unitLabel = '',
  emptyMessage = 'No focus sessions recorded in this period.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const hasNonZero = data.some((d) => d.value > 0);
  if (data.length === 0 || !hasNonZero) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-center rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838] px-4">
        <BarChart3 className="w-6 h-6 text-[#898493]/50 mb-2" />
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  const width = 620;
  const height = 195;
  const padLeft = 36;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const slotW = plotW / data.length;
  const barW = Math.min(34, Math.max(6, slotW * 0.62));
  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] px-2 py-1 rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#17151D] transition-colors cursor-pointer"
        >
          {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
          <span>{showTable ? 'Chart View' : 'Table Summary'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-[#EEEAF2] dark:border-[#2D2838]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] dark:text-[#9E99A8] sticky top-0">
              <tr>
                <th className="py-2 px-3 font-semibold">Period</th>
                <th className="py-2 px-3 font-semibold text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAF2] dark:divide-[#2D2838]">
              {data.map((row) => (
                <tr key={row.key}>
                  <td className="py-2 px-3 text-[#34313D] dark:text-[#F4F2F7]">{row.fullLabel}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                    {row.value}
                    {unitLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-52 overflow-visible select-none"
            role="img"
            aria-label="Focus time bar chart"
          >
            {yTicks.map((tick, idx) => {
              const y = padTop + plotH - (tick / maxVal) * plotH;
              return (
                <g key={`bar-y-${idx}-${tick}`}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    className="stroke-[#EEEAF2] dark:stroke-[#2D2838]"
                    strokeDasharray={tick === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-[#898493] dark:fill-[#9E99A8] text-[10px] font-mono tabular-nums"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const xCenter = padLeft + slotW * i + slotW / 2;
              const barH = d.value > 0 ? Math.max(4, (d.value / maxVal) * plotH) : 0;
              const y = padTop + plotH - barH;
              const isHovered = hoveredIdx === i;
              const showXLabel = i % labelStep === 0 || i === data.length - 1;

              return (
                <g
                  key={d.key}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {showXLabel && (
                    <text
                      x={xCenter}
                      y={height - 6}
                      textAnchor="middle"
                      className="fill-[#898493] dark:fill-[#9E99A8] text-[10px]"
                    >
                      {d.label}
                    </text>
                  )}

                  {/* Invisible hover hit box */}
                  <rect
                    x={padLeft + slotW * i}
                    y={padTop}
                    width={slotW}
                    height={plotH}
                    fill="transparent"
                  />

                  {barH > 0 && (
                    <rect
                      x={xCenter - barW / 2}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={Math.min(6, barW / 2)}
                      fill={color}
                      fillOpacity={hoveredIdx === null || isHovered ? 0.92 : 0.45}
                      className="transition-all duration-150"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {hoveredIdx !== null && data[hoveredIdx] && (
            <div
              className="pointer-events-none absolute top-1 z-10 px-2.5 py-1.5 rounded-xl bg-[#34313D] dark:bg-[#F4F2F7] text-white dark:text-[#34313D] text-[11px] font-medium shadow-sm whitespace-nowrap -translate-x-1/2"
              style={{
                left: `${((padLeft + slotW * hoveredIdx + slotW / 2) / width) * 100}%`,
              }}
            >
              <span className="opacity-80">{data[hoveredIdx].fullLabel}: </span>
              <span className="font-mono font-bold tabular-nums">
                {data[hoveredIdx].value}
                {unitLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. PASTEL DONUT CHART (DISTRIBUTION WITH LEGEND)
// ============================================================================

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface PastelDonutChartProps {
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  emptyMessage?: string;
  valueSuffix?: string;
}

export const PastelDonutChart: React.FC<PastelDonutChartProps> = ({
  segments,
  centerValue,
  centerLabel,
  emptyMessage = 'No data available for this distribution.',
  valueSuffix = '',
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const nonZeroSegments = segments.filter((s) => s.value > 0);
  const total = nonZeroSegments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838] px-4">
        <p className="text-xs text-[#898493] dark:text-[#9E99A8]">{emptyMessage}</p>
      </div>
    );
  }

  const size = 148;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const arcs = nonZeroSegments.map((seg) => {
    const fraction = seg.value / total;
    const dashLength = fraction * circumference;
    const gap = Math.max(0, circumference - dashLength);
    const offset = -cumulativePercent * circumference;
    cumulativePercent += fraction;
    return {
      ...seg,
      dashArray: `${dashLength} ${gap}`,
      dashOffset: offset,
    };
  });

  const hoveredSeg = hoveredKey ? arcs.find((a) => a.key === hoveredKey) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#FAF9FC] dark:text-[#17151D]"
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={arc.color}
              strokeWidth={hoveredKey === arc.key ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-200 cursor-pointer"
              opacity={hoveredKey && hoveredKey !== arc.key ? 0.45 : 1}
              onMouseEnter={() => setHoveredKey(arc.key)}
              onMouseLeave={() => setHoveredKey(null)}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7]">
            {hoveredSeg ? `${hoveredSeg.value}${valueSuffix}` : centerValue}
          </span>
          <span className="text-[10px] font-medium text-[#898493] dark:text-[#9E99A8] truncate max-w-[82px]">
            {hoveredSeg ? hoveredSeg.label : centerLabel}
          </span>
        </div>
      </div>

      {/* Clean Unboxed Legend */}
      <div className="flex-1 w-full space-y-2">
        {segments.map((seg) => (
          <div
            key={seg.key}
            onMouseEnter={() => seg.value > 0 && setHoveredKey(seg.key)}
            onMouseLeave={() => setHoveredKey(null)}
            className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors ${
              hoveredKey === seg.key ? 'bg-[#FAF9FC] dark:bg-[#17151D]' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium text-[#34313D] dark:text-[#F4F2F7] truncate">
                {seg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
              <span className="font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {seg.value}
                {valueSuffix}
              </span>
              <span className="text-[#898493] dark:text-[#9E99A8] w-9 text-right">
                ({seg.percent}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. PRODUCTIVITY SCORE CARD (TRANSPARENT GAUGE + FORMULA BREAKDOWN)
// ============================================================================

interface ProductivityScoreCardProps {
  scoreResult: ProductivityScoreResult;
}

export const ProductivityScoreCard: React.FC<ProductivityScoreCardProps> = ({ scoreResult }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const numericScore = scoreResult.available && scoreResult.score !== null ? scoreResult.score : 0;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  const badgeColors = !scoreResult.available
    ? 'bg-[#FAF9FC] text-[#898493] dark:bg-[#17151D] dark:text-[#9E99A8]'
    : numericScore >= 80
    ? 'bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
    : numericScore >= 50
    ? 'bg-[#F4F1FA] text-[#6E56B0] dark:bg-[#2C253B] dark:text-[#C5B4ED]'
    : 'bg-[#EEF5FC] text-[#2B5885] dark:bg-[#1E2C3D] dark:text-[#A9C8E8]';

  return (
    <div className="p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Productivity Score
              </h3>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                Transparent activity indicator
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeColors}`}>
            {scoreResult.levelLabel}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
          {/* Circular Gauge */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
              <circle
                cx="55"
                cy="55"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="9"
                className="text-[#EEEAF2] dark:text-[#2D2838]"
              />
              {scoreResult.available && (
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="transparent"
                  stroke="#A995D8"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7]">
                {scoreResult.available ? scoreResult.score : '—'}
              </span>
              <span className="text-[10px] font-medium text-[#898493] dark:text-[#9E99A8]">
                {scoreResult.available ? '/ 100' : 'No Data'}
              </span>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="flex-1 w-full space-y-3">
            {scoreResult.maxTaskComponent > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#898493] dark:text-[#9E99A8] font-medium">
                    Task Completion
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {scoreResult.taskComponent} / {scoreResult.maxTaskComponent} pts
                  </span>
                </div>
                <div className="w-full bg-[#FAF9FC] dark:bg-[#17151D] h-2 rounded-full overflow-hidden border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div
                    className="h-full rounded-full bg-[#B5DCCB] transition-all duration-500"
                    style={{
                      width: `${
                        scoreResult.maxTaskComponent > 0
                          ? (scoreResult.taskComponent / scoreResult.maxTaskComponent) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#898493] dark:text-[#9E99A8] font-medium">
                  Focus Investment
                </span>
                <span className="font-mono tabular-nums font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {scoreResult.maxTaskComponent === 0 && scoreResult.available
                    ? `${scoreResult.score} / 100 pts`
                    : `${scoreResult.focusComponent} / ${scoreResult.maxFocusComponent} pts`}
                </span>
              </div>
              <div className="w-full bg-[#FAF9FC] dark:bg-[#17151D] h-2 rounded-full overflow-hidden border border-[#EEEAF2] dark:border-[#2D2838]">
                <div
                  className="h-full rounded-full bg-[#F1B8CC] transition-all duration-500"
                  style={{
                    width: `${
                      scoreResult.maxTaskComponent === 0 && scoreResult.available
                        ? scoreResult.score || 0
                        : scoreResult.maxFocusComponent > 0
                        ? (scoreResult.focusComponent / scoreResult.maxFocusComponent) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] leading-relaxed">
              {scoreResult.explanation}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838] flex items-start gap-2 text-[11px] text-[#898493] dark:text-[#9E99A8]">
        <HelpCircle className="w-3.5 h-3.5 text-[#A995D8] shrink-0 mt-0.5" />
        <span>{scoreResult.disclaimer}</span>
      </div>
    </div>
  );
};
