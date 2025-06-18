import React from "react";

/**
 * PUBLIC_INTERFACE
 * Animated tooltip balloon with accessible attributes for instructions/help on critical actions.
 * Use for buttons, forms, or onboarding triggers.
 */
function Tooltip({ text, x, y, visible, role = "tooltip", id, mobile = false }) {
  if (!visible) return null;
  // Calculate position offsets for mobile/desktop
  const style = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 2040,
    background: "#23263a",
    color: "#eaf6fc",
    padding: mobile ? "12px 19px" : "11px 16px",
    borderRadius: 9,
    boxShadow: "0 2px 14px #1189c970",
    fontSize: 15,
    maxWidth: mobile ? 290 : 265,
    pointerEvents: "none",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.18s, transform 0.18s cubic-bezier(.49,0,.41,1)",
    willChange: "opacity, transform"
  };
  return (
    <div
      style={style}
      role={role}
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!visible}
      id={id}
    >
      {text}
    </div>
  );
}

export default Tooltip;
