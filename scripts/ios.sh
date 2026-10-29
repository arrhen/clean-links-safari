#!/usr/bin/env bash
# Build Clean Links for iPhone and iPad.
#
#   BUNDLE_ID=com.yourname.cleanlinks ./scripts/ios.sh simulator
#       Unsigned build, installed and launched on a booted iOS Simulator.
#   BUNDLE_ID=com.yourname.cleanlinks ./scripts/ios.sh project
#       Generates the Xcode project and opens it. Choose your team under
#       Signing & Capabilities for both targets, then Product > Archive
#       to upload to TestFlight or the App Store.
#
# BUNDLE_ID: a unique reverse-DNS id of your choosing. The extension becomes
#            "$BUNDLE_ID.Extension".
# SIM_DEVICE: simulator name or UDID (default: any booted one).
set -euo pipefail

MODE="${1:-simulator}"
: "${BUNDLE_ID:?Set BUNDLE_ID, e.g. com.yourname.cleanlinks}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/build/ios"
APP_NAME="Clean Links"
VERSION="$(node -p "require('$ROOT/package.json').version")"

node "$ROOT/scripts/build.js" safari
rm -rf "$WORK"

xcrun safari-web-extension-converter "$ROOT/dist/safari" \
  --project-location "$WORK" --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" --ios-only --copy-resources \
  --no-open --no-prompt

PROJ="$WORK/$APP_NAME/$APP_NAME.xcodeproj"
PBX="$PROJ/project.pbxproj"
APP_DIR="$WORK/$APP_NAME/$APP_NAME"

# The converter derives the container app's id from your account name; make it
# a prefix of the extension's id, which Xcode requires.
sed -i '' -E "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*Clean-Links\"/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID/" "$PBX"

# Our screen, icon and App Store settings.
cp "$ROOT/app-ios/ViewController.swift" "$APP_DIR/ViewController.swift"
cp -R "$ROOT/app-ios/Resources/." "$APP_DIR/Resources/"
cp "$ROOT/app-ios/AppIcon/"*.png "$APP_DIR/Assets.xcassets/AppIcon.appiconset/"
find "$WORK" -name '*.swift' -exec sed -i '' -E 's#^//  Created by .*#//  Clean Links#' {} +
sed -i '' -E -e 's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = 18.0;/' \
  -e "s/MARKETING_VERSION = [0-9.]+;/MARKETING_VERSION = $VERSION;/" \
  -e "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER:-1};/" "$PBX"
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$APP_DIR/Info.plist"

case "$MODE" in
  simulator)
    DERIVED="$WORK/derived"
    xcodebuild -project "$PROJ" -scheme "$APP_NAME" -configuration Debug \
      -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
      -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO build
    APP="$DERIVED/Build/Products/Debug-iphonesimulator/$APP_NAME.app"
    DEVICE="${SIM_DEVICE:-booted}"
    xcrun simctl install "$DEVICE" "$APP"
    xcrun simctl launch "$DEVICE" "$BUNDLE_ID"
    ;;
  project)
    open "$PROJ"
    echo "Opened. Pick your team for both targets, then Product > Archive."
    ;;
  *) echo "Unknown mode: $MODE (use simulator or project)" >&2; exit 1 ;;
esac
