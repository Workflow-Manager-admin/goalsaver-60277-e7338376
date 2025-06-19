import React, { useState, useEffect } from "react";

// PUBLIC_INTERFACE
/**
 * The main container for the GoalSaver application.
 * Features:
 * - Goal-Based Savings Planner
 * - Smart Contribution Calculator
 * - Auto Reminders & Habit Builder (simulated)
 * - Progress Tracker
 * - Multiple Goals Management (virtual piggy bank)
 * Style: Clean, minimal, light theme; colors: primary #4CAF50, secondary #FFC107, accent #2196F3
 */
function GoalSaverMainContainer() {
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
          `Don't forget to make progress on "${leastSaved.title}". Small contributions add up!`
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

  // Updated harmonious, modern palette (matches App.css variables)
  const palette = {
    primary: "#6894ee",      // Soft blue
    primaryDark: "#3b5aaa",
    secondary: "#f5f6fa",    // Gentle neutral (bg)
    accent: "#b592ff",       // Lavender
    accentAlt: "#ffb7b0",    // Coral/pink (alt accent)
    background: "#f5f6fa",
    card: "#fff",
    text: "#21243c",
    textSecondary: "#5e6580",
    border: "#dde6f2",
    light: "#fff",
    progressBg: "#e9eaf6",
    progressFg: "#6894ee",
  };

  // PUBLIC_INTERFACE
  function ProgressBar({ value, max }) {
    const percent = Math.min(100, Math.round((value / max) * 100));
    return (
      <div style={{
        width: "100%",
        background: palette.progressBg,
        borderRadius: 12,
        height: 14,
        margin: "8px 0 4px 0",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${percent}%`,
          background: palette.progressFg,
          height: "100%",
          borderRadius: 12,
          transition: "width 0.5s"
        }} />
      </div>
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
          background: "rgba(34, 42, 46, 0.17)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-modal="true"
        role="dialog"
      >
        <div style={{
          background: palette.card,
          color: palette.text,
          borderRadius: 14,
          padding: "36px 36px 30px 36px",
          minWidth: 320,
          maxWidth: '90vw',
          boxShadow: "0 6px 32px 3px #b592ff18",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{fontWeight:700, fontSize: 21, marginBottom:10, letterSpacing:0.1, color: palette.primary}}>
            {current ? "Change Savings Contribution Frequency" : "Welcome to GoalSaver! 🎉"}
          </div>
          {!current && (
            <div style={{color:palette.accent, fontWeight: 400, fontSize: 15, marginBottom: 12, textAlign:"center"}}>
              Choose how you want to save towards your goals. <br/>
              You can change this preference anytime.
            </div>
          )}
          <div style={{display:"flex", gap:12, margin:"12px 0 17px 0"}}>
            {["daily","weekly","monthly"].map(f=>(
              <button
                key={f}
                onClick={()=>onSelect(f)}
                style={{
                  background: current === f ? palette.primary : palette.secondary,
                  color: current === f ? "#fff" : palette.textSecondary,
                  border: current === f ? `2px solid ${palette.accent}` : `1px solid ${palette.border}`,
                  borderRadius:7, padding:"12px 22px", fontWeight:550,
                  fontSize:16, cursor:"pointer", boxShadow: current===f?"0 3px 12px 0 #6894ee18":"none",
                  transition: "background 0.2s"
                }}
                aria-label={`Select ${f} contributions`}
              >
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{color: palette.textSecondary, fontSize: 13, marginBottom: 17, textAlign: "center"}}>
            Your suggested plan and reminders will be shown in the frequency you pick.
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

    return (
      <div
        style={{
          background: palette.card,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          boxShadow: goal.priority
            ? `0 2px 12px 1px rgba(33, 150, 243, 0.13)`
            : `0 2px 8px 0 rgba(33, 150, 243, 0.06)`,
          opacity: goal.active ? 1 : 0.7,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontWeight: 700 }}>
            {goal.title}
            {goal.priority && (
              <span
                title="Priority"
                style={{
                  marginLeft: 10,
                  color: palette.accentAlt, // coral for priority star
                  fontSize: 18,
                  verticalAlign: "middle",
                }}
              >
                ★
              </span>
            )}
          </h3>
          <div>
            <button
              onClick={() => handleQuickSave(goal.id)}
              style={{
                background: palette.accent,
                color: "#fff",
                border: "none",
                borderRadius: 5,
                padding: "6px 14px",
                marginRight: 8,
                fontWeight: 500,
                cursor: goal.active ? "pointer" : "default",
                opacity: goal.active ? 1 : 0.65,
                fontSize: 15,
                boxShadow: goal.active ? "0 2px 8px 0 #b592ff33" : "none",
                transition: "background 0.2s",
              }}
              disabled={!goal.active || passed}
              title="Quick Save (build your savings habit)"
            >
              Quick Save
            </button>
            <button
              onClick={() => handleToggleActive(goal.id)}
              style={{
                background: goal.active ? palette.primary : palette.surfaceLight,
                color: goal.active ? "#fff" : palette.textSecondary,
                border: "none",
                borderRadius: 5,
                padding: "4px 12px",
                marginRight: 7,
                fontSize: 15,
                cursor: "pointer",
                fontWeight: 500,
                boxShadow: goal.active ? "0 2px 8px 0 #6894ee22" : "none",
                transition: "background 0.2s",
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
                borderRadius: 5,
                padding: "4px 12px",
                fontSize: 15,
                cursor: "pointer",
                marginRight: 7,
                fontWeight: 500,
                boxShadow: goal.priority ? "0 2px 8px 0 #ffb7b044" : "none",
                transition: "background 0.2s",
              }}
              title="Toggle Priority"
            >
              Prioritize
            </button>
            <button
              onClick={() => handleDeleteGoal(goal.id)}
              style={{
                background: palette.surfaceLight,
                color: palette.textSecondary,
                border: "none",
                borderRadius: 5,
                padding: "4px 12px",
                fontSize: 15,
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              title="Delete Goal"
            >
              ×
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 15, color: palette.textSecondary }}>
          <b>Target:</b> ₹{goal.targetAmount.toLocaleString()}{" "}
          <span style={{ marginLeft: 18 }}>
            <b>Deadline:</b> {goal.deadline}
          </span>
        </div>
        <ProgressBar value={goal.savedAmount} max={goal.targetAmount} />
        <div style={{ fontSize: 14, marginTop: 2 }}>
          Saved <b>₹{goal.savedAmount.toLocaleString()}</b>{" "}
          {percent >= 100 ? (
            <span style={{ color: palette.accentAlt, fontWeight: 600 }}>
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
              (Deadline over)
            </span>
          )}
        </div>
        {percent < 100 && !passed && (
          <form
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
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
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 16,
                outline: "none",
                flex: "0 0 160px",
                boxShadow: "0 2px 8px 0 #dde6f205",
                background: palette.secondary,
                color: palette.text,
                transition: "border 0.2s",
              }}
              disabled={!goal.active}
            />
            <button
              type="submit"
              style={{
                background: palette.primary,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 20px",
                fontWeight: 500,
                fontSize: 16,
                cursor: goal.active ? "pointer" : "not-allowed",
                opacity: goal.active ? 1 : 0.8,
                boxShadow: goal.active ? "0 2px 8px 0 #6894ee33" : "none",
                transition: "background 0.2s",
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
          <div style={{ fontSize: 12, color: "#666", marginTop: 9 }}>
            Last contribution: {new Date(goal.lastContribution).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: palette.background,
        minHeight: "100vh",
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        color: palette.text,
        paddingBottom: 60,
      }}
    >
      {/* Notification Prompt */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 36,
            background: palette.accent,
            color: "#fff",
            fontWeight: 500,
            borderRadius: 8,
            padding: "15px 34px",
            boxShadow: "0 8px 24px 1px #b592ff22",
            zIndex: 1000,
            fontSize: 16,
            transition: "opacity 0.3s",
          }}
          aria-live="polite"
        >
          {notification}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: palette.primary,
          color: "#fff",
          padding: "34px 0 20px 0",
          borderBottom: `5px solid ${palette.accentAlt}`,
          boxShadow: "0 3px 12px #b592ff10",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent:"center", position:"relative"}}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.5 }}>
              GoalSaver <span style={{ fontWeight: 400, color: palette.accentAlt }}>🐷</span>
            </span>
            {/* Show frequency and change option if set */}
            {savingsFrequency &&
              <button
                onClick={handleChangeFrequency}
                style={{
                  fontSize: 14,
                  color: palette.accent,
                  background: `${palette.secondary}`,
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 16px",
                  fontWeight: 600,
                  marginLeft: 16,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  boxShadow: "0 2px 10px 0 #b592ff22"
                }}
                title="Change savings contribution frequency"
              >
                Contribution: {savingsFrequency.charAt(0).toUpperCase()+savingsFrequency.slice(1)}
                {" "}
                <span style={{color:palette.accentAlt, fontWeight: 400, fontSize:15}}>✎</span>
              </button>}
          </div>
          <div style={{ fontSize: 15, opacity: 0.94, color: palette.secondary }}>
            Personalize, plan and reach all your goals — no bank required!
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          marginTop: 38,
          padding: "0 24px",
        }}
      >
        {/* New Goal Planner */}
        <section
          style={{
            background: palette.card,
            borderRadius: 16,
            boxShadow: "0 2px 12px 1px #6894ee08",
            padding: "34px 22px 24px 22px",
            marginBottom: 30,
            marginTop: 30,
          }}
        >
          <form
            onSubmit={handleAddGoal}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 17,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 18, color: palette.primary }}>
              🎯 Add a New Goal
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
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
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 16,
                  flex: "1 1 180px",
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.2s",
                }}
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
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 16,
                  width: 140,
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.2s",
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
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 16,
                  width: 190,
                  background: palette.secondary,
                  color: palette.text,
                  transition: "border 0.2s",
                }}
              />
              <button
                type="submit"
                style={{
                  background: palette.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "11px 24px",
                  fontWeight: 600,
                  fontSize: 17,
                  cursor: "pointer",
                  minWidth: 100,
                  boxShadow: "0 2px 12px 1px #b592ff30",
                  transition: "background 0.2s",
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
              marginBottom: 18,
              fontWeight: 600,
              color: palette.primaryDark,
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>
              <svg height="19" width="19" style={{ marginRight: 5, verticalAlign: "middle" }} viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill={palette.accent} />
                <text x="6" y="15" fontSize="10" fill={palette.primary} fontWeight="bold">₹</text>
              </svg>
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
                padding: 40,
                textAlign: "center",
                color: "#7d7d7d",
                fontStyle: "italic",
                fontSize: 18,
              }}
            >
              No goals yet. Add your first goal and start saving!
              <div>🐷</div>
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
    </div>
  );
}

export default GoalSaverMainContainer;
