# Helpers for patching the Xcode project the Safari converter generates.
# Older Xcode writes project.pbxproj; Xcode 27 writes project.xcproj (JSON-like).
# Source this file, then call xc_init "$PROJ".

xc_init() {
  if [ -f "$1/project.xcproj" ]; then XC_FILE="$1/project.xcproj"; XC_NEW=1
  else XC_FILE="$1/project.pbxproj"; XC_NEW=0; fi
}

# xc_set KEY VALUE: set every build setting KEY to VALUE.
xc_set() {
  if [ "$XC_NEW" = 1 ]; then
    sed -i '' -E "s|\"$1\": \"[^\"]*\"|\"$1\": \"$2\"|" "$XC_FILE"
  else
    sed -i '' -E "s|$1 = (\"[^\"]*\"\|[^;]*);|$1 = \"$2\";|" "$XC_FILE"
  fi
}

# xc_fix_bundle_id ID: the converter derives the container app's id from your
# account name; make it a prefix of the extension's id, which Xcode requires.
xc_fix_bundle_id() {
  if [ "$XC_NEW" = 1 ]; then
    sed -i '' -E "s|\"PRODUCT_BUNDLE_IDENTIFIER\": \"[^\"]*Clean-Links\"|\"PRODUCT_BUNDLE_IDENTIFIER\": \"$1\"|" "$XC_FILE"
  else
    sed -i '' -E "s/PRODUCT_BUNDLE_IDENTIFIER = \"[^\"]*Clean-Links\"/PRODUCT_BUNDLE_IDENTIFIER = $1/" "$XC_FILE"
  fi
}
