# Goalie – Friendly Savings Planner App

> Previously named "GoalSaver" – now with a lively look and branding! 🎉

This project implements **Goalie**, a personal finance app to help you set goals, plan smart savings, and build good money habits in a playful, visually engaging way.

## Features

- **Goal-Based Savings Planner**: Set financial goals and plan your savings.
- **Friendly, lively UI**: Modern, fluid design with playful graphics and a goal post symbol in the branding.
- **Smart Contribution Calculator**: Get suggestions on how much to save.
- **Motivational Notifier**: Habit-building nudges, reminders, and progress celebration.
- **Multiple Goals Support**: Manage several goals, prioritize, and activate/deactivate.

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Customization

- The main look, colors, and layout can be changed in `src/App.css` and the main container component.
- The Goalie branding and design is defined in `src/GoalieMainContainer.js`.
- Google Calendar integration utility: `src/googleCalendarIntegration.js`

## Important Note: Babel Configuration

This project’s `package.json` includes a `babel` section with a plugin:

```json
"babel": {
"plugins": ["./.ve/babel-plugin-jsx-editor-id.js"]
}
```

**Do NOT remove or change this. It is required for visual editing.**

---

## 🗓 Google Calendar Sync Integration

You can now sync your Goalie savings reminders to your personal Google Calendar!

### Features

- **Connect your Google account** via OAuth (secure, in-browser flow).
- **Pick or create a calendar** where Goalie will push your goal reminders.
- **Reminders are pushed as calendar events**: When you create or change a goal/deadline, corresponding events update in Google Calendar.
- **Disconnect and manage calendars** safely.

### Setup Instructions

1. **Create a Google OAuth Client ID:**
   - Go to [Google Cloud Console API Credentials](https://console.cloud.google.com/apis/credentials).
   - Create a new OAuth 2.0 Client ID for a "Web application".
   - *Add `http://localhost:3000` and (for production) your domain as an Authorized origin.*

2. **Paste your Client ID into Goalie**:
   - Click "Google Setup" in the app's Calendar section.
   - Enter your OAuth Client ID (looks like `xxxx.apps.googleusercontent.com`).
   - *No secrets or server-side logic is used; this is 100% client-side and safe for demo/dev.*

3. **Sign in with Google**:
   - Click "Connect Google Calendar" and complete the OAuth popup.

4. **Pick or create the target calendar**:
   - Use "Choose Calendar" or "Create New Calendar" to manage where reminders sync.

**Security Note:** Your access token is stored in your browser (localStorage), not on any server. Remove your client ID at any time in settings.

### Event Mapping

- Each savings goal syncs as a calendar event at the goal's deadline date (default, 8am).
- If you delete a goal, its event is removed from your chosen calendar.

---


## More

To learn React, check out the [React documentation](https://reactjs.org/).
