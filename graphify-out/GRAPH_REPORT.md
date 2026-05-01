# Graph Report - .  (2026-05-01)

## Corpus Check
- 38 files · ~162,388 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 118 nodes · 160 edges · 12 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_README App Overview|README App Overview]]
- [[_COMMUNITY_Streaks & Persistence Logic|Streaks & Persistence Logic]]
- [[_COMMUNITY_Timer Flow & Sensory Effects|Timer Flow & Sensory Effects]]
- [[_COMMUNITY_Settings & Profile Mutations|Settings & Profile Mutations]]
- [[_COMMUNITY_README Stats & Persistence Docs|README Stats & Persistence Docs]]
- [[_COMMUNITY_Brand Visual Identity|Brand Visual Identity]]
- [[_COMMUNITY_Session End Recording|Session End Recording]]
- [[_COMMUNITY_Graphify Tooling References|Graphify Tooling References]]
- [[_COMMUNITY_Home & Insights Screenshots|Home & Insights Screenshots]]
- [[_COMMUNITY_Insights All-Time Screenshots|Insights All-Time Screenshots]]
- [[_COMMUNITY_Profile & Settings Screenshots|Profile & Settings Screenshots]]
- [[_COMMUNITY_README Utils Reference|README Utils Reference]]

## God Nodes (most connected - your core abstractions)
1. `Just 5 App` - 11 edges
2. `getDb()` - 9 edges
3. `loadHomeStats()` - 8 edges
4. `loadStatsBundle()` - 8 edges
5. `getPrefs()` - 6 edges
6. `src/screens` - 6 edges
7. `Just-5 App Icon` - 6 edges
8. `Just-5 Visual Identity (Stacked Stones + Green Sun)` - 6 edges
9. `playChime()` - 5 edges
10. `dayDiffInDays()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `getPrefs()` --calls--> `loadUserProfile()`  [INFERRED]
  src\effects.ts → src\db\index.ts
- `finish()` --calls--> `hapticSuccess()`  [INFERRED]
  src\screens\SessionEndScreen.tsx → src\effects.ts
- `onToggleSound()` --calls--> `invalidateEffectsCache()`  [INFERRED]
  src\screens\SettingsScreen.tsx → src\effects.ts
- `onToggleHaptics()` --calls--> `invalidateEffectsCache()`  [INFERRED]
  src\screens\SettingsScreen.tsx → src\effects.ts
- `tick()` --calls--> `playChime()`  [INFERRED]
  src\screens\TimerScreen.tsx → src\effects.ts

## Hyperedges (group relationships)
- **Three Main User Flows** — readme_home_screen, readme_timer_screen, readme_session_end_screen [EXTRACTED 0.95]
- **Expo Technology Stack** — readme_expo_sdk_54, readme_expo_sqlite, readme_expo_audio, readme_expo_haptics [EXTRACTED 0.90]
- **Gamification System** — readme_streaks, readme_milestones, readme_gamification_ts [EXTRACTED 0.85]

## Communities

### Community 0 - "README App Overview"
Cohesion: 0.13
Nodes (19): App.tsx Entry, src/effects.ts (Audio/Haptics), Expo Audio, Expo Go Workflow, Expo Haptics, Expo SDK 54, 5-Minute Focus Session, Just 5 App (+11 more)

### Community 1 - "Streaks & Persistence Logic"
Cohesion: 0.22
Nodes (12): applyConversionOnSave(), applyDailyOnSave(), dayDiffInDays(), effectiveCurrentConversion(), effectiveCurrentDaily(), loadHomeStats(), loadMonthGrid(), loadStatsBundle() (+4 more)

### Community 2 - "Timer Flow & Sensory Effects"
Cohesion: 0.27
Nodes (9): onStart(), tick(), ensureAudioMode(), getChimePlayer(), getPrefs(), hapticSuccess(), hapticTap(), hapticWarning() (+1 more)

### Community 3 - "Settings & Profile Mutations"
Cohesion: 0.23
Nodes (10): getDb(), loadUserProfile(), resetAllData(), setHapticsEnabled(), setSoundEnabled(), updateDisplayName(), onSaveName(), onToggleHaptics() (+2 more)

### Community 4 - "README Stats & Persistence Docs"
Cohesion: 0.2
Nodes (11): src/components, Custom React Native Charts, src/db (SQLite Persistence), Expo SQLite, src/gamification.ts (Titles/Milestones), Home Screen, Local SQLite Persistence, Milestones and Focus Titles (+3 more)

### Community 5 - "Brand Visual Identity"
Cohesion: 0.64
Nodes (8): Just-5 Adaptive Icon (Android), Just-5 Favicon (Web), Just-5 App Icon, Tagline: '5 minutes is enough', Just-5 Visual Identity (Stacked Stones + Green Sun), Just-5 Wordmark (Black 'Just-' + Green '5'), Mindfulness / Zen Balance Concept, Just-5 Splash Icon

### Community 6 - "Session End Recording"
Cohesion: 0.5
Nodes (2): recordSession(), finish()

### Community 7 - "Graphify Tooling References"
Cohesion: 0.5
Nodes (4): GRAPH_REPORT.md Reference, Graphify CLI Commands, Graphify Project Instructions, Graphify Wiki Index

### Community 8 - "Home & Insights Screenshots"
Cohesion: 1.0
Nodes (4): Home Screen - Focus with Your Focus Stats, Home Screen - Focus with 2-day Streak Banner, Insights Screen - Today Tab (Current Momentum), Insights Screen - Consistency Tab (Calendar)

### Community 9 - "Insights All-Time Screenshots"
Cohesion: 0.83
Nodes (4): Insights Screen - All Time Personal Records & Focus Distribution, Insights Screen - All Time Summary with Peak Focus, Insights Screen - Milestones and Title (Warming Up), Insights Screen - Session Duration Histogram & Milestones

### Community 11 - "Profile & Settings Screenshots"
Cohesion: 1.0
Nodes (3): Profile Screen - User Stats Overview, Profile Screen - Milestones Section, Settings Screen - Preferences and Danger Zone

### Community 24 - "README Utils Reference"
Cohesion: 1.0
Nodes (1): src/utils

## Knowledge Gaps
- **12 isolated node(s):** `GRAPH_REPORT.md Reference`, `Graphify Wiki Index`, `Graphify CLI Commands`, `React Native`, `TypeScript` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Session End Recording`** (4 nodes): `recordSession()`, `finish()`, `tick()`, `SessionEndScreen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `README Utils Reference`** (1 nodes): `src/utils`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadUserProfile()` connect `Settings & Profile Mutations` to `Streaks & Persistence Logic`, `Timer Flow & Sensory Effects`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `getPrefs()` connect `Timer Flow & Sensory Effects` to `Settings & Profile Mutations`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Just 5 App` connect `README App Overview` to `README Stats & Persistence Docs`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `GRAPH_REPORT.md Reference`, `Graphify Wiki Index`, `Graphify CLI Commands` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `README App Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._