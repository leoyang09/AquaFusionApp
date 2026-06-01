import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useData } from '@/src/DataContext';
import type { SondeId, MetricsState } from '@/src/DataContext';

// ─── Sonde display config ────────────────────────────────────────────────────

type SondeConfig = { id: SondeId; label: string; site: string; device: string };

const SONDES: SondeConfig[] = [
  { id: 'sonde_12', label: 'Pine Lake (Sonde #12)', site: 'Pine Lake', device: 'Sonde #12' },
  { id: 'sonde_45', label: 'Wetland Creek (Sonde #45)', site: 'Wetland Creek', device: 'Sonde #45' },
];

function getSonde(id: SondeId): SondeConfig {
  return SONDES.find((s) => s.id === id)!;
}

// ─── Per-sensor threshold evaluation ─────────────────────────────────────────

type SensorStatus = { label: string; color: string; bg: string };

const STATUS_OK:   SensorStatus = { label: 'Optimal',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)' };
const STATUS_WARN: SensorStatus = { label: 'Marginal',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
const STATUS_CRIT: SensorStatus = { label: 'Critical',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' };

function tempStatus(v: number): SensorStatus {
  if (v >= 10 && v <= 20) return { ...STATUS_OK };
  if (v >= 5  && v <= 25) return { ...STATUS_WARN, label: 'Marginal' };
  return { ...STATUS_CRIT, label: 'Out of Range' };
}
function doStatus(v: number): SensorStatus {
  if (v >= 7) return { ...STATUS_OK };
  if (v >= 5) return { ...STATUS_WARN, label: 'Low' };
  return { ...STATUS_CRIT, label: 'Hypoxic' };
}
function phStatus(v: number): SensorStatus {
  if (v >= 6.5 && v <= 8.5) return { ...STATUS_OK, label: 'Neutral' };
  if (v >= 5.5 && v <= 9.5) return { ...STATUS_WARN };
  return { ...STATUS_CRIT };
}
function turbStatus(v: number): SensorStatus {
  if (v <= 10) return { ...STATUS_OK, label: 'Clear' };
  if (v <= 25) return { ...STATUS_WARN, label: 'Moderate' };
  return { ...STATUS_CRIT, label: 'High' };
}
function depthStatus(v: number): SensorStatus {
  if (v >= 0.5 && v <= 3.0) return { ...STATUS_OK, label: 'Normal' };
  if (v >= 0.2 && v <= 5.0) return { ...STATUS_WARN };
  return { ...STATUS_CRIT };
}

// ─── Diagnostic banner ───────────────────────────────────────────────────────

type DiagStyle = 'alert' | 'warn' | 'info';

const DIAG_THEMES: Record<DiagStyle, { bannerBg: string; bannerBorder: string; iconBg: string; textColor: string }> = {
  alert: { bannerBg: 'rgba(248,113,113,0.12)', bannerBorder: 'rgba(248,113,113,0.35)', iconBg: 'rgba(248,113,113,0.3)',  textColor: '#f87171' },
  warn:  { bannerBg: 'rgba(251,191,36,0.1)',   bannerBorder: 'rgba(251,191,36,0.28)',   iconBg: 'rgba(251,191,36,0.25)', textColor: '#fbbf24' },
  info:  { bannerBg: 'rgba(74,158,255,0.1)',   bannerBorder: 'rgba(74,158,255,0.25)',   iconBg: 'rgba(74,158,255,0.2)',  textColor: '#4a9eff' },
};

function getDiagnosticInfo(m: MetricsState, isAnomaly: boolean, device: string): { text: string; style: DiagStyle } {
  const scores = [
    { name: 'Dissolved Oxygen', score: m.rawDO < 5 ? 2 : m.rawDO < 7 ? 1 : 0 },
    { name: 'Turbidity',        score: m.rawTurbidity > 25 ? 2 : m.rawTurbidity > 10 ? 1 : 0 },
    { name: 'Temperature',      score: (m.rawTemp < 5 || m.rawTemp > 25) ? 2 : (m.rawTemp < 10 || m.rawTemp > 20) ? 1 : 0 },
    { name: 'pH',               score: (m.rawPH < 5.5 || m.rawPH > 9.5) ? 2 : (m.rawPH < 6.5 || m.rawPH > 8.5) ? 1 : 0 },
    { name: 'Water Depth',      score: (m.rawDepth < 0.2 || m.rawDepth > 5.0) ? 2 : (m.rawDepth < 0.5 || m.rawDepth > 3.0) ? 1 : 0 },
  ];
  const worst = scores.reduce((a, b) => (b.score >= a.score ? b : a));
  if (isAnomaly) {
    const prefix = worst.score === 2 ? 'Critical' : 'Abnormal';
    return { text: `${prefix} ${worst.name} reading on ${device} — autoencoder flag triggered.`, style: worst.score === 2 ? 'alert' : 'warn' };
  }
  return { text: `Alert: Minor changes in ${worst.name} detected on ${device}.`, style: 'info' };
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: SensorStatus;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCardTop}>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <View style={[styles.statusPillDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.metricCardValue}>{value}</Text>
      <Text style={styles.metricCardLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { currentMetrics, selectedSondeId, setSelectedSondeId } = useData();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sonde = getSonde(selectedSondeId);
  const statusIsNormal = !currentMetrics.isAnomaly;

  function handleSondeSelect(id: SondeId) {
    setSelectedSondeId(id);
    setDropdownOpen(false);
  }

  const tempSt  = tempStatus(currentMetrics.rawTemp);
  const doSt    = doStatus(currentMetrics.rawDO);
  const phSt    = phStatus(currentMetrics.rawPH);
  const turbSt  = turbStatus(currentMetrics.rawTurbidity);
  const depthSt = depthStatus(currentMetrics.rawDepth);

  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.dropIcon} />
              <Text style={styles.appTitle}>AquaFusion</Text>
            </View>
            <TouchableOpacity style={styles.avatarButton}>
              <Text style={styles.avatarText}>L</Text>
            </TouchableOpacity>
          </View>

          {/* ── Sonde Selector ── */}
          <View style={styles.selectorWrapper}>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setDropdownOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <View style={[styles.selectorDot, statusIsNormal ? styles.dotNormal : styles.dotAnomaly]} />
              <Text style={styles.selectorText} numberOfLines={1}>
                {sonde.label}
              </Text>
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
                      onPress={() => handleSondeSelect(s.id)}
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

          {/* ── Location + Status ── */}
          <View style={styles.card}>
            <View style={styles.locationRow}>
              <View style={styles.pinIcon}>
                <View style={styles.pinDot} />
              </View>
              <Text style={styles.locationText}>{sonde.site}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.stationBadge}>
                <Text style={styles.stationBadgeText}>{sonde.device}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  statusIsNormal ? styles.statusBadgeNormal : styles.statusBadgeAnomaly,
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: statusIsNormal ? '#4ade80' : '#f87171' }]} />
                <Text style={[styles.statusText, { color: statusIsNormal ? '#4ade80' : '#f87171' }]}>
                  {statusIsNormal ? 'All Systems Normal' : 'Anomaly Detected'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Individual Metric Cards ── */}
          <Text style={styles.sectionLabel}>Live Readings</Text>

          {/* Row 1: Temperature + DO */}
          <View style={styles.row}>
            <MetricCard label="Temperature" value={currentMetrics.temperature} status={tempSt} />
            <MetricCard label="Dissolved O₂" value={currentMetrics.dissolvedOxygen} status={doSt} />
          </View>

          {/* Row 2: pH + Turbidity */}
          <View style={styles.row}>
            <MetricCard label="pH Level" value={currentMetrics.pH} status={phSt} />
            <MetricCard label="Turbidity" value={currentMetrics.turbidity} status={turbSt} />
          </View>

          {/* Row 3: Depth — full width */}
          <View style={styles.card}>
            <View style={[styles.metricCardTop, { justifyContent: 'space-between' }]}>
              <Text style={styles.metricCardLabel}>Water Depth</Text>
              <View style={[styles.statusPill, { backgroundColor: depthSt.bg }]}>
                <View style={[styles.statusPillDot, { backgroundColor: depthSt.color }]} />
                <Text style={[styles.statusPillText, { color: depthSt.color }]}>{depthSt.label}</Text>
              </View>
            </View>
            <Text style={[styles.metricCardValue, styles.depthValue]}>{currentMetrics.depth}</Text>
            <Text style={styles.updateText}>Updated {currentMetrics.lastUpdate}</Text>
          </View>

          {/* ── Diagnostic Banner — always visible ── */}
          {(() => {
            const diag = getDiagnosticInfo(currentMetrics, currentMetrics.isAnomaly, sonde.device);
            const theme = DIAG_THEMES[diag.style];
            return (
              <View style={[styles.diagBanner, { backgroundColor: theme.bannerBg, borderColor: theme.bannerBorder }]}>
                <View style={[styles.diagIconBox, { backgroundColor: theme.iconBg }]}>
                  <Text style={[styles.diagIconText, { color: theme.textColor }]}>!</Text>
                </View>
                <Text style={[styles.diagText, { color: theme.textColor }]}>{diag.text}</Text>
              </View>
            );
          })()}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_BASE = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropIcon: { width: 10, height: 14, borderRadius: 5, backgroundColor: '#4a9eff' },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },
  avatarButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(74,158,255,0.25)',
    borderWidth: 2, borderColor: '#4a9eff',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  selectorWrapper: { marginBottom: 14 },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
  },
  selectorDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotNormal: { backgroundColor: '#4ade80' },
  dotAnomaly: { backgroundColor: '#f87171' },
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

  card: { ...CARD_BASE, padding: 14, marginBottom: 12 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pinIcon: {
    width: 16, height: 20, borderRadius: 8,
    borderWidth: 2, borderColor: '#4a9eff',
    justifyContent: 'center', alignItems: 'center',
  },
  pinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4a9eff' },
  locationText: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stationBadge: {
    backgroundColor: 'rgba(74,158,255,0.18)',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  stationBadgeText: { color: '#4a9eff', fontSize: 11, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, gap: 5,
  },
  statusBadgeNormal: { backgroundColor: 'rgba(74,222,128,0.12)' },
  statusBadgeAnomaly: { backgroundColor: 'rgba(248,113,113,0.15)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 2,
  },

  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  // Individual metric card
  metricCard: {
    ...CARD_BASE,
    flex: 1,
    padding: 14,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricCardValue: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  metricCardLabel: {
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  statusPillDot: { width: 5, height: 5, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  depthValue: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  updateText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  diagBanner: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2,
  },
  diagIconBox: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  diagIconText: { fontSize: 13, fontWeight: '800' },
  diagText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 20 },
});
