# Just 5

> The hardest part of a focus session is not doing it. It is starting it.

Just 5 is a focus app built around one simple commitment: start with only 5 minutes. The app lowers the barrier to getting started, tracks whether you keep going, and turns those sessions into streaks, milestones, and stats.

## What the app does

- Start a 5 minute focus session from one main button
- Run a live count-up timer during the session
- Ask whether you want to keep going after 5 minutes
- Track daily streaks and conversion streaks
- Award milestones and focus titles
- Show stats for today, consistency, and all-time progress
- Store everything locally on device with SQLite

## Current stack

- Expo SDK 54
- React Native
- TypeScript
- React Navigation
- Expo SQLite
- Expo Audio
- Expo Haptics

## Project structure

```text
.
|-- App.tsx              # App entry, navigation setup, tab/stack wiring
|-- app.json             # Expo app configuration
|-- index.ts             # Registers the root app with Expo
|-- package.json         # Scripts, dependencies, project metadata
|-- assets/              # Static app assets such as icons, splash, and audio
`-- src/
    |-- components/      # Reusable UI pieces and chart-style visual components
    |-- db/              # SQLite access, persistence, streak logic, and stats queries
    |-- navigation/      # Navigation route and param type definitions
    |-- screens/         # Full-screen app views such as Home, Timer, Stats, and Settings
    |-- utils/           # Small shared helpers like time formatting
    |-- effects.ts       # Audio and haptic feedback helpers
    |-- gamification.ts  # Focus titles and milestone definitions
    `-- theme.ts         # Shared colors, spacing, fonts, radii, and text styles
```

## How it works

The app has three main user flows:

1. Home screen: start a session and view streak and summary stats.
2. Timer screen: count up from the session start time.
3. Session end screen: stop at 5 minutes or continue and mark the session as converted.

The app stores sessions, streak state, milestones, and user preferences in a local SQLite database. Stats and profile views are derived from that stored data.

## Run with Expo Go

This is the easiest way to run the app on an iPhone or Android phone during development.

### Requirements

- Node.js 20 or newer
- npm
- Expo Go installed on your phone

Expo Go links:

- iPhone: https://apps.apple.com/app/expo-go/id982107779
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### Install and start

```bash
npm install
npm start
```

This starts the Expo development server and shows a QR code.

### Open on iPhone

1. Make sure your iPhone and computer are on the same Wi-Fi network.
2. Open the Camera app on your iPhone.
3. Scan the QR code shown by `npm start`.
4. Tap the link and open the project in Expo Go.

### Open on Android

1. Make sure your Android phone and computer are on the same Wi-Fi network.
2. Open the Expo Go app.
3. Scan the QR code shown by `npm start`.
4. The project should open in Expo Go.

### Useful commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```

Notes:

- `npm start` is the normal command for Expo Go.
- `npm run ios` opens the iOS target through Expo tooling. On a physical iPhone you will still typically use Expo Go plus the QR code.
- `npm run android` is useful if you have an Android emulator or want Expo to target Android tooling directly.
- `npm run web` opens the app in a browser.

## Important Expo Go limitation

When you run the app through Expo Go, your computer must keep the Expo server running. If `npm start` stops, the live development session stops too.

That is good for development, but it is not the same as a standalone installed app.

## Features in the current app

### Home

- Start button for the 5 minute session
- Current streak summary
- Toast for unlocked milestones
- High-level focus summary tiles

### Timer

- Count-up timer
- Five minute threshold handling
- Sound and haptic feedback
- Cancel flow for short sessions

### Session end

- Stop at 5 minutes
- Keep going past 5 minutes
- Save converted vs non-converted sessions

### Stats

- Today summary
- Last 7 days contribution graph
- Monthly consistency grid
- Hour-of-day focus distribution
- Session length histogram
- Personal records and milestones

### Profile and settings

- Display name
- Focus title
- Sound toggle
- Haptics toggle
- Reset app data

## Local data

The app stores its data on device with SQLite. That includes:

- Sessions
- Streak state
- Milestones
- Profile and preferences

Nothing in the current app is backed by a remote server.

## Development notes

- The timer is based on timestamps, not a long-running background task.
- Charts are custom React Native components, not a charting library.
- The app uses local-only persistence.

## License

MIT
