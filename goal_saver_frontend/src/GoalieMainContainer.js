import React, { useState, useEffect } from "react";
import PieChart from "./PieChart";
import {
  googleSignIn,
  getAccessToken,
  signOutGoogle,
  fetchCalendars,
  createCalendar,
  syncCalendarEvent,
  deleteCalendarEvent,
  makeGoalEvent
} from "./googleCalendarIntegration";

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

  // Google Calendar Integration State
  const [gcalStatus, setGcalStatus] = useState("idle"); // idle|signed_out|signing_in|signed_in|error
  const [gcalError, setGcalError] = useState("");
  const [gcalAccessToken, setGcalAccessToken] = useState(() => getAccessToken());
  const [showGcalSetup, setShowGcalSetup] = useState(false);
  const [gcalCalendars, setGcalCalendars] = useState([]);
  const [gcalCalendarId, setGcalCalendarId] = useState(localStorage.getItem("GCAL_SELECTED_CALENDAR") || "");
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [gcalSyncMap, setGcalSyncMap] = useState(() => {
    // Maps goal.id to gcal eventId (for updating/deleting)
    const obj = localStorage.getItem("GOAL_GCAL_MAP");
    return obj ? JSON.parse(obj) : {};
  });

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

  // Persist gcalSyncMap to localStorage
  useEffect(() => {
    localStorage.setItem("GOAL_GCAL_MAP", JSON.stringify(gcalSyncMap));
  }, [gcalSyncMap]);

  // Track access token changes
  useEffect(() => {
    if (gcalAccessToken) setGcalStatus("signed_in");
    else setGcalStatus("signed_out");
  }, [gcalAccessToken]);


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

  // Refresh calendar list on login
  useEffect(() => {
    async function loadCals() {
      if (!gcalAccessToken) return;
      try {
        setGcalStatus("signed_in");
        setGcalError("");
        const calendars = await fetchCalendars();
        setGcalCalendars(calendars);
      } catch (e) {
        setGcalError("Failed to load calendars. Try signing in again.");
        setGcalStatus("error");
      }
    }
    if (gcalAccessToken) loadCals();
  }, [gcalAccessToken]);


  // PUBLIC_INTERFACE
  function handleNotification(message) {
    setNotification(message);
  }

  // PUBLIC_INTERFACE
  async function handleGcalConnectClick() {
    setGcalStatus("signing_in");
    setGcalError("");
    try {
      const clientId = localStorage.getItem("GCAL_CLIENT_ID") || "";
      if (!clientId) {
        setGcalStatus("error");
        setGcalError("Google OAuth Client ID not set. See settings or docs.");
        return;
      }
      const token = await googleSignIn(clientId);
      setGcalAccessToken(token);
      setGcalStatus("signed_in");
      handleNotification("Google Calendar connected!");
      // Automatically ask to pick calendar
      setShowCalendarPicker(true);
    } catch (e) {
      setGcalStatus("error");
      setGcalError("Failed to sign in: " + (e.message || e));
    }
  }

  // PUBLIC_INTERFACE
  function handleGcalSignOut() {
    signOutGoogle();
    setGcalAccessToken(null);
    setGcalStatus("signed_out");
    setGcalCalendarId("");
    localStorage.removeItem("GCAL_SELECTED_CALENDAR");
    handleNotification("Disconnected from Google Calendar.");
    setGcalSyncMap({});
  }

  // After calendar is selected
  function onCalendarSelected(calId) {
    setGcalCalendarId(calId);
    localStorage.setItem("GCAL_SELECTED_CALENDAR", calId);
    handleNotification("Google Calendar selected.");
  }

  // PUBLIC_INTERFACE
  async function handleCalendarPicker() {
    if (!gcalAccessToken) {
      handleNotification("Sign in to Google first.");
      setShowGcalSetup(true);
      return;
    }
    setShowCalendarPicker(true);
  }

  // Handle calendar creation
  async function handleCreateNewCalendar() {
    let calName = window.prompt("Enter name for new calendar:", "Goalie Reminders");
    if (!calName) return;
    try {
      const newCal = await createCalendar(calName);
      setGcalCalendars(prev => [...prev, newCal]);
      setGcalCalendarId(newCal.id);
      localStorage.setItem("GCAL_SELECTED_CALENDAR", newCal.id);
      handleNotification("Created new calendar!");
    } catch (e) {
      setGcalError("Failed to create calendar: " + (e.message || e));
    }
  }

  // Sync single goal to Google Calendar (insert/update)
  async function syncGoalToGcal(goal) {
    if (!gcalAccessToken || !gcalCalendarId) return;
    setGcalStatus("syncing");
    const eventObj = makeGoalEvent(goal);
    try {
      const existingId = gcalSyncMap[goal.id] || null;
      const eventId = await syncCalendarEvent(gcalCalendarId, eventObj, existingId);
      setGcalSyncMap(prev => ({ ...prev, [goal.id]: eventId }));
      setGcalStatus("signed_in");
    } catch (e) {
      setGcalStatus("error");
      setGcalError("Fail to sync reminder: " + (e.message || e));
    }
  }

  // Remove goal from Google Calendar
  async function removeGoalFromGcal(goalId) {
    if (!gcalAccessToken || !gcalCalendarId) return;
    const evtId = gcalSyncMap[goalId];
    if (!evtId) return;
    try {
      await deleteCalendarEvent(gcalCalendarId, evtId);
      setGcalSyncMap(prev => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    } catch (e) {
      // Swallow errors
    }
  }

  // Sync on add/modify/delete goal
  useEffect(() => {
    // On add/update, push to calendar; on deletion, remove.
    if (!gcalAccessToken || !gcalCalendarId) return;
    // Find deleted IDs
    const existingIds = Object.keys(gcalSyncMap);
    const goalIds = goals.map(g => g.id + "");
    const deleted = existingIds.filter(id => !goalIds.includes(id));
    // Remove deleted from Google Calendar
    deleted.forEach(id => removeGoalFromGcal(id));
    // Sync/Update active (quick best effort)
    goals.forEach(goal => {
      syncGoalToGcal(goal);
    });
    // eslint-disable-next-line
  }, [goals, gcalAccessToken, gcalCalendarId]);

  // User helper: setup Client ID for OAuth (basic, for demo/dev flow)
  function GcalSetupPrompt({ open, onClose }) {
    const [input, setInput] = useState(localStorage.getItem("GCAL_CLIENT_ID") || "");
    if (!open) return null;
    return (
      <div style={{
        position: "fixed", zIndex: 1600, inset: 0, background: "rgba(44,68,93,0.17)", display: "flex",
        alignItems: "center", justifyContent: "center", backdropFilter: "blur(2.5px)"
      }}>
        <div style={{
          background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 7px 33px #a9e9e8aa",
          minWidth: 340, maxWidth: "80vw", display: "flex", flexDirection: "column", alignItems: "flex-start"
        }}>
          <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 7 }}>Google API Setup</div>
          <div style={{ fontSize: 15, color: "#888", marginBottom: 10 }}>
            Enter your Google OAuth Client ID for Goalie (see <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Console</a>).<br />
            <span style={{ color: "#e6913e" }}>Do not share secret keys here.</span>
          </div>
          <input
            style={{ border: "1.7px solid #bfcbe6", borderRadius: 7, fontSize: 16, width: "100%", marginBottom: 13, padding: "9px 14px" }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Google OAuth Client ID (example.apps.googleusercontent.com)" />
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                localStorage.setItem("GCAL_CLIENT_ID", input);
                onClose();
                window.location.reload();
              }}
              style={{ background: "#637be7", color: "#fff", padding: "8px 22px", borderRadius: 8, fontWeight: 650, border: 0, fontSize: 16, cursor: "pointer" }}
              disabled={!input.trim()}
            >Save & Refresh</button>
            <button onClick={onClose} style={{ background: "#fff", color: "#787878", padding: "8px 24px", border: "1.3px solid #dbdbe8", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  function GcalStatusBar() {
    return (
      <div style={{
        background: "#e6e7fa",
        color: "#384775",
        fontSize: 15.2,
        padding: "8px 17px 8px 13px",
        borderRadius: 9,
        marginBottom: 13,
        marginTop: 7,
        boxShadow: "0 2px 7px #e7eaf545",
        border: "1.4px solid #bfcbe6",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 33
      }}>
        <span style={{ color: "#637be7", fontWeight: 700, fontSize: 15.7 }}>Google Calendar: </span>
        {
          gcalStatus === "signed_in" && gcalCalendarId
            ? <span>Connected ✅ – <b>selected calendar:</b> {gcalCalendars.find(c => c.id === gcalCalendarId)?.summary || "(Loading…)"}</span>
            : gcalStatus === "signed_in"
              ? <span>Connected ✅ – <i>No calendar selected.</i></span>
              : gcalStatus === "signing_in"
                ? <span>Signing in...</span>
                : <span>Not connected</span>
        }
        {
          gcalError && <span style={{ color: "#b2381d", fontWeight: 600 }}>Error: {gcalError}</span>
        }
        {gcalStatus === "signed_in" &&
          <button onClick={handleGcalSignOut}
            style={{ marginLeft: "auto", background: "#fff", color: "#b2381d", border: "1px solid #ccc", borderRadius: 7, padding: "3px 15px", fontWeight: 600, cursor: "pointer" }}>
            Sign out
          </button>
        }
      </div>
    );
  }

  function GcalCalendarPicker() {
    if (!showCalendarPicker) return null;
    return (
      <div style={{
        position: "fixed", zIndex: 1700, inset: 0, background: "rgba(32,48,61,0.17)", display: "flex",
        alignItems: "center", justifyContent: "center", backdropFilter: "blur(2.2px)"
      }}>
        <div style={{
          background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 7px 35px #b7f5ffa9", minWidth: 320, maxWidth: "80vw"
        }}>
          <div style={{ fontWeight: 700, fontSize: 17.8, color: "#637be7" }}>Select Calendar for Goalie Reminders</div>
          <div style={{ fontSize: 14, color: "#385" }}>Pick where Goalie will sync your savings reminders.</div>
          <div style={{ marginTop: 17, marginBottom: 21 }}>
            <select
              value={gcalCalendarId}
              onChange={e => { onCalendarSelected(e.target.value); setShowCalendarPicker(false); }}
              style={{ width: "100%", fontSize: 16, padding: "10px", borderRadius: 7, border: "1.1px solid #c8c8e6" }}
            >
              <option value="">-- Select --</option>
              {gcalCalendars.map((c, idx) => <option value={c.id} key={c.id + idx}>{c.summary}</option>)}
            </select>
          </div>
          <button onClick={handleCreateNewCalendar} style={{
            background: "#ffd768", color: "#384775", border: "none", fontWeight: 700, padding: "8px 22px", borderRadius: 8, fontSize: 15, cursor: "pointer"
          }}>+ Create New Calendar</button>
          <button onClick={() => setShowCalendarPicker(false)}
            style={{ marginLeft: 11, background: "#fff", color: "#838383", border: "1.2px solid #dbdbe8", borderRadius: 7, padding: "8px 18px", fontSize: 15, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
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

  // Calculate aggregate completion percent for all goals (weighted)
  // Only include goals with targetAmount > 0
  const overallTotalTarget = goals.reduce((sum, g) => sum + (g.targetAmount > 0 ? g.targetAmount : 0), 0);
  const overallTotalSaved = goals.reduce((sum, g) => sum + (g.targetAmount > 0 ? Math.min(g.savedAmount, g.targetAmount) : 0), 0);
  const overallPercent = overallTotalTarget > 0 ? Math.round((overallTotalSaved / overallTotalTarget) * 100) : 0;


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

    // Pie chart color tunes
    const pieFg = percent >= 100 ? "#43a75b" : palette.primary;
    const pieBg = "#e6e7fa";
    const pieSize = 48;
    const pieStroke = 8;

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
          transition: "all 0.32s cubic-bezier(.15,.83,.53,.99)",
          cursor: "pointer",
        }}
        tabIndex={0}
        aria-label={`Goal card: ${goal.title} (${percent}% complete)`}
        onMouseOver={e => {
          e.currentTarget.style.boxShadow = "0 7px 38px 3px #befff927";
        }}
        onMouseOut={e => {
          e.currentTarget.style.boxShadow = goal.priority
            ? `0 3px 21px 2px #aacffd23`
            : palette.shadowCard;
        }}
        onFocus={e => {
          e.currentTarget.style.boxShadow = "0 7px 38px 3px #befff927";
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = goal.priority
            ? `0 3px 21px 2px #aacffd23`
            : palette.shadowCard;
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            {/* Pie chart indicator */}
            <div
              style={{
                marginRight: 4,
                flex: "none",
                width: pieSize,
                height: pieSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f7fcff",
                borderRadius: "50%",
                boxShadow: percent === 100
                  ? "0 3px 13px #8dfba422"
                  : "0 2px 9px #ecf7f399",
                border: percent === 100
                  ? "2.4px solid #43a75bbb"
                  : "2.2px solid #e6e7fa",
                transition: "border .25s, box-shadow .36s",
                position: "relative"
              }}
              title={`${percent}% of goal saved`}
              aria-label={`Pie progress: ${percent}%`}
            >
              <PieChart percent={percent} size={pieSize-4} fgColor={pieFg} bgColor={pieBg} strokeWidth={pieStroke} showLabel={percent>14 || percent===100}/>
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: 0.5, display:"flex", alignItems:"center", gap:8 }}>
              {goal.title}
              {goal.priority && (
                <span
                  title="Priority"
                  style={{
                    marginLeft: 7,
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
          </div>
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
              gap: 18,
              width: "100%",
              justifyContent: "center",
              position: "relative"
            }}>
            {/* Prominent hand-crafted football goal post SVG for branding (no ambiguity) */}
            <span style={{
              display: "flex",
              alignItems: "center",
              marginRight: 7,
              minWidth: 76,
              minHeight: 46,
              background: "none",
              padding: 0,
              borderRadius: 0,
              justifyContent: "center"
            }}>
              {/* Unambiguous football/soccer goal icon */}
              <svg
                width="76"
                height="46"
                viewBox="0 0 152 92"
                style={{
                  verticalAlign: "middle",
                  aspectRatio: "152/92",
                  display: "block",
                  filter: "drop-shadow(0 2px 7px #aee2ffd8)"
                }}
                aria-hidden="true"
              >
                {/* Main posts and crossbar */}
                <rect x="16" y="18" width="15" height="64" rx="5" fill="#74b5f9" stroke="#496fa0" strokeWidth="2.8"/>
                <rect x="121" y="18" width="15" height="64" rx="5" fill="#74b5f9" stroke="#496fa0" strokeWidth="2.8"/>
                <rect x="31" y="8" width="90" height="12" rx="4.5" fill="#ffe15b" stroke="#d4d096" strokeWidth="3.6"/>
                {/* Perspective net/sides */}
                <polygon points="31,20 31,80 18,78 18,18" fill="#c8defc" opacity="0.34"/>
                <polygon points="121,20 121,80 136,78 136,18" fill="#c8defc" opacity="0.34"/>
                {/* Ground shadow */}
                <ellipse cx="76" cy="87" rx="66" ry="7" fill="#91efce" opacity="0.18"/>
                {/* 3D rear posts */}
                <rect x="39" y="80" width="74" height="5" rx="2.1" fill="#b0d8fa" opacity="0.50"/>
                <rect x="44" y="20" width="6" height="62" rx="2.8" fill="#e4e8f3" opacity="0.52"/>
                <rect x="102" y="20" width="6" height="62" rx="2.8" fill="#e4e8f3" opacity="0.52"/>
                {/* Net horizontal lines */}
                <rect x="48" y="30" width="56" height="2" rx="1" fill="#dde9f6" opacity="0.78"/>
                <rect x="48" y="40" width="56" height="2" rx="1" fill="#dde9f6" opacity="0.78"/>
                <rect x="48" y="50" width="56" height="2" rx="1" fill="#dde9f6" opacity="0.78"/>
                <rect x="48" y="60" width="56" height="2" rx="1" fill="#dde9f6" opacity="0.78"/>
                <rect x="48" y="70" width="56" height="2" rx="1" fill="#dde9f6" opacity="0.78"/>
                {/* Net vertical lines */}
                <rect x="56" y="22" width="1.8" height="57" rx="0.7" fill="#dae7f6" opacity="0.62"/>
                <rect x="67" y="22" width="1.8" height="57" rx="0.7" fill="#dae7f6" opacity="0.62"/>
                <rect x="78" y="22" width="1.8" height="57" rx="0.7" fill="#dae7f6" opacity="0.62"/>
                <rect x="89" y="22" width="1.8" height="57" rx="0.7" fill="#dae7f6" opacity="0.62"/>
                <rect x="100" y="22" width="1.8" height="57" rx="0.7" fill="#dae7f6" opacity="0.62"/>
                {/* Optional football accent - bottom right, subtle */}
                <circle cx="131" cy="75" r="7" fill="#fff" stroke="#aac8dd" strokeWidth="2.1" opacity="0.85" />
                <circle cx="131" cy="75" r="2.4" fill="#dde9f6"/>
                <line x1="131" y1="71.7" x2="131" y2="78.3" stroke="#bfc3d5" strokeWidth="1" opacity="0.7"/>
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

        {/* OVERALL AGGREGATE PIE CHART */}
        {/* GOOGLE CALENDAR INTEGRATION UI */}
        <section style={{ margin: "0 0 34px 0", paddingTop: 14 }}>
          <GcalStatusBar />
          <div style={{ display: "flex", gap: 17 }}>
            {gcalStatus !== "signed_in" &&
              <button
                className="btn"
                style={{ background: "#637be7", color: "#fff" }}
                onClick={() => setShowGcalSetup(true)}
              >Google Setup
              </button>
            }
            {gcalStatus === "signed_out" &&
              <button
                className="btn"
                style={{ background: "#43a75b", color: "#fff" }}
                onClick={handleGcalConnectClick}
              >Connect Google Calendar
              </button>
            }
            {gcalStatus === "signed_in" &&
              <button
                className="btn"
                style={{ background: "#ffd768", color: "#27332b" }}
                onClick={handleCalendarPicker}
              >Choose Calendar
              </button>
            }
            <button className="btn"
              style={{ background: "#fff", color: "#637be7", border: "1.5px solid #ddd" }}
              onClick={() => window.open("https://developers.google.com/calendar/api/quickstart/js", "_blank")}
            >Google Calendar API Docs
            </button>
          </div>
        </section>
        <section
          style={{
            marginTop: -22,
            marginBottom: 37,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: palette.card,
            borderRadius: 28,
            boxShadow: "0 8px 38px 2px #b0fedb33",
            border: `2.2px solid ${palette.accentAlt}`,
            padding: "36px 5vw 28px 5vw",
            maxWidth: 520,
            minWidth: 250,
            width: "100%",
            marginLeft: "auto",
            marginRight: "auto",
            position: "relative",
            zIndex: 30
          }}
        >
          <div
            style={{
              fontWeight: 740,
              fontSize: 22.7,
              color: palette.primaryDark,
              letterSpacing: ".6px",
              textAlign: "center",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 11,
              userSelect: "none"
            }}
          >
            <span
              style={{
                fontSize: 23,
                color: palette.accentAlt,
                verticalAlign: "middle"
              }}
              aria-hidden="true"
            >🏅</span>
            Overall Goals Progress
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 12,
              marginBottom: 8,
              width: "100%",
            }}
          >
            <PieChart
              goalSegments={
                (() => {
                  // For each goal: the value is *actual progress value* (saved up to target), total is sum of all
                  const goalsList = goals.filter(g => g.targetAmount > 0);
                  const segs = goalsList.map((g, i) => {
                    const valueRaw = Math.min(g.savedAmount, g.targetAmount);
                    return {
                      name: g.title,
                      value: valueRaw,
                      color: undefined, // let PieChart auto-palette
                      displayPercent:
                        overallTotalTarget > 0
                          ? `${Math.round((valueRaw / overallTotalTarget) * 100)}%`
                          : "0%",
                    };
                  });
                  return segs;
                })()
              }
              size={135}
              bgColor={palette.progressBg}
              strokeWidth={15}
              showLabel={true}
            />
          </div>
          <div style={{
            color: palette.textSecondary,
            fontSize: 15.3,
            fontWeight: 500,
            textAlign: "center",
            marginTop: 6,
            lineHeight: 1.38,
            minHeight: 20
          }}>
            {goals.length === 0
              ? "No goals set yet. Add a new goal below!"
              : (overallPercent === 100
                ? "Amazing! You've reached all your current savings goals. 🎉"
                : `You have saved ₹${overallTotalSaved.toLocaleString()} out of ₹${overallTotalTarget.toLocaleString()} so far.`)}
          </div>
        </section>
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
      {/* Google Calendar Setup Modal */}
      <GcalSetupPrompt open={showGcalSetup} onClose={() => setShowGcalSetup(false)} />
      {/* Google Calendar picker modal */}
      <GcalCalendarPicker />
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
