package com.adamk.tvassistant;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Talks to the bridge on the Pi (tvbridge.py). */
final class BridgeClient {
    private final String base, token;

    BridgeClient(String base, String token) { this.base = base; this.token = token; }

    boolean configured() { return !base.isEmpty() && !token.isEmpty(); }

    JSONObject ask(byte[] wav) throws IOException { return request("POST", "/ask", wav, "audio/wav", 150_000); }

    JSONObject health() throws IOException { return request("GET", "/health", null, null, 5_000); }

    JSONObject events(long after) throws IOException { return request("GET", "/events?after=" + after, null, null, 40_000); }

    String url(String path) { return base + path; }

    String token() { return token; }

    private JSONObject request(String method, String path, byte[] body, String type, int timeoutMs) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(base + path).openConnection();
        c.setRequestMethod(method);
        c.setConnectTimeout(5_000);
        c.setReadTimeout(timeoutMs);
        c.setRequestProperty("X-Token", token);
        if (body != null) {
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", type);
            c.setFixedLengthStreamingMode(body.length);
            try (OutputStream out = c.getOutputStream()) { out.write(body); }
        }
        int status = c.getResponseCode();
        InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
        String text = in == null ? "" : readAll(in);
        c.disconnect();
        try {
            JSONObject json = new JSONObject(text);
            if (status == 401) json.put("error", "The Pi refused the app's token.");
            return json;
        } catch (Exception e) {
            throw new IOException("HTTP " + status + " from the Pi");
        }
    }

    private static String readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        return out.toString("UTF-8");
    }
}
