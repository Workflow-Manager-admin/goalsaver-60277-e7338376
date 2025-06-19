import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import jwt_decode from "jwt-decode";
import { getGoogleClientId } from "./env";

/**
 * GoogleSignIn component modularized for easy consumption and styling.
 * Handles Google Sign-In/Sign-Out, exposes authenticated user, token and errors.
 * Integrates with UI by displaying correct state and exposing callbacks.
 * 
 * Props:
 *   onSuccess(user, token): callback, receives user info and OAuth token on successful login
 *   onLogout(): callback, called on logout
 */
 // PUBLIC_INTERFACE
function GoogleSignIn({ onSuccess, onLogout }) {
  const [googleUser, setGoogleUser] = useState(null);   // User profile (decoded from JWT)
  const [token, setToken] = useState(null);  // Google access token
  const [error, setError] = useState(null);

  // Handler for Google login success
  function handleLoginSuccess(credentialResponse) {
    try {
      // credentialResponse contains 'credential' (JWT) and 'clientId'
      const user = jwt_decode(credentialResponse.credential);
      setGoogleUser(user);
      setToken(credentialResponse.credential);
      setError(null);
      if (onSuccess) onSuccess(user, credentialResponse.credential);
    } catch (err) {
      setError("Failed to decode Google credential. Try again.");
    }
  }

  // Handler for Google login error
  function handleLoginError() {
    setError("Google sign-in failed. Please try again.");
  }

  // Handler for log out
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
            {error && <div style={{ color: "#b00020", marginTop: 6, fontSize: 15 }}>{error}</div>}
          </>
        ) : (
          <div style={{
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
