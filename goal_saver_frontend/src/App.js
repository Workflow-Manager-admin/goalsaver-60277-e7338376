import React, { useState } from "react";
import "./App.css";
import GoalSaverMainContainer from "./GoalSaverMainContainer";
import GoogleSignIn from "./GoogleSignIn";

/**
 * App entrypoint - renders the authentication UI and then the GoalSaver main container.
 * Displays the sign-in UI at the top, and passes user state to GoalSaverMainContainer in future expansion.
 */
function App() {
  // Manage the authenticated user state here for demo; could be passed to GoalSaverMainContainer if needed.
  const [googleUser, setGoogleUser] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <div className="app">
      {/* Visible Google Sign-In at the top of the app */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        background: "rgba(250,250,253,0.97)",
        zIndex: 2000,
        boxShadow: "0 3px 15px 0 rgba(33,150,243,0.06)",
        borderBottom: "1.5px solid #f6f6f6",
        padding: "15px 0 0 0"
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Logo */}
          <div className="logo" style={{fontWeight:700,fontSize:"1.3rem",letterSpacing:0.1,display:"flex",alignItems:"center",gap:8}}>
            GoalSaver <span className="logo-symbol">🐷</span>
          </div>
          {/* Google Auth UI */}
          <div>
            <GoogleSignIn
              onSuccess={(user, newToken) => { setGoogleUser(user); setToken(newToken); }}
              onLogout={() => { setGoogleUser(null); setToken(null); }}
            />
          </div>
        </div>
      </div>
      {/* Margin for fixed header */}
      <div style={{marginTop: 120}}>
        <GoalSaverMainContainer />
      </div>
    </div>
  );
}

export default App;