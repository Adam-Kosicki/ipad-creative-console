package com.adamk.tvassistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.IBinder;
import android.os.SystemClock;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Collections;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Always-on assistant: listens for "Hey Jarvis", records the request, sends it to the Pi
 * bridge (which asks Muse), and plays Muse's spoken answer. Also rings alarms and speaks
 * messages the Pi pushes (timers set by Muse, tv.say).
 */
public class AssistantService extends Service {
    static final String TAG = "TvAssistant";
    static final String ACTION_TALK = "com.adamk.tvassistant.TALK";
    static final String ACTION_ASK_TEXT = "com.adamk.tvassistant.ASK_TEXT";
    static final String ACTION_STOP_ALARM = "com.adamk.tvassistant.STOP_ALARM";

    enum State { STARTING, IDLE, LISTENING, THINKING, SPEAKING, ALARM, NO_MIC }

    // Read by MainActivity for its status screen.
    static volatile State state = State.STARTING;
    static volatile float level = 0f, lastScore = 0f, peakScore = 0f;
    static volatile String lastHeard = "", lastReply = "", lastError = "", bridgeStatus = "not checked";
    static volatile boolean running = false;

    private static final int RATE = 16000;
    private static final int CHUNK_MS = 80;
    private static final int MAX_WAIT_FOR_SPEECH_MS = 5000;
    private static final int END_SILENCE_MS = 1200;
    private static final int IGNORE_START_MS = 700;   // tail of "Hey Jarvis" + the listening beep
    private static final int MIN_REQUEST_MS = 2500;
    private static final int MAX_REQUEST_MS = 12000;

    private Prefs prefs;
    private Overlay overlay;
    private StatusPill pill;
    private volatile CountDownLatch speechLatch;
    private volatile boolean interrupted = false;
    static final String ACTION_STOP = "com.adamk.tvassistant.STOP";

    /** Stop talking now and drop any further Muse messages queued to be spoken. */
    void stopSpeaking() {
        interrupted = true;
        try { tts.stop(); } catch (Exception ignored) { }
        CountDownLatch l = speechLatch;
        if (l != null) l.countDown();
        Muse.stopFollowing();
        overlay.hide();
        pill.hide();
        if (state == State.SPEAKING || state == State.THINKING) state = State.IDLE;
    }
    static volatile org.json.JSONArray pendingApprovals = new org.json.JSONArray();
    private static volatile String lastApprovalIds = "";

    /** Status from Muse's chat stream (called from Python). */
    static void musePhase(String phase, String text) {
        AssistantService s = instance;
        if (s == null || s.pill == null) return;
        StatusPill.Phase p;
        switch (phase) {
            case "thinking": p = StatusPill.Phase.THINKING; break;
            case "responding": p = StatusPill.Phase.RESPONDING; break;
            case "done": p = StatusPill.Phase.DONE; break;
            case "failed": p = StatusPill.Phase.FAILED; break;
            default: p = StatusPill.Phase.WORKING;
        }
        if (pendingApprovals.length() > 0 && p != StatusPill.Phase.DONE && p != StatusPill.Phase.FAILED) return;
        s.pill.set(p, text);
    }

    static void museApprovals(String json) {
        AssistantService s = instance;
        try {
            org.json.JSONArray list = new org.json.JSONArray(json);
            pendingApprovals = list;
            if (s == null) return;
            if (list.length() == 0) { lastApprovalIds = ""; s.pill.set(StatusPill.Phase.WORKING, ""); return; }
            String ids = "";
            for (int i = 0; i < list.length(); i++) ids += list.getJSONObject(i).optString("id") + ",";
            s.pill.set(StatusPill.Phase.APPROVAL, list.getJSONObject(0).optString("title"));
            if (!ids.equals(lastApprovalIds)) {
                lastApprovalIds = ids;
                s.worker.submit(() -> {
                    s.beep(ToneGenerator.TONE_PROP_BEEP2);
                    Intent i = new Intent(s, ApprovalActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    s.startActivity(i);
                });
            }
        } catch (Exception e) { Log.w(TAG, "bad approvals payload", e); }
    }

    static void dropApproval(String id) {
        org.json.JSONArray out = new org.json.JSONArray();
        for (int i = 0; i < pendingApprovals.length(); i++) {
            org.json.JSONObject o = pendingApprovals.optJSONObject(i);
            if (o != null && !id.equals(o.optString("id"))) out.put(o);
        }
        pendingApprovals = out;
        AssistantService s = instance;
        if (s != null && out.length() == 0) { lastApprovalIds = ""; s.pill.set(StatusPill.Phase.WORKING, ""); }
    }
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private Thread micThread, eventThread;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private AudioManager audio;
    private AudioFocusRequest focus;
    private volatile boolean talkRequested = false;
    private volatile long cooldownUntil = 0;
    private static volatile AssistantService instance;

    /** Muse's transcription of what was said, shown on screen for checking mic quality. */
    static void heard(String text) {
        lastHeard = text;
        AssistantService s = instance;
        if (s != null && state == State.THINKING) s.overlay.show(text, 0);
    }

    static void start(Context c) {
        Intent i = new Intent(c, AssistantService.class);
        c.startForegroundService(i);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = new Prefs(this);
        overlay = new Overlay(this);
        pill = new StatusPill(this);
        instance = this;
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        startForeground(1, notification());
        tts = new TextToSpeech(this, s -> {
            ttsReady = s == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setLanguage(Locale.US);
                // Play replies at the TV's normal volume (the Assistant volume is often very low).
                tts.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            }
        });
        running = true;
        new Thread(() -> {
            try {
                Muse.init(this, this::announce);
            } catch (Throwable t) {
                Log.e(TAG, "Muse link failed to start", t);
                lastError = "Muse link: " + t.getMessage();
            }
        }, "muse-init").start();
        micThread = new Thread(this::micLoop, "mic");
        micThread.start();
        eventThread = new Thread(this::eventLoop, "events");
        eventThread.start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_TALK.equals(intent.getAction())) talkRequested = true;
        if (intent != null && ACTION_ASK_TEXT.equals(intent.getAction())) {
            String text = intent.getStringExtra("text");
            state = State.THINKING;
            overlay.show("Thinking…", 0);
            pill.set(StatusPill.Phase.THINKING, "");
            worker.submit(() -> ask(null, text));
        }
        if (intent != null && ACTION_STOP_ALARM.equals(intent.getAction())) AlarmActivity.stopAll();
        if (intent != null && ACTION_STOP.equals(intent.getAction())) stopSpeaking();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        if (micThread != null) micThread.interrupt();
        if (eventThread != null) eventThread.interrupt();
        worker.shutdownNow();
        overlay.hide();
        pill.hide();
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private Notification notification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("assistant", "Assistant", NotificationManager.IMPORTANCE_LOW));
        return new Notification.Builder(this, "assistant")
                .setContentTitle("TV Assistant")
                .setContentText("Listening for \"Hey Jarvis\"")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .build();
    }

    // -- Microphone loop ------------------------------------------------------

    private void micLoop() {
        WakeWord wake = null;
        AudioRecord rec = null;
        try {
            wake = new WakeWord(this, "hey_jarvis_v0.1");
            Log.i(TAG, "mic source " + prefs.source() + ", gain " + prefs.gain() + ", stt " + prefs.stt());
            rec = openMic();
        } catch (Throwable t) {
            Log.e(TAG, "mic start failed", t);
            lastError = "Mic: " + t.getMessage();
            state = State.NO_MIC;
            return;
        }
        state = State.IDLE;
        short[] chunk = new short[WakeWord.CHUNK];
        short[] request = new short[RATE * MAX_REQUEST_MS / 1000];
        int requestLen = 0, quietMs = 0, sinceStartMs = 0;
        boolean heardSpeech = false;
        float noise = 200f;
        long lastLog = 0;

        while (running) {
            if (micLent) {
                if (rec != null) { rec.stop(); rec.release(); rec = null; }
                SystemClock.sleep(50);
                continue;
            }
            if (rec == null) {
                try {
                    rec = openMic();
                } catch (Throwable t) {
                    Log.e(TAG, "mic reopen failed", t);
                    SystemClock.sleep(500);
                    continue;
                }
            }
            int got = 0;
            while (got < chunk.length && running) {
                int n = rec.read(chunk, got, chunk.length - got);
                if (n <= 0) { SystemClock.sleep(20); break; }
                got += n;
            }
            if (got < chunk.length) continue;
            float gain = prefs.gain();
            if (gain != 1f) {
                for (int i = 0; i < chunk.length; i++) {
                    float v = chunk[i] * gain;
                    chunk[i] = (short) (v > 32767 ? 32767 : (v < -32768 ? -32768 : v));
                }
            }

            float rms = rms(chunk);
            level = rms;
            float score;
            try {
                score = wake.process(chunk);
            } catch (Throwable t) {
                Log.e(TAG, "wake word failed", t);
                lastError = "Wake word: " + t.getMessage();
                score = 0f;
            }
            lastScore = score;
            peakScore = Math.max(peakScore * 0.995f, score);
            long now = SystemClock.elapsedRealtime();
            if (now - lastLog > 2000 || score > 0.2f) {
                Log.d(TAG, String.format(Locale.US, "state=%s rms=%.0f noise=%.0f score=%.3f", state, rms, noise, score));
                lastLog = now;
            }
            boolean triggered = prefs.wakeEnabled() && score >= prefs.threshold() && now > cooldownUntil;

            switch (state) {
                case IDLE:
                    noise = 0.97f * noise + 0.03f * Math.min(rms, noise * 3f);
                    if (triggered || talkRequested) {
                        talkRequested = false;
                        Log.i(TAG, "wake (score " + score + ")");
                        startListening();
                        requestLen = 0; quietMs = 0; sinceStartMs = 0; heardSpeech = false;
                        if (useGoogleStt()) {
                            micLent = true;
                            rec.stop(); rec.release(); rec = null;  // the recognizer opens the mic itself
                            listenWithGoogle();
                        }
                    }
                    break;
                case LISTENING:
                    System.arraycopy(chunk, 0, request, requestLen, chunk.length);
                    requestLen += chunk.length;
                    sinceStartMs += CHUNK_MS;
                    boolean speech = rms > Math.max(noise * 2.5f, 35f * gain);
                    if (sinceStartMs <= IGNORE_START_MS) speech = false;
                    if (speech) { heardSpeech = true; quietMs = 0; } else quietMs += CHUNK_MS;
                    boolean full = requestLen + chunk.length > request.length;
                    if (!heardSpeech && sinceStartMs >= MAX_WAIT_FOR_SPEECH_MS) {
                        Log.i(TAG, "no speech after wake word");
                        beep(ToneGenerator.TONE_PROP_NACK);
                        overlay.hide();
                        pill.hide();
                        finishTurn();
                    } else if ((heardSpeech && quietMs >= END_SILENCE_MS && sinceStartMs >= MIN_REQUEST_MS) || full) {
                        Log.i(TAG, "request recorded: " + sinceStartMs + " ms");
                        state = State.THINKING;
                        overlay.show("Thinking…", 0);
                        pill.set(StatusPill.Phase.THINKING, "");
                        final byte[] wav = Wav.fromPcm(request, requestLen);
                        worker.submit(() -> ask(wav, null));
                    }
                    break;
                case ALARM:
                    if (triggered) {
                        AlarmActivity.stopAll();
                        cooldownUntil = now + 1500;
                    }
                    break;
                case SPEAKING:
                case THINKING:
                    // Saying "Hey Jarvis" while Muse is talking cuts it off and starts a new request.
                    if (triggered && score >= 0.85f) {
                        Log.i(TAG, "wake while busy: interrupting (score " + score + ")");
                        stopSpeaking();
                        talkRequested = true;
                    }
                    break;
                default:
                    break;
            }
        }
        if (rec != null) { rec.stop(); rec.release(); }
        wake.close();
    }

    private AudioRecord openMic() {
        int min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioRecord rec = new AudioRecord(prefs.source(), RATE, AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT, Math.max(min, RATE * 2));
        if (rec.getState() != AudioRecord.STATE_INITIALIZED) {
            rec.release();
            throw new IllegalStateException("mic would not open");
        }
        rec.startRecording();
        return rec;
    }

    /** True while Google's recognizer has the mic (our AudioRecord is closed). */
    private volatile boolean micLent = false;
    private volatile boolean sttBroken = false;
    private GoogleStt stt;

    private boolean useGoogleStt() {
        return !sttBroken && !"off".equals(prefs.stt()) && prefs.bridge().isEmpty();
    }

    /** After the wake word: Google's recognizer turns the request into text, live on screen. */
    private void listenWithGoogle() {
        if (stt == null || !stt.which().equals(prefs.stt())) stt = new GoogleStt(this, prefs.stt());
        stt.listen(new GoogleStt.Callback() {
            @Override public void onPartial(String text) {
                lastHeard = text;
                overlay.show(text, 0);
            }

            @Override public void onDone(String text, int error, boolean unavailable) {
                if (text != null) {
                    lastHeard = text;
                    state = State.THINKING;
                    overlay.show(text, 0);
                    pill.set(StatusPill.Phase.THINKING, "");
                    micLent = false;
                    worker.submit(() -> ask(null, text));
                    return;
                }
                if (unavailable) {
                    sttBroken = true;
                    lastError = "Google speech recognizer unavailable (error " + error + "); using voice notes";
                }
                overlay.hide();
                pill.hide();
                worker.submit(() -> beep(ToneGenerator.TONE_PROP_NACK));
                finishTurn();
                micLent = false;
            }
        });
    }

    private void startListening() {
        interrupted = false;
        state = State.LISTENING;
        requestFocus();
        beep(ToneGenerator.TONE_PROP_ACK);
        overlay.show("Listening…", 0);
        pill.set(StatusPill.Phase.LISTENING, "");
    }

    private void finishTurn() {
        abandonFocus();
        cooldownUntil = SystemClock.elapsedRealtime() + 1500;
        if (state == State.SPEAKING || state == State.THINKING || state == State.STARTING) state = State.IDLE;
    }

    // -- Asking Muse through the Pi --------------------------------------------

    private void ask(byte[] wav, String askText) {
        BridgeClient bridge = new BridgeClient(prefs.bridge(), prefs.token());
        boolean usePi = !prefs.bridge().isEmpty();
        try {
            JSONObject r;
            if (usePi && wav != null) {
                r = bridge.ask(wav);
            } else if (Muse.ready()) {
                r = wav != null ? Muse.ask(wav) : Muse.askText(askText); // the TV itself is the Muse device
            } else {
                say("I'm still starting up. Try again in a moment.");
                return;
            }
            if (!r.optBoolean("ok")) {
                lastError = r.optString("error", "unknown error");
                say(lastError);
                return;
            }
            String text = r.optString("text", "");
            String heard = r.optString("heard", "");
            if (!heard.isEmpty()) lastHeard = heard;
            lastReply = text;
            lastError = "";
            state = State.SPEAKING;
            overlay.show(lastHeard.isEmpty() ? text : lastHeard + "\n\n" + text, 0);
            JSONArray audioUrls = r.optJSONArray("audio");
            JSONArray audioFiles = r.optJSONArray("audio_files");
            boolean played = false;
            if (audioUrls != null) {
                for (int i = 0; i < audioUrls.length(); i++) played |= playUrl(bridge, audioUrls.getString(i));
            }
            if (audioFiles != null) {
                for (int i = 0; i < audioFiles.length(); i++) {
                    java.io.File f = new java.io.File(audioFiles.getString(i));
                    played |= playFile(f);
                    f.delete();
                }
            }
            if (!played) speakAndWait(text);
            if (!interrupted) overlay.show(text, 4000);
        } catch (Exception e) {
            Log.e(TAG, "ask failed", e);
            lastError = (usePi ? "Can't reach the Pi: " : "Muse: ") + e.getMessage();
            say(usePi ? "I can't reach the Pi right now." : "Something went wrong talking to Muse.");
        } finally {
            finishTurn();
        }
    }

    private void say(String text) {
        state = State.SPEAKING;
        overlay.show(text, 5000);
        beep(ToneGenerator.TONE_PROP_NACK);
        speakAndWait(text);
    }

    private boolean playFile(java.io.File file) {
        CountDownLatch done = new CountDownLatch(1);
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            mp.setDataSource(file.getAbsolutePath());
            mp.setOnCompletionListener(m -> done.countDown());
            mp.setOnErrorListener((m, what, extra) -> { done.countDown(); return true; });
            mp.prepare();
            mp.start();
            done.await(120, TimeUnit.SECONDS);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "could not play Muse's voice, using the TV's", e);
            return false;
        } finally {
            mp.release();
        }
    }

    /** Muse (tv.say) or the Pi asked the TV to say something. */
    void announce(String text) {
        worker.submit(() -> {
            State before = state;
            overlay.show(text, 0);
            beep(ToneGenerator.TONE_PROP_BEEP);
            speakAndWait(text);
            overlay.show(text, 4000);
            if (state == before) state = State.IDLE;
        });
    }

    private boolean playUrl(BridgeClient bridge, String path) {
        CountDownLatch done = new CountDownLatch(1);
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            mp.setDataSource(this, Uri.parse(bridge.url(path)), Collections.singletonMap("X-Token", bridge.token()));
            mp.setOnCompletionListener(m -> done.countDown());
            mp.setOnErrorListener((m, what, extra) -> { done.countDown(); return true; });
            mp.prepare();
            mp.start();
            done.await(120, TimeUnit.SECONDS);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "could not play Muse's voice, using the TV's", e);
            return false;
        } finally {
            mp.release();
        }
    }

    /** First few sentences only (about 350 characters); the card still shows everything. */
    static String spokenPart(String text) {
        if (text == null || text.length() <= 350) return text;
        int cut = -1;
        for (int i = 330; i >= 120; i--) {
            char ch = text.charAt(i);
            if ((ch == '.' || ch == '!' || ch == '?') && i + 1 < text.length() && Character.isWhitespace(text.charAt(i + 1))) { cut = i + 1; break; }
        }
        return cut > 0 ? text.substring(0, cut) : text.substring(0, 350);
    }

    void speakAndWait(String text) {
        text = spokenPart(text);
        if (!ttsReady || text == null || text.isEmpty()) return;
        if (interrupted) return;
        CountDownLatch done = new CountDownLatch(1);
        speechLatch = done;
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onStop(String id, boolean wasInterrupted) { done.countDown(); }
            @Override public void onDone(String id) { done.countDown(); }
            @Override public void onError(String id) { done.countDown(); }
        });
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "u" + SystemClock.elapsedRealtime());
        try { done.await(60, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
    }

    // -- Things the Pi pushes (alarms, tv.say) ----------------------------------

    private void eventLoop() {
        long after = -1;
        while (running) {
            BridgeClient bridge = new BridgeClient(prefs.bridge(), prefs.token());
            if (!bridge.configured()) { bridgeStatus = "not used (the TV talks to Muse itself)"; SystemClock.sleep(3000); continue; }
            try {
                if (after < 0) { // skip anything that happened before this app started
                    JSONObject h = bridge.health();
                    bridgeStatus = h.optBoolean("muse") ? "connected to Muse" : "Pi up, Muse not connected";
                    after = bridge.events(Long.MAX_VALUE / 4).optLong("last", 0);
                    continue;
                }
                JSONObject r = bridge.events(after);
                if (r.has("error")) { bridgeStatus = r.optString("error"); SystemClock.sleep(10000); continue; }
                bridgeStatus = "connected";
                JSONArray items = r.optJSONArray("events");
                long last = r.optLong("last", after);
                if (items != null) {
                    for (int i = 0; i < items.length(); i++) handleEvent(items.getJSONObject(i));
                }
                after = last;
            } catch (Exception e) {
                bridgeStatus = "can't reach the Pi (" + e.getMessage() + ")";
                SystemClock.sleep(5000);
            }
        }
    }

    private void handleEvent(JSONObject e) {
        String type = e.optString("type");
        Log.i(TAG, "event " + e);
        if ("say".equals(type)) {
            announce(e.optString("text"));
        } else if ("alarm".equals(type)) {
            Intent i = new Intent(this, AlarmActivity.class)
                    .putExtra("label", e.optString("label"))
                    .putExtra("kind", e.optString("kind", "timer"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            state = State.ALARM;
            startActivity(i);
        }
    }

    /** Called by AlarmActivity when the alarm stops. */
    static void alarmEnded() {
        if (state == State.ALARM) state = State.IDLE;
    }

    // -- Helpers ---------------------------------------------------------------

    private void requestFocus() {
        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANT).build())
                .build();
        audio.requestAudioFocus(focus); // pauses or ducks whatever is playing
    }

    private void abandonFocus() {
        if (focus != null) audio.abandonAudioFocusRequest(focus);
        focus = null;
    }

    private static void beep(int tone) {
        try {
            ToneGenerator g = new ToneGenerator(AudioManager.STREAM_MUSIC, 70);
            g.startTone(tone, 200);
            SystemClock.sleep(220);
            g.release();
        } catch (RuntimeException ignored) { }
    }

    private static float rms(short[] s) {
        double sum = 0;
        for (short v : s) sum += (double) v * v;
        return (float) Math.sqrt(sum / s.length);
    }
}
