import React, { useState, useEffect } from "react";
import "./App.css";
import TipToSave from "./TipToSave";

/* Goalie Dark Mode Brand Palette */
const BRAND = {
  primary: "var(--goalie-brand)",
  secondary: "var(--goalie-accent)",
  accent: "var(--goalie-light)"
};

const MOTIVATION = [
  "Great start! Every bit counts!",
  "Keep going, you're making progress!",
  "Halfway there, stay focused!",
  "Goal in sight! Almost done!",
  "Congratulations, you've reached your goal!",
];

// PUBLIC_INTERFACE
function MainContainer() {
  // State for all goals
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem("goalie-goals");
    return saved ? JSON.parse(saved) : [];
  });
  // Reminders (in-app only, as offline PWA)
  const [reminders, setReminders] = useState([]);
  // Form state
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Save goals to localStorage for offline usage
  useEffect(() => {
    localStorage.setItem("goalie-goals", JSON.stringify(goals));
  }, [goals]);

  // Simulate reminders for habit formation (study intervals, PWA app only)
  useEffect(() => {
    const outstandingGoals = goals.filter(
      (g) =>
        g.isActive &&
        !g.completed &&
        g.progress < g.amount &&
        g.remindersEnabled
    );
    if (outstandingGoals.length > 0) {
      // Set a reminder in 15 seconds for demonstration (in real app, customizable/flexible)
      const timer = setTimeout(() => {
        setReminders(
          outstandingGoals.map((g) => ({
            id: g.id,
            title: `Remember to save for "${g.title}"!`,
            goalId: g.id,
          }))
        );
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [goals]);

  // Public: Add new goal
  function addGoal(goal) {
    setGoals([
      ...goals,
      {
        ...goal,
        id: Date.now(),
        progress: 0,
        completed: false,
        remindersEnabled: true,
        isActive: true,
        savingsHistory: [],
      },
    ]);
    setShowGoalForm(false);
  }

  // Update a goal progress
  function updateGoalProgress(goalId, amount, note = "") {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newProgress = Math.min(
          g.amount,
          Math.round((g.progress + amount) * 100) / 100
        );
        const completed = newProgress >= g.amount;
        return {
          ...g,
          progress: newProgress,
          completed,
          savingsHistory: [
            ...g.savingsHistory,
            {
              date: Date.now(),
              amount,
              note,
            },
          ],
        };
      })
    );
  }

  // Modify goal (edit, activate/deactivate etc)
  function modifyGoal(goalId, data) {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...data } : g))
    );
  }

  // Remove goal
  function removeGoal(goalId) {
    setGoals(goals.filter((g) => g.id !== goalId));
  }

  // Handle multi-goal activation/prioritization
  function setActiveGoal(goalId) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, isActive: true }
          : { ...g, isActive: false }
      )
    );
  }

  // Dismiss reminders
  function dismissReminder(reminderId) {
    setReminders(reminders.filter((r) => r.id !== reminderId));
  }

  // Render
  return (
    <div className="goalie-main" style={{ background: "var(--goalie-darkest)", minHeight: "100vh" }}>
      {/* Main Navbar */}
      <nav
        className="navbar"
        style={{
          backgroundColor: "var(--goalie-dark)",
          borderBottom: "2px solid var(--border-color)",
          color: "var(--text-color)",
          boxShadow: "var(--shadow-navbar)",
        }}
      >
        <div className="container" style={{ maxWidth: 940, gap: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            className="logo"
            style={{ fontWeight: 700, color: "var(--goalie-brand)", fontSize: "1.37em" }}
          >
            <span className="logo-symbol" style={{color: "var(--goalie-accent)"}}>🥅</span>
            Goalie
          </span>
          <button
            className="btn btn-brand"
            style={{
              marginLeft: 12
            }}
            onClick={() => setShowGoalForm((x) => !x)}
          >
            {showGoalForm ? "Cancel" : "New Goal"}
          </button>
        </div>
      </nav>

      {/* Reminders */}
      {reminders.length > 0 &&
        reminders.map((reminder) => (
          <ReminderPrompt
            key={reminder.id}
            title={reminder.title}
            onDismiss={() => dismissReminder(reminder.id)}
          />
        ))}

      {/* Main Content */}
      <main style={{ paddingTop: 100, maxWidth: 940, margin: "0 auto" }}>
        <div className="container">
          {/* Welcome & summary */}
          <section style={{
            marginBottom: 16,
            padding: "18px 14px",
            background: "linear-gradient(91deg,var(--goalie-darkest),var(--goalie-card-alt) 98%)",
            borderRadius: 12,
            boxShadow: "0 1.5px 10px 0 #23254f13",
          }}>
            <h2 style={{
              fontWeight: 700,
              marginBottom: 8,
              color: "var(--goalie-brand)",
              letterSpacing: "0.5px"
            }}>
              Welcome to Goalie!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, margin: 0 }}>
              Set financial goals, plan your savings, track your progress, and build saving habits—
              all in one simple, offline-friendly virtual piggy bank.
            </p>
          </section>
          <TipToSave />
          {/* Goal creation form */}
          {showGoalForm && <GoalForm onSave={addGoal} onCancel={() => setShowGoalForm(false)} />}
          {/* Multiple Goals Management */}
          <section>
            <GoalList
              goals={goals}
              onProgressAdd={updateGoalProgress}
              onModify={modifyGoal}
              onRemove={removeGoal}
              onActivate={setActiveGoal}
              brand={BRAND}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

/**
 * Component: GoalForm
 * Form for creating a new savings goal
 */
function GoalForm({ onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [income, setIncome] = useState("");
  const [spending, setSpending] = useState("");

  // Calculate default suggestion: (amount - saved) / (days until deadline)
  const today = new Date();
  const estPerDay =
    amount && deadline
      ? Math.max(
          0,
          Number(amount) /
            (Math.ceil((new Date(deadline) - today) / (1000 * 3600 * 24)) || 1)
        )
      : 0;

  // Behavioral adjustment: suggest based on disposable = income - spending
  const disposable = income && spending ? Math.max(0, Number(income) - Number(spending)) : null;
  const smartEst = disposable
    ? Math.min(disposable, estPerDay)
    : estPerDay;

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !amount || !deadline) return;
    onSave({
      title,
      amount: Math.round(Number(amount) * 100) / 100,
      deadline,
      estPerDay: Math.round(estPerDay * 100) / 100,
      smartEst: Math.round(smartEst * 100) / 100,
      income: income ? Number(income) : null,
      spending: spending ? Number(spending) : null,
    });
    setTitle("");
    setAmount("");
    setDeadline("");
    setIncome("");
    setSpending("");
  }

  return (
    <form className="goal-form" style={formStyles.form} onSubmit={handleSubmit}>
      <h3 style={formStyles.title}>New Goal</h3>
      <label style={formStyles.label}>
        Goal Name
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={formStyles.input}
        />
      </label>
      <label style={formStyles.label}>
        Target Amount
        <input
          type="number"
          min="1"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={formStyles.input}
        />
      </label>
      <label style={formStyles.label}>
        Deadline
        <input
          type="date"
          required
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          style={formStyles.input}
        />
      </label>
      <label style={formStyles.label}>
        Monthly Income (optional)
        <input
          type="number"
          min="0"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          style={formStyles.input}
        />
      </label>
      <label style={formStyles.label}>
        Monthly Spending (optional)
        <input
          type="number"
          min="0"
          value={spending}
          onChange={(e) => setSpending(e.target.value)}
          style={formStyles.input}
        />
      </label>
      {amount && deadline && (
        <div style={formStyles.suggestion}>
          <small>
            {disposable
              ? `Suggestion: ~₹${smartEst}/day (based on your disposable/month)`
              : `Save ~₹${estPerDay}/day to reach your goal!`}
          </small>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button
          type="submit"
          className="btn"
          style={{ background: BRAND.primary, color: "#fff" }}
        >
          Add Goal
        </button>
        <button
          type="button"
          className="btn"
          style={{ background: "#31344a", color: "#eee" }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Modular: Goal List as container for Goal Cards
function GoalList({
  goals,
  onProgressAdd,
  onModify,
  onRemove,
  onActivate,
  brand,
}) {
  if (!goals || goals.length === 0)
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
        No goals created yet. Click "New Goal" to start saving!
      </div>
    );

  return (
    <div style={{ display: "grid", gap: 22, marginTop: 12 }}>
      {goals.map((goal, idx) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          isPrimary={goal.isActive}
          onProgressAdd={onProgressAdd}
          onModify={onModify}
          onRemove={onRemove}
          onActivate={onActivate}
          brand={brand}
          index={idx + 1}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function GoalCard({
  goal,
  isPrimary,
  onProgressAdd,
  onModify,
  onRemove,
  onActivate,
  brand,
  index,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saveVal, setSaveVal] = useState("");
  const [saveNote, setSaveNote] = useState("");
  // Calculate progress
  const percent = Math.min(100, ((goal.progress / goal.amount) * 100).toFixed(1));

  // Milestone motivational message
  let milestoneMsg = MOTIVATION[0];
  if (percent >= 95) milestoneMsg = MOTIVATION[4];
  else if (percent >= 70) milestoneMsg = MOTIVATION[3];
  else if (percent >= 45) milestoneMsg = MOTIVATION[2];
  else if (percent >= 20) milestoneMsg = MOTIVATION[1];

  // Days left
  const today = new Date();
  const dline = new Date(goal.deadline);
  const daysLeft = Math.max(
    0,
    Math.ceil((dline - today) / (1000 * 3600 * 24))
  );

  // Smart suggestion for micro-saving
  const saveSuggestion = Math.max(
    0.01,
    Math.round((goal.smartEst || goal.estPerDay || 0) * 100) / 100
  );

  // PUBLIC_INTERFACE
  function handleAddProgress(e) {
    e.preventDefault();
    if (!saveVal || isNaN(Number(saveVal)) || Number(saveVal) <= 0) return;
    onProgressAdd(goal.id, Number(saveVal), saveNote);
    setSaveVal("");
    setSaveNote("");
    setShowAdd(false);
  }

  return (
    <div
      className="goal-card"
      style={{
        background: "#23263a",
        border: `2px solid ${isPrimary ? brand.primary : "#3332"}`,
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 12px 0 #10121a60",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between"}}>
        <div>
          <span
            style={{
              background: isPrimary ? brand.accent : brand.secondary,
              color: "#fff",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.1em",
              marginRight: 12,
            }}
            aria-label="Goal Number"
          >
            {index}
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: "1.15em",
              color: brand.primary,
              marginRight: 8,
            }}
          >
            {goal.title}
          </span>
          {isPrimary && (
            <span
              style={{
                fontSize: 12,
                background: brand.primary,
                color: "#fff",
                borderRadius: 6,
                padding: "2px 7px",
                marginLeft: 6,
                verticalAlign: "middle",
              }}
            >
              ACTIVE
            </span>
          )}
        </div>
        <div style={{display:"flex", gap:5}}>
          <button
            className="btn"
            onClick={() => onActivate(goal.id)}
            style={{
              background: isPrimary ? "#23263a" : brand.primary,
              color: isPrimary ? brand.primary : "#fff",
              border: "none",
              padding: "4px 10px",
              fontSize: 13,
              marginRight: 2,
              minWidth: 60,
              opacity: isPrimary ? 0.7 : 1,
            }}
            disabled={isPrimary}
            title="Make Primary"
          >
            {isPrimary ? "Primary" : "Set Active"}
          </button>
          <button
            className="btn"
            onClick={() => onRemove(goal.id)}
            style={{
              background: "#3D1C24",
              color: "#e04a43",
              border: "1px solid #8c2e37",
              fontSize: 13,
              padding: "4px 10px",
            }}
            title="Remove"
          >
            Delete
          </button>
        </div>
      </div>

      <div
        style={{
          margin: "7px 0 5px 42px",
          color: "#b7bbc6",
          fontSize: 13,
        }}
      >
        Target: <b>₹{goal.amount}</b>
        {goal.deadline && (
          <>
            {" "}
            | By: <b>{new Date(goal.deadline).toLocaleDateString()}</b>
          </>
        )}{" "}
        | Days Left: <b>{daysLeft}</b>
      </div>
      <div style={{ margin: "2px 0 10px 42px", color: "#888", fontSize: 13 }}>
        {goal.income ? <>Income: ₹{goal.income}</> : ""}
        {goal.spending ? <>, Spending: ₹{goal.spending}</> : ""}
        {goal.income && goal.spending ? (
          <>
            , Disposable: <b>₹{goal.income - goal.spending}</b>
          </>
        ) : (
          ""
        )}
      </div>

      {/* Progress Bar + motivation */}
      <ProgressBar percent={percent} color={brand.accent} />
      <div style={{ marginLeft: 42, marginBottom: 5, color: brand.primary }}>
        {milestoneMsg}
      </div>
      <div style={{ marginLeft: 42, color: "#eee", fontSize: 16 }}>
        Saved: <b>₹{goal.progress}</b> / <b>₹{goal.amount}</b>
      </div>
      {/* Add virtual savings/cash */}
      <div style={{ marginLeft: 42 }}>
        {goal.completed ? (
          <strong style={{ color: brand.primary, fontSize: 17 }}>Goal Complete 🎉</strong>
        ) : (
          <div>
            {!showAdd ? (
              <button
                className="btn"
                style={{
                  background: brand.accent,
                  color: "#fff",
                  fontSize: 14,
                  padding: "6px 16px",
                }}
                onClick={() => setShowAdd(true)}
              >
                Add Savings
              </button>
            ) : (
              <form style={formStyles.addBox} onSubmit={handleAddProgress}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={saveVal}
                  onChange={(e) => setSaveVal(e.target.value)}
                  placeholder={`Ex: ₹${saveSuggestion}`}
                  style={formStyles.inputSmall}
                />
                <input
                  type="text"
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  style={formStyles.inputNote}
                  placeholder="Note (optional)"
                />
                <button
                  className="btn"
                  type="submit"
                  style={{
                    background: brand.primary,
                    color: "#fff",
                    fontSize: 13,
                  }}
                >
                  Save
                </button>
                <button
                  className="btn"
                  style={{
                    background: "#23263a",
                    color: "#eee",
                    fontSize: 13,
                  }}
                  type="button"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      {/* Habit builder enable/disable */}
      {!goal.completed && (
        <label style={{ marginLeft: 42, marginTop: 4, fontSize: 13, color: "#b7bbc6" }}>
          <input
            type="checkbox"
            checked={goal.remindersEnabled}
            style={{ marginRight: 6 }}
            onChange={() =>
              onModify(goal.id, { remindersEnabled: !goal.remindersEnabled })
            }
          />
          Habit Building Reminders
        </label>
      )}
      {/* Savings History (minimal) */}
      <details
        style={{
          marginLeft: 42,
          marginTop: 7,
          fontSize: 13,
          color: "#2196F3",
        }}
      >
        <summary style={{ cursor: "pointer" }}>Show Savings Log</summary>
        <ul style={{ listStyle: "disc", margin: "7px 0 0 16px" }}>
          {goal.savingsHistory.length === 0 && <li>No savings yet.</li>}
          {goal.savingsHistory.map((entry, idx) => (
            <li key={idx}>
              <span style={{ color: brand.primary, fontWeight: 600 }}>
                +₹{entry.amount}
              </span>
              {entry.note ? ` (${entry.note})` : ""}
              &nbsp;
              <span style={{ color: "#888", fontSize: 11 }}>
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

// ProgressBar component
function ProgressBar({ percent, color }) {
  return (
    <div
      style={{
        background: "#222634",
        borderRadius: 8,
        height: 16,
        marginLeft: 42,
        marginRight: 20,
        position: "relative",
        marginTop: 5,
        marginBottom: 5,
      }}
      aria-label="progress-bar"
    >
      <div
        style={{
          width: `${percent}%`,
          background: color,
          height: "100%",
          borderRadius: 8,
          transition: "width 0.6s cubic-bezier(.9,.2,.2,1)",
          textAlign: "right",
        }}
        aria-valuenow={percent}
      ></div>
      <span
        style={{
          position: "absolute",
          left: `${Math.max(10, Math.min(percent, 90))}%`,
          top: 0,
          transform: "translateX(-50%)",
          color: "#f7f7fa",
          fontWeight: 700,
          fontSize: 12,
          textShadow: "0 1px 4px #0007",
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

// Reminder prompt (in-app only, not push)
function ReminderPrompt({ title, onDismiss }) {
  return (
    <div
      style={{
        background: "#2f1e41ec",
        border: `1px solid #f7c948`,
        color: "#f7c948",
        borderRadius: 7,
        padding: "17px 22px",
        position: "fixed",
        top: 70,
        right: 40,
        zIndex: 102,
        minWidth: 220,
        boxShadow: "0 2px 16px 0 #1b1516c0",
        fontWeight: 500,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span role="img" aria-label="reminder">
        ⏰
      </span>
      <span>{title}</span>
      <button
        className="btn"
        style={{
          background: "#f7c948",
          color: "#2f1e41",
          fontSize: 13,
          padding: "3px 9px",
          border: "none",
        }}
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}

// Minimal inline form styling
const formStyles = {
  form: {
    background: "#23263a",
    border: `2px solid #3acae7`,
    borderRadius: 9,
    padding: 24,
    marginBottom: 26,
    marginTop: 10,
    maxWidth: 480,
    boxShadow: "0 1px 6px 0 #1a5671a4",
  },
  title: {
    fontWeight: 600,
    fontSize: "1.35em",
    marginBottom: 15,
    color: "#4CAF50",
  },
  label: {
    display: "block",
    marginBottom: 11,
    color: "#eee",
    fontSize: "1em",
    fontWeight: 500,
  },
  input: {
    fontSize: 15,
    padding: "6px 12px",
    marginTop: 4,
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #23263a",
    borderRadius: 5,
    outline: "none",
    background: "#191b25",
    color: "#eee",
    marginBottom: 7,
  },
  suggestion: {
    background: "#132e26",
    borderRadius: 5,
    color: "#7afe8e",
    fontSize: 13,
    padding: "7px 9px",
    marginBottom: -7,
  },
  addBox: {
    display: "flex",
    gap: 7,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  inputSmall: {
    width: 70,
    fontSize: 15,
    border: "1px solid #23263a",
    borderRadius: 4,
    padding: "4px 6px",
    outline: "none",
    marginRight: 3,
    background: "#191b25",
    color: "#eee",
  },
  inputNote: {
    flex: 1,
    fontSize: 13,
    border: "1px solid #23263a",
    borderRadius: 4,
    padding: "4px 6px",
    marginRight: 3,
    background: "#191b25",
    color: "#eee",
  },
};

export default MainContainer;
