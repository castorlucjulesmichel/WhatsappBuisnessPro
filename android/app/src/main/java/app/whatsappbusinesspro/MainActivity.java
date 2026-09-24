package app.whatsappbusinesspro;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final int CONTACTS_PERMISSION_REQUEST = 501;
    private static final String APP_URL =
            "https://castorlucjulesmichel.github.io/WhatsappBuisnessPro/?android=1";
    private static final String TRUSTED_HOST = "castorlucjulesmichel.github.io";

    private WebView webView;
    private boolean pendingContactImport = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                String host = request.getUrl().getHost();
                return host == null || !TRUSTED_HOST.equalsIgnoreCase(host);
            }
        });

        webView.addJavascriptInterface(new ContactsBridge(), "AndroidContacts");
        webView.loadUrl(APP_URL);
    }

    public final class ContactsBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public void importAllContacts() {
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.READ_CONTACTS)
                        == PackageManager.PERMISSION_GRANTED) {
                    sendAllContactsToWeb();
                } else {
                    pendingContactImport = true;
                    requestPermissions(
                            new String[]{Manifest.permission.READ_CONTACTS},
                            CONTACTS_PERMISSION_REQUEST
                    );
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != CONTACTS_PERMISSION_REQUEST) return;

        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;

        if (granted && pendingContactImport) {
            pendingContactImport = false;
            sendAllContactsToWeb();
        } else {
            pendingContactImport = false;
            webView.evaluateJavascript(
                    "window.WBP_ANDROID_CONTACTS_DENIED && window.WBP_ANDROID_CONTACTS_DENIED();",
                    null
            );
        }
    }

    private void sendAllContactsToWeb() {
        new Thread(() -> {
            JSONArray contacts = readContacts();
            String payload = JSONObject.quote(contacts.toString());
            runOnUiThread(() -> webView.evaluateJavascript(
                    "window.WBP_ANDROID_CONTACTS_IMPORTED && " +
                    "window.WBP_ANDROID_CONTACTS_IMPORTED(" + payload + ");",
                    null
            ));
        }).start();
    }

    private JSONArray readContacts() {
        Map<String, JSONObject> unique = new LinkedHashMap<>();

        String[] projection = new String[]{
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
        };

        try (Cursor cursor = getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )) {
            if (cursor == null) return new JSONArray();

            int nameIndex = cursor.getColumnIndex(
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
            );
            int phoneIndex = cursor.getColumnIndex(
                    ContactsContract.CommonDataKinds.Phone.NUMBER
            );

            while (cursor.moveToNext()) {
                String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "Contact";
                String phone = phoneIndex >= 0 ? cursor.getString(phoneIndex) : "";
                if (phone == null || phone.trim().isEmpty()) continue;

                String normalized = phone.replaceAll("[^0-9+]", "");
                if (normalized.startsWith("00")) {
                    normalized = "+" + normalized.substring(2);
                }
                if (normalized.isEmpty()) continue;

                try {
                    JSONObject item = new JSONObject();
                    item.put("name", name == null || name.trim().isEmpty() ? "Contact" : name.trim());
                    item.put("phone", normalized);
                    unique.put(normalized, item);
                } catch (Exception ignored) {}
            }
        } catch (SecurityException ignored) {}

        JSONArray result = new JSONArray();
        for (JSONObject item : unique.values()) result.put(item);
        return result;
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
