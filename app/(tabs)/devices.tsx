import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useData } from '@/src/DataContext';
import type { SondeId } from '@/src/DataContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceStatus = 'active' | 'warning' | 'offline';

type Device = {
  id: string;
  sondeId?: SondeId;       // present for tracked sondes
  name: string;
  site: string;
  status: DeviceStatus;
  battery: number;
  signal: 'Strong' | 'Moderate' | 'Weak' | 'None';
  staticLastSeen: string;  // fallback when no live data
  firmware: string;
};

// ─── Static device registry ───────────────────────────────────────────────────

const DEVICES: Device[] = [
  {
    id: 'd1',
    sondeId: 'sonde_12',
    name: 'Sonde #12',
    site: 'Pine Lake',
    status: 'active',
    battery: 82,
    signal: 'Strong',
    staticLastSeen: 'Awaiting data…',
    firmware: 'v3.1.4',
  },
  {
    id: 'd2',
    sondeId: 'sonde_45',
    name: 'Sonde #45',
    site: 'Wetland Creek',
    status: 'warning',
    battery: 23,
    signal: 'Moderate',
    staticLastSeen: 'Awaiting data…',
    firmware: 'v3.0.9',
  },
  {
    id: 'd3',
    name: 'Sonde #07',
    site: 'North Inlet',
    status: 'offline',
    battery: 0,
    signal: 'None',
    staticLastSeen: '3 hrs ago',
    firmware: 'v2.9.2',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastSeen(tsMs?: number): string {
  if (!tsMs) return '';
  const diffMs = Date.now() - tsMs;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hr${diffH > 1 ? 's' : ''} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD > 1 ? 's' : ''} ago`;
}

const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; bg: string; border: string }> = {
  active:  { label: 'Active',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)' },
  warning: { label: 'Warning', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  offline: { label: 'Offline', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BatteryBar({ level, status }: { level: number; status: DeviceStatus }) {
  const color = status === 'active' ? '#4ade80' : status === 'warning' ? '#fbbf24' : '#f87171';
  return (
    <View style={styles.battBar}>
      <View style={[styles.battFill, { width: `${level}%` as any, backgroundColor: color }]} />
      <View style={styles.battNub} />
    </View>
  );
}

function SignalStrength({ signal }: { signal: Device['signal'] }) {
  const levels: Record<Device['signal'], number> = { None: 0, Weak: 1, Moderate: 2, Strong: 3 };
  const active = levels[signal];
  return (
    <View style={styles.signalContainer}>
      {[1, 2, 3].map((lvl) => (
        <View
          key={lvl}
          style={[
            styles.signalBar,
            { height: lvl * 5 + 4 },
            lvl <= active ? styles.signalBarActive : styles.signalBarInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DevicesScreen() {
  const { lastSeenPerSonde } = useData();

  function liveStatus(device: Device): DeviceStatus {
    if (device.battery === 0) return 'offline';
    if (device.battery <= 20) return 'warning';
    return 'active';
  }

  const counts = {
    active:  DEVICES.filter((d) => liveStatus(d) === 'active').length,
    warning: DEVICES.filter((d) => liveStatus(d) === 'warning').length,
    offline: DEVICES.filter((d) => liveStatus(d) === 'offline').length,
  };

  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Devices</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{DEVICES.length} Total</Text>
            </View>
          </View>

          {/* Fleet Summary */}
          <View style={styles.summaryRow}>
            {(Object.entries(counts) as [DeviceStatus, number][]).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <View key={status} style={[styles.summaryCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                  <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                  <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Device Cards */}
          {DEVICES.map((device) => {
            const status = liveStatus(device);
            const cfg = STATUS_CONFIG[status];

            // Resolve Last Seen: prefer live timestamp, fall back to staticLastSeen
            const liveTs = device.sondeId ? lastSeenPerSonde[device.sondeId] : undefined;
            const lastSeen = liveTs
              ? formatLastSeen(liveTs)
              : device.staticLastSeen;

            return (
              <TouchableOpacity key={device.id} activeOpacity={0.85} style={styles.deviceCard}>
                {/* Card Top Row */}
                <View style={styles.deviceTop}>
                  <View style={styles.deviceIconBox}>
                    <View style={styles.deviceIconInner} />
                    <View style={styles.deviceIconBar} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceSite}>{device.site}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Battery + Signal + Last Seen */}
                <View style={styles.deviceStats}>
                  <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>Battery</Text>
                    <View style={styles.battRow}>
                      <BatteryBar level={device.battery} status={status} />
                      <Text style={styles.battPercent}>{device.battery}%</Text>
                    </View>
                  </View>
                  <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>Signal</Text>
                    <View style={styles.signalRow}>
                      <SignalStrength signal={device.signal} />
                      <Text style={styles.signalLabel}>{device.signal}</Text>
                    </View>
                  </View>
                  <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>Last Seen</Text>
                    <Text style={[styles.statValue, liveTs ? styles.statValueLive : null]}>
                      {lastSeen}
                    </Text>
                  </View>
                </View>

                {/* Firmware */}
                <Text style={styles.firmwareText}>FW {device.firmware}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Add Device Button */}
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <View style={styles.addBtnIcon}>
              <View style={styles.plusH} />
              <View style={styles.plusV} />
            </View>
            <Text style={styles.addBtnText}>Add New Device</Text>
          </TouchableOpacity>

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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  countBadge: {
    backgroundColor: 'rgba(74,158,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  countBadgeText: { color: '#4a9eff', fontSize: 12, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    paddingVertical: 14, alignItems: 'center',
  },
  summaryCount: { fontSize: 26, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },

  deviceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 16, marginBottom: 12,
  },
  deviceTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  deviceIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(74,158,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.25)', justifyContent: 'center',
    alignItems: 'center', gap: 4,
  },
  deviceIconInner: {
    width: 18, height: 12, borderRadius: 3,
    borderWidth: 2, borderColor: '#4a9eff',
  },
  deviceIconBar: { width: 8, height: 2, backgroundColor: '#4a9eff', borderRadius: 1 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  deviceSite: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14 },

  deviceStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBlock: { flex: 1 },
  statLabel: {
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  statValue: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  statValueLive: { color: '#4ade80' },

  battRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  battBar: {
    width: 40, height: 12, borderRadius: 3, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)', overflow: 'visible', position: 'relative',
  },
  battFill: { height: '100%', borderRadius: 2 },
  battNub: {
    position: 'absolute', right: -5, top: 3,
    width: 3, height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 1,
  },
  battPercent: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signalContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 5, borderRadius: 1 },
  signalBarActive: { backgroundColor: '#4ade80' },
  signalBarInactive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  signalLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  firmwareText: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: 'rgba(74,158,255,0.4)', borderStyle: 'dashed',
    borderRadius: 16, paddingVertical: 16, marginTop: 4,
    backgroundColor: 'rgba(74,158,255,0.05)',
  },
  addBtnIcon: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  plusH: { position: 'absolute', width: 14, height: 2, backgroundColor: '#4a9eff', borderRadius: 1 },
  plusV: { position: 'absolute', width: 2, height: 14, backgroundColor: '#4a9eff', borderRadius: 1 },
  addBtnText: { color: '#4a9eff', fontSize: 15, fontWeight: '700' },
});
