import React from "react";

/**
 * PUBLIC_INTERFACE
 * Animated tooltip balloon with accessible attributes for instructions/help on critical actions.
 * Allows for JSX content, smooth fade/slide-in, and dynamic placement.
 */
function Tooltip({ text, x, y, visible, role = "tooltip", id, mobile = false }) {
  if (!visible) return null;
  // Advanced fade-in and slide for modern feel, more flexible max width for content/JSX
  const style = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 2040,
    background: "#23263a",
    color: "#eaf6fc",
    padding: mobile ? "13px 22px" : "12px 18px",
    borderRadius: 10,
    boxShadow: "0 4px 20px #1189c970",
    fontSize: 15,
    maxWidth: mobile ? 326 : 290,
    minWidth: 120,
    pointerEvents: "none",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0px) scale(1)" : "translateY(16px) scale(0.93)",
    transition: "opacity 0.22s cubic-bezier(.49,0,.41,1), transform 0.19s cubic-bezier(.53,.13,.34,.9)",
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
      {typeof text === "function" ? text() : text}
    </div>
  );
}

export default Tooltip;
