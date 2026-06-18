package pl.motoquest.app;

import android.Manifest;
import android.graphics.Color;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(MotoQuestNativePlugin.class);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setAppVisible(true);

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                2307
            );
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        setAppVisible(true);
    }

    @Override
    public void onPause() {
        setAppVisible(false);
        super.onPause();
    }

    private void setAppVisible(boolean visible) {
        getSharedPreferences(BackgroundLocationService.PREFERENCES, MODE_PRIVATE)
            .edit()
            .putBoolean(BackgroundLocationService.APP_VISIBLE_KEY, visible)
            .apply();
    }
}
