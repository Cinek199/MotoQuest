package pl.motoquest.app;

import android.Manifest;
import android.app.Activity;
import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Rational;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

@CapacitorPlugin(name = "MotoQuestNative")
public class MotoQuestNativePlugin extends Plugin {
    @PluginMethod
    public void startBackgroundTracking(PluginCall call) {
        if (
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            call.reject("LOCATION_PERMISSION_REQUIRED");
            return;
        }

        Intent intent = new Intent(getContext(), BackgroundLocationService.class);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stopBackgroundTracking(PluginCall call) {
        Intent intent = new Intent(getContext(), BackgroundLocationService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void drainLocations(PluginCall call) {
        String saved = BackgroundLocationService.drainPoints(getContext());

        try {
            JSObject result = new JSObject();
            result.put("points", new JSArray(saved));
            call.resolve(result);
        } catch (JSONException error) {
            call.reject("INVALID_LOCATION_QUEUE", error);
        }
    }

    @PluginMethod
    public void enterPictureInPicture(PluginCall call) {
        Activity activity = getActivity();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("PICTURE_IN_PICTURE_UNAVAILABLE");
            return;
        }

        PictureInPictureParams params = new PictureInPictureParams.Builder()
            .setAspectRatio(new Rational(9, 16))
            .build();

        boolean entered = activity.enterPictureInPictureMode(params);

        if (!entered) {
            call.reject("PICTURE_IN_PICTURE_FAILED");
            return;
        }

        call.resolve();
    }
}
