package com.adamk.tvassistant;

import android.content.Context;

/**
 * The status part of the shared MuseBar card: what Muse is doing right now, with a colour per phase
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

    private final MuseBar bar;

    StatusPill(Context context) { this.bar = MuseBar.get(context); }

    void set(Phase p, String text) {
        long hide = p == Phase.DONE ? 3000 : p == Phase.FAILED ? 8000 : p == Phase.APPROVAL ? 10 * 60_000L : 75_000L;
        bar.setStatus(p, text, hide);
    }

    void hide() { bar.clearStatusNow(); }
}
