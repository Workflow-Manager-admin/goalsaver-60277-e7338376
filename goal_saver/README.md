# Goalie - Lightweight React Template

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with Goalie brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Important Note: Babel Configuration

This project’s `package.json` includes a `babel` section with a plugin:

```json
"babel": {
"plugins": ["./.ve/babel-plugin-jsx-editor-id.js"]
}
```

This plugin enables **visual editing functionality** in supported tools.

**Warning for AI code agents and contributors:**
**DO NOT** remove or modify this section - it is ESSENTIAL for proper operation.
Removing it will break editor integration and visual editing features.

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

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --goalie-light: #00ffff;
  --goalie-dark: #000222;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Google OAuth2 Calendar Integration

### Setting up Google Authentication for Calendar Access

This app supports Google Calendar integration using OAuth 2.0 (client-side, PKCE via [Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/overview)).

**To enable OAuth login:**
1. Go to the [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a new **OAuth 2.0 Client ID** (type: "Web application").
3. Under "Authorized JavaScript origins", add your local dev server (e.g., `http://localhost:3000`).
4. Copy your new Client ID to `goal_saver/src/GoogleLoginButton.js` — set the `CLIENT_ID` at the top.
5. Save and restart the app.
6. When users click "Connect Google Calendar", they will be prompted to sign in with Google and grant the **Calendar (calendar.events) scope**. The permission prompt is clear: Goalie only requests access to add/view your calendar events (not email or files).

**Token Storage:**  
Access tokens are stored securely in `localStorage` under a Goalie-specific key, and are never sent to any third party. If the app ever needs to access Google Calendar APIs, it uses only your own local token.

**Note:**  
- You can always disconnect your Google account with the "Disconnect" button.
- If your app fails to reach the Google login dialog, check that your JS origins are properly set in Google Cloud Console.

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
