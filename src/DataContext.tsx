import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type SondeId = 'sonde_12' | 'sonde_45';

export type SensorRow = {
  id?: number;
  sonde_id: string;
  created_at?: string;
  temperature: number;
  water_depth: number;
  dissolved_oxygen: number;
  ph: number;
  turbidity: number;
  is_anomaly: boolean;
};

export type MetricsState = {
  // Formatted display strings
  temperature: string;
  dissolvedOxygen: string;
  depth: string;
  pH: string;
  turbidity: string;
  turbidityLevel: string;
  isAnomaly: boolean;
  doHistory: number[];
  lastUpdate: string;
  // Raw numeric values for threshold evaluation
  rawTemp: number;
  rawDO: number;
  rawDepth: number;
  rawPH: number;
  rawTurbidity: number;
};

export type HistoricalPoint = {
  sonde_id: string;
  timestamp: number; // ms epoch
  dissolved_oxygen: number;
  temperature: number;
  ph: number;
  turbidity: number;
  water_depth: number;
  is_anomaly: boolean;
};

type DataContextValue = {
  selectedSondeId: SondeId;
  setSelectedSondeId: (id: SondeId) => void;
  metricsPerSonde: Record<string, MetricsState>;
  currentMetrics: MetricsState;
  historicalData: HistoricalPoint[];
  lastSeenPerSonde: Record<string, number>; // ms epoch of latest INSERT per sonde
};

// ─── Seed data ────────────────────────────────────────────────────────────────

export const SONDE_SEEDS: Record<SondeId, MetricsState> = {
  sonde_12: {
    temperature: '12.4°C',
    dissolvedOxygen: '8.1 mg/L',
    depth: '1.42 m',
    pH: '7.3',
    turbidity: '7.9 NTU',
    turbidityLevel: 'Low',
    isAnomaly: false,
    doHistory: [6.8, 7.1, 7.4, 7.9, 8.1, 8.0, 7.7, 7.4, 7.1, 7.3, 7.6, 7.9],
    lastUpdate: 'Awaiting data…',
    rawTemp: 12.4,
    rawDO: 8.1,
    rawDepth: 1.42,
    rawPH: 7.3,
    rawTurbidity: 7.9,
  },
  sonde_45: {
    temperature: '10.0°C',
    dissolvedOxygen: '7.1 mg/L',
    depth: '0.88 m',
    pH: '7.0',
    turbidity: '12.3 NTU',
    turbidityLevel: 'Moderate',
    isAnomaly: false,
    doHistory: [6.5, 6.8, 7.0, 7.2, 7.1, 6.9, 7.1, 7.3, 7.0, 6.8, 7.1, 7.2],
    lastUpdate: 'Awaiting data…',
    rawTemp: 10.0,
    rawDO: 7.1,
    rawDepth: 0.88,
    rawPH: 7.0,
    rawTurbidity: 12.3,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTurbidityLevel(ntu: number): string {
  if (ntu < 5) return 'Low';
  if (ntu < 20) return 'Moderate';
  return 'High';
}

function rowToMetrics(row: SensorRow, prev: MetricsState): MetricsState {
  return {
    temperature: `${row.temperature.toFixed(1)}°C`,
    dissolvedOxygen: `${row.dissolved_oxygen.toFixed(1)} mg/L`,
    depth: `${row.water_depth.toFixed(2)} m`,
    pH: `${row.ph.toFixed(1)}`,
    turbidity: `${row.turbidity.toFixed(1)} NTU`,
    turbidityLevel: getTurbidityLevel(row.turbidity),
    isAnomaly: row.is_anomaly,
    doHistory: [...prev.doHistory.slice(-11), row.dissolved_oxygen],
    lastUpdate: 'just now',
    rawTemp: row.temperature,
    rawDO: row.dissolved_oxygen,
    rawDepth: row.water_depth,
    rawPH: row.ph,
    rawTurbidity: row.turbidity,
  };
}

const MAX_HISTORY = 200;

// ─── Context ──────────────────────────────────────────────────────────────────

export const DataContext = createContext<DataContextValue>({
  selectedSondeId: 'sonde_12',
  setSelectedSondeId: () => {},
  metricsPerSonde: { ...SONDE_SEEDS },
  currentMetrics: SONDE_SEEDS['sonde_12'],
  historicalData: [],
  lastSeenPerSonde: {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [selectedSondeId, setSelectedSondeId] = useState<SondeId>('sonde_12');
  const [metricsPerSonde, setMetricsPerSonde] = useState<Record<string, MetricsState>>({
    ...SONDE_SEEDS,
  });
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [lastSeenPerSonde, setLastSeenPerSonde] = useState<Record<string, number>>({});

  useEffect(() => {
    const channel = supabase
      .channel('sensor_logs_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_logs' },
        (payload) => {
          const row = payload.new as SensorRow;
          const id = row.sonde_id;

          setMetricsPerSonde((prev) => {
            const prevMetrics =
              prev[id] ?? SONDE_SEEDS[id as SondeId] ?? SONDE_SEEDS['sonde_12'];
            return { ...prev, [id]: rowToMetrics(row, prevMetrics) };
          });

          const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();

          const point: HistoricalPoint = {
            sonde_id: row.sonde_id,
            timestamp: ts,
            dissolved_oxygen: row.dissolved_oxygen,
            temperature: row.temperature,
            ph: row.ph,
            turbidity: row.turbidity,
            water_depth: row.water_depth,
            is_anomaly: row.is_anomaly,
          };

          setHistoricalData((prev) => {
            const next = [...prev, point];
            return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
          });

          setLastSeenPerSonde((prev) => ({ ...prev, [id]: ts }));
        },
      )
      .subscribe((status) => {
        if (__DEV__) console.log('[DataContext] global channel', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentMetrics =
    metricsPerSonde[selectedSondeId] ?? SONDE_SEEDS[selectedSondeId];

  return (
    <DataContext.Provider
      value={{
        selectedSondeId,
        setSelectedSondeId,
        metricsPerSonde,
        currentMetrics,
        historicalData,
        lastSeenPerSonde,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  return useContext(DataContext);
}
