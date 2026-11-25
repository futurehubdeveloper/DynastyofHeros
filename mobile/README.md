# Dynasty of Heroes: Tactics

The Android app opens The First Escape in a Flutter WebView. It uses a bundled copy of the repository’s playable demo and can run offline.

From the repository root, run `./mobile/build-apk.ps1` with Flutter, the Android SDK, and JDK 21 installed. The script syncs `play-demo.html`, runs Flutter analysis, and writes `Dynasty-of-Heroes.apk` in the repository root.

The APK uses Flutter’s default Android debug signing configuration for direct installation. Google Play distribution requires a separate upload-signing configuration and an Android App Bundle.
