package com.adamk.tvassistant;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.TextView;

/** A small Siri-style bubble at the bottom of the TV screen. Needs "display over other apps". */
final class Overlay {
    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private TextView view;
    private final Runnable hide = this::hideNow;

    Overlay(Context context) { this.context = context; }

    void show(String text, long hideAfterMs) {
        main.post(() -> {
            if (!Settings.canDrawOverlays(context)) return;
            WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
            if (view == null) {
                view = new TextView(context);
                view.setTextColor(Color.WHITE);
                view.setTextSize(22);
                view.setPadding(48, 28, 48, 28);
                view.setMaxWidth(1400);
                GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                        new int[]{0xE0301860, 0xE0103050});
                bg.setCornerRadius(60);
                view.setBackground(bg);
                WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                        WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                        PixelFormat.TRANSLUCENT);
                lp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
                lp.y = 80;
                try { wm.addView(view, lp); } catch (Exception e) { view = null; return; }
            }
            view.setText(text);
            main.removeCallbacks(hide);
            if (hideAfterMs > 0) main.postDelayed(hide, hideAfterMs);
        });
    }

    void hide() { main.post(this::hideNow); }

    private void hideNow() {
        if (view == null) return;
        try { ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).removeView(view); } catch (Exception ignored) { }
        view = null;
    }
}
