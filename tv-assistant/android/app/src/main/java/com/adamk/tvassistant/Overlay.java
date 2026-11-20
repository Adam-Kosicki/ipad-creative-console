package com.adamk.tvassistant;

import android.content.Context;

/** The conversation text (what you said, Muse's reply). Drawn by the shared MuseBar card. */
final class Overlay {
    private final MuseBar bar;

    Overlay(Context context) { this.bar = MuseBar.get(context); }

    void show(String text, long hideAfterMs) { bar.setBody(text, hideAfterMs); }

    void hide() { bar.clearBodyNow(); }
}
