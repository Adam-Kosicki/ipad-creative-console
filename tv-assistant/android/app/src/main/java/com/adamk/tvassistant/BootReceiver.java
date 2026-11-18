package com.adamk.tvassistant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // Android 12 silences the mic for a foreground service started from the background,
        // so start it through the activity (allowed: the app may draw over other apps), which
        // then steps back out of the way.
        try {
            context.startActivity(new Intent(context, MainActivity.class)
                    .putExtra("background_start", true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION));
        } catch (Exception e) {
            AssistantService.start(context);
        }
    }
}
