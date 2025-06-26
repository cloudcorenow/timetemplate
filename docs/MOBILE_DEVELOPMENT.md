# 📱 Mobile Development Guide

This guide will help you build and deploy native iOS and Android apps from your TimeOff Manager web application using Capacitor.

## 🚀 Quick Start

### 1. Setup Mobile Development Environment

```bash
# Run the mobile setup script
chmod +x scripts/mobile-setup.sh
./scripts/mobile-setup.sh
```

### 2. Build and Open in IDE

```bash
# For Android (requires Android Studio)
npm run mobile:android

# For iOS (requires Xcode on macOS)
npm run mobile:ios
```

## 📋 Prerequisites

### For Android Development
- **Android Studio** (latest version)
- **Android SDK** (API level 22 or higher)
- **Java Development Kit (JDK)** 8 or higher

### For iOS Development
- **macOS** (required)
- **Xcode** (latest version)
- **iOS Simulator** or physical iOS device
- **Apple Developer Account** (for device testing and App Store)

## 🛠️ Development Commands

### Building and Syncing
```bash
# Build web app and sync to mobile platforms
npm run mobile:build

# Sync changes to mobile platforms (after code changes)
npm run mobile:sync

# Copy web assets to mobile platforms
npm run mobile:copy
```

### Opening in IDEs
```bash
# Open Android project in Android Studio
npm run mobile:android

# Open iOS project in Xcode
npm run mobile:ios
```

### Running on Devices
```bash
# Run on connected Android device
npm run mobile:run:android

# Run on connected iOS device/simulator
npm run mobile:run:ios
```

## 📱 Mobile Features

### Native Capabilities
Your TimeOff Manager mobile app includes:

- ✅ **Native UI** with platform-specific styling
- ✅ **Splash Screen** with company branding
- ✅ **Status Bar** customization
- ✅ **Keyboard** handling and optimization
- ✅ **Back Button** handling (Android)
- ✅ **Safe Area** support (iOS)
- ✅ **Touch Optimizations** for mobile interaction

### Planned Features (Can be added)
- 🔔 **Push Notifications** for request updates
- 📷 **Camera Integration** for profile pictures
- 📱 **Biometric Authentication** (Face ID, Touch ID)
- 📍 **Location Services** for check-in/out
- 📊 **Offline Support** with local storage
- 🔄 **Background Sync** when connection returns

## 🎨 Mobile UI Optimizations

### Responsive Design
- **Touch-friendly buttons** (minimum 44px touch targets)
- **Optimized text sizes** (16px minimum to prevent zoom on iOS)
- **Safe area handling** for iPhone notches and home indicators
- **Platform-specific fonts** (San Francisco on iOS, Roboto on Android)

### Native Feel
- **No text selection** on non-input elements
- **Smooth scrolling** with momentum
- **Hidden scrollbars** for cleaner appearance
- **Tap highlight removal** for native feel

## 🔧 Configuration

### App Configuration
The app is configured in `capacitor.config.ts`:

```typescript
{
  appId: 'com.sapphire.timeoff',
  appName: 'TimeOff Manager',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2563eb",
      showSpinner: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#2563eb"
    }
  }
}
```

### Platform Detection
Use the `useCapacitor` hook to detect platform:

```typescript
const { isNative, isAndroid, isIOS, platform } = useCapacitor();

if (isNative) {
  // Native app specific code
}

if (isIOS) {
  // iOS specific code
}
```

## 📦 Building for Production

### Android APK/AAB
1. **Open in Android Studio**: `npm run mobile:android`
2. **Configure signing**: Generate keystore and configure in `build.gradle`
3. **Build**: Build → Generate Signed Bundle/APK
4. **Test**: Install on device or upload to Play Console

### iOS IPA
1. **Open in Xcode**: `npm run mobile:ios`
2. **Configure signing**: Set up development team and certificates
3. **Build**: Product → Archive
4. **Distribute**: Upload to App Store Connect or export for testing

## 🚀 App Store Deployment

### Google Play Store (Android)
1. **Create Play Console account**
2. **Prepare store listing** (screenshots, descriptions)
3. **Upload AAB file**
4. **Configure release** (internal testing → production)
5. **Submit for review**

### Apple App Store (iOS)
1. **Create App Store Connect account**
2. **Create app record** in App Store Connect
3. **Upload build** via Xcode or Transporter
4. **Configure app information** and screenshots
5. **Submit for review**

## 🔍 Testing

### Device Testing
```bash
# Test on connected Android device
adb devices
npm run mobile:run:android

# Test on iOS simulator
npm run mobile:run:ios
```

### Debugging
- **Chrome DevTools**: For Android debugging
- **Safari Web Inspector**: For iOS debugging
- **Native logs**: View in Android Studio/Xcode

## 🛠️ Troubleshooting

### Common Issues

**Build Failures:**
- Ensure all dependencies are installed
- Clean and rebuild: `npm run mobile:build`
- Check platform-specific requirements

**iOS Signing Issues:**
- Verify Apple Developer account
- Check certificates and provisioning profiles
- Ensure bundle ID matches App Store Connect

**Android Gradle Issues:**
- Update Android Studio and SDK
- Check `android/gradle.properties`
- Clear Gradle cache if needed

### Platform-Specific Fixes

**iOS:**
```bash
# Clean iOS build
cd ios && rm -rf build && cd ..
npm run mobile:build
```

**Android:**
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npm run mobile:build
```

## 📱 App Store Assets

### Required Screenshots
- **iPhone**: 6.7", 6.5", 5.5" displays
- **iPad**: 12.9", 11" displays
- **Android**: Phone and tablet sizes

### App Icons
- **iOS**: Various sizes from 20x20 to 1024x1024
- **Android**: Various densities (mdpi, hdpi, xhdpi, etc.)

### Store Descriptions
Prepare compelling descriptions highlighting:
- Time-off request management
- Manager approval workflows
- Team calendar integration
- Professional time tracking

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Mobile Build
on: [push]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build web app
        run: npm run build
      - name: Sync Capacitor
        run: npx cap sync
      - name: Build iOS
        run: xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release
```

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

---

**Your TimeOff Manager is now ready for mobile! 📱✨**

Start with `npm run mobile:android` or `npm run mobile:ios` to begin native development.