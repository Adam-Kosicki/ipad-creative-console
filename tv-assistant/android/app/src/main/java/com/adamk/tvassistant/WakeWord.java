package com.adamk.tvassistant;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;

import android.content.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.Iterator;

/**
 * openWakeWord "hey jarvis" detector. Feed it 80 ms chunks (1280 samples, 16 kHz mono);
 * each call returns a 0..1 score. Same pipeline as openwakeword's AudioFeatures:
 * audio -> melspectrogram (x/10+2) -> 76-frame windows -> 96-d embeddings -> last 16 -> score.
 */
public final class WakeWord implements AutoCloseable {
    public static final int CHUNK = 1280;
    private static final int RAW_KEEP = CHUNK + 160 * 3;
    private static final int MEL_WINDOW = 76;
    private static final int FEATURES = 16;

    private final OrtEnvironment env;
    private final OrtSession mel, emb, wake;
    private final String melIn, embIn, wakeIn;
    private final short[] raw = new short[RAW_KEEP];
    private int rawLen = 0;
    private final ArrayDeque<float[]> melFrames = new ArrayDeque<>();
    private final ArrayDeque<float[]> features = new ArrayDeque<>();

    public WakeWord(Context context, String wakeModel) throws IOException, OrtException {
        env = OrtEnvironment.getEnvironment();
        OrtSession.SessionOptions options = new OrtSession.SessionOptions();
        options.setIntraOpNumThreads(1);
        mel = env.createSession(readAsset(context, "models/melspectrogram.onnx"), options);
        emb = env.createSession(readAsset(context, "models/embedding_model.onnx"), options);
        wake = env.createSession(readAsset(context, "models/" + wakeModel + ".onnx"), options);
        melIn = mel.getInputNames().iterator().next();
        embIn = emb.getInputNames().iterator().next();
        wakeIn = wake.getInputNames().iterator().next();
        reset();
    }

    public void reset() {
        rawLen = 0;
        melFrames.clear();
        features.clear();
        for (int i = 0; i < MEL_WINDOW; i++) {
            float[] ones = new float[32];
            java.util.Arrays.fill(ones, 1f);
            melFrames.add(ones);
        }
    }

    /** One 1280-sample chunk in, wake-word score out (0 until ~1.3 s of audio has been seen). */
    public float process(short[] chunk) throws OrtException {
        if (rawLen + CHUNK <= RAW_KEEP) {
            System.arraycopy(chunk, 0, raw, rawLen, CHUNK);
            rawLen += CHUNK;
        } else {
            int keep = RAW_KEEP - CHUNK;
            System.arraycopy(raw, rawLen - keep, raw, 0, keep);
            System.arraycopy(chunk, 0, raw, keep, CHUNK);
            rawLen = RAW_KEEP;
        }
        float[] audio = new float[rawLen];
        for (int i = 0; i < rawLen; i++) audio[i] = raw[i];

        try (OnnxTensor in = OnnxTensor.createTensor(env, FloatBuffer.wrap(audio), new long[]{1, rawLen});
             OrtSession.Result out = mel.run(Collections.singletonMap(melIn, in))) {
            float[][][][] m = (float[][][][]) out.get(0).getValue(); // [1][1][frames][32]
            for (float[] frame : m[0][0]) {
                float[] f = new float[32];
                for (int j = 0; j < 32; j++) f[j] = frame[j] / 10f + 2f;
                melFrames.add(f);
            }
        }
        while (melFrames.size() > MEL_WINDOW) melFrames.removeFirst();

        float[] window = new float[MEL_WINDOW * 32];
        int k = 0;
        for (float[] f : melFrames) {
            System.arraycopy(f, 0, window, k, 32);
            k += 32;
        }
        try (OnnxTensor in = OnnxTensor.createTensor(env, FloatBuffer.wrap(window), new long[]{1, MEL_WINDOW, 32, 1});
             OrtSession.Result out = emb.run(Collections.singletonMap(embIn, in))) {
            float[][][][] e = (float[][][][]) out.get(0).getValue(); // [1][1][1][96]
            features.add(e[0][0][0].clone());
        }
        while (features.size() > FEATURES) features.removeFirst();
        if (features.size() < FEATURES) return 0f;

        float[] x = new float[FEATURES * 96];
        k = 0;
        for (Iterator<float[]> it = features.iterator(); it.hasNext(); k += 96) System.arraycopy(it.next(), 0, x, k, 96);
        try (OnnxTensor in = OnnxTensor.createTensor(env, FloatBuffer.wrap(x), new long[]{1, FEATURES, 96});
             OrtSession.Result out = wake.run(Collections.singletonMap(wakeIn, in))) {
            float[][] s = (float[][]) out.get(0).getValue();
            return s[0][0];
        }
    }

    @Override
    public void close() {
        try { mel.close(); emb.close(); wake.close(); } catch (OrtException ignored) { }
    }

    private static byte[] readAsset(Context context, String name) throws IOException {
        try (InputStream in = context.getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toByteArray();
        }
    }
}
