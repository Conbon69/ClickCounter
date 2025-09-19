## Local Run Instructions

1) Start the Expo Metro bundler

```bash
cd counter-app && yarn install && yarn start
```

2) Open the app in Expo Go (on a device) or a simulator/emulator.

3) The local SQLite database seeds itself on first launch.

4) Tap the "Increment" button to verify today's count increases.

5) Check the displayed analytics list (last 7 days) updates accordingly.

6) Leave the app running past midnight (or simulate a date change) to verify `resetCountsAtMidnight` seeds a new day starting at 0.

### Run Tests

```bash
yarn test
```

Expected green output includes:

```
Test Suites: 1 passed, 1 total
```

## Acceptance Checklist

- App launches without errors
- Tapping the button increases today’s count
- Counts reset at midnight
- Analytics list shows correct historical data
- All tests pass with green output

## Deploy to Render (Static Site for Web Preview)

Note: This project targets mobile (Expo Go / native). The SQLite storage is designed for iOS/Android and may not function on the web build. Use Render to host a web preview only. Connect your GitHub repo first (e.g., `Conbon69/ClickCounter`).

1) Push code to GitHub

   - Repository: [`Conbon69/ClickCounter`](https://github.com/Conbon69/ClickCounter)

2) On Render, create a new Static Site

   - Connect your GitHub account and select the repo above.
   - Root Directory: `counter-app`
   - Build Command:
     ```bash
     npm ci && npx expo export --platform web --output-dir dist
     ```
   - Publish Directory: `dist`
   - Environment (optional but recommended):
     - `NODE_VERSION` = `18`
     - `EXPO_NO_TELEMETRY` = `1`

3) Deploy

   - Render will install dependencies and produce a static web build.
   - Visit the Render URL. UI should load, but device-only features (SQLite persistence) may be limited in the web preview.

4) Recommended for Mobile

   - For full functionality (SQLite), use Expo Go or build native binaries. The Render deployment is just a convenient web preview of the UI.


