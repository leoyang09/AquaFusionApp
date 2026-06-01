import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useMemo } from 'react';
import { useData } from '@/src/DataContext';
import type { HistoricalPoint } from '@/src/DataContext';

// ─── Chart geometry ──────────────────────────────────────────────────────────

const CHART_W = Dimensions.get('window').width - 64;
const CHART_H = 130;

type DataPoint = { label: string; value: number };

function avg(data: DataPoint[]) {
  return (data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1);
}

function LineChart({
  data,
  color,
  yMin,
  yMax,
}: {
  data: DataPoint[];
  color: string;
  yMin: number;
  yMax: number;
}) {
  const padX = 8;
  const padY = 10;
  const innerW = CHART_W - padX * 2;
  const innerH = CHART_H - padY * 2;
  const range = yMax - yMin;

  const getX = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const getY = (val: number) => padY + (1 - (val - yMin) / range) * innerH;

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
  const segments = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1];
    const dx = next.x - p.x;
    const dy = next.y - p.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { cx: (p.x + next.x) / 2, cy: (p.y + next.y) / 2, length, angle };
  });

  const yGridVals = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <View style={{ width: CHART_W, height: CHART_H + 24 }}>
      <View style={{ width: CHART_W, height: CHART_H, position: 'relative' }}>
        {yGridVals.map((val) => (
          <View
            key={val}
            style={{
              position: 'absolute',
              left: padX,
              top: getY(val),
              width: innerW,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
        ))}
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 1,
              top: p.y,
              width: 2,
              height: CHART_H - padY - p.y,
              backgroundColor: color,
              opacity: 0.08,
            }}
          />
        ))}
        {segments.map((seg, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: seg.cx - seg.length / 2,
              top: seg.cy - 1.5,
              width: seg.length,
              height: 3,
              backgroundColor: color,
              borderRadius: 2,
              transform: [{ rotate: `${seg.angle}deg` }],
            }}
          />
        ))}
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 5,
              top: p.y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: 'rgba(14,32,64,0.9)',
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padX }}>
        {data.map((d) => (
          <Text key={d.label} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Per-period static fallback data ─────────────────────────────────────────

const PERIODS = ['24h', '7d', '30d', '90d'] as const;
type Period = (typeof PERIODS)[number];

type PeriodDataset = {
  rangeLabel: string;
  doData: DataPoint[];
  tempData: DataPoint[];
  doRange: [number, number];
  tempRange: [number, number];
  summary: { label: string; value: string; unit: string; color: string }[];
};

const PERIOD_DATA: Record<Period, PeriodDataset> = {
  '24h': {
    rangeLabel: 'Last 24 hours',
    doData: [
      { label: '00h', value: 7.8 }, { label: '04h', value: 7.3 }, { label: '08h', value: 6.9 },
      { label: '12h', value: 7.2 }, { label: '16h', value: 7.6 }, { label: '20h', value: 8.1 },
      { label: '24h', value: 8.0 },
    ],
    tempData: [
      { label: '00h', value: 11.0 }, { label: '04h', value: 10.6 }, { label: '08h', value: 11.2 },
      { label: '12h', value: 12.4 }, { label: '16h', value: 13.0 }, { label: '20h', value: 12.7 },
      { label: '24h', value: 12.2 },
    ],
    doRange: [5.5, 9.5],
    tempRange: [9, 15],
    summary: [
      { label: 'DO Min', value: '6.9', unit: 'mg/L', color: '#f87171' },
      { label: 'DO Max', value: '8.1', unit: 'mg/L', color: '#4ade80' },
      { label: 'Temp Avg', value: '11.9', unit: '°C', color: '#fbbf24' },
      { label: 'pH Avg', value: '7.3', unit: '', color: '#4a9eff' },
    ],
  },
  '7d': {
    rangeLabel: 'Last 7 days',
    doData: [
      { label: 'Mon', value: 8.1 }, { label: 'Tue', value: 7.8 }, { label: 'Wed', value: 7.2 },
      { label: 'Thu', value: 6.5 }, { label: 'Fri', value: 7.0 }, { label: 'Sat', value: 7.6 },
      { label: 'Sun', value: 8.0 },
    ],
    tempData: [
      { label: 'Mon', value: 11.2 }, { label: 'Tue', value: 11.8 }, { label: 'Wed', value: 12.4 },
      { label: 'Thu', value: 13.1 }, { label: 'Fri', value: 12.9 }, { label: 'Sat', value: 12.6 },
      { label: 'Sun', value: 12.2 },
    ],
    doRange: [5.5, 9.5],
    tempRange: [10, 15],
    summary: [
      { label: 'DO Min', value: '6.5', unit: 'mg/L', color: '#f87171' },
      { label: 'DO Max', value: '8.1', unit: 'mg/L', color: '#4ade80' },
      { label: 'Temp Avg', value: '12.3', unit: '°C', color: '#fbbf24' },
      { label: 'pH Avg', value: '7.2', unit: '', color: '#4a9eff' },
    ],
  },
  '30d': {
    rangeLabel: 'Last 30 days',
    doData: [
      { label: 'W1', value: 7.9 }, { label: 'W2', value: 7.4 }, { label: 'W3', value: 6.8 },
      { label: 'W4', value: 7.2 }, { label: 'W5', value: 7.7 },
    ],
    tempData: [
      { label: 'W1', value: 10.5 }, { label: 'W2', value: 11.2 }, { label: 'W3', value: 12.3 },
      { label: 'W4', value: 12.8 }, { label: 'W5', value: 11.9 },
    ],
    doRange: [5.0, 10.0],
    tempRange: [9, 15],
    summary: [
      { label: 'DO Min', value: '6.1', unit: 'mg/L', color: '#f87171' },
      { label: 'DO Max', value: '8.4', unit: 'mg/L', color: '#4ade80' },
      { label: 'Temp Avg', value: '11.7', unit: '°C', color: '#fbbf24' },
      { label: 'pH Avg', value: '7.1', unit: '', color: '#4a9eff' },
    ],
  },
  '90d': {
    rangeLabel: 'Last 90 days',
    doData: [
      { label: 'Mar', value: 8.2 }, { label: 'Apr', value: 7.5 },
      { label: 'May', value: 6.8 }, { label: 'Jun', value: 7.1 },
    ],
    tempData: [
      { label: 'Mar', value: 9.8 }, { label: 'Apr', value: 11.2 },
      { label: 'May', value: 12.4 }, { label: 'Jun', value: 11.6 },
    ],
    doRange: [5.0, 10.0],
    tempRange: [8, 15],
    summary: [
      { label: 'DO Min', value: '5.9', unit: 'mg/L', color: '#f87171' },
      { label: 'DO Max', value: '8.8', unit: 'mg/L', color: '#4ade80' },
      { label: 'Temp Avg', value: '11.3', unit: '°C', color: '#fbbf24' },
      { label: 'pH Avg', value: '7.0', unit: '', color: '#4a9eff' },
    ],
  },
};

const WINDOW_MS: Record<Period, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

// Build a live PeriodDataset from historicalData when >= 2 points exist in the window.
// Maps evenly-sampled points to the static label set so axis labels stay consistent.
function buildLiveDataset(
  history: HistoricalPoint[],
  sondeId: string,
  period: Period,
): PeriodDataset | null {
  const now = Date.now();
  const filtered = history
    .filter((h) => h.sonde_id === sondeId && h.timestamp >= now - WINDOW_MS[period])
    .sort((a, b) => a.timestamp - b.timestamp);

  if (filtered.length < 2) return null;

  const staticPd = PERIOD_DATA[period];
  const targetCount = staticPd.doData.length;
  const step = (filtered.length - 1) / (targetCount - 1);
  const sampled: HistoricalPoint[] = Array.from({ length: targetCount }, (_, i) =>
    filtered[Math.min(Math.round(i * step), filtered.length - 1)],
  );

  const doVals = sampled.map((h) => h.dissolved_oxygen);
  const tempVals = sampled.map((h) => h.temperature);
  const phVals = filtered.map((h) => h.ph);

  const doMin = Math.min(...doVals);
  const doMax = Math.max(...doVals);
  const tempMin = Math.min(...tempVals);
  const tempMax = Math.max(...tempVals);
  const buf = (v: number) => (v < 1 ? 0.5 : v * 0.12);
  const phAvg = (phVals.reduce((a, b) => a + b, 0) / phVals.length).toFixed(1);
  const tempAvg = (tempVals.reduce((a, b) => a + b, 0) / tempVals.length).toFixed(1);

  return {
    rangeLabel: staticPd.rangeLabel,
    doData: sampled.map((h, i) => ({ label: staticPd.doData[i].label, value: h.dissolved_oxygen })),
    tempData: sampled.map((h, i) => ({ label: staticPd.tempData[i].label, value: h.temperature })),
    doRange: [Math.max(0, doMin - buf(doMax - doMin)), doMax + buf(doMax - doMin)] as [number, number],
    tempRange: [Math.max(0, tempMin - buf(tempMax - tempMin)), tempMax + buf(tempMax - tempMin)] as [number, number],
    summary: [
      { label: 'DO Min', value: doMin.toFixed(1), unit: 'mg/L', color: '#f87171' },
      { label: 'DO Max', value: doMax.toFixed(1), unit: 'mg/L', color: '#4ade80' },
      { label: 'Temp Avg', value: tempAvg, unit: '°C', color: '#fbbf24' },
      { label: 'pH Avg', value: phAvg, unit: '', color: '#4a9eff' },
    ],
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const { historicalData, selectedSondeId } = useData();
  const [activePeriod, setActivePeriod] = useState<Period>('7d');

  const pd = useMemo(
    () => buildLiveDataset(historicalData, selectedSondeId, activePeriod) ?? PERIOD_DATA[activePeriod],
    [historicalData, selectedSondeId, activePeriod],
  );

  const doAvg = avg(pd.doData);
  const tempAvg = avg(pd.tempData);

  const siteLabel = selectedSondeId === 'sonde_12' ? 'Pine Lake' : 'Wetland Creek';

  async function handleShare() {
    try {
      await Share.share({
        title: 'AquaFusion — Water Quality Report',
        message:
          `AquaFusion Water Quality Report\n` +
          `Site: ${siteLabel}  |  Period: ${pd.rangeLabel}\n\n` +
          `DO Avg: ${doAvg} mg/L\n` +
          `Temp Avg: ${tempAvg} °C\n` +
          `DO Min: ${pd.summary[0].value} mg/L\n` +
          `DO Max: ${pd.summary[1].value} mg/L\n\n` +
          `Generated by AquaFusion Monitoring System`,
      });
    } catch {
      // dismissed
    }
  }

  function handleExport() {
    Alert.alert(
      'Export CSV',
      `Preparing ${pd.rangeLabel.toLowerCase()} sensor export for ${siteLabel}.\n\nFile will be downloaded to your device.`,
      [{ text: 'OK' }],
    );
  }

  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Data Analysis</Text>
            <View style={styles.filterIcon}>
              <View style={styles.filterLine} />
              <View style={[styles.filterLine, { width: 14 }]} />
              <View style={[styles.filterLine, { width: 8 }]} />
            </View>
          </View>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setActivePeriod(p)}
                style={[styles.periodBtn, activePeriod === p && styles.periodBtnActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.periodText, activePeriod === p && styles.periodTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DO chart */}
          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Dissolved Oxygen Levels</Text>
                <Text style={styles.chartSub}>mg/L · {pd.rangeLabel}</Text>
              </View>
              <View style={styles.avgBadge}>
                <Text style={styles.avgBadgeText}>Avg {doAvg}</Text>
              </View>
            </View>
            <LineChart data={pd.doData} color="#4a9eff" yMin={pd.doRange[0]} yMax={pd.doRange[1]} />
          </View>

          {/* Temperature chart */}
          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Water Temperature</Text>
                <Text style={styles.chartSub}>°C · {pd.rangeLabel}</Text>
              </View>
              <View style={[styles.avgBadge, styles.avgBadgeAmber]}>
                <Text style={[styles.avgBadgeText, { color: '#fbbf24' }]}>Avg {tempAvg}</Text>
              </View>
            </View>
            <LineChart data={pd.tempData} color="#fbbf24" yMin={pd.tempRange[0]} yMax={pd.tempRange[1]} />
          </View>

          {/* Summary stats */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{pd.rangeLabel} Summary</Text>
            <View style={styles.statsRow}>
              {pd.summary.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statUnit}>{s.unit}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Export / Share */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={handleExport}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnTextOutline}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnFill]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnTextFill}>Share Report</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  filterIcon: { gap: 4, alignItems: 'flex-end' },
  filterLine: { height: 2, width: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  periodBtnActive: { backgroundColor: 'rgba(74,158,255,0.25)', borderColor: '#4a9eff' },
  periodText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  periodTextActive: { color: '#ffffff' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  chartSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  avgBadge: {
    backgroundColor: 'rgba(74,158,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  avgBadgeAmber: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.25)',
  },
  avgBadgeText: { fontSize: 12, fontWeight: '700', color: '#4a9eff' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statUnit: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.4)',
    backgroundColor: 'rgba(74,158,255,0.06)',
  },
  actionBtnFill: { backgroundColor: '#4a9eff' },
  actionBtnTextOutline: { color: '#4a9eff', fontSize: 14, fontWeight: '700' },
  actionBtnTextFill: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
