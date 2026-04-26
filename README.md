# Just 5 — The Commitment Trick App

> The hardest part of a focus session isn't doing it. It's starting it.

**Just 5** is a focus app built around a single psychological hack: commit to *just* 5 minutes. Once you start, continuing is easy. The app makes starting frictionless and rewards you whether you stop at 5 minutes or keep going.

---

## Vision

Most focus apps are heavy. They ask you to plan, set goals, pick a category, choose a duration, and *then* start. By the time you're set up, the resistance has won.

Just 5 inverts that. One button. One commitment. Five minutes. If you keep going, great. If you stop at 5, you still won — because you started, and the streak counts the *start*, not the duration.

The bar is intentionally low. The goal is to build the habit of starting, not the habit of doing four-hour sessions.

---

## Core Flow

The MVP is three screens:

1. **Home** — one giant `Start 5 Minutes` button. Current streak shown above it.
2. **Live timer** — counts **up** from 0:00 (counting up feels less pressuring than counting down).
3. **Session end** — `Keep Going` vs `I'm Done` decision after the 5 minutes are up.

That's it. Everything else is layered on top.

---

## Features

### Streaks
- **Daily Commitment Streak** — tap "Start 5 Minutes" once per day to keep it alive.
- **Conversion Streak** — consecutive days where you converted a 5-minute start into a longer session.
- **Best vs Current** shown side by side (Duolingo-style).
- **Grace period** — earn 1 saved grace per 7-day streak; one missed day doesn't reset you.

### Stats
- **Today** — did you start, how long, what time of day.
- **This Week** — GitHub-style contribution graph (started / converted / skipped).
- **All Time** — total sessions, total focus time, average session length, conversion rate.
- **Best Time of Day** — bar chart of which hours you tend to start.
- **Session Length Distribution** — histogram of how your sessions cluster.

### Light Gamification
- **Focus Titles** — `Warming Up` → `In The Zone` (7-day streak) → `Flow State` (30-day streak with 70%+ conversion).
- **Milestones** — first session, first 10 sessions, first 60+ minute session, first 7-day streak.
- **Personal Records** — longest single session, longest streak, most focus time in a day.

---

## Tech Stack

- **Expo (SDK 54)** + React Native — single codebase for iOS and Android
- **TypeScript**
- **Expo SQLite** for local persistence (chosen over AsyncStorage so the stats screen can query by date range)
- **Victory Native** for the contribution graph and histograms
- Background timer handled by storing the start timestamp and computing elapsed time on resume (cleaner than running an actual background task)

---

## Roadmap

The app ships in stages. Each stage maps to a GitHub issue and ends in a tagged release.

| Version | Stage | Scope |
|---------|-------|-------|
| `v0.1.0` | **MVP** | Home + Start button, count-up timer, session-end decision, 7-day streak counter, basic stats (total sessions, total focus time), local SQLite persistence |
| `v0.2.0` | **Streaks v2** | Conversion streak, best vs current, grace period |
| `v0.3.0` | **Stats screen** | Contribution graph, best time of day, session length distribution, today/week/all-time tabs |
| `v0.4.0` | **Gamification** | Focus titles, milestones, personal records |
| `v0.5.0` | **Polish & background** | Background-resilient timer, animations, haptics, app icon, splash |
| `v1.0.0` | **Release** | Store-ready build for iOS + Android |

Roadmap is tracked as GitHub issues. See the [Issues tab](../../issues).

---

## Project Structure

```
.
├── App.tsx              # Entry point
├── app.json             # Expo config
├── assets/              # Icons, splash
├── index.ts
├── package.json
└── tsconfig.json
```

As the app grows, expect: `src/screens/`, `src/components/`, `src/db/`, `src/hooks/`, `src/state/`.

---

## Getting Started

Requirements: Node 20+, npm, the Expo Go app on your phone (or an Android/iOS simulator).

```bash
git clone https://github.com/shivamshinde123/Just-5.git
cd Just-5
npm install
npm start
```

Then scan the QR with Expo Go (Android) or the Camera app (iOS). To target a simulator directly:

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator (macOS only)
npm run web       # Web preview
```

---

## Contributing

This is a personal project, but issues and PRs are welcome. Each stage of work is tracked as a GitHub issue — pick one and go.

---

## License

MIT
