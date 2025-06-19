import React, { useState } from "react";

/**
 * PieChart can render:
 *  - A single overall percent (backward compatible)
 *  - OR: Multiple segments (each with { name, percent, color? })
 * 
 * If 'goals' prop is provided (array of objects), each is a segment:
 *   { name, percent, color? }
 * If 'percent' prop is provided, it renders the old overall arc.
 *
 * Shows tooltip with name+percent on hover for goal segments.
 *
 * @param {Array} [goals] - [{ name, percent, color? }]
 * @param {number} [percent]
 * @param {number} size
 * @param {string} bgColor
 * @param {number} strokeWidth
 * @param {boolean} showLabel
 */
// PUBLIC_INTERFACE
function PieChart({
  goals,
  percent,
  size = 135,
  fgColor = "#6bbd53",        // used only for single (overall) mode
  bgColor = "#e6e7fa",
  strokeWidth = 15,
  showLabel = true,
}) {
  const palette = [
    "#6bbd53", // green
    "#637be7", // blue/lavender
    "#ffd768", // yellow
    "#ffb46b", // orange
    "#60d0f5", // blue-cyan
    "#9e66c7", // purple
    "#ff929c", // pink
    "#55d69c", // teal
    "#85a2ec", // light blue
    "#efb3fa", // pale purple
    "#43a75b", // dark green
    "#ffc268", // gold
  ];

  // Tooltip state (index of segment hovered)
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Core SVG math
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Helper: get arc path for segment (SVG "donut arc")
  function describeArc(startAngle, sweep) {
    const rad = (deg) => (Math.PI / 180) * deg;
    const a1 = rad(startAngle);
    const a2 = rad(startAngle + sweep);

    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const largeArc = sweep > 180 ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    ].join(" ");
  }

  // If segment mode:
  if (goals && Array.isArray(goals) && goals.length > 0) {
    // Each segment's sweep is percent*3.6 (since percent is of 100)
    let start = 0;
    const segments = goals.map((goal, idx) => {
      const pct = Math.max(0, Math.min(goal.percent, 100));
      const sweep = 3.6 * pct; // percent of circle
      const segStart = start;
      const segPaletteColor =
        goal.color || palette[idx % palette.length];
      start += sweep;
      return {
        ...goal,
        idx,
        sweep,
        segStart,
        color: segPaletteColor,
        pct,
      };
    });

    // Tooltip (in portal-like div for easy CSS)
    const tooltip = hoverIdx != null && segments[hoverIdx] ? (
      <div
        style={{
          position: "fixed",
          pointerEvents: "none",
          left: mouse.x + 11,
          top: mouse.y + 7,
          background: "#fff",
          color: "#637be7",
          border: "2px solid #e6e7fa",
          borderRadius: 11,
          boxShadow: "0 6px 24px 1px #b0fedb2d",
          padding: "9px 18px 9px 16px",
          fontSize: 15.5,
          zIndex: 1000,
          fontWeight: 600,
          transition: "opacity 0.16s",
          minWidth: 56,
          opacity: 0.97,
          lineHeight: 1.35,
          letterSpacing: 0.3,
          fontFamily: "'Nunito', 'Inter', sans-serif",
        }}
        aria-live="polite"
      >
        <span style={{
          color: segments[hoverIdx].color,
          fontWeight: 700,
          fontSize: 16.5,
          marginRight: 6,
        }}>
          ●
        </span>
        {segments[hoverIdx].name}
        <span style={{
          marginLeft: 11,
          color: "#55b26c",
          fontWeight: 650,
          fontSize: 15
        }}>
          {segments[hoverIdx].pct}%</span>
      </div>
    ) : null;

    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block" }}
        >
          {/* Background circle for unfilled (unused) area */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            style={{ opacity: 0.70, transition: "stroke 0.3s" }}
          />
          {/* Segments */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={describeArc(seg.segStart - 90, seg.sweep === 360 ? 359.999 : seg.sweep)}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              style={{
                filter: idx === hoverIdx ? "drop-shadow(0 0 10px #ffd76877)" : "none",
                opacity: idx === hoverIdx ? 1 : 0.93,
                transition: "opacity 0.22s, filter 0.14s"
              }}
              onMouseMove={e => {
                setHoverIdx(idx);
                setMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={e => setHoverIdx(idx)}
              onBlur={() => setHoverIdx(null)}
              tabIndex={0}
              aria-label={`Goal: ${seg.name}, ${seg.pct}%`}
            />
          ))}
          {/* Central multi-pie icon or percentage label */}
          {showLabel &&
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.23}
              fill="#324665"
              fontWeight={780}
              style={{
                fontFamily: "'Nunito', 'Inter', 'Roboto', Helvetica, Arial, sans-serif",
                pointerEvents: "none",
                userSelect: "none"
              }}
            >
              {segments.length === 1
                ? `${segments[0].pct}%`
                : "Goals"}
            </text>
          }
        </svg>
        {/* Tooltip portal */}
        {tooltip}
      </div>
    );
  }

  // Legacy: show a single arc with percent filled
  const pct = Math.max(0, Math.min(percent, 100));
  const offset = circ * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
        style={{ opacity: 0.72 }}
      />
      {/* Foreground arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={fgColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          transition: "stroke-dashoffset 0.7s cubic-bezier(.7,0,0,.9)",
          filter: pct === 100 ? "drop-shadow(0 0 7px #ffe15b66)" : "none"
        }}
      />
      {/* Optional percent label in the center */}
      {showLabel && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.36}
          fill={pct === 100 ? "#43a75b" : fgColor}
          fontWeight={770}
          style={{
            fontFamily: "'Nunito', 'Inter', 'Roboto', Helvetica, Arial, sans-serif",
            pointerEvents: "none",
            userSelect: "none"
          }}
        >
          {pct}%
        </text>
      )}
    </svg>
  );
}

export default PieChart;
