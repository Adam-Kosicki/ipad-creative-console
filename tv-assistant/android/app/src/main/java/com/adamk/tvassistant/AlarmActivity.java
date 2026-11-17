package com.adamk.tvassistant;

import android.app.Activity;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Locale;

/** Full-screen alarm: rings and speaks the label. Any remote button or "Hey Jarvis" stops it. */
public class AlarmActivity extends Activity {
    private static final long MAX_RING_MS = 3 * 60_000;
    private static AlarmActivity current;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Ringtone ringtone;
    private ToneGenerator tone;
    private TextToSpeech tts;
    private String label = "";
    private boolean stopped = false;

    static void stopAll() {
        new Handler(Looper.getMainLooper()).post(() -> { if (current != null) current.stop(); });
    }

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        current = this;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        label = getIntent().getStringExtra("label");
        String timerId = getIntent().getStringExtra("timer_id");
        if (timerId != null) new Timers(this).remove(timerId);
        if (AssistantService.running) AssistantService.state = AssistantService.State.ALARM;
        boolean isAlarm = "alarm".equals(getIntent().getStringExtra("kind"));
        String title = isAlarm ? "Alarm" : "Timer done";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xFF1A1036);
        TextView big = new TextView(this);
        big.setText("⏰ " + title);
        big.setTextSize(64);
        big.setTextColor(Color.WHITE);
        big.setGravity(Gravity.CENTER);
        TextView small = new TextView(this);
        small.setText((label == null || label.isEmpty() ? "" : label + "\n\n") + "Press any button or say \"Hey Jarvis\" to stop");
        small.setTextSize(28);
        small.setTextColor(0xFFCCCCFF);
        small.setGravity(Gravity.CENTER);
        root.addView(big);
        root.addView(small);
        setContentView(root);

        startRinging();
        String speech = title + (label == null || label.isEmpty() ? "" : ": " + label);
        tts = new TextToSpeech(this, s -> {
            if (s == TextToSpeech.SUCCESS && !stopped) {
                tts.setLanguage(Locale.US);
                handler.postDelayed(() -> { if (!stopped) tts.speak(speech, TextToSpeech.QUEUE_FLUSH, null, "alarm"); }, 1500);
            }
        });
        handler.postDelayed(this::stop, MAX_RING_MS);
    }

    private void startRinging() {
        Uri uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
        if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        if (uri != null) ringtone = RingtoneManager.getRingtone(this, uri);
        if (ringtone != null) {
            ringtone.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
            if (android.os.Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
            ringtone.play();
        }
        // TVs often ship without alarm sounds, so also beep in a loop.
        tone = new ToneGenerator(AudioManager.STREAM_MUSIC, 90);
        beepLoop();
    }

    private void beepLoop() {
        if (stopped) return;
        if (ringtone == null || !ringtone.isPlaying()) tone.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600);
        handler.postDelayed(this::beepLoop, 1400);
    }

    void stop() {
        if (stopped) return;
        stopped = true;
        if (ringtone != null) ringtone.stop();
        if (tone != null) tone.release();
        if (tts != null) { tts.stop(); tts.shutdown(); }
        AssistantService.alarmEnded();
        finish();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        stop();
        return true;
    }

    @Override
    protected void onDestroy() {
        stop();
        if (current == this) current = null;
        super.onDestroy();
    }
}
