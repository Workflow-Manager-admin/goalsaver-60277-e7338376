//
// GoogleCalendarUtils.js
// Utility module to interact with Google Calendar API using OAuth tokens stored from login
//
// Provides functions to add or delete reminder events to user's primary calendar for goal reminders
//
// Requirements:
// - Use access token stored in localStorage under "goalie-google-oauth"
// - Insert events for new/updated goals
// - Gracefully handle token expiry, refresh, and errors
// - Provide user-friendly responses
//

/**
 * Get stored Google OAuth2 token (from GoogleLoginButton.js).
 */
function getStoredAuth() {
  try {
    const data = localStorage.getItem("goalie-google-oauth");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Checks if the stored token is still valid (with 1m early expiration).
 */
function isTokenValid(auth) {
  if (!auth || !auth.access_token || !auth.expires_at) return false;
  return Date.now() < auth.expires_at - 60 * 1000;
}

/**
 * PUBLIC_INTERFACE
 * Inserts a savings reminder event into the user's Google Calendar.
 * - goal: goal object {title, amount, deadline, id, ...}
 * - whenType: "created" or "updated" (for event summary)
 * Returns: {status: "success"|"error", message, data}
 */
export async function addGoalReminderToCalendar(goal, whenType = "created") {
  const auth = getStoredAuth();
  if (!isTokenValid(auth)) {
    return {
      status: "error",
      message: "Google authentication expired. Please reconnect your account.",
    };
  }

  // Compose event details
  const summary =
    whenType === "created"
      ? `Goalie: Start Saving for "${goal.title}"!`
      : `Goalie: Updated "${goal.title}" Savings Goal`;

  // The date/time for the reminder - use the goal deadline at noon, or today + 1 (nudging)
  let targetDate = goal.deadline
    ? new Date(goal.deadline)
    : new Date(Date.now() + 86400000);
  // Ensure the event shows as all-day or at 9:00am:
  targetDate.setHours(9, 0, 0, 0);
  const endDate = new Date(targetDate);
  endDate.setHours(10, 0, 0, 0);

  const event = {
    summary,
    description: `Savings Goal: ${goal.title}\nTarget: ₹${goal.amount}\nDeadline: ${goal.deadline}\nStay on track with Goalie!`,
    start: {
      dateTime: targetDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 * 24 }, // 24h before
        { method: "popup", minutes: 60 * 2 }, // 2h before
      ],
    },
    extendedProperties: {
      private: { goalie_goal_id: goal.id || "" },
    },
    // Use an icon for fun
    colorId: "10", // Soft blue
    source: {
      title: "Goalie App",
      url: "https://goalie.app" // Branding for calendar source
    }
  };

  try {
    const resp = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );
    if (!resp.ok) {
      if (resp.status === 401) {
        return {
          status: "error",
          message: "Google token expired. Please reconnect Calendar.",
        };
      }
      const err = await resp.json();
      return {
        status: "error",
        message: err.error && err.error.message
          ? "Calendar error: " + err.error.message
          : "Could not add event to Google Calendar.",
      };
    }
    const eventData = await resp.json();
    return {
      status: "success",
      message: `Savings reminder added to your Google Calendar for "${goal.title}"!`,
      data: eventData,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to access Google Calendar: " + (error.message || error),
    };
  }
}

/**
 * PUBLIC_INTERFACE
 * Removes a previously-created event by eventId.
 * This can be called if a goal is deleted and you track the eventId.
 * Returns {status, message}
 */
export async function deleteCalendarEvent(eventId) {
  const auth = getStoredAuth();
  if (!isTokenValid(auth)) {
    return {
      status: "error",
      message: "Google authentication expired. Please reconnect your account.",
    };
  }
  if (!eventId) {
    return {
      status: "error",
      message: "No Calendar event ID provided.",
    };
  }
  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );
    if (resp.status === 204) {
      return {
        status: "success",
        message: "Event removed from your Google Calendar.",
      };
    } else if (resp.status === 401) {
      return {
        status: "error",
        message: "Google token expired. Please reconnect Calendar.",
      };
    } else {
      return {
        status: "error",
        message: "Could not remove event from Calendar.",
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: "Failed to delete calendar event: " + (error.message || error),
    };
  }
}
