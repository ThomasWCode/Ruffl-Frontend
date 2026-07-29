# Ruffl mobile app

Ruffl is the iOS and Android application used by commissioners and makers. This repository contains only the mobile client. It connects to the separate `Ruffl-Backend` repository for accounts, maker profiles, commissions, messages, warnings, and disputes.

This guide assumes you have not used React Native, Expo, or a mobile emulator before.

## Technology in plain English

- **React Native** lets the project build Android and iOS interfaces from one codebase.
- **Expo** supplies the development server and mobile tooling around React Native.
- **Expo Go** is a phone app that can open Ruffl during early development without creating an app-store build.
- **Expo development builds** contain Ruffl's own native libraries, including Sentry, and are the recommended production-like test path.
- **Expo Router** turns files under `app/` into screens and navigation routes.
- **TypeScript** is JavaScript with additional checks that catch many mistakes before the app runs.
- **npm** downloads the libraries listed in `package.json` and runs the commands under `scripts`.
- **Environment variables** are local settings, such as the backend address, which should not be hard-coded into the application.

## Repository structure

```text
Ruffl-Frontend/
|-- app/                 Screens and navigation routes
|-- src/api/             Backend request client
|-- src/components/      Shared interface components
|-- src/context/         Login session and live account-status checks
|-- src/lib/             Calculations and display helpers
|-- src/theme.ts         Colours and shared visual values
|-- test/                Automated tests
|-- app.json             Expo application configuration
|-- eas.json             Development, preview, and production cloud-build profiles
|-- .env.example         Example local settings
`-- package.json         Libraries and development commands
```

## Before the first run

Install the following:

1. **Node.js 22 LTS** from [nodejs.org](https://nodejs.org/). npm is installed with Node.js.
2. **Expo Go** from the iOS App Store or Google Play if you want to test on a physical phone.
3. A code editor such as [Visual Studio Code](https://code.visualstudio.com/).
4. The `Ruffl-Backend` repository beside this repository.

After installing Node.js, open PowerShell and confirm it works:

```powershell
node --version
npm --version
```

If either command is not recognised, close and reopen PowerShell. If it still fails, reinstall Node.js and allow its installer to add Node to `PATH`.

## First-time setup

Open PowerShell and move into this repository:

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Frontend
```

Install the packages:

```powershell
npm install
```

`npm install` reads `package.json`, downloads the required libraries into `node_modules`, and creates or updates `package-lock.json`. Run it again whenever `package.json` changes or after pulling dependency changes from Git.

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

The `.env` file is ignored by Git. Do not commit it.

## Configure the backend address

Open `.env` and set `EXPO_PUBLIC_API_URL`.

The complete local file is:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENVIRONMENT=development
```

`EXPO_PUBLIC_*` values are compiled into the app and are not secret. Never put a Sentry auth token, database password, R2 secret, JWT secret, or Expo access token in them.

### Physical phone

`localhost` on a phone means the phone itself, not the development computer. Use the computer's local network address instead.

1. In PowerShell, run:

   ```powershell
   ipconfig
   ```

2. Find the active Wi-Fi or Ethernet adapter.
3. Find its **IPv4 Address**, for example `192.168.1.238`.
4. Set `.env` to:

   ```dotenv
   EXPO_PUBLIC_API_URL=http://192.168.1.238:3000
   ```

5. Make sure the computer and phone are connected to the same home or office network.

### Android Emulator

The standard Android Emulator reaches the Windows host through `10.0.2.2`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### iOS Simulator

The iOS Simulator normally reaches the host through `localhost`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

The iOS Simulator requires macOS and Xcode. It cannot run natively on Windows.

## Start Ruffl for the first time

Ruffl needs two terminals: one for the backend and one for the mobile app.

### Terminal 1: start the backend

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Backend
npm run dev
```

Leave this terminal open. The backend should report that it is listening on port `3000`.

### Terminal 2: start Expo

```powershell
cd C:\Users\thoma\Documents\Ruffl\Ruffl-Frontend
npm start
```

Leave this terminal open too. Expo prints a QR code.

### Open the app on a phone

1. Open Expo Go.
2. Scan the QR code from the Expo terminal.
3. Wait for the JavaScript bundle to finish loading.
4. On the Ruffl sign-in screen, choose a demo role.

Demo accounts:

| Role | Email | Password |
|---|---|---|
| Commissioner | `commissioner@demo.ruffl` | `RufflDemo1!` |
| Maker | `maker@demo.ruffl` | `RufflDemo1!` |

The buttons on the login screen enter these values automatically.

## What normal development looks like

1. Start the backend with `npm run dev`.
2. Start Expo with `npm start`.
3. Edit files in `app/` or `src/`.
4. Save the file.
5. Expo normally refreshes the app automatically.
6. Watch both terminals for errors.
7. Run the validation commands before committing.

Useful Expo terminal keys include:

- Press `r` to reload the app.
- Press `a` to open Android when an emulator is installed.
- Press `w` to open the browser version.
- Press `Ctrl+C` to stop Expo.

If `.env` changes, stop Expo with `Ctrl+C` and start it again. A normal hot reload may not reload environment variables.

## Available npm commands

| Command | Purpose |
|---|---|
| `npm start` | Starts the Expo development server and prints a QR code |
| `npm run android` | Starts Expo and attempts to open an Android emulator/device |
| `npm run ios` | Starts Expo and attempts to open the iOS Simulator |
| `npm run web` | Runs the web-compatible version for quick layout checks |
| `npm run export:web` | Creates a production static web bundle in `dist` |
| `npm run typecheck` | Checks TypeScript without creating a build |
| `npm run lint` | Checks code style and common programming mistakes |
| `npm test` | Runs the automated tests once |
| `npm run test:watch` | Keeps tests running and reruns them after changes |

## Automated validation

Run these before committing:

```powershell
npm run typecheck
npm run lint
npm test
npm run export:web
```

The mobile tests cover calculations, progress display, API errors, rate-limit messages, and account restriction propagation. Backend permissions and commission lifecycle tests live in `Ruffl-Backend`.

## Live warnings, suspension, and deletion

- The app checks the current account with the backend every three seconds.
- It checks again whenever the app returns from the background.
- A warning appears as a global dialog, regardless of the current screen.
- Selecting **I understand** marks the warning as read on the backend.
- Suspension, soft deletion, and permanent deletion clear the local authenticated session and force the dedicated account-status screen.
- The backend also rejects every authenticated action immediately, so the three-second client check is not the security boundary.

The interface update is not literally instantaneous. Its normal maximum delay is approximately three seconds. True real-time delivery would require WebSockets or push-notification handling.

## Product flows currently available

- Commissioner and maker signup/login
- Role-aware home summaries
- Maker search, profiles, pricing, queue state, reviews, and waitlists
- Structured commission requests
- Price negotiation
- Simulated deposits and milestone releases
- Ordered progress updates and approvals
- Shipping and receipt confirmation
- Reviews and dispute entry points
- Commission, direct, dispute, and support conversation types
- Direct “message maker” and “contact Ruffl support” actions with polling conversation screens
- Activity notifications that can be acknowledged as read
- Maker price and payout calculator
- Warning, suspension, and deletion handling
- Sentry JavaScript/native crash reporting when a mobile project DSN is configured

No real payment is taken. Every payment-related action is symbolic.

## Troubleshooting

### “Could not connect to Ruffl” or “Network request failed”

Check all of the following:

- The backend terminal is still running.
- The backend uses port `3000`.
- `EXPO_PUBLIC_API_URL` contains the computer's IPv4 address, not `localhost`, when using a phone.
- The phone and computer are on the same network.
- The IP address has not changed since `.env` was created.
- Windows Firewall is not blocking Node.js on private networks.
- Expo was restarted after editing `.env`.

Test the backend from the computer:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected result:

```text
status service
------ -------
ok     ruffl-api
```

### The QR code opens but Ruffl never loads

1. Stop Expo with `Ctrl+C`.
2. Restart with a cleared Metro cache:

   ```powershell
   npx expo start --clear
   ```

3. Reopen Expo Go and scan the new QR code.

### Login reports too many attempts

`POST /auth/login` allows ten attempts from one IP address within fifteen minutes. Successful and unsuccessful attempts both count. Wait for the displayed time or restart the development backend to clear its in-memory limiter.

### Account warnings or suspension do not update

- Confirm the mobile app is connected to the same backend instance as the admin dashboard.
- Check `EXPO_PUBLIC_API_URL`.
- Leave the app open for at least three seconds.
- Background and foreground the app to trigger an immediate check.
- Inspect the backend terminal for `GET /me`.

### Expo reports incompatible packages

Run:

```powershell
npx expo install --check
```

Use `npx expo install <package-name>` for Expo-native packages because Expo chooses a compatible version.

## Expo Go versus a development build

Expo Go is useful for quick JavaScript/layout checks, but it contains a fixed native runtime and only supports the current Expo Go SDK. Ruffl is currently on supported Expo SDK 54, while the newest SDK is 57. Expo recommends incremental one-version-at-a-time upgrades and development builds for production apps. SDK 54 continues receiving critical fixes until the next Expo SDK release, expected in September or October 2026.

`expo-dev-client` and `eas.json` are already installed/configured. Link the repository to your Expo account once:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` adds the real Expo project ID to app configuration. Review that change before committing it.

Create development builds:

```powershell
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

EAS requires an Expo account. Apple Developer and Google Play accounts are required for store distribution.

Create preview and production builds only after configuring EAS environment variables:

```powershell
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://backend.ruffl.thomaswhite.me
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value https://backend.ruffl.thomaswhite.me
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform all
```

Create a separate Sentry React Native project first, then add its DSN as `EXPO_PUBLIC_SENTRY_DSN` in preview/production. Configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` as protected EAS build secrets for source-map upload; those three are not `EXPO_PUBLIC_*` values.

## Security and current limitations

- Authentication tokens are stored through Expo SecureStore.
- Never place private server keys in `EXPO_PUBLIC_*` variables. Anything beginning with `EXPO_PUBLIC_` is included in the client application.
- Media selection/upload UI and Expo Push registration still require production integration. Backend R2 upload signing is implemented.
- Sentry is initialized, but the `ruffl-frontend` Sentry project/DSN and protected source-map credentials still need to be created.
- Production backend data uses PostgreSQL. Local development without `DATABASE_URL` intentionally uses memory and resets on restart.
- No payment processor is integrated.

As of 29 July 2026, npm still reports high-severity advisories in transitive Expo/React Native tooling (`brace-expansion` and `postcss`) with no compatible fix in the SDK 54 tree, plus an indirect `uuid` advisory. Do not run `npm audit fix --force` blindly because that can move native packages outside Expo's supported versions. Recheck after each Expo patch and perform the SDK 54 → 55 → 56 → 57 upgrade incrementally in a dedicated change with native development builds on both platforms.
