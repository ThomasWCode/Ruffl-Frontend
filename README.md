# Ruffl mobile app

Ruffl is an Expo/React Native mobile app for iOS and Android. The codebase is TypeScript with Expo Router, which keeps navigation and business-facing screens consistent across both platforms.

## Why this stack

- One maintainable codebase for iOS and Android
- Fast physical-device testing through Expo Go during early development
- A clear path to production development builds when native notification, monitoring, and upload integrations are enabled
- Strict TypeScript plus separately testable domain helpers
- Secure device storage for the bearer token through Expo SecureStore

## Install packages

Requirements:

- Node.js 20.19 or newer; Node 22 LTS is recommended
- npm
- Expo Go on an Android or iOS phone for the quickest local test

```powershell
npm install
```

## Test the app on a physical phone

1. Start `Ruffl-Backend` with `npm run dev`.
2. Find the development computer's LAN IPv4 address with `ipconfig`.
3. Copy `.env.example` to `.env`.
4. Replace `localhost` in `EXPO_PUBLIC_API_URL` with that LAN address, for example `http://192.168.1.20:3000`.
5. Make sure the phone and computer are on the same network.
6. Start Expo:

```powershell
npm start
```

7. Scan the QR code with Expo Go.
8. Tap **Commissioner** or **Maker** on the demo sign-in panel.

For local Expo Go testing this project intentionally targets Expo SDK 54. The current Expo documentation identifies SDK 54 as the compatible physical-device path during the SDK 57 transition.

## Test with an emulator

Start the backend and Expo, then:

```powershell
npm run android
```

Android Emulator commonly reaches the host at `http://10.0.2.2:3000`; set that as `EXPO_PUBLIC_API_URL`. iOS Simulator can normally use `http://localhost:3000`:

```powershell
npm run ios
```

The iOS Simulator requires macOS/Xcode. Android Studio is required for the Android emulator.

## Automated validation

```powershell
npm run typecheck
npm run lint
npm test
```

Tests cover price/deposit/payout calculations, progress percentage, and user-facing lifecycle labels. API permission and lifecycle tests live in `Ruffl-Backend`.

## Available product flows

- Commissioner and maker signup/login with one-tap local demo accounts
- Role-aware home summaries and activity
- Maker search, queue status, pricing, profiles, reviews, and waitlist joining
- Structured commission requests and price negotiation
- Explicitly simulated deposit and milestone releases
- Ordered milestone updates and approvals
- Shipping, receipt confirmation, review, and dispute entry points
- One inbox over commission/direct/dispute/support conversation types
- Maker-local price/payout calculator
- Warning and suspension-aware session handling

## Production development builds

Expo Go is appropriate for the current integration-light development phase. Before app-store testing, install the Expo development client and create development builds:

```powershell
npx expo install expo-dev-client
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

EAS requires an Expo account. A macOS build machine is not required when using EAS cloud builds, but Apple Developer and Google Play accounts are required for store distribution.

## Known boundary

Media picking/upload UI, native Expo Push registration, and Sentry initialization need the real service credentials and production development builds. The backend already defines the relevant data and upload-slot boundaries. All money actions are deliberately labelled simulated because there is no payment processor.

As of 26 July 2026, `npm audit --omit=dev` reports high-severity advisories in transitive Expo/React Native build-tool dependencies (`brace-expansion` and `postcss`) with no compatible fix published for the SDK 54 tree. The backend and admin production dependency audits are clean. Do not run `npm audit fix --force` blindly because it can move native packages outside Expo's supported version set; reassess the advisories when moving from Expo Go to a production development build.
