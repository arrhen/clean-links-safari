#!/usr/bin/env bash
# Build Clean Links as a Safari extension signed with YOUR certificate and
# install it to ~/Applications.
#
#   TEAM_ID=ABCDE12345 BUNDLE_ID=com.yourname.cleanlinks ./scripts/install.sh
#
# TEAM_ID:   your Apple Developer Team ID (Xcode > Settings > Accounts; a free
#            Apple ID "Personal Team" works). Create an Apple Development
#            certificate there first (Manage Certificates > + > Apple Development).
# BUNDLE_ID: a unique reverse-DNS id of your choosing. The extension becomes
#            "$BUNDLE_ID.Extension".
set -euo pipefail

: "${TEAM_ID:?Set TEAM_ID to your Apple Developer Team ID}"
: "${BUNDLE_ID:?Set BUNDLE_ID, e.g. com.yourname.cleanlinks}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/build"
APP_NAME="Clean Links"
LSREGISTER=/System/Library/Frameworks/CoreServices.framework/Versions/Current/Frameworks/LaunchServices.framework/Versions/Current/Support/lsregister

node "$ROOT/scripts/build.js" safari
rm -rf "$WORK"

xcrun safari-web-extension-converter "$ROOT/dist/safari" \
  --project-location "$WORK" --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" --macos-only --copy-resources \
  --no-open --no-prompt

# The converter derives the container app's id from your account name; make it
# a prefix of the extension's id, which Xcode requires.
PBX="$WORK/$APP_NAME/$APP_NAME.xcodeproj/project.pbxproj"
sed -i '' -E "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*Clean-Links\"/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID/" "$PBX"

# --- Container app polish: our window, icon and App Store settings.
APP_DIR="$WORK/$APP_NAME/$APP_NAME"
VERSION="$(node -p "require('$ROOT/package.json').version")"
cp "$ROOT/app/ViewController.swift" "$APP_DIR/ViewController.swift"
cp -R "$ROOT/app/Resources/." "$APP_DIR/Resources/"
cp "$ROOT/app/AppIcon/"*.png "$APP_DIR/Assets.xcassets/AppIcon.appiconset/"
# The generator stamps your account name into file headers; neutralize it.
find "$WORK" -name '*.swift' -exec sed -i '' -E 's#^//  Created by .*#//  Clean Links#' {} +
# Roomier window than the 425x325 default.
sed -i '' -E 's#(contentRect" x="[0-9]+" y="[0-9]+" )width="425" height="325"#\1width="520" height="640"#' "$APP_DIR/Base.lproj/Main.storyboard"
sed -i '' -E -e 's/MACOSX_DEPLOYMENT_TARGET = [0-9.]+;/MACOSX_DEPLOYMENT_TARGET = 15.0;/' \
  -e "s/MARKETING_VERSION = [0-9.]+;/MARKETING_VERSION = $VERSION;/" \
  -e "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER:-1};/" \
  -e 's/INFOPLIST_KEY_NSHumanReadableCopyright = "";/INFOPLIST_KEY_NSHumanReadableCopyright = "MIT licensed. Source on GitHub.";/' "$PBX"
PLIST="$APP_DIR/Info.plist"
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :LSApplicationCategoryType string public.app-category.utilities" "$PLIST"

DERIVED="$WORK/derived"
xcodebuild -project "$WORK/$APP_NAME/$APP_NAME.xcodeproj" -scheme "$APP_NAME" \
  -configuration Release -derivedDataPath "$DERIVED" -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic \
  CODE_SIGN_IDENTITY="Apple Development" build

BUILT="$DERIVED/Build/Products/Release/$APP_NAME.app"
mkdir -p "$HOME/Applications"
osascript -e "quit app \"$APP_NAME\"" 2>/dev/null || true
rm -rf "$HOME/Applications/$APP_NAME.app"
cp -R "$BUILT" "$HOME/Applications/"

# Xcode registers its build copy with macOS; remove it so Safari lists one entry.
"$LSREGISTER" -u "$BUILT" >/dev/null 2>&1 || true
rm -rf "$WORK"

open "$HOME/Applications/$APP_NAME.app"
echo "Installed. Quit and reopen Safari, then enable it in Safari > Settings > Extensions."
