import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useData } from '@/src/DataContext';
import type { SondeId } from '@/src/DataContext';

// ─── Sonde display config (UI labels only — metrics come from DataContext) ────

type SondeConfig = {
  id: SondeId;
  label: string;
  site: string;
  device: string;
};

const SONDES: SondeConfig[] = [
  { id: 'sonde_12', label: 'Pine Lake (Sonde #12)', site: 'Pine Lake', device: 'Sonde #12' },
  { id: 'sonde_45', label: 'Wetland Creek (Sonde #45)', site: 'Wetland Creek', device: 'Sonde #45' },
];

function getSonde(id: SondeId): SondeConfig {
  return SONDES.find((s) => s.id === id)!;
}

const DO_MIN = 6;
const DO_RANGE = 2.5;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { currentMetrics, selectedSondeId, setSelectedSondeId, historicalData } = useData();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Prefer live readings from historicalData; fall back to seed doHistory in currentMetrics.
  const liveDoHistory = historicalData
    .filter((h) => h.sonde_id === selectedSondeId)
    .slice(-12)
    .map((h) => h.dissolved_oxygen);
  const doHistory = liveDoHistory.length >= 2 ? liveDoHistory : currentMetrics.doHistory;

  const sonde = getSonde(selectedSondeId);
  const statusIsNormal = !currentMetrics.isAnomaly;

  function handleSondeSelect(id: SondeId) {
    setSelectedSondeId(id);
    setDropdownOpen(false);
  }

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

          {/* ── Location + Live Status ── */}
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

          {/* ── Key Metrics ── */}
          <Text style={styles.sectionLabel}>Key Metrics</Text>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.metricLabel}>Temp</Text>
              <Text style={styles.metricPrimary}>{currentMetrics.temperature}</Text>
              <View style={styles.divider} />
              <Text style={styles.metricLabel}>DO</Text>
              <Text style={styles.metricSecondary}>{currentMetrics.dissolvedOxygen}</Text>
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.metricLabel}>Depth</Text>
              <Text style={styles.metricPrimary}>{currentMetrics.depth}</Text>
              <View style={styles.divider} />
              <Text style={styles.metricLabel}>pH</Text>
              <Text style={styles.metricSecondary}>{currentMetrics.pH}</Text>
            </View>
          </View>

          {/* ── Turbidity ── */}
          <View style={styles.card}>
            <View style={styles.turbidityRow}>
              <View>
                <Text style={styles.metricLabel}>Turbidity</Text>
                <Text style={styles.metricPrimary}>{currentMetrics.turbidity}</Text>
              </View>
              <View
                style={[
                  styles.levelBadge,
                  currentMetrics.turbidityLevel === 'High' && styles.levelBadgeHigh,
                  currentMetrics.turbidityLevel === 'Moderate' && styles.levelBadgeModerate,
                ]}
              >
                <Text
                  style={[
                    styles.levelBadgeText,
                    currentMetrics.turbidityLevel === 'High' && { color: '#f87171' },
                    currentMetrics.turbidityLevel === 'Moderate' && { color: '#fbbf24' },
                  ]}
                >
                  {currentMetrics.turbidityLevel}
                </Text>
              </View>
            </View>
          </View>

          {/* ── DO Trend ── */}
          <Text style={styles.sectionLabel}>Last 24 Hours</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Dissolved Oxygen Trend</Text>
            <View style={styles.miniChartContainer}>
              {doHistory.map((val, i) => (
                <View
                  key={i}
                  style={[styles.miniBar, { height: Math.max(4, ((val - DO_MIN) / DO_RANGE) * 44) }]}
                />
              ))}
            </View>
            <Text style={styles.updateText}>Updated {currentMetrics.lastUpdate}</Text>
          </View>

          {/* ── Alert Banners ── */}
          {currentMetrics.isAnomaly && (
            <View style={styles.anomalyBanner}>
              <View style={styles.anomalyIconBox}>
                <Text style={styles.anomalyIconText}>!</Text>
              </View>
              <Text style={styles.anomalyText}>
                Autoencoder anomaly flag on {sonde.device} — reading outside normal envelope. Check device in field.
              </Text>
            </View>
          )}

          {!currentMetrics.isAnomaly && (
            <View style={styles.alertBanner}>
              <View style={styles.alertIconBox}>
                <Text style={styles.alertIconText}>!</Text>
              </View>
              <Text style={styles.alertText}>
                Alert: Minor oxygen dip detected 2 hours ago
              </Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD = {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74,158,255,0.25)',
    borderWidth: 2,
    borderColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  selectorWrapper: { marginBottom: 14 },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  selectorDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotNormal: { backgroundColor: '#4ade80' },
  dotAnomaly: { backgroundColor: '#f87171' },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#ffffff' },
  chevronBox: {
    width: 16,
    height: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
  },
  chevronBoxOpen: { transform: [{ scaleY: -1 }] },
  chevronLeft: {
    width: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 1,
    transform: [{ rotate: '40deg' }, { translateY: 3 }],
  },
  chevronRight: {
    width: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 1,
    transform: [{ rotate: '-40deg' }, { translateY: 3 }],
  },

  dropdownPanel: {
    marginTop: 4,
    backgroundColor: 'rgba(0,20,55,0.97)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  dropdownOptionActive: { backgroundColor: 'rgba(74,158,255,0.12)' },
  dropdownOptionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  dropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  dropdownDotActive: { backgroundColor: '#4a9eff' },
  dropdownOptionInner: { flex: 1 },
  dropdownOptionText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  dropdownOptionTextActive: { color: '#ffffff' },
  dropdownSite: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4a9eff' },

  card: { ...CARD, padding: 14, marginBottom: 12 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pinIcon: {
    width: 16,
    height: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a9eff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4a9eff' },
  locationText: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stationBadge: {
    backgroundColor: 'rgba(74,158,255,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stationBadgeText: { color: '#4a9eff', fontSize: 11, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusBadgeNormal: { backgroundColor: 'rgba(74,222,128,0.12)' },
  statusBadgeAnomaly: { backgroundColor: 'rgba(248,113,113,0.15)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 2,
  },

  row: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1, padding: 14, marginBottom: 12 },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metricPrimary: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  metricSecondary: { fontSize: 16, fontWeight: '700', color: '#4a9eff' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 },

  turbidityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  levelBadgeHigh: { backgroundColor: 'rgba(248,113,113,0.15)' },
  levelBadgeModerate: { backgroundColor: 'rgba(251,191,36,0.15)' },
  levelBadgeText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },

  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 },
  miniChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 52,
    marginBottom: 10,
  },
  miniBar: { flex: 1, backgroundColor: '#4a9eff', borderRadius: 3, opacity: 0.8 },
  updateText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  anomalyBanner: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  anomalyIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(248,113,113,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anomalyIconText: { color: '#f87171', fontSize: 13, fontWeight: '800' },
  anomalyText: { color: '#f87171', fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 20 },

  alertBanner: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(251,191,36,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: { color: '#fbbf24', fontSize: 13, fontWeight: '800' },
  alertText: { color: '#fbbf24', fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 20 },
});
