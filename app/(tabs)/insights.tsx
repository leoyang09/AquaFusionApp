import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useData, formatRelativeTime } from '@/src/DataContext';
import type { MetricsState } from '@/src/DataContext';

// ─── Source → display label ───────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  dissolved_oxygen: 'Dissolved Oxygen',
  temperature:      'Temperature',
  ph:               'pH Level',
  turbidity:        'Turbidity',
  water_depth:      'Water Depth',
};

function sourceLabel(src: string): string {
  return SOURCE_LABELS[src] ?? (src || 'Unknown Channel');
}

// ─── Dynamic insight content per anomaly source ───────────────────────────────

type InsightBlock = {
  patternTitle: string;
  patternValue: string;
  patternDetail: (m: MetricsState) => string;
  predictionTitle: string;
  predictionValue: string;
  predictionDetail: string;
  recommendations: string[];
  confidence: number;
  accent: string;
};

const ANOMALY_INSIGHTS: Record<string, InsightBlock> = {
  dissolved_oxygen: {
    patternTitle: 'Hypoxia Event — Dissolved Oxygen',
    patternValue: 'Sustained oxygen depletion detected across multiple intervals',
    patternDetail: (m) =>
      `DO std dev σ = ${m.stdDO > 0 ? m.stdDO.toFixed(3) : 'elevated'}. Concentration declining toward hypoxic threshold (<5 mg/L). Current reading: ${m.dissolvedOxygen}.`,
    predictionTitle: 'Hypoxic Stress Escalation',
    predictionValue: 'Oxygen levels risk critical threshold breach within 1–3 hours',
    predictionDetail:
      'Biological oxygen demand (BOD) spike likely from organic loading or thermal stratification. Aquatic life stress probable if DO remains below 5 mg/L for >2 consecutive 15-min intervals.',
    recommendations: [
      'Activate emergency aeration at the affected monitoring zone immediately',
      'Trace organic load sources upstream — inspect for sewage overflow or agricultural runoff',
      'Increase sonde sampling to every 5 minutes during the active hypoxic event',
      'Notify downstream watershed managers and fishery operators of the ongoing event',
    ],
    confidence: 73,
    accent: '#4a9eff',
  },

  turbidity: {
    patternTitle: 'Sediment Suspension — Turbidity Spike',
    patternValue: 'Stormwater runoff or upstream erosion event in progress',
    patternDetail: (m) =>
      `Turbidity std dev σ = ${m.stdTurbidity > 0 ? m.stdTurbidity.toFixed(3) : 'elevated'}. Spike morphology consistent with stormwater runoff or active bank erosion. Current reading: ${m.turbidity}.`,
    predictionTitle: 'Sustained High Turbidity — 4–8 Hours',
    predictionValue: 'Light penetration inhibited; secondary dissolved oxygen depression possible',
    predictionDetail:
      'High suspended sediment load suppresses aquatic photosynthesis and clogs filter-feeding organisms. Turbidity expected to remain elevated for 4–8 hours following peak inflow. Structural erosion of bank material likely ongoing.',
    recommendations: [
      'Inspect upstream construction sites, exposed banks, and storm drains for active runoff sources',
      'Collect grab samples for suspended sediment concentration and fecal coliform analysis',
      'Deploy turbidity curtain around sensitive benthic habitats if site access permits',
      'Cross-reference with NOAA regional precipitation radar to confirm stormwater origin',
    ],
    confidence: 71,
    accent: '#34d399',
  },

  water_depth: {
    patternTitle: 'Rapid Inflow — Water Depth Anomaly',
    patternValue: 'Flash flood or structural channel change detected',
    patternDetail: (m) =>
      `Water depth std dev σ = ${m.stdDepth > 0 ? m.stdDepth.toFixed(3) : 'elevated'}. Rapid fluctuation pattern indicates acute inflow surge or downstream obstruction consistent with flash flooding. Current reading: ${m.depth}.`,
    predictionTitle: 'Continued Level Rise — 2–6 Hours',
    predictionValue: 'Downstream sediment, debris transport, and sonde displacement risk elevated',
    predictionDetail:
      'If upstream precipitation continues, water level will remain elevated for 2–6 hours with peak transport of suspended solids and debris. Stormwater tracking and flood coordination required. Associated turbidity spike expected.',
    recommendations: [
      'Issue stormwater advisory and alert downstream flood management coordinators immediately',
      'Verify sonde mounting integrity — inspect for displacement or physical obstruction',
      'Monitor for associated turbidity spike and dissolved oxygen depression (secondary effects)',
      'Log event start timestamp and duration for the watershed incident database',
    ],
    confidence: 68,
    accent: '#60a5fa',
  },

  temperature: {
    patternTitle: 'Thermal Deviation — Temperature Channel',
    patternValue: 'Water temperature outside calibrated baseline range',
    patternDetail: (m) =>
      `Temperature std dev σ = ${m.stdTemp > 0 ? m.stdTemp.toFixed(3) : 'elevated'}. Thermal stratification or external heat source detected. Current reading: ${m.temperature}.`,
    predictionTitle: 'Metabolic Rate Acceleration',
    predictionValue: 'Thermal stress likely to compound dissolved oxygen depletion risk',
    predictionDetail:
      'Elevated temperatures increase organism metabolic rates and reduce DO saturation capacity. Combined hypoxia risk elevated in warm or stratified water columns.',
    recommendations: [
      'Assess for upstream thermal discharge (power plant, industrial cooling) or solar stratification',
      'Monitor dissolved oxygen closely — thermal stress compounds hypoxic risk',
      'Record duration of thermal event for seasonal trend analysis',
      'Check downstream mixing zone effectiveness for thermal dilution',
    ],
    confidence: 69,
    accent: '#fbbf24',
  },

  ph: {
    patternTitle: 'pH Deviation — Acid / Base Shift',
    patternValue: 'Water chemistry outside neutral buffer range',
    patternDetail: (m) =>
      `pH std dev σ = ${m.stdPH > 0 ? m.stdPH.toFixed(3) : 'elevated'}. Acidification or alkalinity shift beyond autoencoder calibrated baseline. Current reading: pH ${m.pH}.`,
    predictionTitle: 'Aquatic Chemistry Stress',
    predictionValue: 'Persistent pH deviation risks organism gill stress and carbonate disruption',
    predictionDetail:
      'Extreme pH values impair gill function in fish and affect the carbonate buffering system. Sustained deviation may indicate acid mine drainage, chemical spill, or atmospheric acid deposition.',
    recommendations: [
      'Sample for alkalinity and conductivity to identify source (acid rain, runoff, industrial discharge)',
      'Inspect upstream tributaries for known acid sources — mine drainage, agricultural chemicals',
      'Cross-reference with regional precipitation data for acid deposition confirmation',
      'Alert water quality authority if pH persists outside 6.0–9.0 for >2 hours',
    ],
    confidence: 70,
    accent: '#a78bfa',
  },
};

const STABLE_INSIGHT: InsightBlock = {
  patternTitle: 'All Channels Baseline — Stable Operation',
  patternValue: 'No statistically significant deviations detected',
  patternDetail: () =>
    'All five sensor channels operating within calibrated threshold bounds. Autoencoder reconstruction error remains below the anomaly trigger level. System is operating nominally.',
  predictionTitle: 'Stable Monitoring Window Expected',
  predictionValue: 'Water quality parameters projected to remain within normal bounds',
  predictionDetail:
    'No upstream events or seasonal indicators suggest imminent deviation. Continued stable conditions anticipated over the next monitoring window.',
  recommendations: [
    'Maintain standard 15-minute monitoring intervals',
    'Review 7-day trend charts for gradual baseline drift not captured by the autoencoder',
    'Schedule preventive sonde cleaning and calibration if last service > 30 days ago',
    'Archive current baseline readings as seasonal reference for year-over-year comparison',
  ],
  confidence: 94,
  accent: '#4ade80',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.confBar}>
      <View style={[styles.confFill, { width: `${value}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { currentMetrics, selectedSondeId, alarmLatchPerSonde, timeTick: _timeTick } = useData();

  const latch = alarmLatchPerSonde[selectedSondeId] ?? null;
  const isLatched = latch !== null;
  const isAlarmActive = isLatched || currentMetrics.isAnomaly;

  const activeSource = (isLatched ? latch.source : currentMetrics.anomalySource) || '';
  const insight = isAlarmActive
    ? (ANOMALY_INSIGHTS[activeSource] ?? ANOMALY_INSIGHTS['dissolved_oxygen'])
    : STABLE_INSIGHT;

  const sondeName =
    selectedSondeId === 'sonde_12' ? 'Pine Lake (Sonde #12)' : 'Wetland Creek (Sonde #45)';

  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <View style={styles.modelBadge}>
              <View style={[styles.modelDot, { backgroundColor: isAlarmActive ? '#f87171' : '#4ade80' }]} />
              <Text style={styles.modelText}>AquaAI v2.4</Text>
            </View>
          </View>

          {/* Station + alarm state row */}
          <View style={styles.contextRow}>
            <Text style={styles.contextStation} numberOfLines={1}>{sondeName}</Text>
            {isAlarmActive ? (
              <View style={styles.alarmBadge}>
                <View style={styles.alarmDot} />
                <Text style={styles.alarmBadgeText}>
                  ALARM{latch ? ` · ${formatRelativeTime(latch.latchedAt, Date.now())}` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.stableBadge}>
                <Text style={styles.stableBadgeText}>STABLE</Text>
              </View>
            )}
          </View>

          {/* Anomaly source chip */}
          {isAlarmActive && activeSource ? (
            <View style={styles.sourceRow}>
              <View style={styles.sourceChip}>
                <Text style={styles.sourceChipLabel}>ANOMALY SOURCE</Text>
                <Text style={styles.sourceChipValue}>{sourceLabel(activeSource)}</Text>
              </View>
            </View>
          ) : null}

          {/* Pattern Card */}
          <View style={[styles.card, isAlarmActive ? styles.cardRed : styles.cardBlue]}>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: insight.accent + '22' }]}>
                <Text style={[styles.tagText, { color: insight.accent }]}>Detected Pattern</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{insight.patternTitle}</Text>
            <Text style={styles.cardValue}>{insight.patternValue}</Text>
            <Text style={styles.cardDetail}>{insight.patternDetail(currentMetrics)}</Text>
          </View>

          {/* Prediction Card */}
          <View
            style={[
              styles.card,
              isAlarmActive ? styles.cardAmber : styles.cardGreen,
            ]}
          >
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: isAlarmActive
                      ? 'rgba(251,191,36,0.15)'
                      : 'rgba(74,222,128,0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isAlarmActive ? '#fbbf24' : '#4ade80' },
                  ]}
                >
                  Prediction
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{insight.predictionTitle}</Text>
            <Text style={styles.cardValue}>{insight.predictionValue}</Text>
            <Text style={styles.cardDetail}>{insight.predictionDetail}</Text>
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Recommendations</Text>
            {insight.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <View style={[styles.recBullet, { backgroundColor: insight.accent }]} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Confidence */}
          <View style={styles.card}>
            <View style={styles.confHeader}>
              <Text style={styles.sectionLabel}>Model Confidence</Text>
              <Text style={[styles.confValue, { color: insight.accent }]}>
                {insight.confidence}%
              </Text>
            </View>
            <ConfidenceBar value={insight.confidence} color={insight.accent} />
            <Text style={styles.confCaption}>
              {isAlarmActive
                ? 'Based on edge autoencoder anomaly score and per-channel standard deviation correlations'
                : 'Based on 14-day rolling baseline and seasonal calibration dataset'}
            </Text>
          </View>

          <Text style={styles.footer}>
            Last reading: {currentMetrics.lastUpdate} · {sondeName}
          </Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_BASE = {
  borderRadius: 16 as const,
  borderWidth: 1 as const,
  padding: 16 as const,
  marginBottom: 12 as const,
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  modelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(74,158,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  modelDot: { width: 6, height: 6, borderRadius: 3 },
  modelText: { color: '#4a9eff', fontSize: 11, fontWeight: '600' },

  contextRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  contextStation: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    fontWeight: '600', flex: 1, marginRight: 10,
  },
  alarmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  alarmDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f87171' },
  alarmBadgeText: { color: '#f87171', fontSize: 11, fontWeight: '700' },
  stableBadge: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  stableBadgeText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },

  sourceRow: { marginBottom: 12 },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  sourceChipLabel: {
    fontSize: 9, fontWeight: '700', color: 'rgba(248,113,113,0.6)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sourceChipValue: { fontSize: 13, fontWeight: '700', color: '#f87171' },

  card: {
    ...CARD_BASE,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.11)',
  },
  cardBlue:  { backgroundColor: 'rgba(74,158,255,0.08)',  borderColor: 'rgba(74,158,255,0.2)' },
  cardRed:   { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' },
  cardAmber: { backgroundColor: 'rgba(251,191,36,0.07)',  borderColor: 'rgba(251,191,36,0.2)' },
  cardGreen: { backgroundColor: 'rgba(74,222,128,0.07)',  borderColor: 'rgba(74,222,128,0.2)' },

  tagRow: { marginBottom: 10 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 6, lineHeight: 22 },
  cardValue: {
    fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)',
    marginBottom: 8, lineHeight: 22,
  },
  cardDetail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  recBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  recText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 22, flex: 1 },

  confHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 12,
  },
  confValue: { fontSize: 28, fontWeight: '800' },
  confBar: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 10,
  },
  confFill: { height: '100%', borderRadius: 4 },
  confCaption: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },

  footer: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.3)', marginTop: 4,
  },
});
