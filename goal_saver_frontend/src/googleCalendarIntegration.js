//
// Google Calendar Integration Utility for Goalie
//  - Handles Google OAuth, calendar selection/creation, and syncing events.
//
// NOTE: This uses client-side OAuth2 (PKCE) via popup, and stores tokens in localStorage.
//       The app never keeps your OAuth secret in source code; user must register their own app (see below).
//
// Docs: https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow
//

const GOOGLE_DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar";

// <<---- USER SETUP: Register your app in Google Console --- (DO NOT COMMIT CLIENT_ID WITH SECRETS) ---->>
const GOOGLE_CLIENT_ID = localStorage.getItem("GCAL_CLIENT_ID") || "";  // User should set via setup UI

// Utility to load Google's gapi script
function loadGapiScript(callback) {
  if (window.gapi) return callback();
  const existing = document.getElementById("gapi-script");
  if (existing) {
    existing.onload = callback;
    return;
  }
  const script = document.createElement("script");
  script.id = "gapi-script";
  script.src = "https://apis.google.com/js/api.js";
  script.onload = callback;
  document.body.appendChild(script);
}

// PUBLIC_INTERFACE
/**
 * Triggers the Google OAuth sign-in popup and loads gapi client.
 * On success, stores and returns the accessToken.
 * @returns {Promise<string|null>}
 */
async function googleSignIn(clientId = GOOGLE_CLIENT_ID) {
  return new Promise((resolve, reject) => {
    if (!clientId) return reject(new Error("Google Client ID not set"));
    loadGapiScript(() => {
      window.gapi.load("client:auth2", () => {
        window.gapi.client.init({
          discoveryDocs: GOOGLE_DISCOVERY_DOCS,
          clientId,
          scope: GOOGLE_SCOPES,
        }).then(() => {
          const auth = window.gapi.auth2.getAuthInstance();
          auth.signIn().then(user => {
            const accessToken = user.getAuthResponse().access_token;
            localStorage.setItem("GCAL_ACCESS_TOKEN", accessToken);
            resolve(accessToken);
          }, err => {
            reject(err);
          });
        });
      });
    });
  });
}

// PUBLIC_INTERFACE
/**
 * Gets the access token (from memory or localStorage), or null if not logged in.
 * @returns {string|null}
 */
function getAccessToken() {
  return localStorage.getItem("GCAL_ACCESS_TOKEN") || null;
}

// PUBLIC_INTERFACE
/**
 * Signs the user out from Google for this app.
 */
function signOutGoogle() {
  if (window.gapi && window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
    window.gapi.auth2.getAuthInstance().signOut();
  }
  localStorage.removeItem("GCAL_ACCESS_TOKEN");
}

// PUBLIC_INTERFACE
/**
 * Fetches the user's calendars.
 * @returns {Promise<Array<{id: string, summary: string}>>}
 */
async function fetchCalendars() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Not authenticated with Google");
  const resp = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { "Authorization": "Bearer " + accessToken }
  });
  if (!resp.ok) throw new Error("Could not fetch calendar list");
  const data = await resp.json();
  return (data.items || []).map(({ id, summary }) => ({ id, summary }));
}

// PUBLIC_INTERFACE
/**
 * Creates a new calendar with the given name.
 * @returns {Promise<{id: string, summary: string}>}
 */
async function createCalendar(summary) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Not authenticated with Google");
  const resp = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ summary })
  });
  if (!resp.ok) throw new Error("Failed to create calendar");
  return resp.json();
}

// PUBLIC_INTERFACE
/**
 * Inserts or updates an event on the user-selected calendar.
 * If eventId is provided, does update; else, insert.
 * Returns eventId.
 */
async function syncCalendarEvent(calendarId, event, eventId = null) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Not authenticated with Google");
  const url = eventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const method = eventId ? "PUT" : "POST";
  const resp = await fetch(url, {
    method,
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (!resp.ok) throw new Error("Failed to sync event");
  const data = await resp.json();
  return data.id;
}

// PUBLIC_INTERFACE
/**
 * Deletes a calendar event by ID.
 */
async function deleteCalendarEvent(calendarId, eventId) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Not authenticated with Google");
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + accessToken }
  });
  if (!resp.ok) throw new Error("Failed to delete event");
}

// PUBLIC_INTERFACE
/** Utility to get short event object for a savings goal */
function makeGoalEvent(goal, reminderTime = "08:00") {
  // reminderTime: "HH:MM" 24h
  const date = goal.deadline;
  const start = date + "T" + reminderTime + ":00";
  const summary = `🏅 Savings Goal: ${goal.title}`;
  const description = `Target ₹${goal.targetAmount}\nCurrent: ₹${goal.savedAmount}\nManaged by Goalie app.`;
  return {
    summary,
    description,
    start: { dateTime: start },
    end: { dateTime: start },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 10 * 60 }]
    }
  };
}

export {
  googleSignIn,
  getAccessToken,
  signOutGoogle,
  fetchCalendars,
  createCalendar,
  syncCalendarEvent,
  deleteCalendarEvent,
  makeGoalEvent
};
