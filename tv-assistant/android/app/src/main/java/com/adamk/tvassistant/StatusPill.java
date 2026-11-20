package com.adamk.tvassistant;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.TextView;

/**
 * A status pill at the top-left of the TV: what Muse is doing right now, with a colour per phase
 * and a running timer, so it is always clear whether Muse is listening, thinking, working,
 * waiting for the viewer, or finished.
 */
final class StatusPill {
    enum Phase {
        LISTENING("Listening", 0xFF2E9E5B), THINKING("Thinking", 0xFF3B7DDD), WORKING("Working", 0xFFE0A21B),
        RESPONDING("Replying", 0xFF3B7DDD), APPROVAL("Needs your OK", 0xFFE5533D), DONE("Done", 0xFF2E9E5B),
        FAILED("Failed", 0xFFC0392B);
        final String label; final int color;
        Phase(String label, int color) { this.label = label; this.color = color; }
    }

    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private TextView view;
    private Phase phase;
    private String detail = "";
    private long since;
    private long lastChange;
    private final Runnable tick = this::render;
    private final Runnable hide = this::hideNow;

    StatusPill(Context context) { this.context = context; }

    void set(Phase p, String text) {
        main.post(() -> {
            if (p != phase || (text != null && !text.equals(detail))) lastChange = SystemClock.elapsedRealtime();
            if (p != phase && !(isBusy(p) && isBusy(phase))) since = SystemClock.elapsedRealtime();
            phase = p;
            detail = text == null ? "" : text;
            main.removeCallbacks(hide);
            if (p == Phase.DONE) main.postDelayed(hide, 4000);
            else if (p == Phase.FAILED) main.postDelayed(hide, 9000);
            else main.postDelayed(hide, 10 * 60_000L); // safety net if Muse never says it is done
            render();
        });
    }

    private static boolean isBusy(Phase p) {
        return p == Phase.THINKING || p == Phase.WORKING || p == Phase.RESPONDING;
    }

    void hide() { main.post(this::hideNow); }

    private void render() {
        if (phase == null || !Settings.canDrawOverlays(context)) return;
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (view == null) {
            view = new TextView(context);
            view.setTextColor(Color.WHITE);
            view.setTextSize(20);
            view.setPadding(36, 18, 36, 18);
            view.setMaxWidth(1300);
            view.setMaxLines(2);
            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                    PixelFormat.TRANSLUCENT);
            lp.gravity = Gravity.TOP | Gravity.START;
            lp.x = 60; lp.y = 50;
            try { wm.addView(view, lp); } catch (Exception e) { view = null; return; }
        }
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xE6141820);
        bg.setStroke(5, phase.color);
        bg.setCornerRadius(60);
        view.setBackground(bg);
        long secs = (SystemClock.elapsedRealtime() - since) / 1000;
        String timer = (phase == Phase.WORKING || phase == Phase.THINKING) && secs >= 3 ? "  " + secs + "s" : "";
        String line = "● " + phase.label + (detail.isEmpty() ? "" : ": " + detail) + timer;
        view.setText(line);
        view.setTextColor(phase == Phase.APPROVAL ? 0xFFFFD2CA : Color.WHITE);
        main.removeCallbacks(tick);
        if (phase == Phase.WORKING || phase == Phase.THINKING) main.postDelayed(tick, 1000);
    }

    private void hideNow() {
        main.removeCallbacks(tick);
        phase = null;
        if (view == null) return;
        try { ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).removeView(view); } catch (Exception ignored) { }
        view = null;
    }
}
