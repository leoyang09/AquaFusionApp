import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { useData } from '@/src/DataContext';
import type { SondeId } from '@/src/DataContext';

const INITIAL_REGION: Region = {
  latitude: 47.5861,
  longitude: -122.0435,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Site = {
  id: string;
  sondeId: SondeId;
  deviceName: string;
  name: string;
  latitude: number;
  longitude: number;
  battery: number;
};

const SITES: Site[] = [
  {
    id: 's1',
    sondeId: 'sonde_12',
    deviceName: 'Sonde #12',
    name: 'Pine Lake',
    latitude: 47.5878,
    longitude: -122.0468,
    battery: 82,
  },
  {
    id: 's2',
    sondeId: 'sonde_45',
    deviceName: 'Sonde #45',
    name: 'Wetland Creek',
    latitude: 47.5835,
    longitude: -122.0395,
    battery: 23,
  },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023968' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1826' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

function CustomMarker({
  site,
  isSelected,
  isAnomaly,
}: {
  site: Site;
  isSelected: boolean;
  isAnomaly: boolean;
}) {
  const statusColor = isAnomaly ? '#f87171' : '#4ade80';
  return (
    <View style={styles.markerOuter}>
      <View style={[styles.markerPin, isSelected && styles.markerPinSelected]}>
        <Text style={styles.markerPinText}>{site.deviceName.replace('Sonde ', 'S')}</Text>
      </View>
      <View style={[styles.markerStatusDot, { backgroundColor: statusColor }]} />
      <View style={styles.markerTail} />
    </View>
  );
}

export default function MapScreen() {
  const { metricsPerSonde } = useData();
  const [selected, setSelected] = useState<Site>(SITES[0]);
  const mapRef = useRef<MapView>(null);

  function focusSite(site: Site) {
    setSelected(site);
    mapRef.current?.animateToRegion(
      { latitude: site.latitude, longitude: site.longitude, latitudeDelta: 0.018, longitudeDelta: 0.018 },
      450,
    );
  }

  const selectedMetrics = metricsPerSonde[selected.sondeId];
  const selectedIsAnomaly = !!selectedMetrics?.isAnomaly;

  // All 6 metric fields for the expanded card grid
  const metricGrid = [
    { label: 'Temp',      value: selectedMetrics?.temperature      ?? '—' },
    { label: 'DO',        value: selectedMetrics?.dissolvedOxygen   ?? '—' },
    { label: 'pH',        value: selectedMetrics?.pH                ?? '—' },
    { label: 'Turbidity', value: selectedMetrics?.turbidity         ?? '—' },
    { label: 'Depth',     value: selectedMetrics?.depth             ?? '—' },
    { label: 'Battery',   value: `${selected.battery}%`                    },
  ];

  return (
    <LinearGradient colors={['#001C44', '#003B80']} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map View</Text>
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={() => mapRef.current?.animateToRegion(INITIAL_REGION, 600)}
          >
            <View style={styles.recenterIcon}>
              <View style={[styles.recenterLine, { width: 12, height: 2 }]} />
              <View style={[styles.recenterLine, { width: 2, height: 12, position: 'absolute' }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Real Map */}
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={INITIAL_REGION}
            customMapStyle={DARK_MAP_STYLE}
            userInterfaceStyle="dark"
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
          >
            {SITES.map((site) => {
              const siteAnomaly = !!metricsPerSonde[site.sondeId]?.isAnomaly;
              return (
                <Marker
                  key={site.id}
                  coordinate={{ latitude: site.latitude, longitude: site.longitude }}
                  onPress={() => focusSite(site)}
                  tracksViewChanges={true}
                >
                  <CustomMarker
                    site={site}
                    isSelected={selected.id === site.id}
                    isAnomaly={siteAnomaly}
                  />
                  <Callout tooltip>
                    <View style={styles.calloutBox}>
                      <Text style={styles.calloutTitle}>{site.deviceName}</Text>
                      <Text style={styles.calloutSub}>{site.name}</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        </View>

        {/* Selected-Site Detail Card — expanded 6-metric grid */}
        <View style={styles.siteCard}>
          <View style={styles.siteCardHeader}>
            <View>
              <Text style={styles.siteName}>{selected.deviceName} — {selected.name}</Text>
              <Text style={styles.siteSubtitle}>
                {selectedMetrics ? `Updated ${selectedMetrics.lastUpdate}` : 'Awaiting data…'}
              </Text>
            </View>
            <View
              style={[
                styles.siteStatusBadge,
                selectedIsAnomaly ? styles.siteStatusWarning : styles.siteStatusActive,
              ]}
            >
              <View
                style={[
                  styles.siteStatusDot,
                  { backgroundColor: selectedIsAnomaly ? '#f87171' : '#4ade80' },
                ]}
              />
              <Text
                style={[
                  styles.siteStatusText,
                  { color: selectedIsAnomaly ? '#f87171' : '#4ade80' },
                ]}
              >
                {selectedIsAnomaly ? 'Anomaly' : 'Active'}
              </Text>
            </View>
          </View>

          {/* 3-column × 2-row metric grid */}
          <View style={styles.metricsGrid}>
            {metricGrid.map((m, i) => (
              <View key={m.label} style={[styles.metricCell, i < 3 && styles.metricCellBorderBottom]}>
                <Text style={styles.metricCellLabel}>{m.label}</Text>
                <Text style={styles.metricCellValue}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Site Selector Pills */}
        <View style={styles.siteList}>
          {SITES.map((site) => {
            const siteAnomaly = !!metricsPerSonde[site.sondeId]?.isAnomaly;
            return (
              <TouchableOpacity
                key={site.id}
                onPress={() => focusSite(site)}
                style={[styles.sitePill, selected.id === site.id && styles.sitePillActive]}
                activeOpacity={0.75}
              >
                <View style={[styles.pillDot, { backgroundColor: siteAnomaly ? '#f87171' : '#4ade80' }]} />
                <Text style={[styles.sitePillText, selected.id === site.id && styles.sitePillTextActive]}>
                  {site.deviceName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  recenterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(74,158,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  recenterIcon: { width: 14, height: 14, justifyContent: 'center', alignItems: 'center' },
  recenterLine: { backgroundColor: '#4a9eff', borderRadius: 1 },

  mapWrapper: { flex: 1, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },

  markerOuter: { alignItems: 'center' },
  markerPin: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(0,28,68,0.9)', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#4a9eff',
  },
  markerPinSelected: { backgroundColor: '#4a9eff', borderColor: '#ffffff' },
  markerPinText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  markerStatusDot: {
    width: 8, height: 8, borderRadius: 4, marginTop: 2,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)',
  },
  markerTail: { width: 2, height: 6, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },

  calloutBox: {
    backgroundColor: 'rgba(0,28,68,0.95)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(74,158,255,0.4)', minWidth: 120,
  },
  calloutTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  calloutSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  siteCard: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 14,
  },
  siteCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  siteName: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  siteSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  siteStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  siteStatusActive: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)',
  },
  siteStatusWarning: {
    backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)',
  },
  siteStatusDot: { width: 6, height: 6, borderRadius: 3 },
  siteStatusText: { fontSize: 11, fontWeight: '700' },

  // 3-column metric grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCell: {
    width: '33.33%',
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  metricCellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  metricCellLabel: {
    fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3,
  },
  metricCellValue: { fontSize: 14, fontWeight: '700', color: '#4a9eff' },

  siteList: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 10 },
  sitePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sitePillActive: { backgroundColor: 'rgba(74,158,255,0.2)', borderColor: '#4a9eff' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  sitePillText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  sitePillTextActive: { color: '#ffffff' },
});
