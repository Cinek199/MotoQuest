package pl.motoquest.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BackgroundLocationService extends Service implements LocationListener {
    public static final String PREFERENCES = "motoquest_background_tracking";
    public static final String POINTS_KEY = "location_points";
    public static final String APP_VISIBLE_KEY = "app_visible";

    private static final String CHANNEL_ID = "motoquest_tracking";
    private static final int NOTIFICATION_ID = 2307;
    private static final long UPDATE_INTERVAL_MS = 3000L;
    private static final float MIN_DISTANCE_METERS = 5f;
    private static final int MAX_POINTS = 10000;
    private static final Object POINTS_LOCK = new Object();

    private LocationManager locationManager;

    public static String drainPoints(Context context) {
        synchronized (POINTS_LOCK) {
            String saved = context
                .getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                .getString(POINTS_KEY, "[]");

            context
                .getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                .edit()
                .putString(POINTS_KEY, "[]")
                .commit();

            return saved;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                : 0
        );
        startLocationUpdates();
        return START_STICKY;
    }

    private void startLocationUpdates() {
        if (
            ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            stopSelf();
            return;
        }

        requestProvider(LocationManager.GPS_PROVIDER);
        requestProvider(LocationManager.NETWORK_PROVIDER);
    }

    private void requestProvider(String provider) {
        try {
            if (locationManager.isProviderEnabled(provider)) {
                locationManager.requestLocationUpdates(
                    provider,
                    UPDATE_INTERVAL_MS,
                    MIN_DISTANCE_METERS,
                    this
                );
            }
        } catch (IllegalArgumentException | SecurityException ignored) {}
    }

    @Override
    public void onLocationChanged(Location location) {
        boolean appVisible = getSharedPreferences(PREFERENCES, MODE_PRIVATE)
            .getBoolean(APP_VISIBLE_KEY, true);

        if (appVisible || location.getAccuracy() > 100f) {
            return;
        }

        synchronized (POINTS_LOCK) {
            String saved = getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                .getString(POINTS_KEY, "[]");

            try {
                JSONArray points = new JSONArray(saved);

                while (points.length() >= MAX_POINTS) {
                    points.remove(0);
                }

                JSONObject point = new JSONObject();
                point.put("lat", location.getLatitude());
                point.put("lon", location.getLongitude());
                point.put("accuracy", location.getAccuracy());
                point.put("speed", location.hasSpeed() ? location.getSpeed() : JSONObject.NULL);
                point.put("bearing", location.hasBearing() ? location.getBearing() : JSONObject.NULL);
                point.put("timestamp", location.getTime());
                points.put(point);

                getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                    .edit()
                    .putString(POINTS_KEY, points.toString())
                    .apply();
            } catch (JSONException ignored) {}
        }
    }

    private Notification buildNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("MotoQuest")
            .setContentText("Odkrywanie mapy dziala w tle")
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Odkrywanie trasy",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Lokalizacja MotoQuest podczas jazdy w tle");

        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
