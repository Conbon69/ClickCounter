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


