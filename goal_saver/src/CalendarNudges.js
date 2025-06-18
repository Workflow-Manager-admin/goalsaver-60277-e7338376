import React, { useEffect, useState } from "react";
import { fetchUpcomingCalendarEvents } from "./GoogleCalendarUtils";

/**
 * PUBLIC_INTERFACE
 * CalendarNudges component
 * - Handles Google Calendar data opt-in, fetches next 2-4 weeks' events, and generates context-aware nudges (busy slots, payday, etc.).
 * - Used within the dashboard or onboarding for smarter reminder logic.
 * - Props:
 *   - userConsent: boolean (has user explicitly opted in for event data usage?)
 *   - onRequestConsent: function() => Promise<boolean>, called when opt-in is needed
 *   - frequency: "daily"|"weekly"|"monthly"
 *   - children: optional render-props pattern for advanced UI
 */
function CalendarNudges({ userConsent, onRequestConsent, frequency, children }) {
  const [events, setEvents] = useState([]);
  const [fetchState, setFetchState] = useState({ loading: false, error: null, message: null });
  const [nudges, setNudges] = useState([]);
  // Privacy info
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    // Only attempt fetch if userConsent is true
    if (!userConsent) return;
    async function run() {
      setFetchState({ loading: true, error: null, message: null });
      const res = await fetchUpcomingCalendarEvents({
        askUserConsentCb: onRequestConsent,
      });
      if (res.status === "success") {
        setEvents(res.events);
        setFetchState({ loading: false, error: null, message: res.message });
      } else {
        setEvents([]);
        setFetchState({ loading: false, error: res.message, message: res.message });
      }
    }
    run();
    // eslint-disable-next-line
  }, [userConsent, onRequestConsent]);

  // Simple nudge generator: E.g., "It's almost payday", "Busy slots ahead: We'll schedule reminders with less conflict", etc.
  useEffect(() => {
    if (!events || events.length === 0) {
      setNudges([]);
      return;
    }
    const today = new Date();
    // Payday heuristic: Look for a recurring event or one with "payday" in summary/description within next 2 weeks
    const paydayEvent = events.find(ev =>
      (ev.summary && /pay.?day/i.test(ev.summary)) ||
      (ev.description && /pay.?day/i.test(ev.description))
    );
    const paydayNudge =
      paydayEvent &&
      ((new Date(paydayEvent.start.dateTime || paydayEvent.start.date) - today) / (1000 * 3600 * 24) <= 14)
        ? "Payday is coming up! Consider boosting savings right after you get paid."
        : null;

    // Detect high-busy periods: Count number of events per day, flag "full" days as busy
    const eventDays = {};
    events.forEach(ev => {
      const dateStr = (ev.start.dateTime || ev.start.date || "").slice(0, 10);
      if (dateStr) {
        eventDays[dateStr] = (eventDays[dateStr] || 0) + 1;
      }
    });
    const busyThreshold = 5; // custom: 5+ events = busy
    const superBusyDates = Object.keys(eventDays).filter(d => eventDays[d] >= busyThreshold);

    const busyNudge =
      superBusyDates.length > 0
        ? `Looks like you have multiple busy days coming up (${superBusyDates.length} packed days). We'll avoid sending savings reminders on those days.`
        : null;

    // Suggest relaxing reminders during weekends if most events are weekdays
    const weekendBusy = events.some(ev => {
      const dateObj = new Date(ev.start.dateTime || ev.start.date);
      return [0, 6].includes(dateObj.getDay());
    });
    const weekdayCount = events.filter(ev => {
      const dateObj = new Date(ev.start.dateTime || ev.start.date);
      return dateObj.getDay() >= 1 && dateObj.getDay() <= 5;
    }).length;

    const weekendNudge =
      !weekendBusy && weekdayCount > 4
        ? "Most of your events are weekdays. We'll suggest reminders mostly on weekdays for better fit."
        : null;

    // Further nudge: if next 10 days are almost all busy, advise skipping reminders for mental well-being.
    const next10 = Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const busyDaysNext10 = next10.filter(d => eventDays[d] && eventDays[d] >= busyThreshold);
    const overwhelmNudge =
      busyDaysNext10.length >= 7
        ? "Your upcoming 10 days are jam-packed. We'll reduce reminders so you can focus on what's important."
        : null;

    setNudges(
      [paydayNudge, busyNudge, weekendNudge, overwhelmNudge].filter(Boolean)
    );
  }, [events]);

  // Render UI or children-prop
  if (!userConsent) {
    return (
      <div
        style={{
          background: "#f9fbff",
          color: "#446",
          borderRadius: 11,
          fontSize: 15,
          padding: "14px 20px",
          maxWidth: 500,
          margin: "12px 0 0 0",
          boxShadow: "0 2px 16px #bae1fa19",
          cursor: "pointer"
        }}
        tabIndex={0}
        role="button"
        onClick={() => {
          if (typeof onRequestConsent === "function") {
            onRequestConsent();
          }
        }}
        onMouseEnter={() => setShowPrivacy(true)}
        onMouseLeave={() => setShowPrivacy(false)}
        aria-label="Click to grant consent for calendar-based nudges"
      >
        <span role="img" aria-label="calendar" style={{ fontSize: 21, marginRight: 10 }}>📅</span>
        Want even smarter reminders? <b>Opt in</b> to let Goalie suggest tips based on your real Google Calendar – never spam, just context-aware help.
        {showPrivacy && (
          <div style={{
            color: "#936",
            fontSize: 13,
            background: "#fffbe8",
            padding: "8px 13px",
            borderRadius: 6,
            marginTop: 10,
            transition: "opacity 0.22s"
          }}>
            <b>Privacy First</b>: We'll only check your calendar for upcoming events. No data leaves your browser; nothing is shared with third parties.
          </div>
        )}
      </div>
    );
  }
  if (fetchState.loading) {
    return (
      <div
        style={{
          background: "#eaf7ff",
          color: "#3188bb",
          borderRadius: 11,
          padding: "12px 18px",
        }}
      >Loading your upcoming calendar events...</div>
    );
  }
  if (fetchState.error) {
    return (
      <div
        style={{
          background: "#fff3f1",
          color: "#b66555",
          borderRadius: 11,
          padding: "12px 18px",
          marginTop: 7,
        }}
      >
        {fetchState.error}
      </div>
    );
  }
  if (typeof children === "function") {
    return children({ events, nudges });
  }

  // Quick card listing nudges
  if (nudges.length === 0) {
    return null;
  }
  return (
    <div style={{
      background: "linear-gradient(98deg, #eafcff 77%, #f8f6ed 120%)",
      borderRadius: 13,
      fontSize: 15,
      padding: "16px 19px",
      color: "#2c5c8f",
      marginTop: 3,
      marginBottom: 2,
      boxShadow: "0 2px 11px #baeaff22"
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#367ac2", marginBottom: 7 }}>
        <span role="img" aria-label="insight" style={{ fontSize: 19, marginRight: 8 }}>🧠</span>
        Smart Calendar Nudges
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
        {nudges.map((n, idx) => (
          <li key={idx} style={{ marginBottom: 7 }}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

export default CalendarNudges;
