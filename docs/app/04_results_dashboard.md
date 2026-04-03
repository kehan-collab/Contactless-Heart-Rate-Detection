# App Module 4: Results Dashboard

Owner: P4 (Frontend Lead)

## Purpose

Display all analysis results in a polished, dark-themed dashboard.
Shows BPM, signal quality, HRV metrics, stress level, BVP waveform chart,
and any warnings from the backend.

## Screen Layout

```
┌─────────────────────────────────┐
│  💓  74 BPM        SQI: 🟢 82% │  ← BPMDisplay + SQIBadge
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │  BVP Waveform chart         ││  ← WaveformChart
│  │  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~││
│  └─────────────────────────────┘│
├───────────┬───────────┬─────────┤
│  RMSSD    │  SDNN     │ pNN50   │  ← HRVMetricsGrid
│  42.1 ms  │  51.3 ms  │ 18.5%   │
├───────────┼───────────┼─────────┤
│  LF/HF   │  Mean HR  │         │
│  1.4      │  74 BPM   │         │
├───────────┴───────────┴─────────┤
│  🟢 Stress: LOW                 │  ← StressIndicator
│  Confidence: 72%                │
├─────────────────────────────────┤
│  🤖 AI Insights                 │  ← AIInsightsCard (Module 6)
│  "Your heart rate is normal..." │
├─────────────────────────────────┤
│  ⚠️ Warnings (if any)           │
└─────────────────────────────────┘
```

## Implementation Guide

### `src/screens/ResultsScreen.js`

```javascript
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import BPMDisplay from '../components/BPMDisplay';
import SQIBadge from '../components/SQIBadge';
import WaveformChart from '../components/WaveformChart';
import HRVMetricsGrid from '../components/HRVMetricsGrid';
import StressIndicator from '../components/StressIndicator';

export default function ResultsScreen({ route }) {
  const { result } = route.params;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Top row: BPM + SQI */}
      <View style={styles.topRow}>
        <BPMDisplay bpm={result.bpm} />
        <SQIBadge score={result.sqi_score} level={result.sqi_level} />
      </View>

      {/* BVP Waveform */}
      <WaveformChart data={result.bvp_waveform} sqi={result.sqi_level} />

      {/* HRV Metrics */}
      {result.hrv ? (
        <HRVMetricsGrid hrv={result.hrv} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.unavailable}>HRV data unavailable</Text>
        </View>
      )}

      {/* Stress Level */}
      <StressIndicator
        level={result.stress_level}
        confidence={result.stress_confidence}
      />

      {/* Warnings */}
      {result.warnings?.length > 0 && (
        <View style={styles.warningBox}>
          {result.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
          ))}
        </View>
      )}

      {/* Processing time */}
      <Text style={styles.meta}>
        Processed in {(result.processing_time_ms / 1000).toFixed(1)}s
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: COLORS.background },
  content:  { padding: 16, paddingBottom: 40 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16 },
  card:     { backgroundColor: COLORS.card, borderRadius: 12,
              borderWidth: 1, borderColor: COLORS.cardBorder, padding: 20,
              marginBottom: 12 },
  unavailable: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14 },
  warningBox: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 12,
                borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)',
                padding: 16, marginBottom: 12 },
  warningText: { color: COLORS.warning, fontSize: 13, marginBottom: 4 },
  meta: { color: COLORS.textMuted, textAlign: 'center', fontSize: 11,
          marginTop: 8 },
});
```

### `src/components/BPMDisplay.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function BPMDisplay({ bpm }) {
  return (
    <View>
      <Text style={styles.value}>{bpm != null ? Math.round(bpm) : '--'}</Text>
      <Text style={styles.label}>BPM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: 56, fontWeight: '700', color: COLORS.textPrimary },
  label: { fontSize: 14, color: COLORS.textSecondary, marginTop: -4 },
});
```

### `src/components/SQIBadge.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const SQI_COLORS = { HIGH: COLORS.sqiHigh, MEDIUM: COLORS.sqiMedium, LOW: COLORS.sqiLow };

export default function SQIBadge({ score, level }) {
  const color = SQI_COLORS[level] || COLORS.textMuted;
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.text, { color }]}>
        {level} ({Math.round(score * 100)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6,
         shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8,
         shadowRadius: 6, elevation: 4 },
  text: { fontSize: 13, fontWeight: '500' },
});
```

### `src/components/HRVMetricsGrid.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

function MetricCard({ label, value, unit }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {value != null ? value : '--'}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
    </View>
  );
}

export default function HRVMetricsGrid({ hrv }) {
  return (
    <View style={styles.grid}>
      <MetricCard label="RMSSD"  value={hrv.rmssd}       unit="ms"  />
      <MetricCard label="SDNN"   value={hrv.sdnn}        unit="ms"  />
      <MetricCard label="pNN50"  value={hrv.pnn50}       unit="%"   />
      <MetricCard label="LF/HF"  value={hrv.lf_hf_ratio} unit=""    />
      <MetricCard label="Mean HR" value={hrv.mean_hr}    unit="BPM" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap',
           justifyContent: 'space-between', marginBottom: 12 },
  card:  { width: '48%', backgroundColor: COLORS.card, borderRadius: 12,
           borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16,
           marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary },
  unit:  { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
});
```

### `src/components/StressIndicator.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const STRESS = {
  LOW:      { color: COLORS.stressLow,  bg: 'rgba(52,211,153,0.1)',
              border: 'rgba(52,211,153,0.3)', emoji: '🟢' },
  MODERATE: { color: COLORS.stressMod,  bg: 'rgba(251,191,36,0.1)',
              border: 'rgba(251,191,36,0.3)', emoji: '🟡' },
  HIGH:     { color: COLORS.stressHigh, bg: 'rgba(248,113,113,0.1)',
              border: 'rgba(248,113,113,0.3)', emoji: '🔴' },
  UNKNOWN:  { color: COLORS.textMuted,  bg: COLORS.card,
              border: COLORS.cardBorder, emoji: '⚪' },
};

export default function StressIndicator({ level, confidence }) {
  const s = STRESS[level] || STRESS.UNKNOWN;
  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={styles.emoji}>{s.emoji}</Text>
      <Text style={[styles.level, { color: s.color }]}>{level}</Text>
      <Text style={styles.conf}>Confidence: {Math.round(confidence * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { borderRadius: 12, borderWidth: 1, padding: 20,
           alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 28, marginBottom: 4 },
  level: { fontSize: 24, fontWeight: '700' },
  conf:  { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
});
```

### `src/components/WaveformChart.js`

```javascript
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../theme/colors';

const screenWidth = Dimensions.get('window').width - 32;

export default function WaveformChart({ data, sqi }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>No waveform data</Text>
      </View>
    );
  }

  // Downsample to ~100 points for performance
  const step = Math.max(1, Math.floor(data.length / 100));
  const sampled = data.filter((_, i) => i % step === 0);

  const color = sqi === 'LOW' ? COLORS.danger : COLORS.accent;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>BVP Waveform</Text>
      <LineChart
        data={{
          datasets: [{ data: sampled }],
        }}
        width={screenWidth - 32}
        height={160}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: () => color,
          propsForBackgroundLines: { stroke: 'transparent' },
        }}
        bezier
        style={{ borderRadius: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1,
           borderColor: COLORS.cardBorder, padding: 16, marginBottom: 12 },
  title: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  empty: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: 40 },
});
```

## Testing Checklist

- [ ] Results screen renders all sections when API returns full data
- [ ] BPM shows "--" when `bpm` is null
- [ ] Waveform chart renders and is not empty
- [ ] HRV grid shows all 5 metrics
- [ ] Stress indicator changes color based on level
- [ ] Warnings display in amber box when present
- [ ] Screen scrolls smoothly on long content
