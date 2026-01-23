# Entmoot Mobile Build Guide

This guide covers building and deploying the Entmoot iOS app using Expo Application Services (EAS).

## Prerequisites

1. **Node.js 20+** - Required for Expo SDK 54+
2. **Expo CLI** - `npm install -g expo-cli`
3. **EAS CLI** - `npm install -g eas-cli`
4. **Apple Developer Account** - Required for iOS builds and App Store submission

## EAS Setup

### 1. Login to EAS

```bash
eas login
```

### 2. Link Project (First Time Only)

```bash
eas init
```

This will:
- Create/link an EAS project
- Update `app.json` with the EAS project ID
- Generate a unique project identifier

### 3. Configure Apple Credentials

EAS can manage your Apple credentials automatically. When you run your first build, it will prompt you to:
- Sign in with your Apple ID
- Select or create an App Store Connect API key
- Generate provisioning profiles and certificates

## Build Profiles

The `eas.json` file defines three build profiles:

### Development

For local development with the Expo dev client:

```bash
eas build --platform ios --profile development
```

- Uses development client (hot reloading, debugging)
- Distributed internally (not App Store)
- Points to localhost API

### Preview

For TestFlight distribution:

```bash
eas build --platform ios --profile preview
```

- Full production build
- Distributed internally via TestFlight
- Points to staging API
- Uses `preview` update channel

### Production

For App Store submission:

```bash
eas build --platform ios --profile production
```

- Full production build
- Distributed via App Store
- Points to production API
- Auto-increments build number
- Uses `production` update channel

## iOS Provisioning Setup

### Option 1: Let EAS Manage (Recommended)

EAS Build can automatically manage your iOS credentials. On first build:

1. Run: `eas build --platform ios --profile preview`
2. Select "Let EAS handle it" when prompted
3. Sign in with your Apple Developer account
4. EAS will create:
   - Distribution certificate
   - App-specific provisioning profile
   - Push notification key (if needed)

### Option 2: Use Existing Credentials

If you have existing certificates/profiles:

1. Create an App Store Connect API key:
   - Go to [App Store Connect > Users and Access > Keys](https://appstoreconnect.apple.com/access/api)
   - Create a new key with "Admin" access
   - Download the `.p8` file

2. Configure credentials in EAS:
   ```bash
   eas credentials
   ```

3. Or set them via environment variables:
   ```bash
   export EXPO_APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
   ```

### Required Apple Developer Setup

1. **Apple Developer Program**: Enroll at [developer.apple.com](https://developer.apple.com)

2. **Bundle Identifier**: Register `com.entmoot.mobile` in your Apple Developer account:
   - Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
   - Add new identifier > App IDs > App
   - Enter: `com.entmoot.mobile`
   - Enable capabilities: Push Notifications

3. **App Store Connect**: Create the app listing:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps > + > New App
   - Platform: iOS
   - Name: Entmoot
   - Bundle ID: com.entmoot.mobile
   - SKU: com.entmoot.mobile (or your preferred SKU)

## Running Builds

### Local Build (Development)

Start the Expo development server:

```bash
npx expo start
```

### Cloud Build (Preview/Production)

```bash
# Preview build for TestFlight
eas build --platform ios --profile preview

# Production build for App Store
eas build --platform ios --profile production
```

### Dry Run (Validate Configuration)

Verify your configuration without actually building:

```bash
eas build --platform ios --profile preview --dry-run
```

## Submitting to App Store

### 1. Build for Production

```bash
eas build --platform ios --profile production
```

### 2. Submit to App Store Connect

```bash
eas submit --platform ios --latest
```

Or submit a specific build:

```bash
eas submit --platform ios --id BUILD_ID
```

### 3. Configure Submit Settings

Update `eas.json` submit section with your credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

To find these values:
- **appleId**: Your Apple ID email
- **ascAppId**: App Store Connect > My Apps > App Information > Apple ID
- **appleTeamId**: Apple Developer account > Membership > Team ID

## Over-the-Air Updates

Entmoot uses EAS Update for OTA JavaScript bundle updates.

### Configure Update Channels

Channels are configured in `eas.json`:
- `preview` - TestFlight/internal builds
- `production` - App Store builds

### Publishing Updates

```bash
# Update preview builds
eas update --branch preview --message "Bug fix"

# Update production builds
eas update --branch production --message "Bug fix"
```

### Checking Update Status

```bash
eas update:list
```

## Environment Variables

Build-specific environment variables are set in `eas.json` under each profile's `env` section:

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `API_URL` | `http://localhost:3000` | `https://staging-api.entmoot.app` | `https://api.entmoot.app` |

For secrets (API keys, etc.), use EAS Secrets:

```bash
# Set a secret
eas secret:create --name MY_SECRET --value "secret-value"

# List secrets
eas secret:list
```

## Troubleshooting

### Build Fails with Credential Error

```bash
# Reset credentials
eas credentials --platform ios

# Clear credential cache
rm -rf ~/.eas/credentials
```

### Bundle Identifier Mismatch

Ensure `ios.bundleIdentifier` in `app.json` matches your Apple Developer registration.

### Push Notification Issues

1. Verify Push Notifications capability is enabled in Apple Developer portal
2. Check that `expo-notifications` plugin is configured in `app.json`
3. Ensure APNS key is properly configured in EAS credentials

### Build Times Out

For large builds, use a more powerful machine:

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-large"
      }
    }
  }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci
        working-directory: ./mobile

      - name: Build
        run: eas build --platform ios --profile preview --non-interactive
        working-directory: ./mobile
```

### Required Secrets

Set these in your CI environment:
- `EXPO_TOKEN`: Get from https://expo.dev/settings/access-tokens

## Useful Commands

```bash
# View build status
eas build:list

# View build logs
eas build:view BUILD_ID

# Cancel a build
eas build:cancel BUILD_ID

# Check credentials
eas credentials --platform ios

# Update EAS CLI
npm install -g eas-cli@latest
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
