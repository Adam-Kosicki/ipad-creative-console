package com.adamk.tvassistant;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

/** Timers and alarms on the TV, scheduled with AlarmManager so they ring even if the app was closed. */
final class Timers {
    private final Context context;
    private final SharedPreferences prefs;

    Timers(Context context) {
        this.context = context.getApplicationContext();
        prefs = this.context.getSharedPreferences("timers", Context.MODE_PRIVATE);
    }

    synchronized String add(long fireAtMillis, String label, String kind) {
        String id = UUID.randomUUID().toString().substring(0, 6);
        try {
            JSONArray all = load();
            all.put(new JSONObject().put("id", id).put("at", fireAtMillis).put("label", label).put("kind", kind));
            save(all);
        } catch (Exception e) { throw new RuntimeException(e); }
        AlarmManager am = context.getSystemService(AlarmManager.class);
        am.setAlarmClock(new AlarmManager.AlarmClockInfo(fireAtMillis, null), ringIntent(id, label, kind));
        return id;
    }

    /** Cancels one id, or every timer for "all". Returns how many were cancelled. */
    synchronized int cancel(String id) {
        JSONArray all = load(), keep = new JSONArray();
        int n = 0;
        for (int i = 0; i < all.length(); i++) {
            JSONObject t = all.optJSONObject(i);
            if ("all".equals(id) || t.optString("id").equals(id)) {
                context.getSystemService(AlarmManager.class)
                        .cancel(ringIntent(t.optString("id"), t.optString("label"), t.optString("kind")));
                n++;
            } else keep.put(t);
        }
        save(keep);
        return n;
    }

    /** Called when a timer rings. */
    synchronized void remove(String id) {
        JSONArray all = load(), keep = new JSONArray();
        for (int i = 0; i < all.length(); i++) if (!all.optJSONObject(i).optString("id").equals(id)) keep.put(all.optJSONObject(i));
        save(keep);
    }

    synchronized String listJson() {
        JSONArray all = load(), out = new JSONArray();
        long now = System.currentTimeMillis();
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
        try {
            for (int i = 0; i < all.length(); i++) {
                JSONObject t = all.getJSONObject(i);
                if (t.getLong("at") < now - 60_000) continue; // stale
                out.put(new JSONObject().put("id", t.getString("id")).put("kind", t.optString("kind"))
                        .put("label", t.optString("label")).put("rings_at", f.format(new Date(t.getLong("at"))))
                        .put("seconds_left", (t.getLong("at") - now) / 1000));
            }
        } catch (Exception ignored) { }
        return out.toString();
    }

    private PendingIntent ringIntent(String id, String label, String kind) {
        Intent i = new Intent(context, AlarmActivity.class)
                .setAction("ring:" + id)
                .putExtra("timer_id", id).putExtra("label", label).putExtra("kind", kind)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, id.hashCode(), i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private JSONArray load() {
        try { return new JSONArray(prefs.getString("all", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    private void save(JSONArray a) { prefs.edit().putString("all", a.toString()).apply(); }
}
