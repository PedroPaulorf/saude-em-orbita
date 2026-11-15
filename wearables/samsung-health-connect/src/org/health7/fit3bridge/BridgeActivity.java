package org.health7.fit3bridge;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.health.connect.*;
import android.health.connect.datatypes.*;
import android.os.Bundle;
import android.os.OutcomeReceiver;
import android.text.InputType;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;

/** Fit3 -> Samsung Health -> Health Connect -> authenticated Health7 API, on explicit user actions. */
public final class BridgeActivity extends Activity {
    private static final String READ = "android.permission.health.READ_HEART_RATE";
    private static final String SAMSUNG = "com.sec.android.app.shealth";
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private EditText address, username, password;
    private TextView status, preview;
    private Button signIn, signOut, read, upload;
    private CheckBox consent;
    private Spinner window;
    private HealthConnectManager health;
    private volatile int epoch;
    private String base, cookie, crew;
    private boolean busy;
    private List<JSONObject> samples = new ArrayList<>();
    private List<String> batches = new ArrayList<>();
    private int batchIndex, added, duplicates;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        health = getSystemService(HealthConnectManager.class);
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(32, 48, 32, 48);
        TextView title = new TextView(this); title.setText("Health7 · Galaxy Fit3 bridge"); title.setTextSize(24); layout.addView(title);
        TextView help = new TextView(this); help.setText("Android 14+ phone prototype. Pair Fit3 with Galaxy Wearable, sync Samsung Health, and allow Samsung Health to share heart rate with Health Connect. This app reads the phone datastore, not the Fit3 radio directly.\n\nUse your computer’s network IP, not localhost on the phone. HTTPS for deployment; private-network HTTP for local tests."); layout.addView(help);
        Button permission = button(layout, "Allow Health Connect heart-rate reading");
        permission.setOnClickListener(v -> requestPermissions(new String[]{READ}, 8));
        Button settings = button(layout, "Open Health Connect settings");
        settings.setOnClickListener(v -> { try { startActivity(new Intent("android.health.connect.action.HEALTH_HOME_SETTINGS")); } catch (RuntimeException e) { show("Open Settings > Health Connect on this phone."); } });
        Button privacy = button(layout, "How your data is used"); privacy.setOnClickListener(v -> startActivity(new Intent(this, PrivacyActivity.class)));
        address = input(layout, "Health7 server, e.g. https://your-server", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        username = input(layout, "Health7 username", InputType.TYPE_CLASS_TEXT);
        password = input(layout, "Health7 password", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        signIn = button(layout, "Sign in to Health7"); signIn.setOnClickListener(v -> login());
        signOut = button(layout, "Sign out"); signOut.setOnClickListener(v -> logout());
        window = new Spinner(this); window.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, new String[]{"Last 1 hour", "Last 6 hours", "Last 24 hours"})); layout.addView(window);
        read = button(layout, "Read Samsung Health preview"); read.setOnClickListener(v -> readPreview());
        preview = new TextView(this); layout.addView(preview);
        consent = new CheckBox(this); consent.setText("I reviewed the preview and authorize sending these samples to my Health7 account."); layout.addView(consent); consent.setOnCheckedChangeListener((b, checked) -> refresh());
        upload = button(layout, "Send preview / retry remaining batches"); upload.setOnClickListener(v -> upload());
        status = new TextView(this); status.setPadding(0, 24, 0, 0); layout.addView(status);
        ScrollView scroll = new ScrollView(this); scroll.addView(layout); setContentView(scroll); refresh();
    }
    private Button button(LinearLayout layout, String title) { Button b = new Button(this); b.setText(title); layout.addView(b); return b; }
    private EditText input(LinearLayout layout, String hint, int type) { EditText t = new EditText(this); t.setHint(hint); t.setInputType(type); t.setSingleLine(true); layout.addView(t); return t; }
    private void show(String text) { runOnUiThread(() -> { if (!isFinishing()) status.setText(text); }); }
    private void refresh() {
        boolean signed = cookie != null;
        address.setEnabled(!signed && !busy); username.setEnabled(!signed && !busy); password.setEnabled(!signed && !busy);
        signIn.setEnabled(!signed && !busy); signOut.setEnabled(signed && !busy);
        read.setEnabled(signed && !busy); window.setEnabled(!busy);
        upload.setEnabled(signed && !busy && !samples.isEmpty() && consent.isChecked()); consent.setEnabled(!busy);
    }
    private static String serverAddress(String text) throws Exception {
        URI uri = new URI(text.trim()); String host = uri.getHost();
        if (host == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null || !(uri.getPath().isEmpty() || uri.getPath().equals("/"))) throw new IOException("Enter only the server origin, without API path, password or query.");
        boolean local = host.equals("localhost") || host.matches("127\\.\\d+\\.\\d+\\.\\d+") || host.matches("10\\.\\d+\\.\\d+\\.\\d+") || host.matches("192\\.168\\.\\d+\\.\\d+") || host.matches("172\\.(1[6-9]|2\\d|3[01])\\.\\d+\\.\\d+");
        if (!"https".equals(uri.getScheme()) && !("http".equals(uri.getScheme()) && local)) throw new IOException("Use HTTPS, or a private-network HTTP address for local testing.");
        return uri.getScheme() + "://" + uri.getRawAuthority();
    }
    private void login() {
        final String destination, user = username.getText().toString().trim(), secret = password.getText().toString();
        try { destination = serverAddress(address.getText().toString()); if (user.isEmpty() || secret.isEmpty()) throw new IOException("Enter username and password."); }
        catch (Exception e) { show(e.getMessage()); return; }
        final int generation = ++epoch; busy = true; refresh();
        worker.execute(() -> {
            try {
                JSONObject body = new JSONObject().put("username", user).put("password", secret);
                HttpResult result = post(destination, "/auth/login", body.toString(), null, null);
                String token = result.cookie;
                if (token == null) throw new IOException("Server did not establish a session.");
                String owner = new JSONObject(result.body).getJSONObject("profile").getString("id");
                runOnUiThread(() -> { if (generation != epoch) return; base = destination; cookie = token; crew = owner; password.setText(""); busy = false; refresh(); show("Signed in. Grant Health Connect permission and read a preview."); });
            } catch (Exception e) { finishError(generation, e); }
        });
    }
    private void logout() {
        final String oldBase = base, oldCookie = cookie, oldCrew = crew;
        epoch++; cookie = null; crew = null; base = null; samples.clear(); batches.clear(); batchIndex = 0;
        preview.setText(""); consent.setChecked(false); password.setText(""); busy = false; refresh();
        worker.execute(() -> { try { post(oldBase, "/auth/logout", "{}", oldCookie, oldCrew); } catch (Exception ignored) { } });
        show("Signed out. Unsaved samples were cleared.");
    }
    private void readPreview() {
        if (health == null || checkSelfPermission(READ) != PackageManager.PERMISSION_GRANTED) { show("Grant heart-rate permission in Health Connect first."); return; }
        if (cookie == null || busy) return;
        int hours = new int[]{1, 6, 24}[window.getSelectedItemPosition()];
        Instant to = Instant.now(), from = to.minus(hours, ChronoUnit.HOURS);
        samples.clear(); batches.clear(); batchIndex = 0; added = 0; duplicates = 0;
        consent.setChecked(false); preview.setText(""); busy = true; refresh();
        readPage(epoch, from, to, -1, new LinkedHashMap<>());
    }
    private void readPage(int generation, Instant from, Instant to, long token, LinkedHashMap<String, JSONObject> collected) {
        if (generation != epoch || isFinishing()) return;
        ReadRecordsRequestUsingFilters.Builder<HeartRateRecord> builder = new ReadRecordsRequestUsingFilters.Builder<>(HeartRateRecord.class)
            .addDataOrigins(new DataOrigin.Builder().setPackageName(SAMSUNG).build()).setPageSize(100).setAscending(true)
            .setTimeRangeFilter(new TimeInstantRangeFilter.Builder().setStartTime(from).setEndTime(to).build());
        if (token != -1) builder.setPageToken(token);
        try {
            health.readRecords(builder.build(), getMainExecutor(), new OutcomeReceiver<ReadRecordsResponse<HeartRateRecord>, HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<HeartRateRecord> response) {
                    if (generation != epoch || isFinishing()) return;
                    try {
                        for (HeartRateRecord record : response.getRecords()) {
                            if (!SAMSUNG.equals(record.getMetadata().getDataOrigin().getPackageName())) continue;
                            Device device = record.getMetadata().getDevice();
                            String model = device == null ? "" : device.getModel();
                            String name = "Samsung Health | " + (model == null || model.trim().isEmpty() ? "device unknown" : model.trim());
                            if (name.length() > 160) throw new IOException("Device metadata exceeds the Health7 limit.");
                            for (HeartRateRecord.HeartRateSample sample : record.getSamples()) {
                                if (sample.getTime().isBefore(from) || sample.getTime().isAfter(to)) continue;
                                long bpm = sample.getBeatsPerMinute();
                                if (bpm < 1 || bpm > 350) throw new IOException("A sample is outside the supported heart-rate range; no preview was uploaded.");
                                String time = sample.getTime().truncatedTo(ChronoUnit.MILLIS).toString();
                                JSONObject normalized = new JSONObject().put("device", name).put("metric", "heartRate").put("value", bpm).put("unit", "bpm").put("at", time);
                                String key = name + "|" + time;
                                JSONObject old = collected.putIfAbsent(key, normalized);
                                if (old != null && old.getLong("value") != bpm) throw new IOException("Conflicting source samples have the same device/time. Choose a shorter window.");
                                if (collected.size() > 5000) throw new IOException("More than 5000 samples. Choose a shorter time window; nothing was uploaded.");
                            }
                        }
                        if (response.getNextPageToken() != -1) { readPage(generation, from, to, response.getNextPageToken(), collected); return; }
                        samples = new ArrayList<>(collected.values());
                        StringBuilder summary = new StringBuilder(samples.size() + " Samsung Health heart-rate samples.\nDevice identity comes from metadata and is not verified as Fit3.\n");
                        for (int i = 0; i < Math.min(10, samples.size()); i++) summary.append(samples.get(i).getLong("value")).append(" bpm · ").append(samples.get(i).getString("at")).append("\n");
                        if (samples.size() > 10) summary.append("Showing first 10. All samples in this selected window will be sent only after authorization.\n");
                        preview.setText(summary.toString()); busy = false; refresh();
                        show(samples.isEmpty() ? "No shared heart-rate samples. Sync Fit3 in Samsung Health and enable Samsung Health → Health Connect sharing." : "Review the preview, authorize upload and press Send.");
                    } catch (Exception e) { samples.clear(); finishError(generation, e); }
                }
                @Override public void onError(HealthConnectException error) { finishError(generation, new IOException("Health Connect read failed. Check permission and Samsung Health sharing.")); }
            });
        } catch (Exception error) { finishError(generation, error); }
    }
    private void upload() {
        if (cookie == null || busy || !consent.isChecked() || samples.isEmpty()) return;
        try {
            if (batches.isEmpty()) for (int start = 0; start < samples.size(); start += 500) {
                JSONArray array = new JSONArray(); for (int i = start; i < Math.min(start + 500, samples.size()); i++) array.put(samples.get(i));
                JSONObject body = new JSONObject().put("version", 1).put("source", "samsung").put("format", "samsung-health-connect-v1").put("quality", "unverified").put("samples", array);
                // Freeze each batch ID/content for retries, including after a lost acknowledgement.
                body.put("clientId", UUID.randomUUID().toString()); batches.add(body.toString());
            }
        } catch (Exception error) { show("Could not build upload batches."); return; }
        final int generation = epoch; final String destination = base, token = cookie, owner = crew;
        busy = true; refresh();
        worker.execute(() -> {
            try {
                while (batchIndex < batches.size()) {
                    if (generation != epoch) return;
                    HttpResult result = post(destination, "/me/wearables/imports", batches.get(batchIndex), token, owner);
                    JSONObject answer = new JSONObject(result.body);
                    if (!owner.equals(answer.getString("crewId"))) throw new IOException("Account mismatch; upload stopped.");
                    added += answer.getInt("added"); duplicates += answer.getInt("duplicates"); batchIndex++;
                }
                final String done = "Saved: " + added + " added, " + duplicates + " duplicates. Open Device integrations in Health7 and refresh history.";
                runOnUiThread(() -> { if (generation != epoch) return; busy = false; samples.clear(); batches.clear(); batchIndex = 0; consent.setChecked(false); refresh(); show(done); });
            } catch (Exception error) { finishError(generation, error); }
        });
    }
    private void finishError(int generation, Exception error) {
        runOnUiThread(() -> { if (generation != epoch || isFinishing()) return; busy = false; refresh(); show(error.getMessage() == null ? "Operation failed. Check the connection and retry." : error.getMessage()); });
    }
    private static final class HttpResult { String body, cookie; HttpResult(String body, String cookie) { this.body = body; this.cookie = cookie; } }
    private static HttpResult post(String base, String path, String body, String cookie, String crew) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(base + "/api/v1" + path).openConnection();
        connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(8000); connection.setReadTimeout(12000);
        connection.setRequestMethod("POST"); connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json"); connection.setRequestProperty("X-Requested-With", "Health7");
        if (cookie != null) connection.setRequestProperty("Cookie", cookie);
        if (crew != null) connection.setRequestProperty("X-Health7-Crew", crew);
        try {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8); connection.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream out = connection.getOutputStream()) { out.write(bytes); }
            int code = connection.getResponseCode();
            if (code == 401) throw new IOException("Sign-in failed or session expired. Sign out and sign in again.");
            if (code < 200 || code >= 300) throw new IOException("Health7 returned HTTP " + code + ". Retry remaining batches without rebuilding the preview.");
            String session = connection.getHeaderField("Set-Cookie"); if (session != null) session = session.split(";", 2)[0];
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            try (InputStream in = connection.getInputStream()) {
                byte[] chunk = new byte[4096]; int count;
                while ((count = in.read(chunk)) != -1) { if (buffer.size() + count > 131072) throw new IOException("Server response exceeded limit."); buffer.write(chunk, 0, count); }
            }
            return new HttpResult(new String(buffer.toByteArray(), StandardCharsets.UTF_8), session);
        } finally { connection.disconnect(); }
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == 8) show(checkSelfPermission(READ) == PackageManager.PERMISSION_GRANTED ? "Heart-rate read permission granted." : "Permission denied. No Health Connect data was read.");
    }
    @Override protected void onDestroy() { epoch++; cookie = null; crew = null; password.setText(""); samples.clear(); batches.clear(); worker.shutdown(); super.onDestroy(); }
}
