import React, { useState } from "react";

/**
 * PieChart can render:
 *  - A single overall percent (backward compatible)
 *  - OR: Multiple segments (each with { name, value, color? }),
 *        where each segment's sweep is proportional to its value out of the sum of all segment values.
 * 
 * If 'goalSegments' prop is provided (array of objects), each is a segment:
 *   { name, value, color? } // value: the number used to build arc size (typically percent-of-total progress)
 * If 'goals' is provided with .percent, it assumes percent-of-goal and creates equal sweep, not suitable for real pie.
 * If 'percent' prop is provided (legacy compatibility), it renders a classic single arc.
 *
 * Shows tooltip with name+value on hover for pie segments.
 *
 * @param {Array} [goalSegments] - [{ name, value, color? }]  // value is the percent-of-total-progress or absolute number
 * @param {Array} [goals]        - [{ name, percent, color? }] // fallback for legacy/incomplete mode, not real pie!
 * @param {number} [percent]
 * @param {number} size
 * @param {string} bgColor
 * @param {number} strokeWidth
 * @param {boolean} showLabel
 */
// PUBLIC_INTERFACE
function PieChart({
  goalSegments, // Array of {name, value, color}
  goals,        // fallback: Array of {name, percent}
  percent,
  size = 135,
  fgColor = "#6bbd53",
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

  // Tooltip state
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // SVG math
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Draw a "true" pie chart if goalSegments is present and nonempty:
  if (goalSegments && Array.isArray(goalSegments) && goalSegments.length > 0) {
    // Compute total, then each arc is value/total * 360 deg.
    let total = goalSegments.reduce((sum, seg) => sum + (typeof seg.value === "number" ? seg.value : 0), 0);
    total = total > 0 ? total : 1; // Prevent divide by 0
    let startAngle = 0;
    const segments = goalSegments.map((seg, idx) => {
      const sweep = seg.value > 0 ? (seg.value / total) * 360 : 0;
      const entry = {
        ...seg,
        idx,
        sweep,
        segStart: startAngle,
        color: seg.color || palette[idx % palette.length],
        value: Math.max(0, seg.value || 0),
      };
      startAngle += sweep;
      return entry;
    });

    // Helper for SVG arc path (non-donut, real pie, can be used for real sectors if needed)
    function describeArcPath(startAngle, sweep) {
      // If sweep is 0, return nothing
      if (sweep <= 0) return "";
      const rad = angle => (Math.PI / 180) * angle;
      const a1 = rad(startAngle);
      const a2 = rad(startAngle + sweep);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      const largeArc = sweep > 180 ? 1 : 0;
      return [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `Z`,
      ].join(" ");
    }

    // Tooltip
    const tooltip = hoverIdx != null && segments[hoverIdx] ? (
      <div
        style={{
          position: "fixed",
          pointerEvents: "none",
          left: mouse.x + 13,
          top: mouse.y + 11,
          background: "#fffefc",
          color: "#384775",
          border: `2px solid #e6e7fa`,
          borderRadius: 11,
          boxShadow: "0 7px 26px 2px #b0fedb31",
          padding: "10px 19px 10px 18px",
          fontSize: 15.3,
          zIndex: 1000,
          fontWeight: 600,
          opacity: 0.97,
          minWidth: 70,
          lineHeight: 1.35,
          letterSpacing: 0.16,
          fontFamily: "'Nunito', 'Inter', sans-serif",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
        aria-live="polite"
      >
        <span style={{
          color: segments[hoverIdx].color,
          fontWeight: 700,
          fontSize: 17,
          marginRight: 7,
          verticalAlign: "middle"
        }}>
          ●
        </span>
        {segments[hoverIdx].name}
        <span style={{
          marginLeft: 13,
          color: "#47b26c",
          fontWeight: 650,
          fontSize: 15
        }}>
          {segments[hoverIdx].displayPercent || segments[hoverIdx].percentDisplay || (segments[hoverIdx].value?.toLocaleString() + "%")}
        </span>
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
          {/* Empty background circle (if incomplete sum) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="#f7fafc"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            style={{ opacity: 0.68 }}
          />
          {/* Segments: each is a classic pie piece (sector) */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={describeArcPath(seg.segStart - 90, seg.sweep >= 360 ? 359.99 : seg.sweep)}
              fill={seg.color}
              style={{
                cursor: "pointer",
                opacity: idx === hoverIdx ? 1 : 0.92,
                filter: idx === hoverIdx ? "drop-shadow(0 0 10px #ffd76897)" : "none",
                transition: "opacity 0.21s, filter 0.17s"
              }}
              tabIndex={0}
              aria-label={`${seg.name}, ${seg.displayPercent || seg.value + "%"}`}
              onMouseMove={e => {
                setHoverIdx(idx);
                setMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={e => setHoverIdx(idx)}
              onBlur={() => setHoverIdx(null)}
            />
          ))}
          {/* Optional donut-ring border for definition */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth*0.26}
          />
          {/* Label in center */}
          {showLabel &&
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.192}
              fill="#324665"
              fontWeight={825}
              style={{
                fontFamily: "'Nunito', 'Inter', 'Roboto', Helvetica, Arial, sans-serif",
                pointerEvents: "none",
                userSelect: "none"
              }}
            >
              {segments.length === 1
                ? (segments[0].displayPercent || (segments[0].value + "%"))
                : "Goals"}
            </text>
          }
        </svg>
        {/* Tooltip */}
        {tooltip}
      </div>
    );
  }

  // Legacy: Donut multi-arc mode for {goals: [{percent,...}]}, not a real pie slice
  if (goals && Array.isArray(goals) && goals.length > 0) {
    // Donut arcs (NOT pie sector: used as fallback, not classic pie!)
    let start = 0;
    const segments = goals.map((goal, idx) => {
      const pct = Math.max(0, Math.min(goal.percent, 100));
      const sweep = 3.6 * pct;
      const entry = {
        ...goal,
        idx,
        sweep,
        segStart: start,
        color: goal.color || palette[idx % palette.length],
        pct,
      };
      start += sweep;
      return entry;
    });

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
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            style={{ opacity: 0.68, transition: "stroke 0.3s" }}
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
          {/* Central label */}
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
