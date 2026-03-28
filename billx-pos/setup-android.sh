#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# billX Android APK — Fully Automated Build Script
# Run this ONCE after installing Android Studio + JDK 17
# ─────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[billX]${NC} $1"; }
warn()  { echo -e "${YELLOW}[billX]${NC} $1"; }
error() { echo -e "${RED}[billX] ERROR:${NC} $1"; exit 1; }

# ── 1. Preflight checks ──────────────────────────────────────────

info "Checking prerequisites..."

command -v java  >/dev/null 2>&1 || error "Java not found. Install JDK 17: brew install openjdk@17"
command -v node  >/dev/null 2>&1 || error "Node.js not found."
command -v npx   >/dev/null 2>&1 || error "npx not found."

JAVA_VER=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
if [ "$JAVA_VER" -lt 17 ] 2>/dev/null; then
  error "Java 17+ required. Found Java $JAVA_VER. Run: brew install openjdk@17"
fi

if [ -z "$ANDROID_HOME" ]; then
  # Try common locations
  if [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"
  else
    error "ANDROID_HOME not set. Open Android Studio once and install Android SDK 34."
  fi
fi

info "Java: OK | ANDROID_HOME: $ANDROID_HOME"

# ── 2. Get local IP for backend API ─────────────────────────────

LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
if [ -z "$LOCAL_IP" ]; then
  warn "Could not detect local IP. You'll need to update .env.local manually."
  LOCAL_IP="YOUR_MAC_IP"
fi
info "Detected local IP: $LOCAL_IP"

# Update .env.local to point to real IP (Android can't reach 'localhost')
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://${LOCAL_IP}:4000
NEXT_PUBLIC_BUSINESS_ID=biz-cup-culture-001
EOF
info ".env.local updated with IP: $LOCAL_IP"

# ── 3. Build Next.js static export ──────────────────────────────

info "Building Next.js static export..."
npm run build
info "Next.js build complete — out/ ready"

# ── 4. Add Android platform (skip if already exists) ────────────

if [ ! -d "android" ]; then
  info "Adding Android platform..."
  npx cap add android
else
  info "Android platform already exists — skipping cap add"
fi

# ── 5. Copy Kotlin printer plugin ───────────────────────────────

PLUGIN_SRC="android-plugin/src/main/java/com/zoltrok/billx/printer/BillxPrinterPlugin.kt"
PLUGIN_DST="android/app/src/main/java/com/zoltrok/billx/printer"

mkdir -p "$PLUGIN_DST"
cp "$PLUGIN_SRC" "$PLUGIN_DST/"
info "Printer plugin copied"

# ── 6. Patch MainActivity.kt ────────────────────────────────────

MAIN_ACTIVITY="android/app/src/main/java/com/zoltrok/billx/pos/MainActivity.kt"
cat > "$MAIN_ACTIVITY" <<'EOF'
package com.zoltrok.billx.pos

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.zoltrok.billx.printer.BillxPrinterPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(BillxPrinterPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
EOF
info "MainActivity.kt patched with plugin registration"

# ── 7. Patch AndroidManifest.xml ────────────────────────────────

MANIFEST="android/app/src/main/AndroidManifest.xml"

PERMISSIONS='    <!-- Bluetooth (Android 11 and below) -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30"/>
    <!-- Bluetooth (Android 12+) -->
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <!-- USB -->
    <uses-feature android:name="android.hardware.usb.host" android:required="false"/>
    <uses-feature android:name="android.hardware.bluetooth" android:required="false"/>'

# Only add if not already present
if ! grep -q "BLUETOOTH_CONNECT" "$MANIFEST"; then
  # Insert permissions before <application
  # Using python3 for reliable XML manipulation
  python3 - "$MANIFEST" "$PERMISSIONS" <<'PYEOF'
import sys, re

manifest_path = sys.argv[1]
permissions = sys.argv[2]

with open(manifest_path, 'r') as f:
    content = f.read()

# Insert before <application
content = content.replace('<application', permissions + '\n\n    <application', 1)

# Add cleartext traffic to application tag
content = re.sub(
    r'(<application\b[^>]*?)(>)',
    lambda m: m.group(1) + '\n        android:usesCleartextTraffic="true"' + m.group(2) if 'usesCleartextTraffic' not in m.group(0) else m.group(0),
    content,
    count=1,
    flags=re.DOTALL
)

with open(manifest_path, 'w') as f:
    f.write(content)

print("AndroidManifest.xml patched")
PYEOF
  info "AndroidManifest.xml patched with permissions"
else
  info "AndroidManifest.xml already patched — skipping"
fi

# ── 8. Sync Capacitor ────────────────────────────────────────────

info "Syncing Capacitor..."
npx cap sync android
info "Capacitor sync complete"

# ── 9. Build debug APK via Gradle ───────────────────────────────

info "Building debug APK (this takes 2-4 minutes)..."
cd android
chmod +x gradlew
./gradlew assembleDebug 2>&1 | tail -20
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  info "✅ APK built: $APK_PATH"
  cp "$APK_PATH" ./billx-debug.apk
  info "✅ Copied to: $(pwd)/billx-debug.apk"
else
  error "APK not found at expected path. Check Gradle errors above."
fi

# ── 10. Install on connected tablet (if ADB device found) ───────

ADB="$ANDROID_HOME/platform-tools/adb"
if [ -f "$ADB" ]; then
  DEVICES=$("$ADB" devices | grep -v "List of" | grep "device$" | wc -l | tr -d ' ')
  if [ "$DEVICES" -gt 0 ]; then
    info "Android device detected — installing APK..."
    "$ADB" install -r ./billx-debug.apk
    info "✅ billX installed on device!"
    info "Starting app..."
    "$ADB" shell am start -n com.zoltrok.billx.pos/.MainActivity
  else
    warn "No device connected via USB. Transfer billx-debug.apk to your tablet manually."
  fi
else
  warn "ADB not found. Transfer billx-debug.apk to your tablet manually."
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  billX APK build complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "  APK: $(pwd)/billx-debug.apk"
echo -e "  Backend must be running on this Mac:"
echo -e "  ${YELLOW}cd backend && npm run dev${NC}"
echo -e "  Tablet must be on the same WiFi network."
echo -e "${GREEN}════════════════════════════════════════${NC}"
