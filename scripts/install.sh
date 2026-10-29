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

node "$ROOT/scripts/build-rules.js"
rm -rf "$WORK"

xcrun safari-web-extension-converter "$ROOT/extension" \
  --project-location "$WORK" --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" --macos-only --copy-resources \
  --no-open --no-prompt

# The converter derives the container app's id from your account name; make it
# a prefix of the extension's id, which Xcode requires.
PBX="$WORK/$APP_NAME/$APP_NAME.xcodeproj/project.pbxproj"
sed -i '' -E "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*Clean-Links\"/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID/" "$PBX"

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
