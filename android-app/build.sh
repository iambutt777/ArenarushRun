#!/usr/bin/env bash
# Builds Arena-Rush.apk. Needs Node 20+ and Java 21 (GitHub Actions has them).
set -euo pipefail
cd "$(dirname "$0")"
npm install --no-audit --no-fund
node scripts/prepare.js
[ -d android ] || npx cap add android
python3 scripts/patch-android.py
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
cp app/build/outputs/apk/debug/app-debug.apk ../Arena-Rush.apk
echo "APK ready: android-app/Arena-Rush.apk"
