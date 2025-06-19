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

## Important Note: Babel Configuration

This project’s `package.json` includes a `babel` section with a plugin:

```json
"babel": {
"plugins": ["./.ve/babel-plugin-jsx-editor-id.js"]
}
```

**Do NOT remove or change this. It is required for visual editing.**

## More

To learn React, check out the [React documentation](https://reactjs.org/).
