# Mobile Build Guide for Sports Stack

This guide covers building and deploying the Sports Stack mobile app for iOS and Android.

## Prerequisites

### For iOS Development
- macOS with Xcode 15 or later
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods installed: `sudo gem install cocoapods`

### For Android Development
- Android Studio (latest stable version)
- JDK 17 or later
- Google Play Developer Account ($25 one-time fee)

## Environment Configurations

The project includes three Capacitor configurations:

| Environment | Config File | App ID | Use Case |
|-------------|-------------|--------|----------|
| Development | `capacitor.config.dev.ts` | `app.lovable.sportsstack.dev` | Hot reload from Lovable preview |
| Staging | `capacitor.config.staging.ts` | `app.lovable.sportsstack.staging` | Testing with built assets |
| Production | `capacitor.config.prod.ts` | `app.lovable.sportsstack` | App Store/Play Store release |

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd sports-stack

# Install dependencies
npm install

# Add native platforms
npx cap add ios
npx cap add android
```

### 2. Development Mode (Hot Reload)

For development with hot reload from the Lovable preview:

```bash
# Use development config
cp capacitor.config.dev.ts capacitor.config.ts

# Sync native projects
npx cap sync

# Run on device/simulator
npx cap run ios       # For iOS
npx cap run android   # For Android
```

### 3. Staging/Production Builds

For testing or releasing built assets:

```bash
# Build the web app
npm run build

# Use staging or production config
cp capacitor.config.staging.ts capacitor.config.ts  # For staging
# OR
cp capacitor.config.prod.ts capacitor.config.ts     # For production

# Sync to native projects
npx cap sync

# Open in native IDE for building
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

## iOS Specific Instructions

### Setting Up Signing

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the "App" target
3. Go to "Signing & Capabilities" tab
4. Select your Team
5. Xcode will automatically create provisioning profiles

### Building for App Store

1. In Xcode, select "Any iOS Device (arm64)" as the destination
2. Go to Product > Archive
3. Once complete, the Organizer window opens
4. Click "Distribute App"
5. Choose "App Store Connect" for production releases

### App Store Requirements

- App icons: Provide all required sizes in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Launch screen: Configure in `ios/App/App/Base.lproj/LaunchScreen.storyboard`
- Privacy descriptions in `Info.plist`:
  - `NSCameraUsageDescription` - For QR code scanning
  - `NSPhotoLibraryUsageDescription` - For profile photos
  - `NSLocationWhenInUseUsageDescription` - For attendance check-in

## Android Specific Instructions

### Setting Up Signing

1. Generate a keystore:
```bash
keytool -genkey -v -keystore sports-stack-release.keystore \
  -alias sports-stack -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/key.properties`:
```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=sports-stack
storeFile=../sports-stack-release.keystore
```

3. The `android/app/build.gradle` should reference this for release builds.

### Building for Play Store

```bash
# Generate release AAB (Android App Bundle)
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Play Store Requirements

- Feature graphic: 1024x500 PNG
- Screenshots: At least 2 screenshots per device type
- Privacy policy URL
- App icon: 512x512 PNG

## Native Plugins Included

| Plugin | Purpose |
|--------|---------|
| `@capacitor/push-notifications` | Push notification support |
| `@capacitor/haptics` | Haptic feedback |
| `@capacitor/splash-screen` | Splash screen management |
| `@capacitor/status-bar` | Status bar styling |
| `@capacitor/keyboard` | Keyboard handling |
| `@capacitor/app` | App lifecycle events |

## Troubleshooting

### iOS Issues

**Pod install fails:**
```bash
cd ios/App
pod install --repo-update
```

**Signing issues:**
- Ensure your Apple Developer account is active
- Check that the Bundle ID matches your App ID in Apple Developer Portal

### Android Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
./gradlew build
```

**Emulator not detected:**
- Ensure Android Emulator is running from Android Studio
- Check that `adb devices` shows your device

### General Issues

**Changes not appearing:**
```bash
npm run build
npx cap sync
```

**Clean rebuild:**
```bash
rm -rf node_modules
npm install
npx cap sync
```

## App Store Submission Checklist

### iOS (App Store Connect)
- [ ] App icons in all required sizes
- [ ] Screenshots for all device sizes (iPhone, iPad)
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Build uploaded via Xcode
- [ ] App Review information

### Android (Play Console)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phone and tablet
- [ ] Short and full descriptions
- [ ] Privacy policy URL
- [ ] AAB uploaded
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [Lovable Mobile Development Guide](https://docs.lovable.dev/features/mobile)
