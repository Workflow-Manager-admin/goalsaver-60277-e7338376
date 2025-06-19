/// Helper to access environment variables in a modular way in React.

// PUBLIC_INTERFACE
/**
 * Get the Google OAuth client ID from environment variables.
 * @returns {string} Google Client ID
 */
export function getGoogleClientId() {
  return process.env.REACT_APP_GOOGLE_CLIENT_ID;
}
