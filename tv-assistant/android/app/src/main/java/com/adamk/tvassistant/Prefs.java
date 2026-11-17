package com.adamk.tvassistant;

import android.content.Context;
import android.content.SharedPreferences;

/** Settings, set from the TV screen or with adb (see README). */
final class Prefs {
    private final SharedPreferences p;

    Prefs(Context c) { p = c.getSharedPreferences("tvassistant", Context.MODE_PRIVATE); }

    String bridge() { return p.getString("bridge", ""); }
    String token() { return p.getString("token", ""); }
    float threshold() { return p.getFloat("threshold", 0.5f); }
    boolean wakeEnabled() { return p.getBoolean("wake", true); }
    /** Digital gain on the mic. The Sony far-field mic is very quiet (speech ~ -50 dBFS). */
    float gain() { return p.getFloat("gain", 8f); }
    /** MediaRecorder.AudioSource: 6 = VOICE_RECOGNITION (default), 1 = MIC, 7 = VOICE_COMMUNICATION, 9 = UNPROCESSED. */
    int source() { return p.getInt("source", 6); }
    /** Speech-to-text after the wake word: "default", "katniss", "tts" (Google's recognizers) or "off" (voice note to Muse). */
    String stt() { return p.getString("stt", "default"); }
    void setStt(String v) { p.edit().putString("stt", v).apply(); }
    void setGain(float g) { p.edit().putFloat("gain", g).apply(); }
    void setSource(int s) { p.edit().putInt("source", s).apply(); }

    void set(String bridge, String token, Float threshold, Boolean wake) {
        SharedPreferences.Editor e = p.edit();
        if (bridge != null) e.putString("bridge", bridge.replaceAll("/+$", ""));
        if (token != null) e.putString("token", token.trim());
        if (threshold != null) e.putFloat("threshold", threshold);
        if (wake != null) e.putBoolean("wake", wake);
        e.apply();
    }
}
