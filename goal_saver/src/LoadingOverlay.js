import React from "react";

/**
 * PUBLIC_INTERFACE
 * LoadingOverlay for showing global/section loading states.
 * Adds modern animation: bouncing spinner, slight tint pulsing for overlay.
 * Usage: <LoadingOverlay message="Saving Goal..." />
 */
function LoadingOverlay({ message = "Working...", visible = false }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        zIndex: 2222,
        background: "rgba(255,255,255,0.71)",
        animation: "pulseOverlay 1.12s ease-in-out infinite alternate",
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "all",
        transition: "background 0.23s"
      }}
      aria-live="polite"
      aria-busy={visible}
      aria-label={message}
      tabIndex={-1}
    >
      <style>
        {`
        @keyframes bounceSpinner {
          0% { transform: translateY(0) scale(.98);}
          18% { transform: translateY(-17px) scale(1.08);}
          40% { transform: translateY(0) scale(1);}
          100% { transform: translateY(0) scale(.98);}
        }
        @keyframes pulseOverlay {
          0% { background: rgba(255,255,255,0.71);}
          100% { background: rgba(230,255,252,0.78);}
        }
      `}
      </style>
      <div style={{
        background: "var(--goalie-card-alt)",
        borderRadius: 26,
        padding: "38px 46px",
        boxShadow: "0 7px 32px #acd6e633, 0 1.5px 10px #d8eaea18",
        display: "flex", flexDirection: "column", alignItems: "center",
        animation: "fadeOverlay 0.34s cubic-bezier(.49,.24,.53,1)"
      }}>
        <div
          className="loading-spinner"
          style={{
            fontSize: 62,
            marginBottom: 11,
            color: "#b2f3e9",
            filter: "drop-shadow(0 6px 22px #b2f3e9cc)",
            animation: "spinload 0.61s linear infinite, bounceSpinner 1.02s cubic-bezier(.7,.28,.7,1.03) infinite",
            display: "inline-block",
            lineHeight: 0.7
          }}
          aria-label="Please wait"
        >⏳</div>
        <span style={{ color: "#5796bb", fontWeight: 800, fontSize: 21, letterSpacing: ".3px" }}>
          {message}
          <span className="loading-ellipsis" style={{ marginLeft: 4 }} />
        </span>
      </div>
    </div>
  );
}

export default LoadingOverlay;
