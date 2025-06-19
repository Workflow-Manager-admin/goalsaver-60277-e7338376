import React, { useState } from "react";

/**
 * PieChart renders a visually appealing, interactive progress pie or donut chart:
 *  - SVG container and all internal elements are fully transparent (never filled white).
 *  - Only the data arcs are visible; no opaque <rect> or <circle> backgrounds.
 *  - Includes: drop shadow, smooth rounded ends (pie and donut), and lively slice hover/scale animation.
 *  - All backgrounds/fills for SVG and wrapper are removed or set to transparent/none for "floating" look.
 *
 * Props:
 * @param {Array} [goalSegments] - [{ name, value, color? }]
 * @param {Array} [goals]        - [{ name, percent, color? }]
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
  // Palette for slices (aesthetic, visually harmonious)
  const palette = [
    "#6bbd53", "#637be7", "#ffd768", "#ffb46b", "#60d0f5", "#9e66c7",
    "#ff929c", "#55d69c", "#85a2ec", "#efb3fa", "#43a75b", "#ffc268",
  ];

  // Tooltip state
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // SVG math
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // --- MAIN PIE SEGMENTS MODE ---
  if (goalSegments && Array.isArray(goalSegments) && goalSegments.length > 0) {
    let total = goalSegments.reduce((sum, seg) => sum + (typeof seg.value === "number" ? seg.value : 0), 0);
    total = total > 0 ? total : 1; // Prevent divide by zero
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

    // SVG pie wedge with rounded edges
    function describeArcPath(startAngle, sweep) {
      if (sweep <= 0) return "";
      const rad = angle => (Math.PI / 180) * angle;
      const a1 = rad(startAngle);
      const a2 = rad(startAngle + sweep);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      const largeArc = sweep > 180 ? 1 : 0;
      if (sweep > 0 && sweep < 25) {
        // For tiny slices, use sharp corners
        return [
          `M ${cx} ${cy}`,
          `L ${x1} ${y1}`,
          `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
          "Z"
        ].join(" ");
      } else {
        // Smoothed corners
        const cornerR = strokeWidth * 0.82;
        const x1c = cx + (r - cornerR) * Math.cos(a1);
        const y1c = cy + (r - cornerR) * Math.sin(a1);
        const x2c = cx + (r - cornerR) * Math.cos(a2);
        const y2c = cy + (r - cornerR) * Math.sin(a2);
        return [
          `M ${cx} ${cy}`,
          `L ${x1} ${y1}`,
          `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
          `A ${cornerR} ${cornerR} 0 0 0 ${x2c} ${y2c}`,
          `A ${r - cornerR} ${r - cornerR} 0 ${largeArc} 0 ${x1c} ${y1c}`,
          `A ${cornerR} ${cornerR} 0 0 0 ${x1} ${y1}`,
          "Z"
        ].join(" ");
      }
    }

    // Tooltip for interactive display
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

    // --- RENDER ---
    return (
      <div style={{
        position: "relative",
        display: "inline-block",
        background: "none",
        border: "none",
        borderRadius: "50%",
        overflow: "visible",
        // Custom soft drop shadow for pie lift
        boxShadow: "0 8px 32px 0 #8ffcf029, 0 2px 18px 0 #70c6fd19",
        padding: 0,
        transition: "box-shadow 0.32s cubic-bezier(.24,.71,.48,1.38)",
        WebkitTapHighlightColor: "transparent"
      }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: "block",
            background: "none",
            border: "none",
            borderRadius: "50%",
            filter: "drop-shadow(0 6px 22px #91f1e626)",
            transition: "filter 0.19s"
          }}
        >
          {/* Soft transparent shadow ring (no fill, subtle shadow ONLY) */}
          <circle
            cx={cx}
            cy={cy}
            r={r + strokeWidth * 0.26}
            fill="none"
            stroke="#fffde8"
            strokeOpacity="0.08"
            strokeWidth={strokeWidth * 0.98}
            style={{
              filter: "blur(2px)",
              opacity: 0.4,
              pointerEvents: "none"
            }}
          />
          {/* Subtle transparent highlight */}
          <circle
            cx={cx}
            cy={cy}
            r={r + strokeWidth * 0.46}
            fill="none"
            stroke="#AEE1F9"
            strokeOpacity="0.10"
            strokeWidth={strokeWidth * 0.29}
            style={{
              filter: "blur(2px)",
              opacity: 0.42,
              pointerEvents: "none"
            }}
          />
          {/* Segments as pie sectors, bold modern drop shadow, rounded smooth ends/hover animation */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={describeArcPath(seg.segStart - 90, seg.sweep >= 360 ? 359.99 : seg.sweep)}
              fill={seg.color}
              style={{
                cursor: "pointer",
                opacity: idx === hoverIdx ? 1 : 0.93,
                filter: idx === hoverIdx
                  ? "drop-shadow(0 6px 33px #ffd768b8) drop-shadow(0 0 16px #51e48744)"
                  : "drop-shadow(0 1.5px 7.2px #99eddc18)",
                transition: "opacity 0.20s, filter 0.24s, transform 0.23s cubic-bezier(.19,1.08,.53,1.1)",
                transform: idx === hoverIdx ? "scale(1.042)" : "scale(1)",
                stroke: "#f8f9fb",
                strokeWidth: 1.0,
                borderRadius: "28px",
                willChange: "opacity, filter, transform"
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
          {/* Subtle soft radial highlight (almost transparent, just visual flair) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth * 0.18}
            style={{
              opacity: 0.16,
              filter: "blur(1.1px) drop-shadow(0 1.5px 7px #fff7e116)",
              pointerEvents: "none"
            }}
          />
          {/* Central label */}
          {showLabel && (
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
                userSelect: "none",
                filter: "drop-shadow(0 1px 4px #fff)"
              }}
            >
              {segments.length === 1
                ? (segments[0].displayPercent || (segments[0].value + "%"))
                : "Goals"}
            </text>
          )}
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
      <div style={{
        position: "relative",
        display: "inline-block",
        background: "none",
        border: "none",
        boxShadow: "0 6px 20px 0 #bed4ff20",
        borderRadius: "50%",
        overflow: "visible",
        padding: 0,
      }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: "block",
            background: "none",
            border: "none",
            borderRadius: "50%",
            filter: "drop-shadow(0 3px 15px #90eaea1a)"
          }}
        >
          {/* Soft transparent shadow ring (no fill, faint shadow ONLY) */}
          <circle
            cx={cx}
            cy={cy}
            r={r + strokeWidth * 0.28}
            fill="none"
            stroke="#fffde8"
            strokeOpacity="0.08"
            strokeWidth={strokeWidth * 0.98}
            style={{
              filter: "blur(1.5px)",
              opacity: 0.32,
              pointerEvents: "none"
            }}
          />
          {/* Background ring (none) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            style={{
              opacity: 0.23,
              transition: "stroke 0.3s"
            }}
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
                filter: idx === hoverIdx
                  ? "drop-shadow(0 1px 12px #ffd768b6) drop-shadow(0 0 3px #51e48718)"
                  : "drop-shadow(0 0 2px #aacff52b)",
                opacity: idx === hoverIdx ? 1 : 0.93,
                transition: "opacity 0.18s, filter 0.11s, transform 0.09s",
                transform: idx === hoverIdx ? "scale(1.016)" : "scale(1)",
                willChange: "opacity, filter, transform"
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
          {/* Soft white highlight ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth * 0.18}
            style={{
              opacity: 0.31,
              filter: "blur(0.9px) drop-shadow(0 1px 5px #ffffff16)"
            }}
          />
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
                userSelect: "none",
                filter: "drop-shadow(0 1px 4px #fff)"
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
    <div style={{
      display: "inline-block",
      background: "none",
      border: "none",
      borderRadius: "50%",
      boxShadow: "0 6px 20px 0 #bed4ff20",
      overflow: "visible",
      padding: 0,
    }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          display: "block",
          background: "none",
          borderRadius: "50%",
          filter: "drop-shadow(0 3px 15px #90eaea1a)"
        }}
      >
        {/* Transparent shadow ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r + strokeWidth * 0.28}
          fill="none"
          stroke="#fffde8"
          strokeOpacity="0.08"
          strokeWidth={strokeWidth * 0.98}
          style={{
            filter: "blur(1.4px)",
            opacity: 0.26,
            pointerEvents: "none"
          }}
        />
        {/* Background arc (soft, nearly invisible just for arc contrast) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          style={{
            opacity: 0.13
          }}
        />
        {/* Foreground arc with rounded cap, shadow highlight, smooth animation */}
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
            filter: pct === 100
              ? "drop-shadow(0 0 19px #ffe15b73) drop-shadow(0 1px 7px #51e48722)"
              : "drop-shadow(0 0 6px #b7e5ef17)",
            opacity: 1
          }}
        />
        {/* Subtle soft highlight ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth * 0.18}
          style={{
            opacity: 0.09,
            filter: "blur(1.2px) drop-shadow(0 1px 3px #ffffff14)"
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
              userSelect: "none",
              filter: "drop-shadow(0 1px 4px #fff)"
            }}
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  );
}

export default PieChart;
