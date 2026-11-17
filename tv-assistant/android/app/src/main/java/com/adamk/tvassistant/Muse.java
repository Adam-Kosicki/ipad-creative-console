package com.adamk.tvassistant;

import android.content.Context;
import android.util.Log;

import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;

import org.json.JSONObject;

import java.io.File;

/** The TV's own link to Muse: Meta's gadget SDK running in embedded Python (tvgadget.py). */
final class Muse {
    private static PyObject module;

    static synchronized void init(Context context, TvHost.Speaker speaker) {
        if (module != null) return;
        Context app = context.getApplicationContext();
        if (!Python.isStarted()) Python.start(new AndroidPlatform(app));
        module = Python.getInstance().getModule("tvgadget");
        File state = new File(app.getFilesDir(), "musegadget");
        File audio = new File(app.getCacheDir(), "replies");
        audio.mkdirs();
        module.callAttr("setup", app, state.getAbsolutePath(), audio.getAbsolutePath(), new TvHost(app, speaker));
        module.callAttr("start");
        Log.i(AssistantService.TAG, "Muse link started");
    }

    static boolean ready() { return module != null; }

    static JSONObject status() {
        try { return new JSONObject(module.callAttr("status").toString()); } catch (Exception e) { return new JSONObject(); }
    }

    static void pair() { module.callAttr("pair"); }

    static String saveSdkToken(String token) { return module.callAttr("save_sdk_token", token).toString(); }

    /** Blocking: sends the voice note and waits for Muse's answer. */
    static JSONObject ask(byte[] wav) throws Exception {
        return new JSONObject(module.callAttr("ask", wav, "").toString());
    }

    static JSONObject askText(String text) throws Exception {
        return new JSONObject(module.callAttr("ask", (Object) null, text).toString());
    }
}
