package com.adamk.tvassistant;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.util.Locale;

/**
 * Status screen. Setup from a PC:
 *   adb shell am start -n com.adamk.tvassistant/.MainActivity --es bridge http://PI_IP:8790 --es token TOKEN
 * Optional: --ef threshold 0.5   --ez wake true
 */
public class MainActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextView status;
    private ProgressBar meter, scoreBar;
    private Prefs prefs;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        prefs = new Prefs(this);
        applyExtras(getIntent());

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(80, 60, 80, 60);
        root.setBackgroundColor(0xFF120C24);

        TextView title = new TextView(this);
        title.setText("TV Assistant · say \"Hey Jarvis\"");
        title.setTextSize(36);
        title.setTextColor(Color.WHITE);
        root.addView(title);

        status = new TextView(this);
        status.setTextSize(20);
        status.setTextColor(0xFFDDDDFF);
        status.setPadding(0, 30, 0, 20);
        root.addView(status);

        root.addView(label("Mic level"));
        meter = bar();
        root.addView(meter);
        root.addView(label("\"Hey Jarvis\" score"));
        scoreBar = bar();
        root.addView(scoreBar);

        LinearLayout buttons = new LinearLayout(this);
        buttons.setGravity(Gravity.START);
        buttons.setPadding(0, 30, 0, 0);
        buttons.addView(button("Pair with Muse", v -> new Thread(() -> {
            Muse.init(this, t -> { });
            Muse.pair();
        }).start()));
        buttons.addView(button("Talk now", v -> startService(new Intent(this, AssistantService.class)
                .setAction(AssistantService.ACTION_TALK))));
        buttons.addView(button(prefs.wakeEnabled() ? "Wake word: on" : "Wake word: off", v -> {
            prefs.set(null, null, null, !prefs.wakeEnabled());
            ((Button) v).setText(prefs.wakeEnabled() ? "Wake word: on" : "Wake word: off");
        }));
        buttons.addView(button("Allow pop-ups", v -> {
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION));
            } catch (Exception e) {
                status.setText("This TV hides that setting. Use the adb command in the README.");
            }
        }));
        root.addView(buttons);
        setContentView(root);

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        } else {
            AssistantService.start(this);
        }
        handler.post(refresh);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        applyExtras(intent);
    }

    private void applyExtras(Intent i) {
        if (i == null || i.getExtras() == null) return;
        Float threshold = i.hasExtra("threshold") ? i.getFloatExtra("threshold", 0.5f) : null;
        Boolean wake = i.hasExtra("wake") ? i.getBooleanExtra("wake", true) : null;
        prefs.set(i.getStringExtra("bridge"), i.getStringExtra("token"), threshold, wake);
        if (i.hasExtra("gain")) prefs.setGain(i.getFloatExtra("gain", 8f));
        if (i.hasExtra("source")) prefs.setSource(i.getIntExtra("source", 6));
        if (i.getBooleanExtra("pair", false)) {
            new Thread(() -> { Muse.init(this, t -> { }); Muse.pair(); }).start();
        }
        String sdkToken = i.getStringExtra("sdk_token");
        if (sdkToken != null) {
            new Thread(() -> {
                Muse.init(this, t -> { });
                pendingNote = "SDK token: " + Muse.saveSdkToken(sdkToken);
            }).start();
        }
    }

    private volatile String pendingNote = "";

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) AssistantService.start(this);
    }

    private final Runnable refresh = new Runnable() {
        @Override
        public void run() {
            String museLine;
            if (!prefs.bridge().isEmpty()) {
                museLine = "Muse via Pi " + prefs.bridge() + ": " + AssistantService.bridgeStatus;
            } else if (!Muse.ready()) {
                museLine = "Muse: starting…";
            } else {
                org.json.JSONObject m = Muse.status();
                String pairing = m.optString("pairing");
                if ("open".equals(pairing)) {
                    museLine = "Muse: PAIRING. In the Muse app: Settings > Devices > Add Device, pick "
                            + m.optString("ble_name");
                } else if (m.optBoolean("connected")) {
                    museLine = "Muse: connected ✓ (" + m.optString("ble_name") + ")";
                } else if (m.optBoolean("paired")) {
                    museLine = "Muse: paired, connecting…";
                } else {
                    museLine = "Muse: not paired" + (m.optBoolean("has_token") ? " (press Pair with Muse)" : " (needs the SDK token)")
                            + (pairing.isEmpty() ? "" : " · last try: " + pairing);
                }
                if (!m.optString("error").isEmpty()) museLine += "\nPairing problem: " + m.optString("error");
            }
            status.setText(String.format(Locale.US,
                    "State: %s\n%s\nBluetooth: %s\nPop-ups allowed: %s\nLast reply: %s\n%s%s",
                    AssistantService.state, museLine, BlePeripheral.support(MainActivity.this),
                    Settings.canDrawOverlays(MainActivity.this) ? "yes" : "no",
                    AssistantService.lastReply.isEmpty() ? "—" : AssistantService.lastReply,
                    AssistantService.lastError.isEmpty() ? "" : "Problem: " + AssistantService.lastError,
                    pendingNote.isEmpty() ? "" : "\n" + pendingNote));
            meter.setProgress((int) Math.min(100, AssistantService.level / 30));
            scoreBar.setProgress((int) (AssistantService.peakScore * 100));
            handler.postDelayed(this, 150);
        }
    };

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(refresh);
        super.onDestroy();
    }

    private TextView label(String s) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextColor(0xFF9999BB);
        t.setTextSize(16);
        return t;
    }

    private ProgressBar bar() {
        ProgressBar b = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        b.setMax(100);
        b.setLayoutParams(new LinearLayout.LayoutParams(1000, 30));
        return b;
    }

    private Button button(String text, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(text);
        b.setOnClickListener(l);
        b.setAllCaps(false);
        return b;
    }
}
