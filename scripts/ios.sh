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
. "$ROOT/scripts/xcproj.sh"
xc_init "$PROJ"
APP_DIR="$WORK/$APP_NAME/$APP_NAME"

# The converter derives the container app's id from your account name; make it
# a prefix of the extension's id, which Xcode requires.
xc_fix_bundle_id "$BUNDLE_ID"

# Our screen, icon and App Store settings.
cp "$ROOT/app-ios/ViewController.swift" "$APP_DIR/ViewController.swift"
cp -R "$ROOT/app-ios/Resources/." "$APP_DIR/Resources/"
cp "$ROOT/app-ios/AppIcon/"*.png "$APP_DIR/Assets.xcassets/AppIcon.appiconset/"
find "$WORK" -name '*.swift' -exec sed -i '' -E 's#^//  Created by .*#//  Clean Links#' {} +
xc_set IPHONEOS_DEPLOYMENT_TARGET 18.0
xc_set MARKETING_VERSION "$VERSION"
xc_set CURRENT_PROJECT_VERSION "${BUILD_NUMBER:-1}"
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
  archive)
    : "${TEAM_ID:?Set TEAM_ID to your Apple Developer Team ID}"
    OUT="$ROOT/dist/appstore-ios"
    rm -rf "$OUT"; mkdir -p "$OUT"
    xcodebuild -project "$PROJ" -scheme "$APP_NAME" -configuration Release \
      -destination 'generic/platform=iOS' -archivePath "$OUT/$APP_NAME.xcarchive" \
      -allowProvisioningUpdates DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic \
      CODE_SIGNING_ALLOWED=NO archive
    cat > "$OUT/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>teamID</key><string>$TEAM_ID</string>
<key>signingStyle</key><string>automatic</string>
</dict></plist>
PLIST
    xcodebuild -exportArchive -archivePath "$OUT/$APP_NAME.xcarchive" \
      -exportOptionsPlist "$OUT/ExportOptions.plist" -exportPath "$OUT/export" -allowProvisioningUpdates
    echo "Archive and export are in $OUT"
    ;;
  *) echo "Unknown mode: $MODE (use simulator, project or archive)" >&2; exit 1 ;;
esac
