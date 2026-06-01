import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const mockInsight = {
  pattern: {
    title: 'Detected Pattern',
    value: 'Recurring nighttime oxygen drops',
    detail: 'DO falls below 7.0 mg/L between 02:00–06:00 daily for the past 5 days.',
  },
  prediction: {
    title: 'Prediction',
    value: 'Algal bloom likely in 3–5 days',
    detail: 'Elevated phosphorus and rising water temperature create favourable bloom conditions.',
  },
  recommendations: [
    'Increase monitoring frequency to every 30 minutes',
    'Check nutrient inflow sources upstream',
    'Deploy additional aeration near the eastern shore',
  ],
  confidence: 87,
  model: 'AquaAI v2.4',
  lastRun: '15 minutes ago',
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <View style={styles.confBar}>
      <View style={[styles.confFill, { width: `${value}%` as any }]} />
    </View>
  );
}

export default function InsightsScreen() {
  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <View style={styles.modelBadge}>
              <View style={styles.modelDot} />
              <Text style={styles.modelText}>{mockInsight.model}</Text>
            </View>
          </View>

          {/* Pattern Card */}
          <View style={[styles.card, styles.cardBlue]}>
            <View style={styles.cardTagRow}>
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={[styles.tagText, { color: '#4a9eff' }]}>Pattern</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{mockInsight.pattern.title}</Text>
            <Text style={styles.cardValue}>{mockInsight.pattern.value}</Text>
            <Text style={styles.cardDetail}>{mockInsight.pattern.detail}</Text>
          </View>

          {/* Prediction Card */}
          <View style={[styles.card, styles.cardAmber]}>
            <View style={styles.cardTagRow}>
              <View style={[styles.tag, styles.tagAmber]}>
                <Text style={[styles.tagText, { color: '#fbbf24' }]}>Prediction</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{mockInsight.prediction.title}</Text>
            <Text style={styles.cardValue}>{mockInsight.prediction.value}</Text>
            <Text style={styles.cardDetail}>{mockInsight.prediction.detail}</Text>
          </View>

          {/* Recommendation Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommendation</Text>
            {mockInsight.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <View style={styles.recBullet} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Confidence Card */}
          <View style={styles.card}>
            <View style={styles.confHeader}>
              <Text style={styles.cardTitle}>Confidence Level</Text>
              <Text style={styles.confValue}>{mockInsight.confidence}%</Text>
            </View>
            <ConfidenceBar value={mockInsight.confidence} />
            <Text style={styles.confCaption}>
              Based on 14-day water quality dataset and weather correlation
            </Text>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Last analysis run {mockInsight.lastRun}</Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74,158,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4a9eff' },
  modelText: { color: '#4a9eff', fontSize: 11, fontWeight: '600' },

  card: {
    ...CARD_BASE,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.11)',
  },
  cardBlue: {
    backgroundColor: 'rgba(74,158,255,0.08)',
    borderColor: 'rgba(74,158,255,0.2)',
  },
  cardAmber: {
    backgroundColor: 'rgba(251,191,36,0.07)',
    borderColor: 'rgba(251,191,36,0.2)',
  },

  cardTagRow: { marginBottom: 10 },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagBlue: { backgroundColor: 'rgba(74,158,255,0.15)' },
  tagAmber: { backgroundColor: 'rgba(251,191,36,0.15)' },
  tagText: { fontSize: 11, fontWeight: '700' },

  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardValue: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginBottom: 8, lineHeight: 24 },
  cardDetail: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },

  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  recBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4a9eff',
    marginTop: 6,
    flexShrink: 0,
  },
  recText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, flex: 1 },

  confHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  confValue: { fontSize: 28, fontWeight: '800', color: '#4ade80' },
  confBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  confFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 4,
  },
  confCaption: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});
