import React from "react";

/**
 * PUBLIC_INTERFACE
 * LoadingOverlay for showing global/section loading states.
 * Usage: <LoadingOverlay message="Saving Goal..." />
 */
function LoadingOverlay({ message = "Working...", visible = false }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        zIndex: 2222, background: "rgba(255,255,255,0.61)",
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "all", transition: "background 0.23s"
      }}
      aria-live="polite"
      aria-busy={visible}
      aria-label={message}
      tabIndex={-1}
    >
      <div style={{
        background: "var(--goalie-card-alt)",
        borderRadius: 26,
        padding: "32px 39px",
        boxShadow: "0 4px 36px #acd6e633, 0 1.5px 10px #d8eaea18",
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        <div
          className="loading-spinner"
          style={{
            fontSize: 56,
            marginBottom: 13,
            color: "#92e4cf",
            filter: "drop-shadow(0 4px 19px #b2f3e9)",
            animation: "spinload 0.86s linear infinite"
          }}
        >⏳</div>
        <span style={{ color: "#5796bb", fontWeight: 700, fontSize: 21 }}>
          {message}
          <span className="loading-ellipsis" style={{ marginLeft: 4 }} />
        </span>
      </div>
    </div>
  );
}

export default LoadingOverlay;
