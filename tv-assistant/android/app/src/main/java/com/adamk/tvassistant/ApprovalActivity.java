package com.adamk.tvassistant;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

/** Full prompt when Muse needs an approval: OK on the remote approves, the second button denies. */
public class ApprovalActivity extends Activity {
    static volatile boolean showing = false;
    private TextView title, detail, result;
    private Button approve, deny;
    private String id = "";
    private LinearLayout root;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xF2101418);
        root.setPadding(160, 80, 160, 80);
        TextView head = text("Muse needs your OK", 40, 0xFFE5533D);
        title = text("", 34, Color.WHITE);
        detail = text("", 24, 0xFFB8C0CC);
        approve = button("Approve");
        deny = button("Deny");
        result = text("", 26, 0xFFFFD27A);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER);
        row.addView(approve);
        row.addView(deny);
        root.addView(head);
        root.addView(title);
        root.addView(detail);
        root.addView(row);
        root.addView(result);
        setContentView(root);
        approve.setOnClickListener(v -> decide("approve"));
        deny.setOnClickListener(v -> decide("deny"));
        approve.requestFocus();
    }

    private TextView text(String s, int sp, int color) {
        TextView t = new TextView(this);
        t.setText(s); t.setTextSize(sp); t.setTextColor(color); t.setGravity(Gravity.CENTER);
        t.setPadding(0, 20, 0, 20);
        t.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return t;
    }

    private Button button(String s) {
        Button x = new Button(this);
        x.setText(s); x.setTextSize(28); x.setPadding(80, 30, 80, 30);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(30, 40, 30, 40);
        x.setLayoutParams(lp);
        return x;
    }

    @Override
    protected void onResume() {
        super.onResume();
        showing = true;
        refresh();
    }

    @Override
    protected void onPause() { super.onPause(); showing = false; }

    /** Shows the first pending approval; closes itself when none are left. */
    void refresh() {
        JSONArray list = AssistantService.pendingApprovals;
        if (list == null || list.length() == 0) { finish(); return; }
        JSONObject first = list.optJSONObject(0);
        id = first.optString("id");
        title.setText(first.optString("title"));
        detail.setText(first.optString("detail") + (list.length() > 1 ? "\n(" + (list.length() - 1) + " more waiting)" : ""));
        result.setText("");
    }

    private void decide(String decision) {
        approve.setEnabled(false); deny.setEnabled(false);
        result.setText("Sending…");
        final String sent = id;
        new Thread(() -> {
            JSONObject r = Muse.decide(sent, decision);
            runOnUiThread(() -> {
                approve.setEnabled(true); deny.setEnabled(true);
                if (r.optBoolean("ok")) {
                    result.setText(decision.equals("approve") ? "Approved" : "Denied");
                    AssistantService.dropApproval(sent);
                    root.postDelayed(this::refresh, 600);
                } else {
                    result.setText(r.optString("error", "That didn't go through. Use the Muse app."));
                }
            });
        }, "approve").start();
    }
}
