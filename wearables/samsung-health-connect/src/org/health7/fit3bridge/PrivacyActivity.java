package org.health7.fit3bridge;
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public final class PrivacyActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        TextView text = new TextView(this); text.setPadding(32, 56, 32, 32); text.setTextSize(18);
        text.setText("Health7 Fit3 Bridge — local test prototype\n\nReads only heart-rate records shared by Samsung Health through Health Connect, after you grant permission.\n\nA preview is shown before upload. Only after confirmation are the measurements sent to your chosen Health7 server and account.\n\nThere is no background sync, no advertising SDK, no external analytics and no storage of your password or session on disk. The API receives the declared Samsung Health origin; device identity is not independently verified.\n\nUse HTTPS for a deployed server. HTTP is accepted only for a private-network development server. Not a medical device.\n\nRevoke permission in Android Health Connect or sign out here to stop access. Data already uploaded remains in your Health7 database.");
        setContentView(text);
    }
}
