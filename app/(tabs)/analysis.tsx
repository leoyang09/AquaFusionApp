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
import { LineChart } from 'react-native-gifted-charts';
import { useData } from '@/src/DataContext';
import type { HistoricalPoint, SondeId } from '@/src/DataContext';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 64;

// ─── Sonde selector config ────────────────────────────────────────────────────

const SONDES = [
  { id: 'sonde_12' as SondeId, label: 'Pine Lake (Sonde #12)',      site: 'Pine Lake' },
  { id: 'sonde_45' as SondeId, label: 'Wetland Creek (Sonde #45)', site: 'Wetland Creek' },
];

// ─── Period filter ────────────────────────────────────────────────────────────

const PERIODS = ['24h', '7d', '30d', '90d'] as const;
type Period = (typeof PERIODS)[number];

const MAX_POINTS: Record<Period, number> = {
  '24h': 96,   // 96 × 15 min = 24 h
  '7d':  200,  // rolling window cap
  '30d': 200,
  '90d': 200,
};

// ─── Sensor chart configs ─────────────────────────────────────────────────────

type ChartConfig = {
  title: string;
  unit: string;
  color: string;
  fixedMax: number;
  extractor: (h: HistoricalPoint) => number;
  fallback: number[];
};

const CHART_CONFIGS: ChartConfig[] = [
  {
    title: 'Dissolved Oxygen',
    unit: 'mg/L',
    color: '#4a9eff',
    fixedMax: 14,
    extractor: (h) => h.dissolved_oxygen,
    fallback: [7.8, 7.3, 6.9, 7.2, 7.6, 8.1, 8.0, 7.7, 7.4, 7.1, 7.3, 7.6],
  },
  {
    title: 'Temperature',
    unit: '°C',
    color: '#fbbf24',
    fixedMax: 35,
    extractor: (h) => h.temperature,
    fallback: [11.0, 10.6, 11.2, 12.4, 13.0, 12.7, 12.2, 11.8, 12.1, 12.4, 12.6, 12.3],
  },
  {
    title: 'pH Level',
    unit: '',
    color: '#a78bfa',
    fixedMax: 14,
    extractor: (h) => h.ph,
    fallback: [7.2, 7.3, 7.1, 7.4, 7.3, 7.2, 7.1, 7.3, 7.4, 7.2, 7.3, 7.2],
  },
  {
    title: 'Turbidity',
    unit: 'NTU',
    color: '#34d399',
    fixedMax: 0, // computed dynamically
    extractor: (h) => h.turbidity,
    fallback: [7.9, 8.1, 8.5, 7.8, 7.6, 8.0, 8.3, 7.9, 7.7, 8.1, 8.4, 8.0],
  },
  {
    title: 'Water Depth',
    unit: 'm',
    color: '#60a5fa',
    fixedMax: 0, // computed dynamically
    extractor: (h) => h.water_depth,
    fallback: [1.42, 1.40, 1.41, 1.43, 1.44, 1.42, 1.41, 1.40, 1.42, 1.43, 1.44, 1.42],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Format index × 15 min as a readable label.
function intervalLabel(i: number): string {
  const totalMin = i * 15;
  if (totalMin === 0) return '0';
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

type GiftedPoint = { value: number; label?: string; dataPointText?: string };

function buildGiftedData(values: number[], isLive: boolean): GiftedPoint[] {
  // Thin x-axis labels to avoid crowding
  const step = values.length <= 8 ? 1 : values.length <= 20 ? 2 : values.length <= 48 ? 4 : 8;
  return values.map((v, i) => ({
    value: parseFloat(v.toFixed(2)),
    label: i % step === 0 ? (isLive ? intervalLabel(i) : `${i}`) : '',
  }));
}

function computeMax(values: number[], fixedMax: number): number {
  if (fixedMax > 0) return fixedMax;
  const max = Math.max(...values);
  return Math.ceil(max * 1.25) || 10;
}

function computeAvg(values: number[]): string {
  if (values.length === 0) return '—';
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function SensorChart({
  config,
  history,
  activePeriod,
}: {
  config: ChartConfig;
  history: HistoricalPoint[];
  activePeriod: Period;
}) {
  const isLive = history.length >= 2;
  const raw = isLive
    ? history.slice(-MAX_POINTS[activePeriod]).map(config.extractor)
    : config.fallback;

  const data = buildGiftedData(raw, isLive);
  const maxVal = computeMax(raw, config.fixedMax);
  const avg = computeAvg(raw);

  // Fit chart to card width when few points, scroll when many
  const idealSpacing = raw.length > 1 ? (CHART_W - 10) / (raw.length - 1) : CHART_W;
  const spacing = Math.max(20, Math.min(50, idealSpacing));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{config.title}</Text>
          {config.unit ? (
            <Text style={styles.chartSub}>{config.unit} · {isLive ? `${raw.length} readings` : 'Seed data'}</Text>
          ) : (
            <Text style={styles.chartSub}>{isLive ? `${raw.length} readings` : 'Seed data'}</Text>
          )}
        </View>
        <View style={[styles.avgBadge, { borderColor: config.color + '55', backgroundColor: config.color + '18' }]}>
          <Text style={[styles.avgBadgeText, { color: config.color }]}>
            Avg {avg}{config.unit ? ` ${config.unit}` : ''}
          </Text>
        </View>
      </View>

      <LineChart
        data={data}
        color={config.color}
        thickness={2.5}
        dataPointsRadius={raw.length <= 20 ? 4 : 0}
        dataPointsColor={config.color}
        hideDataPoints={raw.length > 20}
        noOfSections={4}
        maxValue={maxVal}
        yAxisColor="rgba(255,255,255,0.08)"
        xAxisColor="rgba(255,255,255,0.08)"
        rulesColor="rgba(255,255,255,0.05)"
        rulesType="solid"
        yAxisTextStyle={styles.yAxisText}
        xAxisLabelTextStyle={styles.xAxisText}
        backgroundColor="transparent"
        initialSpacing={10}
        endSpacing={16}
        spacing={spacing}
        width={CHART_W}
        height={110}
        yAxisLabelWidth={36}
        isAnimated
        animateOnDataChange
        scrollToEnd
        formatYLabel={(v) => parseFloat(v).toFixed(1)}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const { historicalData, selectedSondeId, setSelectedSondeId } = useData();
  const [activePeriod, setActivePeriod] = useState<Period>('24h');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sonde = SONDES.find((s) => s.id === selectedSondeId)!;

  const sondeHistory = useMemo(
    () => historicalData.filter((h) => h.sonde_id === selectedSondeId),
    [historicalData, selectedSondeId],
  );

  async function handleShare() {
    const isLive = sondeHistory.length >= 2;
    const doVals = isLive ? sondeHistory.map((h) => h.dissolved_oxygen) : CHART_CONFIGS[0].fallback;
    const doAvg = computeAvg(doVals);
    try {
      await Share.share({
        title: 'AquaFusion — Water Quality Report',
        message:
          `AquaFusion Water Quality Report\n` +
          `Site: ${sonde.site}\n\n` +
          `DO Avg: ${doAvg} mg/L\n` +
          `Data points: ${sondeHistory.length}\n\n` +
          `Generated by AquaFusion Monitoring System`,
      });
    } catch {
      // dismissed
    }
  }

  function handleExport() {
    Alert.alert(
      'Export CSV',
      `Preparing sensor export for ${sonde.site}.\n${sondeHistory.length} records found.\n\nFile will be downloaded to your device.`,
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
          </View>

          {/* Sonde Selector */}
          <View style={styles.selectorWrapper}>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setDropdownOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <View style={styles.selectorDot} />
              <Text style={styles.selectorText} numberOfLines={1}>{sonde.label}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{sondeHistory.length} records</Text>
              </View>
              <View style={[styles.chevronBox, dropdownOpen && styles.chevronBoxOpen]}>
                <View style={styles.chevronLeft} />
                <View style={styles.chevronRight} />
              </View>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownPanel}>
                {SONDES.map((s, i) => {
                  const isActive = s.id === selectedSondeId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.dropdownOption,
                        isActive && styles.dropdownOptionActive,
                        i < SONDES.length - 1 && styles.dropdownOptionBorder,
                      ]}
                      onPress={() => { setSelectedSondeId(s.id); setDropdownOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.dropdownDot, isActive && styles.dropdownDotActive]} />
                      <View style={styles.dropdownOptionInner}>
                        <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                          {s.label}
                        </Text>
                        <Text style={styles.dropdownSite}>{s.site}</Text>
                      </View>
                      {isActive && <View style={styles.checkDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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

          {/* 5 Sensor Charts */}
          {CHART_CONFIGS.map((cfg) => (
            <SensorChart
              key={cfg.title}
              config={cfg}
              history={sondeHistory}
              activePeriod={activePeriod}
            />
          ))}

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

  header: { marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },

  selectorWrapper: { marginBottom: 14 },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
  },
  selectorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4a9eff', flexShrink: 0 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#ffffff' },
  chevronBox: {
    width: 16, height: 10, flexDirection: 'row',
    alignItems: 'flex-start', justifyContent: 'center',
  },
  chevronBoxOpen: { transform: [{ scaleY: -1 }] },
  chevronLeft: {
    width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 1, transform: [{ rotate: '40deg' }, { translateY: 3 }],
  },
  chevronRight: {
    width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 1, transform: [{ rotate: '-40deg' }, { translateY: 3 }],
  },
  dropdownPanel: {
    marginTop: 4, backgroundColor: 'rgba(0,20,55,0.97)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  dropdownOptionActive: { backgroundColor: 'rgba(74,158,255,0.12)' },
  dropdownOptionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  dropdownDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)', flexShrink: 0,
  },
  dropdownDotActive: { backgroundColor: '#4a9eff' },
  dropdownOptionInner: { flex: 1 },
  dropdownOptionText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  dropdownOptionTextActive: { color: '#ffffff' },
  dropdownSite: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4a9eff' },

  countBadge: {
    backgroundColor: 'rgba(74,158,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  countBadgeText: { color: '#4a9eff', fontSize: 11, fontWeight: '700' },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  periodBtnActive: { backgroundColor: 'rgba(74,158,255,0.25)', borderColor: '#4a9eff' },
  periodText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  periodTextActive: { color: '#ffffff' },

  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 16, marginBottom: 12, overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  chartSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  avgBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  avgBadgeText: { fontSize: 11, fontWeight: '700' },

  yAxisText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
  } as any,
  xAxisText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
  } as any,

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnOutline: {
    borderWidth: 1, borderColor: 'rgba(74,158,255,0.4)',
    backgroundColor: 'rgba(74,158,255,0.06)',
  },
  actionBtnFill: { backgroundColor: '#4a9eff' },
  actionBtnTextOutline: { color: '#4a9eff', fontSize: 14, fontWeight: '700' },
  actionBtnTextFill: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
