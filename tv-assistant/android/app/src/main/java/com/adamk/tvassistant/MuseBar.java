package com.adamk.tvassistant;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * One quiet card at the bottom of the TV for everything Muse does: what you said, what it is
 * doing, what it replied. Styled from Meta's Astryx "Neutral" dark theme (surface #1b1b1b,
 * text #fff / #9e9e9e, border white 10%, radius 12, motion fast 125 ms / medium 300 ms).
 */
final class MuseBar {
    // Astryx Neutral, dark.
    static final int SURFACE = 0xEB1B1B1B, BORDER = 0x1AFFFFFF, TEXT = 0xFFFFFFFF, TEXT2 = 0xFF9E9E9E;
    static final int INFO = 0xFF6D9CFE, SUCCESS = 0xFF64AF4C, WARNING = 0xFFF8D36A, ERROR = 0xFFFF705D;
    static final int FAST = 125, MEDIUM = 300;

    private static MuseBar instance;
    static synchronized MuseBar get(Context c) {
        if (instance == null) instance = new MuseBar(c.getApplicationContext());
        return instance;
    }

    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final float dp;
    private LinearLayout card;
    private Indicator indicator;
    private TextView small, big;
    private String body = "";
    private StatusPill.Phase phase;
    private String detail = "";
    private long since;
    private boolean leaving;
    private final Runnable tick = this::render;
    private final Runnable clearBody = () -> { body = ""; render(); };
    private final Runnable clearStatus = () -> { phase = null; detail = ""; render(); };

    private MuseBar(Context context) {
        this.context = context;
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        dp = dm.density;
    }

    void setBody(String text, long hideAfterMs) {
        main.post(() -> {
            body = text == null || text.equals("Listening\u2026") || text.equals("Thinking\u2026") ? "" : text;
            main.removeCallbacks(clearBody);
            if (hideAfterMs > 0) main.postDelayed(clearBody, hideAfterMs);
            render();
        });
    }

    void clearBodyNow() { main.post(() -> { main.removeCallbacks(clearBody); body = ""; render(); }); }

    void setStatus(StatusPill.Phase p, String text, long hideAfterMs) {
        main.post(() -> {
            if (p != phase) since = SystemClock.elapsedRealtime();
            phase = p;
            detail = text == null ? "" : text;
            main.removeCallbacks(clearStatus);
            if (hideAfterMs > 0) main.postDelayed(clearStatus, hideAfterMs);
            render();
        });
    }

    void clearStatusNow() { main.post(() -> { main.removeCallbacks(clearStatus); phase = null; detail = ""; render(); }); }

    private int px(float v) { return Math.round(v * dp); }

    private void render() {
        boolean want = (!body.isEmpty() || phase != null) && Settings.canDrawOverlays(context);
        if (!want) { dismiss(); return; }
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        if (card == null || leaving) {
            if (card != null) { try { wm.removeViewImmediate(card); } catch (Exception ignored) { } card = null; }
            leaving = false;
            build(wm);
            if (card == null) return;
            card.setAlpha(0f);
            card.setTranslationY(px(10));
            card.animate().alpha(1f).translationY(0).setDuration(MEDIUM)
                    .setInterpolator(new DecelerateInterpolator(1.6f)).start();
        }
        // Text: small status line above, main line below.
        long secs = (SystemClock.elapsedRealtime() - since) / 1000;
        String timer = phase != null && (phase == StatusPill.Phase.WORKING || phase == StatusPill.Phase.THINKING) && secs >= 10
                ? "  ·  " + secs + "s" : "";
        String label = phase == null ? "" : phase.label;
        String smallText, bigText;
        if (!body.isEmpty()) {
            smallText = label + (detail.isEmpty() ? "" : "  ·  " + detail) + timer;
            bigText = body;
        } else {
            smallText = label + timer;
            bigText = detail;
        }
        small.setText(smallText);
        small.setVisibility(smallText.trim().isEmpty() ? View.GONE : View.VISIBLE);
        if (!bigText.contentEquals(big.getText())) {
            big.setText(bigText);
            big.setAlpha(0.4f);
            big.animate().alpha(1f).setDuration(FAST).start();
        }
        big.setVisibility(bigText.isEmpty() ? View.GONE : View.VISIBLE);
        indicator.setPhase(phase);
        main.removeCallbacks(tick);
        if (phase == StatusPill.Phase.WORKING || phase == StatusPill.Phase.THINKING) main.postDelayed(tick, 1000);
    }

    private void build(WindowManager wm) {
        card = new LinearLayout(context);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setPadding(px(18), px(12), px(24), px(12));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(SURFACE);
        bg.setCornerRadius(px(14));
        bg.setStroke(Math.max(1, px(1)), BORDER);
        card.setBackground(bg);
        card.setElevation(px(8));

        indicator = new Indicator(context);
        LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(px(26), px(26));
        ip.rightMargin = px(14);
        card.addView(indicator, ip);

        LinearLayout col = new LinearLayout(context);
        col.setOrientation(LinearLayout.VERTICAL);
        small = new TextView(context);
        small.setTextColor(TEXT2);
        small.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        small.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        small.setLetterSpacing(0.04f);
        small.setSingleLine(true);
        big = new TextView(context);
        big.setTextColor(TEXT);
        big.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        big.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        big.setMaxLines(4);
        big.setLineSpacing(0, 1.12f);
        col.addView(small);
        col.addView(big);
        card.addView(col);

        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        col.setMinimumWidth(px(160));
        big.setMaxWidth(Math.min(px(640), (int) (dm.widthPixels * 0.55f)));
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        lp.y = px(40);
        try { wm.addView(card, lp); } catch (Exception e) { card = null; }
    }

    private void dismiss() {
        main.removeCallbacks(tick);
        if (card == null || leaving) return;
        leaving = true;
        final View v = card;
        v.animate().alpha(0f).translationY(px(6)).setDuration(FAST).withEndAction(() -> {
            try { ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).removeViewImmediate(v); } catch (Exception ignored) { }
            if (card == v) { card = null; leaving = false; }
            if (indicator != null) indicator.stop();
        }).start();
    }

    /** Small animated mark: breathing dot, spinning arc, speech bars, check, cross, alert ring. */
    private static final class Indicator extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF r = new RectF();
        private StatusPill.Phase phase;
        private float t;
        private ValueAnimator anim;

        Indicator(Context c) {
            super(c);
            p.setStrokeCap(Paint.Cap.ROUND);
        }

        void setPhase(StatusPill.Phase ph) {
            if (ph == phase && anim != null) return;
            phase = ph;
            if (anim == null) {
                anim = ValueAnimator.ofFloat(0f, 1f);
                anim.setRepeatCount(ValueAnimator.INFINITE);
                anim.setInterpolator(null);
                anim.addUpdateListener(a -> { t = (float) a.getAnimatedValue(); invalidate(); });
            }
            anim.setDuration(ph == StatusPill.Phase.LISTENING ? 2000
                    : ph == StatusPill.Phase.APPROVAL ? 1400
                    : ph == StatusPill.Phase.RESPONDING ? 900 : 1100);
            if (!anim.isStarted()) anim.start();
        }

        void stop() { if (anim != null) anim.cancel(); anim = null; }

        @Override protected void onDraw(Canvas c) {
            float w = getWidth(), h = getHeight(), cx = w / 2, cy = h / 2, base = Math.min(w, h) / 2;
            StatusPill.Phase ph = phase;
            if (ph == null) { p.setStyle(Paint.Style.FILL); p.setColor(TEXT2); c.drawCircle(cx, cy, base * 0.2f, p); return; }
            float sw = base * 0.17f;
            switch (ph) {
                case LISTENING: {
                    float s = 0.5f + 0.5f * (float) Math.sin(t * 2 * Math.PI);
                    p.setStyle(Paint.Style.FILL);
                    p.setColor(INFO); p.setAlpha((int) (60 * (1 - s)));
                    c.drawCircle(cx, cy, base * (0.5f + 0.5f * s), p);
                    p.setColor(INFO); p.setAlpha(255);
                    c.drawCircle(cx, cy, base * (0.36f + 0.06f * s), p);
                    break;
                }
                case THINKING:
                case WORKING: {
                    p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw);
                    p.setColor(TEXT2); p.setAlpha(70);
                    r.set(cx - base * 0.62f, cy - base * 0.62f, cx + base * 0.62f, cy + base * 0.62f);
                    c.drawArc(r, 0, 360, false, p);
                    p.setColor(ph == StatusPill.Phase.WORKING ? INFO : TEXT); p.setAlpha(255);
                    float sweep = 70 + 60 * (0.5f + 0.5f * (float) Math.sin(t * 2 * Math.PI));
                    c.drawArc(r, t * 360 - 90, sweep, false, p);
                    break;
                }
                case RESPONDING: {
                    p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw * 1.3f); p.setColor(INFO);
                    for (int i = 0; i < 4; i++) {
                        float a = 0.35f + 0.65f * (0.5f + 0.5f * (float) Math.sin(t * 2 * Math.PI + i * 1.3f));
                        float x = cx + (i - 1.5f) * base * 0.5f, hh = base * 0.75f * a;
                        c.drawLine(x, cy - hh, x, cy + hh, p);
                    }
                    break;
                }
                case APPROVAL: {
                    float s = 0.5f + 0.5f * (float) Math.sin(t * 2 * Math.PI);
                    p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw); p.setColor(WARNING); p.setAlpha((int) (120 + 135 * s));
                    c.drawCircle(cx, cy, base * 0.7f, p);
                    p.setStyle(Paint.Style.FILL); p.setAlpha(255);
                    c.drawCircle(cx, cy + base * 0.28f, sw * 0.7f, p);
                    p.setStyle(Paint.Style.STROKE);
                    c.drawLine(cx, cy - base * 0.38f, cx, cy + base * 0.06f, p);
                    break;
                }
                case DONE: {
                    p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw * 1.2f); p.setColor(SUCCESS);
                    c.drawLine(cx - base * 0.42f, cy + base * 0.02f, cx - base * 0.1f, cy + base * 0.34f, p);
                    c.drawLine(cx - base * 0.1f, cy + base * 0.34f, cx + base * 0.46f, cy - base * 0.32f, p);
                    break;
                }
                default: {
                    p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(sw * 1.2f); p.setColor(ERROR);
                    float k = base * 0.36f;
                    c.drawLine(cx - k, cy - k, cx + k, cy + k, p);
                    c.drawLine(cx + k, cy - k, cx - k, cy + k, p);
                }
            }
        }
    }
}
