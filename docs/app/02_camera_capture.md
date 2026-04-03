# App Module 2: Camera Capture

Owner: P4 (Frontend Lead)

## Purpose

Record a 30-second video of the user's face using the phone's front camera,
show a live countdown, then send the video to the Python backend via the
API client. Navigate to Results screen with the response.

## Dependencies

- `expo-camera` — native camera access with video recording
- `expo-av` — video playback (used internally by expo-camera)
- Module 3 (`api.js`) must be ready for the upload call

## Screen Flow

```
CameraScreen
  1. Request camera permission (first time only)
  2. Show live camera preview (front-facing)
  3. User taps record button
  4. 30-second countdown overlay appears
  5. Recording stops automatically (or user taps stop early)
  6. Show "Analyzing..." loading state
  7. Upload video to POST /api/analyze
  8. Navigate to ResultsScreen with JSON response
```

## Implementation Guide

### `src/screens/CameraScreen.js`

```javascript
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert,
         ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../theme/colors';
import { analyzeVideo } from '../services/api';

const DURATION = 30;

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [seconds, setSeconds] = useState(DURATION);
  const camRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Permission gate
  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Camera access is needed to scan your face</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const start = async () => {
    if (!camRef.current) return;
    setRecording(true);
    setSeconds(DURATION);

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);

    try {
      const video = await camRef.current.recordAsync({
        maxDuration: DURATION,
        quality: '720p',
      });

      setRecording(false);
      clearInterval(timerRef.current);
      setAnalyzing(true);

      const result = await analyzeVideo(video.uri);
      setAnalyzing(false);
      navigation.replace('Results', { result });
    } catch (err) {
      setRecording(false);
      setAnalyzing(false);
      clearInterval(timerRef.current);
      Alert.alert('Error', err.message || 'Recording failed');
    }
  };

  const stop = () => camRef.current?.stopRecording();

  // Analyzing screen
  if (analyzing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.msg, { marginTop: 16 }]}>
          Analyzing cardiac signals...
        </Text>
        <Text style={styles.sub}>This may take 10-30 seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={camRef} style={styles.camera} facing="front" mode="video">
        {recording && (
          <View style={styles.overlay}>
            <View style={styles.timerRing}>
              <Text style={styles.timerNum}>{seconds}</Text>
            </View>
            <Text style={styles.hint}>Keep face centered • Stay still</Text>
          </View>
        )}
      </CameraView>

      <View style={styles.controls}>
        {!recording ? (
          <TouchableOpacity style={styles.recBtn} onPress={start}>
            <View style={styles.recDot} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.recBtn} onPress={stop}>
            <View style={styles.stopSquare} />
          </TouchableOpacity>
        )}
        <Text style={styles.sub}>
          {recording ? 'Tap to stop early' : 'Tap to start 30s recording'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000' },
  center:     { flex: 1, backgroundColor: COLORS.background,
                justifyContent: 'center', alignItems: 'center', padding: 32 },
  camera:     { flex: 1 },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)',
                justifyContent: 'center', alignItems: 'center' },
  timerRing:  { width: 110, height: 110, borderRadius: 55, borderWidth: 3,
                borderColor: COLORS.accent, justifyContent: 'center',
                alignItems: 'center' },
  timerNum:   { fontSize: 44, fontWeight: '700', color: '#fff' },
  hint:       { color: '#ddd', fontSize: 15, marginTop: 20 },
  controls:   { padding: 20, alignItems: 'center',
                backgroundColor: COLORS.background },
  recBtn:     { width: 68, height: 68, borderRadius: 34, borderWidth: 3,
                borderColor: '#fff', justifyContent: 'center',
                alignItems: 'center' },
  recDot:     { width: 52, height: 52, borderRadius: 26,
                backgroundColor: COLORS.danger },
  stopSquare: { width: 26, height: 26, borderRadius: 4,
                backgroundColor: COLORS.danger },
  msg:        { color: '#fff', fontSize: 16, textAlign: 'center' },
  sub:        { color: COLORS.textSecondary, marginTop: 10, fontSize: 13 },
  grantBtn:   { marginTop: 16, backgroundColor: COLORS.accent, paddingVertical: 14,
                paddingHorizontal: 32, borderRadius: 12 },
  grantText:  { color: '#fff', fontWeight: '600', fontSize: 15 },
});
```

### `src/components/RecordingTimer.js` (Optional reusable version)

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function RecordingTimer({ seconds }) {
  return (
    <View style={styles.ring}>
      <Text style={styles.num}>{seconds}</Text>
      <Text style={styles.label}>sec</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring:  { width: 110, height: 110, borderRadius: 55, borderWidth: 3,
           borderColor: COLORS.accent, justifyContent: 'center',
           alignItems: 'center' },
  num:   { fontSize: 44, fontWeight: '700', color: '#fff' },
  label: { fontSize: 12, color: '#aaa' },
});
```

## Key Design Decisions

- **Front camera** (`facing="front"`) — rPPG needs the face
- **720p** — good enough for skin color detection, smaller upload
- **30-second recording** — matches what the Python pipeline expects
- **`navigation.replace`** — prevents going back to camera from results
- **ActivityIndicator** during analysis — user knows something is happening

## Testing Checklist

- [ ] Camera permission prompt appears on first launch
- [ ] Live preview shows front camera feed
- [ ] Record button starts recording, countdown decrements
- [ ] Stop button ends recording early
- [ ] Auto-stops at 0 seconds
- [ ] "Analyzing..." loader appears after recording
- [ ] Navigates to Results with data after API response
- [ ] Shows error alert if server is unreachable
