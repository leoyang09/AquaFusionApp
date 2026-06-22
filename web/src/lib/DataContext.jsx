import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getTurbidityLevel } from './formatters';

// ─── Seed data (mirrors mobile DataContext) ───────────────────────────────────

const SONDE_SEEDS = {
  sonde_12: {
    temperature: '12.4°C', dissolvedOxygen: '8.1 mg/L', depth: '1.42 m',
    pH: '7.3', turbidity: '7.9 NTU', turbidityLevel: 'Low',
    isAnomaly: false,
    doHistory: [6.8, 7.1, 7.4, 7.9, 8.1, 8.0, 7.7, 7.4, 7.1, 7.3, 7.6, 7.9],
    lastUpdate: 'Awaiting data…',
    rawTemp: 12.4, rawDO: 8.1, rawDepth: 1.42, rawPH: 7.3, rawTurbidity: 7.9,
    anomalySource: '', stdDO: 0, stdTemp: 0, stdPH: 0, stdTurbidity: 0, stdDepth: 0,
  },
  sonde_45: {
    temperature: '10.0°C', dissolvedOxygen: '7.1 mg/L', depth: '0.88 m',
    pH: '7.0', turbidity: '12.3 NTU', turbidityLevel: 'Moderate',
    isAnomaly: false,
    doHistory: [6.5, 6.8, 7.0, 7.2, 7.1, 6.9, 7.1, 7.3, 7.0, 6.8, 7.1, 7.2],
    lastUpdate: 'Awaiting data…',
    rawTemp: 10.0, rawDO: 7.1, rawDepth: 0.88, rawPH: 7.0, rawTurbidity: 12.3,
    anomalySource: '', stdDO: 0, stdTemp: 0, stdPH: 0, stdTurbidity: 0, stdDepth: 0,
  },
};

export const EMPTY_METRICS = {
  temperature: '---', dissolvedOxygen: '---', depth: '---',
  pH: '---', turbidity: '---', turbidityLevel: '---',
  isAnomaly: false, doHistory: [], lastUpdate: 'Waiting for hardware…',
  rawTemp: 0, rawDO: 0, rawDepth: 0, rawPH: 0, rawTurbidity: 0,
  anomalySource: '', stdDO: 0, stdTemp: 0, stdPH: 0, stdTurbidity: 0, stdDepth: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToMetrics(row, prev) {
  return {
    temperature:     `${row.temperature.toFixed(1)}°C`,
    dissolvedOxygen: `${row.dissolved_oxygen.toFixed(1)} mg/L`,
    depth:           `${row.water_depth.toFixed(2)} m`,
    pH:              `${row.ph.toFixed(1)}`,
    turbidity:       `${row.turbidity.toFixed(1)} NTU`,
    turbidityLevel:  getTurbidityLevel(row.turbidity),
    isAnomaly:       row.is_anomaly,
    doHistory:       [...(prev?.doHistory ?? []).slice(-11), row.dissolved_oxygen],
    lastUpdate:      'just now',
    rawTemp:         row.temperature,
    rawDO:           row.dissolved_oxygen,
    rawDepth:        row.water_depth,
    rawPH:           row.ph,
    rawTurbidity:    row.turbidity,
    anomalySource:   row.anomaly_source ?? '',
    stdDO:           row.std_dissolved_oxygen   ?? 0,
    stdTemp:         row.std_temperature        ?? 0,
    stdPH:           row.std_ph                 ?? 0,
    stdTurbidity:    row.std_turbidity          ?? 0,
    stdDepth:        row.std_water_depth        ?? 0,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [selectedSondeId, setSelectedSondeId] = useState('sonde_12');
  const [metricsPerSonde, setMetricsPerSonde] = useState({ ...SONDE_SEEDS });
  const [lastSeenPerSonde, setLastSeenPerSonde]   = useState({});
  const [alarmLatchPerSonde, setAlarmLatchPerSonde] = useState({});
  const [devicesList, setDevicesList] = useState([]);
  const [timeTick, setTimeTick] = useState(0);

  // Minute tick for relative-time display
  useEffect(() => {
    const id = setInterval(() => setTimeTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Devices: initial fetch + realtime inserts
  useEffect(() => {
    supabase
      .from('registered_devices')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setDevicesList(data); });

    const ch = supabase
      .channel('web_devices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registered_devices' },
        payload => setDevicesList(prev => {
          const idx = prev.findIndex(d => d.sonde_id === payload.new.sonde_id);
          if (idx >= 0) { const n = [...prev]; n[idx] = { ...prev[idx], ...payload.new }; return n; }
          return [...prev, payload.new];
        })
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // Sensor logs: global realtime stream
  useEffect(() => {
    const ch = supabase
      .channel('web_sensor_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_logs' },
        payload => {
          const row = payload.new;
          const id  = row.sonde_id;
          const ts  = row.created_at ? new Date(row.created_at).getTime() : Date.now();

          setMetricsPerSonde(prev => ({
            ...prev,
            [id]: rowToMetrics(row, prev[id] ?? SONDE_SEEDS[id] ?? SONDE_SEEDS['sonde_12']),
          }));

          setLastSeenPerSonde(prev => ({ ...prev, [id]: ts }));

          if (row.is_anomaly) {
            setAlarmLatchPerSonde(prev => {
              if (prev[id] != null) return prev;
              return { ...prev, [id]: { latchedAt: ts, source: row.anomaly_source ?? '' } };
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  function clearAlarmForSonde(sondeId) {
    setAlarmLatchPerSonde(prev => ({ ...prev, [sondeId]: null }));
    setMetricsPerSonde(prev => {
      const cur = prev[sondeId];
      if (!cur) return prev;
      return { ...prev, [sondeId]: { ...cur, isAnomaly: false, anomalySource: '' } };
    });
  }

  const currentMetrics =
    metricsPerSonde[selectedSondeId] ?? SONDE_SEEDS[selectedSondeId] ?? EMPTY_METRICS;

  return (
    <DataContext.Provider value={{
      selectedSondeId, setSelectedSondeId,
      metricsPerSonde, currentMetrics,
      lastSeenPerSonde, alarmLatchPerSonde, clearAlarmForSonde,
      timeTick, devicesList,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
