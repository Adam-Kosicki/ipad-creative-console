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

    void set(String bridge, String token, Float threshold, Boolean wake) {
        SharedPreferences.Editor e = p.edit();
        if (bridge != null) e.putString("bridge", bridge.replaceAll("/+$", ""));
        if (token != null) e.putString("token", token.trim());
        if (threshold != null) e.putFloat("threshold", threshold);
        if (wake != null) e.putBoolean("wake", wake);
        e.apply();
    }
}
