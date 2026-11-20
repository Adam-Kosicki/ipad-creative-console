package com.adamk.tvassistant;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.SystemClock;
import android.view.KeyEvent;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** What Muse can do on the TV. Called from Python (tvgadget.TvExecutor) on a background thread. */
public class TvHost {
    public interface Speaker { void say(String text); }

    private static final Map<String, String> APPS = new HashMap<>();
    static {
        APPS.put("youtube", "com.google.android.youtube.tv");
        APPS.put("netflix", "com.netflix.ninja");
        APPS.put("spotify", "com.spotify.tv.android");
        APPS.put("plex", "com.plexapp.android");
        APPS.put("prime video", "com.amazon.amazonvideo.livingroom");
        APPS.put("disney+", "com.disney.disneyplus");
        APPS.put("disney plus", "com.disney.disneyplus");
        APPS.put("hulu", "com.hulu.livingroomplus");
        APPS.put("twitch", "tv.twitch.android.app");
        APPS.put("max", "com.wbd.stream");
        APPS.put("stremio", "com.stremio.one");
        APPS.put("settings", "com.android.tv.settings");
    }

    private final Context context;
    private final Timers timers;
    private final Speaker speaker;

    TvHost(Context context, Speaker speaker) {
        this.context = context.getApplicationContext();
        this.timers = new Timers(context);
        this.speaker = speaker;
    }

    public String setTimer(long fireAtMillis, String label, String kind) { return timers.add(fireAtMillis, label, kind); }

    public String listTimers() { return timers.listJson(); }

    public int cancelTimer(String id) { return timers.cancel(id); }

    public void say(String text) { speaker.say(text); }

    public void heard(String text) { AssistantService.heard(text); }

    /** Muse's live status from the chat stream: thinking, working, responding, done, failed. */
    public void status(String phase, String text) { AssistantService.musePhase(phase, text); }

    /** Pending Muse approvals, as a JSON array of {id,title,detail}; empty when none. */
    public void approvals(String json) { AssistantService.museApprovals(json); }

    public String volume(String action, int level) throws Exception {
        AudioManager am = context.getSystemService(AudioManager.class);
        int s = AudioManager.STREAM_MUSIC, max = am.getStreamMaxVolume(s);
        switch (action) {
            case "up": for (int i = 0; i < Math.max(1, Math.min(10, level)); i++) am.adjustStreamVolume(s, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI); break;
            case "down": for (int i = 0; i < Math.max(1, Math.min(10, level)); i++) am.adjustStreamVolume(s, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI); break;
            case "mute": am.adjustStreamVolume(s, AudioManager.ADJUST_MUTE, AudioManager.FLAG_SHOW_UI); break;
            case "unmute": am.adjustStreamVolume(s, AudioManager.ADJUST_UNMUTE, AudioManager.FLAG_SHOW_UI); break;
            case "set": am.setStreamVolume(s, Math.round(Math.max(0, Math.min(100, level)) * max / 100f), AudioManager.FLAG_SHOW_UI); break;
        }
        return new JSONObject().put("level_percent", Math.round(am.getStreamVolume(s) * 100f / max))
                .put("muted", am.isStreamMute(s)).toString();
    }

    public void media(String key) {
        int code;
        switch (key) {
            case "play": code = KeyEvent.KEYCODE_MEDIA_PLAY; break;
            case "pause": code = KeyEvent.KEYCODE_MEDIA_PAUSE; break;
            case "next": code = KeyEvent.KEYCODE_MEDIA_NEXT; break;
            case "previous": code = KeyEvent.KEYCODE_MEDIA_PREVIOUS; break;
            case "stop": code = KeyEvent.KEYCODE_MEDIA_STOP; break;
            default: code = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
        }
        AudioManager am = context.getSystemService(AudioManager.class);
        long t = SystemClock.uptimeMillis();
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_DOWN, code, 0));
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_UP, code, 0));
    }

    public String openApp(String app) {
        String name = app.trim().toLowerCase(Locale.US);
        String pkg = APPS.containsKey(name) ? APPS.get(name) : app.trim();
        PackageManager pm = context.getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        if (i == null) {
            // Try matching an installed app's label, e.g. "crunchyroll".
            for (android.content.pm.ApplicationInfo info : pm.getInstalledApplications(0)) {
                if (pm.getApplicationLabel(info).toString().toLowerCase(Locale.US).equals(name)) {
                    pkg = info.packageName;
                    i = pm.getLeanbackLaunchIntentForPackage(pkg);
                    if (i == null) i = pm.getLaunchIntentForPackage(pkg);
                    break;
                }
            }
        }
        if (i == null) return "error: " + app + " isn't installed on the TV";
        context.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        return pkg;
    }

    /** A YouTube URL or 11-character video id plays it; anything else searches YouTube on the TV. */
    public String youtube(String video) {
        if (video.isEmpty()) return "error: nothing to play";
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?:v=|youtu\\.be/|shorts/|^)([A-Za-z0-9_-]{11})(?:[?&#].*)?$").matcher(video);
        Intent i;
        String what;
        if (m.find() && (video.contains("youtu") || video.length() == 11)) {
            what = m.group(1);
            i = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://www.youtube.com/watch?v=" + what));
        } else {
            what = "search: " + video;
            i = new Intent(Intent.ACTION_SEARCH).putExtra(android.app.SearchManager.QUERY, video);
        }
        i.setPackage(APPS.get("youtube")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(i);
        } catch (Exception e) {
            if (i.getAction().equals(Intent.ACTION_SEARCH)) {
                // Some YouTube TV builds ignore ACTION_SEARCH; the search page URL works instead.
                Intent web = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(
                        "https://www.youtube.com/results?search_query=" + android.net.Uri.encode(video)))
                        .setPackage(APPS.get("youtube")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try { context.startActivity(web); } catch (Exception e2) { return "error: YouTube isn't installed"; }
            } else return "error: YouTube isn't installed";
        }
        return what;
    }

    public void goHome() {
        context.startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }
}
