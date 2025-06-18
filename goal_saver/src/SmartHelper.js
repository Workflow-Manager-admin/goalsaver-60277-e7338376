import React from "react";

/**
 * PUBLIC_INTERFACE
 * SmartHelper provides context-aware, personalized savings tips and habit encouragements
 * based on user progress and goals.
 *
 * Props:
 *   goals: array of user goal objects (with progress, deadlines etc)
 *   frequency: current savings frequency ("daily", "weekly", "monthly")
 *   onboarding: (boolean) if true, render onboarding-specific helper
 *   onSuggestionAdjust: function(newFrequency) - optional, shown when suggesting dynamic adjustment
 */
function SmartHelper({ goals, frequency, onboarding, onSuggestionAdjust }) {
  // If onboarding, show the onboarding tip
  if (onboarding) {
    return (
      <div className="tip-to-save" style={{
        background: "linear-gradient(93deg, #e8faff 75%, #fcefff 110%)",
        color: "#505892",
        borderRadius: 13,
        margin: "18px 0 15px 0",
        padding: "17px 25px 12px 22px",
        fontSize: "1.16em",
        boxShadow: "0 3px 14px 0 #d0f5ff36, 0 2px 7px #bae1fa18",
        fontWeight: 500,
        display: "flex",
        gap: 14,
        alignItems: "flex-start"
      }}>
        <span className="tip-icon" style={{ fontSize: "1.5em", marginRight: 9 }}>⭐️</span>
        <span>
          Great! The right goal makes it easier to build your savings habit.<br />
          {onSuggestionAdjust && (
            <span>
              Not sure about savings frequency? Try matching it to your pay cycle (e.g., weekly or monthly).
            </span>
          )}
        </span>
      </div>
    );
  }

  // Helper logic: personalized, per user progress & goal state
  if (!goals || !Array.isArray(goals) || goals.length === 0) {
    return null;
  }

  // Are any goals falling behind (progress < suggested for period)?
  // Is a goal nearly done for a celebration?
  const now = new Date();
  const active = goals.filter(g => g.isActive && !g.completed);
  const upcoming = goals.filter(g =>
    !g.completed &&
    g.deadline &&
    (new Date(g.deadline) - now) / (1000 * 3600 * 24) <= 10 &&
    (new Date(g.deadline) - now) / (1000 * 3600 * 24) >= 0
  );
  const completed = goals.filter(g => g.completed);

  // Prioritize helper context:
  // 1. Congratulate on completed goal(s)
  if (completed.length > 0) {
    const lastGoal = completed[completed.length - 1];
    return (
      <div className="tip-to-save" style={{
        background: "linear-gradient(91deg,#e2ffe7 70%,#cdf4ff 100%)",
        color: "#3D814A",
        borderRadius: 13,
        margin: "18px 0 15px 0",
        fontSize: "1.15em",
        fontWeight: 600,
        display: "flex",
        gap: 13,
        alignItems: "flex-start"
      }}>
        <span role="img" aria-label="party" className="tip-icon" style={{
          fontSize: "1.5em", marginRight: 10
        }}>🎉</span>
        <span>Well done! <b>{lastGoal.title}</b> is complete – let's celebrate your achievement! Ready for your next goal?</span>
      </div>
    );
  }

  // 2. Encourage if any upcoming deadlines
  if (upcoming.length > 0) {
    const g = upcoming[0];
    const daysLeft = Math.ceil((new Date(g.deadline) - now) / (1000 * 3600 * 24));
    return (
      <div className="tip-to-save" style={{
        background: "linear-gradient(93deg, #fffbe8 60%, #ecfdef 100%)",
        color: "#9d740c",
        borderRadius: 13,
        margin: "18px 0 15px 0",
        fontSize: "1.16em",
        display: "flex", gap: 14, alignItems: "flex-start"
      }}>
        <span className="tip-icon" style={{ fontSize: "1.39em", marginRight: 8 }}>⏳</span>
        <span>
          <b>{g.title}</b> needs just a push! Only <b>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</b> left.
          Stay on track – you can do it!
        </span>
      </div>
    );
  }

  // 3. Identify lagging goals (saved much less than expected for current period)
  if (active.length > 0) {
    // Calculate % completed vs. expected by time
    const g = active[0];
    const totalDays = Math.max(1, Math.ceil((new Date(g.deadline) - g.createdAt ? new Date(g.createdAt) : now) / (1000 * 3600 * 24)));
    const daysElapsed = Math.max(1, Math.ceil((now - (g.createdAt ? new Date(g.createdAt) : now)) / (1000 * 3600 * 24)));
    const expSoFar = (g.amount / totalDays) * daysElapsed;
    const lagging = g.progress < 0.65 * expSoFar;
    if (lagging) {
      return (
        <div className="tip-to-save" style={{
          background: "linear-gradient(93deg, #ffe0e0 64%, #f7fbff 100%)",
          color: "#ce5070",
          borderRadius: 13,
          margin: "18px 0 15px 0",
          fontSize: "1.14em",
          fontWeight: 500,
          display: "flex",
          gap: 13,
          alignItems: "flex-start"
        }}>
          <span className="tip-icon" role="img" style={{ fontSize: "1.5em", marginRight: 8 }}>⚡️</span>
          <span>
            Looks like you're a bit behind on <b>{g.title}</b>.
            Try a micro-savings boost – even a small addition helps!
          </span>
        </div>
      );
    }
  }

  // 4. Suggest increasing savings if user disposable high
  if (active.length > 0) {
    const g = active[0];
    if (g.income && g.spending && g.income - g.spending > g.currentEst * 2 && onSuggestionAdjust) {
      return (
        <div className="tip-to-save" style={{
          background: "linear-gradient(93deg, #e8faff 65%, #fcf5fa 100%)",
          color: "#366c68",
          borderRadius: 13,
          margin: "18px 0 15px 0",
          fontSize: "1.13em",
          display: "flex", gap: 13, alignItems: "flex-start"
        }}>
          <span className="tip-icon" style={{ fontSize: "1.39em", marginRight: 8 }}>🤖</span>
          <span>
            You have extra disposable income.<br />
            Want to increase your savings?{" "}
            <button type="button" className="btn btn-brand" style={{ padding: "2px 13px", marginLeft: 8, fontSize: 14 }} onClick={() => onSuggestionAdjust()}>
              Adjust Plan
            </button>
          </span>
        </div>
      );
    }
  }

  // 5. Default encouragement
  return (
    <div className="tip-to-save" style={{
      background: "linear-gradient(92deg, #b2ffe7 65%, #e8eaff 100%)",
      color: "#448789",
      borderRadius: 10,
      margin: "18px 0 12px 0",
      fontSize: "1.13em",
      display: "flex", gap: 13, alignItems: "flex-start"
    }}>
      <span className="tip-icon" style={{ fontSize: "1.4em", marginRight: 8 }}>💪</span>
      <span>Small, regular savings get you there faster! Keep your habits strong and check in on your goals.</span>
    </div>
  );
}

export default SmartHelper;
