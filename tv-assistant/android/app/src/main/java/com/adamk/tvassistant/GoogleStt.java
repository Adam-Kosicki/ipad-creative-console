package com.adamk.tvassistant;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import java.util.ArrayList;

/**
 * One sentence through the TV's own speech recognizer (Google's), with live partial text.
 * The caller must have released the mic first: the recognizer needs it.
 */
final class GoogleStt {
    interface Callback {
        void onPartial(String text);
        /** Final text, or null with a reason when nothing usable was heard. */
        void onDone(String text, int error, boolean unavailable);
    }

    private static final String TAG = "TvAssistantStt";
    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private long startedAt;

    private long ms() { return android.os.SystemClock.elapsedRealtime() - startedAt; }

    private final String which;

    /** which: "default", "katniss" (Google TV search) or "tts" (Google speech services). */
    GoogleStt(Context context, String which) {
        this.context = context.getApplicationContext();
        this.which = which;
    }

    private ComponentName component() {
        if ("katniss".equals(which)) return new ComponentName("com.google.android.katniss",
                "com.google.android.apps.tvsearch.voice.recognition.KatnissRecognitionService");
        if ("tts".equals(which)) return new ComponentName("com.google.android.tts",
                "com.google.android.apps.speech.tts.googletts.service.GoogleTTSRecognitionService");
        return null;
    }

    static boolean available(Context c) { return SpeechRecognizer.isRecognitionAvailable(c); }

    void listen(Callback cb) {
        main.post(() -> {
            try {
                if (recognizer == null) {
                    ComponentName c = component();
                    recognizer = c == null ? SpeechRecognizer.createSpeechRecognizer(context)
                            : SpeechRecognizer.createSpeechRecognizer(context, c);
                }
                startedAt = android.os.SystemClock.elapsedRealtime();
            } catch (Exception e) {
                Log.w(TAG, "speech recognizer unavailable", e);
                cb.onDone(null, -1, true);
                return;
            }
            recognizer.setRecognitionListener(new RecognitionListener() {
                private boolean finished;

                private void finish(String text, int error, boolean unavailable) {
                    if (finished) return;
                    finished = true;
                    cb.onDone(text, error, unavailable);
                }

                @Override public void onReadyForSpeech(Bundle b) { Log.i(TAG, "stt ready +" + ms() + "ms"); }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float db) { AssistantService.level = Math.max(0f, db) * 100f; }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { Log.i(TAG, "stt end of speech +" + ms() + "ms"); }
                @Override public void onEvent(int type, Bundle b) { }

                @Override public void onPartialResults(Bundle b) {
                    String t = first(b);
                    if (t != null && !t.isEmpty()) { Log.i(TAG, "stt partial +" + ms() + "ms: " + t); cb.onPartial(t); }
                }

                @Override public void onResults(Bundle b) {
                    String t = first(b);
                    Log.i(TAG, "stt final +" + ms() + "ms: " + t);
                    finish(t == null || t.isEmpty() ? null : t, SpeechRecognizer.ERROR_NO_MATCH, false);
                }

                @Override public void onError(int error) {
                    Log.w(TAG, "stt error " + error + " +" + ms() + "ms");
                    boolean unavailable = error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
                            || error == SpeechRecognizer.ERROR_CLIENT
                            || error == SpeechRecognizer.ERROR_SERVER_DISCONNECTED
                            || error == 10 /* ERROR_TOO_MANY_REQUESTS */
                            || error == 12 /* ERROR_LANGUAGE_NOT_SUPPORTED */
                            || error == 13 /* ERROR_LANGUAGE_UNAVAILABLE */;
                    finish(null, error, unavailable);
                }
            });
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                    .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    .putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false)
                    .putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());
            Log.i(TAG, "stt start via " + which + ", available=" + SpeechRecognizer.isRecognitionAvailable(context));
            try {
                recognizer.startListening(i);
            } catch (Exception e) {
                Log.w(TAG, "speech recognizer failed to start", e);
                cb.onDone(null, -1, true);
            }
        });
    }

    void cancel() {
        main.post(() -> { if (recognizer != null) recognizer.cancel(); });
    }

    private static String first(Bundle b) {
        ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return r == null || r.isEmpty() ? null : r.get(0).trim();
    }
}
