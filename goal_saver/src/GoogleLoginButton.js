/**
 * =========== GOOGLE LOGIN BUTTON INTEGRATION CHECKLIST ===========
 * 
 * 1. Confirm CLIENT_ID is set to your valid credentials from Google Cloud Console.
 * 2. Ensure 'gsi/client' loads from https://accounts.google.com/gsi/client and window.google.accounts/oauth2 is visible.
 * 3. All OAuth flows request `calendar.events` scope + `openid`, handling all callback outcomes.
 * 4. Access tokens are stored in localStorage. Check expiration (expires_at).
 * 5. On callback errors, detailed logging appears in both UI and browser console.
 * 6. Re-login/refresh and disconnect states are handled and reflected in UI.
 * 
 * Debugging tips:
 * - If button is disabled, GSI script load likely failed – check network/console.
 * - If authentication fails, double check client ID, OAuth consent screen config, and allowed JS origins.
 * - See README for full OAuth instructions and troubleshooting.
 */

import React, { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * GoogleLoginButton handles Google OAuth2 login for Calendar integration.
 * - Requests calendar.events scope.
 * - Displays login/connect button and handles consent.
 * - Persists tokens securely in localStorage.
 * - Can render UI for login, error, and logged-in state.
 *
 * Usage: <GoogleLoginButton onLogin={cb} />
 */
/**
 * IMPORTANT:
 * Replace the below CLIENT_ID with your actual Google OAuth 2.0 Client ID for Web from
 * https://console.cloud.google.com/apis/credentials (create OAuth client, type: Web, authorized JS origins).
 * See the Goalie README OAuth section for more details.
 */
/**
 * IMPORTANT: Set your Google OAuth 2.0 Client ID for Web below.
 * To debug, use a test client id if available and document the change for revert in prod.
 * If left as 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', auth will fail.
 */
const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; // TODO: Replace with your actual Google OAuth client id

// Small helper for localStorage namespacing
const localKey = "goalie-google-oauth";

function getStoredAuth() {
  try {
    const data = localStorage.getItem(localKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStoredAuth(creds) {
  // Only store access_token and expiration
  localStorage.setItem(localKey, JSON.stringify(creds));
}

function clearStoredAuth() {
  localStorage.removeItem(localKey);
}

function isTokenValid(auth) {
  if (!auth || !auth.access_token || !auth.expires_at) return false;
  return Date.now() < auth.expires_at - 60 * 1000; // 1min early expiration buffer
}

// PUBLIC_INTERFACE
function GoogleLoginButton({ onLogin }) {
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [auth, setAuth] = useState(getStoredAuth());
  const [error, setError] = useState(null);

  // Load Google Identity Services script on first mount
  useEffect(() => {
    // Prevent double inclusion
    if (window.google && window.google.accounts) {
      setGsiLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts) {
        setGsiLoaded(true);
      } else {
        setError("Google Identity Services failed to load (no google.accounts).");
      }
    };
    script.onerror = () => setError("Failed to load Google login script.");
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Attempt to refresh stored token on mount
  useEffect(() => {
    if (auth && isTokenValid(auth)) {
      if (typeof onLogin === "function") onLogin(auth);
    } else {
      setAuth(null);
    }
    // eslint-disable-next-line
  }, []);

  // Token exchange helper
  const handleCredentialResponse = async (response) => {
    // Exchange the ID token for access/refresh tokens via Google OAuth (PKCE; frontend implicit)
    // Use OAuth 2.0 Token Endpoint with client_id, code, etc.
    // Here, we use the new token client which returns the access_token directly (no server).
    // See: https://developers.google.com/identity/oauth2/web/guides/use-token-model
    if (!window.google || !window.google.accounts.oauth2) {
      setError("Google Identity Services failed to initialize.");
      return;
    }
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid https://www.googleapis.com/auth/calendar.events",
        callback: (resp) => {
          if (resp && resp.access_token) {
            const creds = {
              access_token: resp.access_token,
              expires_at: Date.now() + (resp.expires_in ? resp.expires_in * 1000 : 3540 * 1000),
              token_type: resp.token_type,
              granted_scopes: resp.scope,
            };
            setStoredAuth(creds);
            setAuth(creds);
            setError(null);
            if (typeof onLogin === "function") onLogin(creds);
          } else if (resp && resp.error) {
            setError("Google OAuth error: " + (resp.error_description || resp.error));
            // Logging error for debugging
            console.error("Google OAuth token client error response:", resp);
          } else {
            setError("Authentication failed, no access token returned.");
            // Logging error for debugging
            console.error("Empty or invalid response from Google OAuth token client:", resp);
          }
        },
        error_callback: (err) => {
          setError(err && err.error ? err.error : "Google login error");
          // Logging error for debugging
          console.error("Google OAuth error_callback:", err);
        }
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      setError("Google login failed: " + (err.message || err));
      // Logging error for debugging
      console.error("Google login exception:", err);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(null);
    setError(null);
  };

  return (
    <div
      style={{
        margin: "18px 0 26px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        maxWidth: 370,
        background: "#f9fbff",
        borderRadius: 10,
        boxShadow: "0 2.5px 8.5px #b2eaff20",
        padding: "14px 20px"
      }}
    >
      <div style={{
        fontWeight: 600,
        color: "#4285f4",
        marginBottom: 7,
        fontSize: "1.1em"
      }}>
        Google Calendar Integration
      </div>
      <div style={{ color: "#557", fontSize: 15, marginBottom: 9 }}>
        Connect your Google Calendar to save reminders to your events and enable smarter savings insights. <br />
        <b>Permission requested:</b> View and add calendar events only. No access to personal emails, contacts, or files.
      </div>
      {error && (
        <div style={{ color: "#d94343", marginBottom: 7, fontWeight: 500, fontSize: 15 }}>
          {error}
          <br />
          <small style={{ color: "#b35532" }}>
            Please check the browser console for technical logs if the issue persists.
          </small>
        </div>
      )}
      {auth && isTokenValid(auth) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{
            color: "#367ac2",
            fontWeight: 500,
            fontSize: 15
          }}>
            Calendar connected!
          </span>
          <button
            className="btn"
            style={{
              background: "#e7e5f6",
              color: "#3565a5",
              fontSize: 13,
              marginLeft: 4,
              border: "1.1px solid #b9dbfa"
            }}
            onClick={handleLogout}
            aria-label="Disconnect Google Calendar"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="btn btn-brand"
          style={{
            fontWeight: 600,
            background: "linear-gradient(92deg, #fff 80%, #b9dbfa 130%)",
            color: "#2c4a94",
          }}
          onClick={handleCredentialResponse}
          disabled={!gsiLoaded}
          aria-label="Connect with Google"
        >
          <span style={{
            verticalAlign: "middle",
            fontSize: "1.32em",
            marginRight: 7,
            filter: "drop-shadow(0 2px 8px #b9dbfa60)"
          }} role="img" aria-label="Google Calendar">📅</span>
          Connect Google Calendar
        </button>
      )}
      <div style={{ color: "#b3b3c3", marginTop: 5, fontSize: 12, fontWeight: 400 }}>
        We do <b>not</b> store your Google credentials or messages. Calendar access is used for smarter reminders only.
      </div>
    </div>
  );
}

export default GoogleLoginButton;
