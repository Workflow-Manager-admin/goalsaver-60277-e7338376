import React, { useState, useEffect } from "react";

// PUBLIC_INTERFACE
/**
 * The main container for the Goalie application.
 * Features:
 * - Goal-Based Savings Planner
 * - Smart Contribution Calculator
 * - Auto Reminders & Habit Builder (simulated)
 * - Progress Tracker
 * - Multiple Goals Management (virtual piggy bank)
 * Enhanced Design: Friendly, lively, engaging UI. Goal post branding. Playful gradients and interactivity.
 */
function GoalieMainContainer() {
  // Savings frequency state and persistence
  const SAVINGS_FREQUENCY_KEY = "savingsFrequency";
  const [savingsFrequency, setSavingsFrequency] = useState(() => {
    return localStorage.getItem(SAVINGS_FREQUENCY_KEY) || null;
  });

  // State for managing all goals
  const [goals, setGoals] = useState(() => {
    // Load from localStorage for persistence; fallback to example
    const stored = localStorage.getItem("goals");
    return stored
      ? JSON.parse(stored)
      : [
          {
            id: 1,
            title: "Emergency Fund",
            targetAmount: 50000,
            savedAmount: 8000,
            deadline: "2025-01-31",
            priority: true,
            active: true,
            lastContribution: null,
          },
        ];
  });
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
  });
  const [notification, setNotification] = useState(null);
  const [showFrequencySelector, setShowFrequencySelector] = useState(() => savingsFrequency === null);

  // Save savings frequency to localStorage when it is set
  useEffect(() => {
    if (savingsFrequency) {
      localStorage.setItem(SAVINGS_FREQUENCY_KEY, savingsFrequency);
      setShowFrequencySelector(false);
    }
  }, [savingsFrequency]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  // Automatic simulated reminders & motivational prompts
  useEffect(() => {
    if (goals.length === 0) return;
    const interval = setInterval(() => {
      // Randomly remind about lowest-saved active goal
      const activeGoals = goals.filter((g) => g.active);
      if (activeGoals.length === 0) return;

      const leastSaved = activeGoals.reduce((acc, g) => {
        if (!acc || g.savedAmount / g.targetAmount < acc.savedAmount / acc.targetAmount) return g;
        return acc;
      }, null);

      if (
        leastSaved &&
        (!leastSaved.lastNotified ||
          Date.now() - leastSaved.lastNotified > 1000 * 60 * 60 * 12)
      ) {
        handleNotification(
          `Don’t forget to make progress on "${leastSaved.title}". Small contributions add up!`
        );
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === leastSaved.id
              ? { ...goal, lastNotified: Date.now() }
              : goal
          )
        );
      }
    }, 60000); // Check every minute (artificially short for demo)

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [goals]);

  // Notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const to = setTimeout(() => setNotification(null), 4200);
      return () => clearTimeout(to);
    }
  }, [notification]);

  // PUBLIC_INTERFACE
  function handleNotification(message) {
    setNotification(message);
  }

  // PUBLIC_INTERFACE
  function handleNewGoalChange(e) {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  }

  // PUBLIC_INTERFACE
  function handleAddGoal(e) {
    e.preventDefault();
    if (
      !newGoal.title.trim() ||
      !newGoal.targetAmount ||
      !newGoal.deadline
    ) {
      handleNotification("Please fill in all goal details.");
      return;
    }
    setGoals([
      ...goals,
      {
        id: Date.now(),
        title: newGoal.title.trim(),
        targetAmount: parseFloat(newGoal.targetAmount),
        savedAmount: 0,
        deadline: newGoal.deadline,
        priority: false,
        active: true,
        lastContribution: null,
      },
    ]);
    setNewGoal({ title: "", targetAmount: "", deadline: "" });
    handleNotification("Goal added!");
  }

  // PUBLIC_INTERFACE
  function handleDeleteGoal(goalId) {
    setGoals(goals.filter((g) => g.id !== goalId));
    handleNotification("Goal deleted.");
  }

  // PUBLIC_INTERFACE
  function handleToggleActive(goalId) {
    setGoals(goals.map((g) => g.id === goalId ? { ...g, active: !g.active } : g));
  }

  // PUBLIC_INTERFACE
  function handleTogglePriority(goalId) {
    setGoals(goals.map((g) => g.id === goalId ? { ...g, priority: !g.priority } : g));
  }

  // PUBLIC_INTERFACE
  function handleContribution(goalId, amount) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              savedAmount: Math.min(
                g.targetAmount,
                parseFloat((g.savedAmount + amount).toFixed(2))
              ),
              lastContribution: Date.now(),
            }
          : g
      )
    );
    handleNotification("Contribution added! 🐷");
  }

  // PUBLIC_INTERFACE
  function handleQuickSave(goalId) {
    // Micro-savings: add a random small increment (habit builder)
    const amount = Math.floor(Math.random() * 100) + 10; // Rs 10–109
    handleContribution(goalId, amount);
    handleNotification(`Small habits matter! Saved ₹${amount} to your virtual piggy bank.`);
  }

  // PUBLIC_INTERFACE
  function handleSelectSavingsFrequency(freq) {
    setSavingsFrequency(freq);
    setShowFrequencySelector(false);
    handleNotification(`Savings contribution frequency set to "${freq.charAt(0).toUpperCase() + freq.slice(1)}"!`);
  }

  // PUBLIC_INTERFACE
  function handleChangeFrequency() {
    setShowFrequencySelector(true);
  }

  // PUBLIC_INTERFACE
  function getContributionSuggestion(goal) {
    /**
     * Calculates the required amount per selected savings frequency
     * (daily/weekly/monthly) to reach the user's goal by the deadline.
     */
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const amountLeft = goal.targetAmount - goal.savedAmount;
    if (amountLeft <= 0) return 0;
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return amountLeft;

    let perContribution;
    if (savingsFrequency === "daily") {
      perContribution = Math.ceil(amountLeft / diffDays);
    } else if (savingsFrequency === "weekly") {
      // Number of weeks (fractional weeks count as full week)
      const diffWeeks = Math.ceil(diffDays / 7);
      perContribution = Math.ceil(amountLeft / diffWeeks);
    } else if (savingsFrequency === "monthly") {
      const months =
        (deadline.getFullYear() - now.getFullYear()) * 12 +
        (deadline.getMonth() - now.getMonth()) +
        1;
      perContribution = Math.ceil(amountLeft / months);
    } else {
      // If frequency not set or unknown fallback to daily
      perContribution = Math.ceil(amountLeft / diffDays);
    }
    return perContribution;
  }

  // Brighter, friendlier palette with playful background
  const palette = {
    primary: "#6bbd53",
    primaryDark: "#338a2e",
    secondary: "#fffbe9",
    accent: "#637be7",
    accentAlt: "#ffd768",
    background: "linear-gradient(135deg, #FFFBE9 0%, #C6F9F6 53%, #AEE1F9 100%)",
    card: "#ffffffee",
    text: "#17212b",
    textSecondary: "#4b6682",
    border: "#cdeadb",
    light: "#fff",
    progressBg: "#e6e7fa",
    progressFg: "#6bbd53",
    shadowCard: "0 4px 20px 0 #9ffde440",
    headerGradient: "linear-gradient(90deg, #ffe15b 0%, #a7e078 70%, #3cd0ff 105%)",
  };

  // PUBLIC_INTERFACE
  function ProgressBar({ value, max }) {
    const percent = Math.min(100, Math.round((value / max) * 100));
    return (
      <div style={{
        width: "100%",
        background: palette.progressBg,
        borderRadius: 12,
        height: 16,
        margin: "8px 0 4px 0",
        overflow: "hidden",
        boxShadow: "0 1px 12px #72e3eb1e"
      }}>
        <div style={{
          width: `${percent}%`,
          background: `linear-gradient(to right, #6bbd53 70%, #ffd768)`,
          height: "100%",
          borderRadius: 12,
          transition: "width 0.5s",
          boxShadow: percent === 100 ? "0 0 10px #ffe15b55" : "none",
        }} />
      </div>
    );
  }

  // Goal post SVG component: a visually explicit football/soccer goal for branding
  function GoalPostIcon({ size = 48, animated }) {
    // Dimensions set to be visually bold and readable beside "Goalie"
    // Simplified net and perspective for clarity and "goal" shape
    return (
      <span style={{ display: "inline-block" }}>
        <svg
          width={size}
          height={size * 0.54}
          viewBox="0 0 130 70"
          style={{
            aspectRatio: "130/70",
            verticalAlign: "middle",
            ...(animated ? { transform: "translateY(-2px) scale(1.08)", transition: "all .19s" } : {}),
            filter: "drop-shadow(0 2px 7px #aee2ffd8)"
          }}
          aria-hidden="true"
        >
          {/* Goal frame - front posts */}
          <rect x="8" y="10" width="12" height="50" rx="3.8" fill="#8CBDFF" stroke="#467faa" strokeWidth="1.2"/>
          <rect x="110" y="10" width="12" height="50" rx="3.8" fill="#8CBDFF" stroke="#467faa" strokeWidth="1.2"/>
          <rect x="20" y="4" width="90" height="10" rx="3.5" fill="#ffe15b" stroke="#d4d096" strokeWidth="2"/>
          {/* Goal crossbar net supports (side depth perspective) */}
          <polygon points="20,14 20,62 13,60 13,12" fill="#c6ecff" opacity="0.44"/>
          <polygon points="110,14 110,62 122,60 122,12" fill="#c6ecff" opacity="0.44"/>
          {/* Ground shadow (subtle) */}
          <ellipse cx="65" cy="65" rx="56" ry="6" fill="#b2ffc9" opacity="0.18"/>
          {/* Backbar and rear posts (3D depth illusion) */}
          <rect x="23" y="56.5" width="84" height="3.5" rx="1.6" fill="#b0d8fa" opacity="0.54"/>
          <rect x="26.5" y="13.5" width="5" height="45" rx="2.3" fill="#e4e8f3" opacity="0.57"/>
          <rect x="98.5" y="13.5" width="5" height="45" rx="2.3" fill="#e4e8f3" opacity="0.57"/>
          {/* Net - horizontal lines */}
          <rect x="28" y="20" width="74" height="1.6" rx="0.9" fill="#dde9f6" opacity="0.86"/>
          <rect x="28" y="28" width="74" height="1.6" rx="0.9" fill="#dde9f6" opacity="0.86"/>
          <rect x="28" y="36" width="74" height="1.6" rx="0.9" fill="#dde9f6" opacity="0.86"/>
          <rect x="28" y="44" width="74" height="1.6" rx="0.9" fill="#dde9f6" opacity="0.86"/>
          <rect x="28" y="52" width="74" height="1.6" rx="0.9" fill="#dde9f6" opacity="0.86"/>
          {/* Net - vertical lines */}
          <rect x="35" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          <rect x="47" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          <rect x="59" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          <rect x="71" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          <rect x="83" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          <rect x="95" y="16" width="1.4" height="43" rx="0.7" fill="#dae7f6" opacity="0.7"/>
          {/* Ball (optional, subtle, to reinforce soccer/football theme) */}
          <circle cx="98" cy="57" r="7" fill="#fff" stroke="#aac8dd" strokeWidth="2.1" opacity="0.92" />
          <circle cx="98" cy="57" r="2.8" fill="#dde9f6"/>
          <line x1="98" y1="54" x2="98" y2="60" stroke="#bfc3d5" strokeWidth="1" opacity="0.9"/>
        </svg>
      </span>
    );
  }

  // PUBLIC_INTERFACE
  function FrequencySelectorModal({ onSelect, onCancel, current }) {
    // Shows on first load, or if triggered from header/settings
    return (
      <div
        style={{
          position: "fixed",
          zIndex: 1500,
          inset: 0,
          background: "rgba(34, 42, 46, 0.19)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(1.5px)"
        }}
        aria-modal="true"
        role="dialog"
      >
        <div style={{
          background: palette.card,
          color: palette.text,
          borderRadius: 14,
          padding: "42px 40px 32px 40px",
          minWidth: 340,
          maxWidth: '90vw',
          boxShadow: "0 8px 40px 4px #87e7fd31",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{fontWeight:700, fontSize: 23, marginBottom:12, letterSpacing:0.1, color: palette.primary}}>
            {current ? "Change Savings Contribution Frequency" : "Welcome to Goalie! "}
            <GoalPostIcon size={28}/>
          </div>
          {!current && (
            <div style={{color:palette.accent, fontWeight: 400, fontSize: 15, marginBottom: 13, textAlign:"center"}}>
              Choose how you want to save towards your goals.<br/>
              You can change this preference anytime.
            </div>
          )}
          <div style={{display:"flex", gap:14, margin:"14px 0 17px 0"}}>
            {["daily","weekly","monthly"].map(f=>(
              <button
                key={f}
                onClick={()=>onSelect(f)}
                style={{
                  background: current === f ? palette.primary : palette.secondary,
                  color: current === f ? "#fff" : palette.textSecondary,
                  border: current === f ? `2px solid ${palette.accent}` : `1px solid ${palette.border}`,
                  borderRadius:9, padding:"13px 25px", fontWeight:570,
                  fontSize:18, cursor:"pointer", boxShadow: current===f?"0 4px 18px 0 #b0eeff28":"none",
                  transition: "all 0.18s"
                }}
                aria-label={`Select ${f} contributions`}
              >
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{color: palette.textSecondary, fontSize: 14, marginBottom: 19, textAlign: "center"}}>
            Your plan and reminders will be personalized for the picked frequency.
          </div>
          {current &&
            <button onClick={onCancel} style={{
                color:palette.accent,background:"transparent",
                border:"none",fontSize:15,cursor:"pointer" }}>Cancel</button>}
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function GoalCard({ goal }) {
    const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
    const left = Math.max(0, goal.targetAmount - goal.savedAmount);
    const suggestion = getContributionSuggestion(goal);

    // If deadline passed
    const passed = new Date(goal.deadline) < new Date();

    // Show frequency human label
    const freqLabels = { daily: "day", weekly: "week", monthly: "month" };
    const freqText = savingsFrequency && freqLabels[savingsFrequency]
      ? ` / ${freqLabels[savingsFrequency]}`
      : "";

    // Animation pop for cards with recent changes
    const [pop, setPop] = useState(false);
    useEffect(() => {
      if (goal.lastContribution) {
        setPop(true);
        const timer = setTimeout(() => setPop(false), 450);
        return () => clearTimeout(timer);
      }
    }, [goal.lastContribution]);

    return (
      <div
        style={{
          background: palette.card,
          color: palette.text,
          border: `1.5px solid ${palette.border}`,
          borderRadius: 19,
          padding: 26,
          marginBottom: 20,
          boxShadow: goal.priority
            ? `0 3px 21px 2px #aacffd23`
            : palette.shadowCard,
          opacity: goal.active ? 1 : 0.5,
          position: "relative",
          transform: pop ? "scale(1.03) rotate(-0.4deg)" : "scale(1)",
          transition: "all 0.32s cubic-bezier(.15,.83,.53,.99)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
            {goal.title}
            {goal.priority && (
              <span
                title="Priority"
                style={{
                  marginLeft: 10,
                  color: palette.accentAlt,
                  fontSize: 19,
                  verticalAlign: "middle",
                  textShadow: "0 1px 5px #ffd25694"
                }}
              >
                ★
              </span>
            )}
          </h3>
          <div style={{display: "flex", alignItems: "center", gap: 5}}>
            <button
              onClick={() => handleQuickSave(goal.id)}
              style={{
                background: palette.accent,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "7px 13px",
                marginRight: 5,
                fontWeight: 500,
                cursor: goal.active ? "pointer" : "default",
                opacity: goal.active ? 1 : 0.55,
                fontSize: 15.5,
                boxShadow: goal.active ? "0 4px 10px 0 #b9cafd44" : "none",
                transition: "background 0.2s",
                outline: "none",
              }}
              disabled={!goal.active || passed}
              title="Quick Save (build your savings habit)"
            >
              Quickly Save
            </button>
            <button
              onClick={() => handleToggleActive(goal.id)}
              style={{
                background: goal.active ? palette.primary : palette.progressBg,
                color: goal.active ? "#fff" : palette.textSecondary,
                border: "none",
                borderRadius: 7,
                padding: "4px 13px",
                fontSize: 15.5,
                cursor: "pointer",
                fontWeight: 500,
                marginRight: 4,
                boxShadow: goal.active ? "0 2px 8px 0 #6bbd5342" : "none",
                transition: "background 0.2s",
                outline: "none"
              }}
              title={goal.active ? "Deactivate Goal" : "Activate Goal"}
            >
              {goal.active ? "Active" : "Deactivated"}
            </button>
            <button
              onClick={() => handleTogglePriority(goal.id)}
              style={{
                background: goal.priority ? palette.accentAlt : palette.secondary,
                color: goal.priority ? "#fff" : palette.text,
                border: "none",
                borderRadius: 7,
                padding: "4px 13px",
                fontSize: 15.5,
                cursor: "pointer",
                marginRight: 4,
                fontWeight: 500,
                boxShadow: goal.priority ? "0 3px 9px 0 #ffd76888" : "none",
                transition: "background 0.2s",
                outline: "none"
              }}
              title="Toggle Priority"
            >
              Prioritize
            </button>
            <button
              onClick={() => handleDeleteGoal(goal.id)}
              style={{
                background: "#fff5f5",
                color: "#d25b4c",
                border: "none",
                borderRadius: 7,
                padding: "4px 12px",
                fontSize: 15.5,
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.2s",
                outline: "none"
              }}
              title="Delete Goal"
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 15.5, color: palette.textSecondary }}>
          <b>Target:</b> ₹{goal.targetAmount.toLocaleString()}{" "}
          <span style={{ marginLeft: 18 }}>
            <b>Deadline:</b> {goal.deadline}
          </span>
        </div>
        <ProgressBar value={goal.savedAmount} max={goal.targetAmount} />
        <div style={{ fontSize: 15, marginTop: 2 }}>
          Saved <b>₹{goal.savedAmount.toLocaleString()}</b>{" "}
          {percent >= 100 ? (
            <span style={{ color: palette.primary, fontWeight: 600 }}>
              🏆 Goal reached!
            </span>
          ) : (
            <>
              | <span style={{ color: palette.accent }}>
                {percent}% complete, ₹{left.toLocaleString()} left
              </span>
            </>
          )}
          {passed && percent < 100 && (
            <span style={{ color: "#e06e6e", marginLeft: 8 }}>
              (Deadline overdue)
            </span>
          )}
        </div>
        {percent < 100 && !passed && (
          <form
            style={{
              marginTop: 21,
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "flex-start"
            }}
            onSubmit={(e) => {
              e.preventDefault();
              const v = e.target.amount.value;
              if (!v) return;
              handleContribution(goal.id, parseFloat(v));
              e.target.amount.value = "";
            }}
          >
            <input
              name="amount"
              type="number"
              min="1"
              max={left}
              step="1"
              placeholder={`Contribute (suggest: ₹${suggestion})`}
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 7,
                padding: "8px 14px",
                fontSize: 16,
                outline: "none",
                flex: "0 0 140px",
                background: palette.secondary,
                color: palette.text,
                boxShadow: "0 2px 8px 0 #cfdfff06",
                transition: "border 0.18s"
              }}
              disabled={!goal.active}
            />
            <button
              type="submit"
              style={{
                background: palette.primary,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "8px 21px",
                fontWeight: 500,
                fontSize: 16,
                cursor: goal.active ? "pointer" : "not-allowed",
                opacity: goal.active ? 1 : 0.8,
                boxShadow: goal.active ? "0 2px 8px 0 #6bbd5333" : "none",
                transition: "background 0.18s"
              }}
              disabled={!goal.active}
            >
              Add
            </button>
            <span style={{ color: palette.accent, fontSize: 13, marginLeft: 6 }}>
              Smart Suggestion: ₹{suggestion}{freqText}
            </span>
          </form>
        )}
        {goal.lastContribution && (
          <div style={{ fontSize: 13, color: "#6b6b6b", marginTop: 11 }}>
            Last contribution: {new Date(goal.lastContribution).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Nunito', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        color: palette.text,
        paddingBottom: 70,
        background: palette.background,
        position: "relative",
        boxSizing: "border-box",
        transition: "background 0.5s"
      }}
    >
      {/* Animated decorative shapes (background flair) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-70px",
          left: "-120px",
          width: "360px",
          height: "320px",
          background: "radial-gradient(circle at 30% 70%, #ffe15b54 0%, #fff2dc00 79%)",
          borderRadius: "57% 43% 76% 24% / 39% 53% 47% 61%",
          zIndex: 0,
          filter: "blur(6px)",
          opacity: 0.48,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-100px",
          right: "-120px",
          width: "290px",
          height: "280px",
          background: "radial-gradient(circle at 50% 20%, #87faff44 0%, #fff2dc00 75%)",
          borderRadius: "43% 57% 64% 36% / 38% 62% 38% 62%",
          zIndex: 0,
          filter: "blur(7px)",
          opacity: 0.34,
        }}
      />

      {/* Notification Prompt */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 36,
            background: palette.accent,
            color: "#fff",
            fontWeight: 600,
            borderRadius: 12,
            padding: "17px 38px 16px 38px",
            boxShadow: "0 11px 32px 0 #83eafe52",
            zIndex: 1400,
            fontSize: 17,
            transition: "opacity 0.22s",
            animation: "popFadeIn .25s cubic-bezier(.41,.52,.19,1.4)"
          }}
          aria-live="polite"
        >
          {notification}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: palette.headerGradient,
          color: "#27332b",
          padding: "38px 0 26px 0",
          borderBottom: `5px solid ${palette.accentAlt}`,
          boxShadow: "0 4px 19px #ffe77338",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          position: "relative",
          zIndex: 20
        }}
      >
        <div
          style={{
            maxWidth: 950,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            userSelect: "none"
          }}
        >
          <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              width: "100%",
              justifyContent: "center",
              position: "relative"
            }}>
            {/* Large, visually central goalpost icon, flush to the left of Goalie text */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: 9,
                background: "none",
                padding: 0,
                borderRadius: 0,
                minWidth: 62,
                minHeight: 38,
                justifyContent: "center",
                // boxShadow: "0 8px 28px #ffd25633",
              }}>
              {/* Soccer goalpost SVG visually prominent */}
              <svg
                width="62"
                height="33"
                viewBox="0 0 130 70"
                style={{
                  verticalAlign: "middle",
                  aspectRatio: "130/70",
                  display: "block"
                }}
                aria-hidden="true"
              >
                {/* Bold front goalposts and crossbar */}
                <rect x="8" y="10" width="12" height="50" rx="3.8" fill="#8CBDFF" stroke="#467faa" strokeWidth="1.7"/>
                <rect x="110" y="10" width="12" height="50" rx="3.8" fill="#8CBDFF" stroke="#467faa" strokeWidth="1.7"/>
                <rect x="20" y="4" width="90" height="10" rx="3.5" fill="#ffe15b" stroke="#d4d096" strokeWidth="2.5"/>
                {/* Perspective side net supports */}
                <polygon points="20,14 20,62 13,60 13,12" fill="#c6ecff" opacity="0.44"/>
                <polygon points="110,14 110,62 122,60 122,12" fill="#c6ecff" opacity="0.44"/>
                {/* Soft base shadow */}
                <ellipse cx="65" cy="65" rx="56" ry="6" fill="#b2ffc9" opacity="0.18"/>
                {/* Rear bars (3D effect) */}
                <rect x="23" y="56.5" width="84" height="3.5" rx="1.6" fill="#b0d8fa" opacity="0.54"/>
                <rect x="26.5" y="13.5" width="5" height="45" rx="2.3" fill="#e4e8f3" opacity="0.57"/>
                <rect x="98.5" y="13.5" width="5" height="45" rx="2.3" fill="#e4e8f3" opacity="0.57"/>
                {/* Net (horizontals) */}
                <rect x="28" y="20" width="74" height="1.6" rx="0.7" fill="#dde9f6" opacity="0.74"/>
                <rect x="28" y="28" width="74" height="1.6" rx="0.7" fill="#dde9f6" opacity="0.74"/>
                <rect x="28" y="36" width="74" height="1.6" rx="0.7" fill="#dde9f6" opacity="0.74"/>
                <rect x="28" y="44" width="74" height="1.6" rx="0.7" fill="#dde9f6" opacity="0.74"/>
                <rect x="28" y="52" width="74" height="1.6" rx="0.7" fill="#dde9f6" opacity="0.74"/>
                {/* Net (verticals) */}
                <rect x="35" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                <rect x="47" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                <rect x="59" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                <rect x="71" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                <rect x="83" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                <rect x="95" y="16" width="1.4" height="43" rx="0.6" fill="#dae7f6" opacity="0.67"/>
                {/* Soccer ball, slightly tucked in to right post */}
                <circle cx="99" cy="57" r="7" fill="#fff" stroke="#aac8dd" strokeWidth="2.1" opacity="0.94"/>
                <circle cx="99" cy="57" r="2.8" fill="#dde9f6"/>
                <line x1="99" y1="54" x2="99" y2="60" stroke="#bfc3d5" strokeWidth="1" opacity="0.9"/>
              </svg>
            </span>
            <span style={{
              fontSize: 39,
              fontWeight: 850,
              letterSpacing: 1.5,
              textShadow: "0 2px 20px #fff47c22",
              color: "#1D301B",
              fontFamily: "'Nunito', 'Inter', 'Roboto', 'Helvetica', sans-serif",
              display: "flex",
              alignItems: "center",
              marginLeft: 0,
              marginRight: 0,
            }}>
              Goalie
            </span>
            {savingsFrequency &&
              <button
                onClick={handleChangeFrequency}
                style={{
                  fontSize: 15.5,
                  color: palette.accent,
                  background: `${palette.secondary}`,
                  border: `2.2px solid ${palette.accentAlt}`,
                  borderRadius: 8,
                  padding: "8px 19px",
                  fontWeight: 700,
                  marginLeft: 22,
                  cursor: "pointer",
                  transition: "background 0.15s, border 0.19s",
                  boxShadow: "0 3px 10px 0 #ffd76828"
                }}
                title="Change savings contribution frequency"
              >
                Contribution: {savingsFrequency.charAt(0).toUpperCase()+savingsFrequency.slice(1)}
                {" "}
                <span style={{color:palette.accentAlt, fontWeight: 400, fontSize:16.5, marginLeft:4}}>✎</span>
              </button>}
          </div>
          <div style={{
            fontSize: 17,
            opacity: 0.92,
            color: "#324665",
            fontWeight: 550,
            fontFamily: "Nunito, Inter, sans-serif",
            textShadow: "0 1px 8px #fff9e73d"
          }}>
            Plan, play, and reach your dreams — with Goalie, your playful savings buddy!
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
          marginTop: 41,
          padding: "0 24px",
        }}
      >
        {/* New Goal Planner */}
        <section
          style={{
            background: palette.card,
            borderRadius: 21,
            boxShadow: "0 6px 29px 2px #70f3c555",
            padding: "38px 24px 25px 24px",
            marginBottom: 38,
            marginTop: 35,
            border: "1px solid #eef6d9",
            position: "relative",
            zIndex: 10,
          }}
        >
          <form
            onSubmit={handleAddGoal}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
            autoComplete="off"
          >
            <div style={{ fontWeight: 700, fontSize: 20, color: "#637be7", display:"flex", alignItems:"center", gap:8 }}>
              🎯 Add a New Goal
            </div>
            <div
              style={{
                display: "flex",
                gap: 13,
                flexWrap: "wrap",
              }}
            >
              <input
                name="title"
                type="text"
                value={newGoal.title}
                onChange={handleNewGoalChange}
                placeholder="Goal name (e.g. Vacation in Bali)"
                required
                style={{
                  border: `1px solid ${palette.border}`,
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 16,
                  flex: "1 1 180px",
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.18s",
                  fontWeight: 500
                }}
                maxLength={25}
                autoCapitalize="sentences"
                spellCheck={true}
              />
              <input
                name="targetAmount"
                type="number"
                min="1"
                max="100000000"
                value={newGoal.targetAmount}
                onChange={handleNewGoalChange}
                placeholder="Total Amount (₹)"
                required
                style={{
                  border: `1px solid ${palette.border}`,
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 16,
                  width: 145,
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.18s",
                  fontWeight: 500
                }}
              />
              <input
                name="deadline"
                type="date"
                value={newGoal.deadline}
                onChange={handleNewGoalChange}
                required
                style={{
                  border: `1px solid ${palette.border}`,
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 16,
                  width: 180,
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.18s",
                  fontWeight: 500
                }}
              />
              <button
                type="submit"
                style={{
                  background: palette.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 27px",
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: "pointer",
                  minWidth: 66,
                  boxShadow: "0 2px 12px 0 #b4fedf44",
                  transition: "background 0.19s"
                }}
              >
                Add Goal
              </button>
            </div>
          </form>
        </section>

        {/* Goals List */}
        <section>
          <div
            style={{
              marginBottom: 21,
              fontWeight: 700,
              color: palette.primaryDark,
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: 0.6,
            }}
          >
            <span>
              <GoalPostIcon size={23}/>
            </span>
            Your Goals
          </div>
          {goals.length > 0 ? (
            goals
              .slice()
              .sort(
                (a, b) =>
                  (a.priority === b.priority
                    ? a.deadline.localeCompare(b.deadline)
                    : b.priority - a.priority)
              )
              .map((goal) => <GoalCard goal={goal} key={goal.id} />)
          ) : (
            <div
              style={{
                padding: 44,
                textAlign: "center",
                color: "#67aac2",
                fontStyle: "italic",
                fontSize: 19,
                borderRadius: 21,
                background: "rgba(255,255,255,0.97)",
                marginTop: 24,
                boxShadow: "0 5px 25px #87e7fd17"
              }}
            >
              No goals yet. Add your first goal and start saving up!
              <div style={{fontSize: 32, margin: "14px 0 0 0"}}>🐷</div>
            </div>
          )}
        </section>
      </div>
      {/* Frequency selection modal (overlays anything else) */}
      {showFrequencySelector && (
        <FrequencySelectorModal
          onSelect={handleSelectSavingsFrequency}
          onCancel={() => setShowFrequencySelector(false)}
          current={savingsFrequency}
        />
      )}
      {/* Decorative large faint soccer ball (just for fun) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-60px",
          bottom: "-70px",
          zIndex: 1,
          opacity: 0.09,
          filter: "blur(3px)",
          pointerEvents: "none"
        }}
      >
        <svg width="180" height="180" viewBox="0 0 82 82">
          <circle cx="41" cy="41" r="39" fill="#99aaf6"/>
          <polygon points="41,16 31,39 41,62 51,39" fill="#fff"/>
          <circle cx="41" cy="39" r="12" fill="#e1ece0"/>
        </svg>
      </div>
    </div>
  );
}

export default GoalieMainContainer;
