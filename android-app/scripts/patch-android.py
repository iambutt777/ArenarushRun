# Applies the Arena Rush settings to the generated Capacitor android project.
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
android = os.path.join(here, '..', 'android')
PKG = 'com.arenarush.game'

# 1. Manifest: portrait, keyboard resizes the screen
mf = os.path.join(android, 'app/src/main/AndroidManifest.xml')
t = open(mf, encoding='utf-8').read()
if 'screenOrientation' not in t:
    t = t.replace('<activity', '<activity\n            android:screenOrientation="portrait"\n            android:windowSoftInputMode="adjustResize"', 1)
open(mf, 'w', encoding='utf-8').write(t)

# 2. MainActivity: keep screen on, fullscreen, sound without a tap
d = os.path.join(android, 'app/src/main/java', *PKG.split('.'))
os.makedirs(d, exist_ok=True)
open(os.path.join(d, 'MainActivity.java'), 'w', encoding='utf-8').write('''package %s;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        hideBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @SuppressWarnings("deprecation")
    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
}
''' % PKG)

# 3. Version from the GitHub run number
code = os.environ.get('VERSION_CODE', '1')
bg = os.path.join(android, 'app/build.gradle')
g = open(bg, encoding='utf-8').read()
g = re.sub(r'versionCode \d+', 'versionCode ' + code, g)
g = re.sub(r'versionName "[^"]*"', 'versionName "2.1.' + code + '"', g)
open(bg, 'w', encoding='utf-8').write(g)
print('android project patched, versionCode', code)
