package com.adamk.tvassistant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** `adb shell am broadcast -a com.adamk.tvassistant.STOP` makes Muse stop talking. */
public class StopReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        Intent s = new Intent(c, AssistantService.class).setAction(AssistantService.ACTION_STOP);
        c.startForegroundService(s);
    }
}
