import React from "react";

/**
 * A minimal SVG-based pie chart to visually represent a percent value.
 * Suitable for representing goal completion progress.
 * 
 * @param {number} percent - Percent completed (0-100)
 * @param {number} size - Diameter of the pie chart in pixels
 * @param {string} fgColor - Foreground color for progress arc
 * @param {string} bgColor - Background color of unfinished arc
 * @param {number} strokeWidth - Thickness of the pie arc
 * @param {boolean} showLabel - Whether or not to show the percent inside the chart
 */
// PUBLIC_INTERFACE
function PieChart({
  percent,
  size = 52,
  fgColor = "#6bbd53",
  bgColor = "#e6e7fa",
  strokeWidth = 8,
  showLabel = true,
}) {
  // Clamp percent and prep arc calculations
  const pct = Math.max(0, Math.min(percent, 100));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
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
