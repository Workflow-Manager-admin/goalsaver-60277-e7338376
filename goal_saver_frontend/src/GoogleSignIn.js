import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { getGoogleClientId } from "./env";

/**
 * GoogleSignIn
 * Modular sign-in component for Google authentication using @react-oauth/google.
 * Handles login/logout, authentication state, error state, and exposes callbacks for parent/consumer.
 * 
 * Reads the Google Client ID from environment variables using getGoogleClientId().
 * 
 * Props:
 *    onSuccess(user, token): invoked after successful login.
 *    onLogout(): invoked after logout.
 * 
 * Exposes UI for login, and after authentication, user info and a "Sign Out" button.
 */

// PUBLIC_INTERFACE
function GoogleSignIn({ onSuccess, onLogout }) {
  const [googleUser, setGoogleUser] = useState(null);       // Decoded user profile (JWT)
  const [token, setToken] = useState(null);                // Google OAuth token (credential)
  const [error, setError] = useState(null);

  // PUBLIC_INTERFACE
  function handleLoginSuccess(credentialResponse) {
    try {
      // Decode JWT credential for user info.
      const user = jwtDecode(credentialResponse.credential);
      setGoogleUser(user);
      setToken(credentialResponse.credential);
      setError(null);
      if (onSuccess) onSuccess(user, credentialResponse.credential);
    } catch (err) {
      setError("Failed to decode Google credential. Try again.");
    }
  }

  // PUBLIC_INTERFACE
  function handleLoginError() {
    setError("Google sign-in failed. Please try again.");
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    googleLogout();
    setGoogleUser(null);
    setToken(null);
    setError(null);
    if (onLogout) onLogout();
  }

  return (
    <GoogleOAuthProvider clientId={getGoogleClientId()}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "30px 0" }}>
        {!googleUser ? (
          <>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              shape="pill"
              width="270"
              size="large"
              logo_alignment="center"
            />
            {error && (
              <div style={{ color: "#b00020", marginTop: 6, fontSize: 15 }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              background: "rgba(33,150,243,0.12)",
              borderRadius: 14,
              padding: "14px 32px",
              boxShadow: "0 2px 8px 0 rgba(33,150,243,0.07)",
              textAlign: "center"
            }}>
            <img
              src={googleUser.picture}
              alt={googleUser.name}
              style={{ borderRadius: "50%", width: 54, height: 54, marginBottom: 8, boxShadow: "0 2px 8px 0 #ccc" }}
            />
            <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: 2 }}>
              Signed in as <span style={{ color: "#2196F3" }}>{googleUser.name}</span>
            </div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 10 }}>
              {googleUser.email}
            </div>
            <button
              className="btn"
              style={{
                background: "#fff",
                color: "#2196F3",
                border: "1px solid #2196F3",
                borderRadius: 6,
                padding: "7px 22px",
                fontWeight: 500,
                fontSize: 16,
                cursor: "pointer"
              }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default GoogleSignIn;
