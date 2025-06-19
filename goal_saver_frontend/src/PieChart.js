import React, { useState } from "react";

/**
 * PieChart (visual enhanced)
 * - NO opaque backgrounds: All backgrounds are 'none' or 'transparent' for SVG/container.
 * - Adds a soft SVG/CSS drop shadow, making the pie float on any background.
 * - All arc paths have rounded visual ends (using stroke-linecap: round for donut, sector geometry for filled pie).
 * - Implements a visually appealing segment hover: slice gently scales/glows on hover with a smooth transition.
 * - Highly modern, visually clean.
 *
 * Props:
 * @param {Array} [goalSegments] - [{ name, value, color? }]
 * @param {Array} [goals]        - [{ name, percent, color? }]
 * @param {number} [percent]     - Number (for single-arc donut mode)
 * @param {number} [size]        - Chart size (number, px)
 * @param {string} [bgColor]     - Background stroke color for ring
 * @param {number} [strokeWidth] - Arc width
 * @param {string} [fgColor]     - Used for foreground in percent mode
 * @param {boolean} [showLabel]  - Show central label
 */
// PUBLIC_INTERFACE
function PieChart({
  goalSegments,
  goals,
  percent,
  size = 135,
  fgColor = "#6bbd53",
  bgColor = "#e6e7fa",
  strokeWidth = 15,
  showLabel = true,
}) {
  // Harmonized palette
  const palette = [
    "#6bbd53", "#637be7", "#ffd768", "#ffb46b", "#60d0f5", "#9e66c7",
    "#ff929c", "#55d69c", "#85a2ec", "#efb3fa", "#43a75b", "#ffc268"
  ];
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // SVG geometry basics
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // ----- Multi-segment "pie" (filled) mode -----
  if (goalSegments && goalSegments.length > 0) {
    let total = goalSegments.reduce((sum, s) => sum + (typeof s.value === "number" ? s.value : 0), 0);
    total = total > 0 ? total : 1;
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

    // Draw sector using arcs for filled pies, with optional roundedness at ends
    function describeSectorArc(cx, cy, r, thickness, startAngle, sweep) {
      if (sweep <= 0) return "";
      // Leave a gap between segments for separation, except for nearly full circle
      const gap = sweep < 359.8 ? 0.84 : 0; // deg of gap between slices
      const sa = startAngle + gap / 2;
      const ea = startAngle + sweep - gap / 2;
      const rad = deg => (Math.PI / 180) * deg;
      const ra = r;
      const ri = r - thickness;
      // Outer arc start (rounded cap)
      const x1 = cx + ra * Math.cos(rad(sa));
      const y1 = cy + ra * Math.sin(rad(sa));
      // Outer arc end
      const x2 = cx + ra * Math.cos(rad(ea));
      const y2 = cy + ra * Math.sin(rad(ea));
      // Inner arc start
      const x3 = cx + ri * Math.cos(rad(ea));
      const y3 = cy + ri * Math.sin(rad(ea));
      // Inner arc end
      const x4 = cx + ri * Math.cos(rad(sa));
      const y4 = cy + ri * Math.sin(rad(sa));
      const largeArc = (ea - sa) > 180 ? 1 : 0;

      // Corner radius for rounded ends
      const capR = Math.min(thickness / 1.82, thickness * 0.62);

      return [
        `M ${x1} ${y1}`,
        // Outer arc
        `A ${ra} ${ra} 0 ${largeArc} 1 ${x2} ${y2}`,
        // Rounded cap (end)
        `A ${capR} ${capR} 0 0 1 ${x3} ${y3}`,
        // Inner arc (back)
        `A ${ri} ${ri} 0 ${largeArc} 0 ${x4} ${y4}`,
        // Rounded cap (start)
        `A ${capR} ${capR} 0 0 1 ${x1} ${y1}`,
        "Z"
      ].join(" ");
    }

    // Tooltip
    const tooltip = hoverIdx != null && segments[hoverIdx] ? (
      <div style={{
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
        whiteSpace: "nowrap"
      }} aria-live="polite">
        <span style={{
          color: segments[hoverIdx].color,
          fontWeight: 700, fontSize: 17, marginRight: 7, verticalAlign: "middle"
        }}>●</span>
        {segments[hoverIdx].name}
        <span style={{
          marginLeft: 13,
          color: "#47b26c",
          fontWeight: 650, fontSize: 15
        }}>
          {segments[hoverIdx].displayPercent || segments[hoverIdx].percentDisplay || (segments[hoverIdx].value?.toLocaleString() + "%")}
        </span>
      </div>
    ) : null;

    // --- Render (backgroundless, glowy modern) ---
    return (
      <div
        style={{
          display: "inline-block",
          position: "relative",
          background: "none",
          border: "none",
          borderRadius: 0,
          overflow: "visible",
          boxShadow: "0 14px 35px -1px #c7ffd723, 0 2px 17px #ace4fa16",
          padding: 0,
          margin: 0,
          transition: "box-shadow 0.28s cubic-bezier(.2,.65,.51,1.21)",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: "block",
            background: "none",
            border: "none",
            borderRadius: 0,
            filter:
              "drop-shadow(0 9px 41px #abfff019) drop-shadow(0 2px 18px #d2e9fe14)",
            transition: "filter 0.15s"
          }}
        >
          {/* Soft, faint drop shadow for floating effect */}
          <ellipse
            cx={cx}
            cy={cy + r * 0.17}
            rx={r * 0.96}
            ry={r * 0.36}
            fill="#dfffe4"
            opacity="0.19"
            style={{
              filter: "blur(1.7px)",
              pointerEvents: "none"
            }}
          />
          {/* Segments: visual pop/glow and rounded ends on hover */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={describeSectorArc(cx, cy, r, strokeWidth, seg.segStart - 90, seg.sweep >= 360 ? 359.999 : seg.sweep)}
              fill={seg.color}
              style={{
                cursor: "pointer",
                opacity: idx === hoverIdx ? 1 : 0.93,
                filter: idx === hoverIdx
                  ? "drop-shadow(0 8px 29px #ffd768ba) drop-shadow(0 0 16px #66f7d592)"
                  : "drop-shadow(0 2.5px 13px #99eddc15)",
                transition: "opacity 0.19s, filter 0.22s, transform 0.24s cubic-bezier(.23,1.08,.3,1.13)",
                transform: idx === hoverIdx ? "scale(1.054)" : "scale(1)",
                stroke: "#f4f6fa",
                strokeWidth: 1.1,
                borderRadius: "21px",
                willChange: "opacity, filter, transform"
              }}
              tabIndex={0}
              aria-label={`${seg.name}, ${seg.displayPercent || seg.value + "%"}`}
              onMouseMove={e => {
                setHoverIdx(idx);
                setMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(idx)}
              onBlur={() => setHoverIdx(null)}
            />
          ))}
          {/* Extra faint radial ring highlight */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth * 0.13}
            style={{
              opacity: 0.08,
              filter: "blur(1.3px) drop-shadow(0 1.5px 4px #fff7e111)",
              pointerEvents: "none"
            }}
          />
          {/* Center label */}
          {showLabel && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.19}
              fill="#324665"
              fontWeight={825}
              style={{
                fontFamily: "'Nunito','Inter',sans-serif",
                pointerEvents: "none",
                userSelect: "none",
                filter: "drop-shadow(0 1px 6px #fff)"
              }}
            >
              {segments.length === 1
                ? (segments[0].displayPercent || (segments[0].value + "%"))
                : "Goals"}
            </text>
          )}
        </svg>
        {tooltip}
      </div>
    );
  }

  // ----- Multi-segment donut (stroke arc) mode -----
  if (goals && Array.isArray(goals) && goals.length > 0) {
    // Donut ring arcs: use SVG path with strokeLinecap=round for rounded ends
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
      const rad = deg => (Math.PI / 180) * deg;
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
      <div style={{
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
        fontFamily: "'Nunito','Inter',sans-serif"
      }} aria-live="polite">
        <span style={{
          color: segments[hoverIdx].color,
          fontWeight: 700,
          fontSize: 16.5, marginRight: 6,
        }}>●</span>
        {segments[hoverIdx].name}
        <span style={{
          marginLeft: 11,
          color: "#55b26c",
          fontWeight: 650,
          fontSize: 15
        }}>
          {segments[hoverIdx].pct}%
        </span>
      </div>
    ) : null;

    return (
      <div style={{
        position: "relative",
        display: "inline-block",
        background: "transparent",
        border: "none",
        borderRadius: 0,
        boxShadow: "0 9px 26px #b6e6fd16",
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
            borderRadius: 0,
            filter: "drop-shadow(0 6px 16px #7be8ed19)"
          }}
        >
          {/* Faint drop shadow */}
          <ellipse
            cx={cx}
            cy={cy + r * 0.15}
            rx={r * 0.92}
            ry={r * 0.32}
            fill="#eafffa"
            opacity="0.13"
            style={{ filter: "blur(1.6px)", pointerEvents: "none" }}
          />
          {/* Core arcs with rounded ends */}
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
                  ? "drop-shadow(0 1px 16px #ffe15b99) drop-shadow(0 0 5px #82ffd366)"
                  : "drop-shadow(0 0 3px #b9eafd15)",
                opacity: idx === hoverIdx ? 1 : 0.94,
                transition: "opacity 0.18s, filter 0.18s, transform 0.17s",
                transform: idx === hoverIdx ? "scale(1.026)" : "scale(1)",
                willChange: "opacity, filter, transform"
              }}
              tabIndex={0}
              onMouseMove={e => {
                setHoverIdx(idx);
                setMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(idx)}
              onBlur={() => setHoverIdx(null)}
              aria-label={`Goal: ${seg.name}, ${seg.pct}%`}
            />
          ))}
          {/* Faint radial highlight */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth * 0.18}
            style={{
              opacity: 0.11,
              filter: "blur(1px) drop-shadow(0 1px 5px #fff6e712)",
              pointerEvents: "none"
            }}
          />
          {/* Optional label */}
          {showLabel && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.2}
              fill="#324665"
              fontWeight={800}
              style={{
                fontFamily: "'Nunito', 'Inter', sans-serif",
                pointerEvents: "none",
                userSelect: "none",
                filter: "drop-shadow(0 1px 5px #fff8)"
              }}>
              {segments.length === 1
                ? `${segments[0].pct}%`
                : "Goals"}
            </text>
          )}
        </svg>
        {tooltip}
      </div>
    );
  }

  // ----- Single percent "ring" mode (donut, no real segments) -----
  const pct = Math.max(0, Math.min(percent ?? 0, 100));
  const offset = circ * (1 - pct / 100);

  return (
    <div style={{
      display: "inline-block",
      background: "transparent",
      border: "none",
      borderRadius: 0,
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
          background: "transparent",
          borderRadius: 0,
          filter: "drop-shadow(0 3px 15px #90eaea1a)"
        }}
      >
        {/* Subtle soft shadow */}
        <ellipse
          cx={cx}
          cy={cy + r * 0.18}
          rx={r * 0.93}
          ry={r * 0.35}
          fill="#eaffec"
          opacity="0.14"
          style={{ filter: "blur(1.3px)", pointerEvents: "none" }}
        />
        {/* Background ring (neutral, faint) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          style={{
            opacity: 0.22,
            transition: "stroke 0.28s"
          }}
        />
        {/* Foreground arc with rounded cap and glow */}
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
            transition: "stroke-dashoffset 0.65s cubic-bezier(.5,0,.15,1)",
            filter: pct === 100
              ? "drop-shadow(0 0 19px #ffe15b64) drop-shadow(0 1.5px 7px #51e48726)"
              : "drop-shadow(0 0 7px #b7e5ef13)",
            opacity: 1
          }}
        />
        {/* Faint highlight */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth * 0.18}
          style={{
            opacity: 0.10,
            filter: "blur(1.05px) drop-shadow(0 1px 3px #ffffff14)"
          }}
        />
        {/* Show percent label */}
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
              fontFamily: "'Nunito','Inter','Roboto',Helvetica,Arial,sans-serif",
              pointerEvents: "none",
              userSelect: "none",
              filter: "drop-shadow(0 1px 4px #fff)"
            }}
          >{pct}%</text>
        )}
      </svg>
    </div>
  );
}

export default PieChart;
