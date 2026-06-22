import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../lib/DataContext';
import { STD_MAX, stdColor } from '../lib/thresholds';
import s from './SignalIntelPanel.module.css';

const panelVariants = {
  hidden:   { x: 28, opacity: 0 },
  visible:  { x: 0,  opacity: 1, transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1], delay: 0.42 } },
};

const barVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.48 } },
};

const barItemVariants = {
  hidden:   { opacity: 0, x: -12 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const STD_LABELS = [
  { key: 'stdTemp',     label: 'TEMPERATURE',  maxKey: 'temperature',       unit: '°C'   },
  { key: 'stdDO',       label: 'DISSOLVED O₂', maxKey: 'dissolved_oxygen',  unit: 'mg/L' },
  { key: 'stdPH',       label: 'pH',           maxKey: 'ph',                unit: 'pH'   },
  { key: 'stdTurbidity',label: 'TURBIDITY',    maxKey: 'turbidity',         unit: 'NTU'  },
  { key: 'stdDepth',    label: 'DEPTH',        maxKey: 'water_depth',       unit: 'm'    },
];

const SOURCE_DISPLAY = {
  dissolved_oxygen: 'Dissolved O₂',
  temperature:      'Temperature',
  ph:               'pH Level',
  turbidity:        'Turbidity',
  water_depth:      'Water Depth',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className={s.tooltip}>
      <span>{payload[0].value?.toFixed(2)}</span>
      <span className={s.tooltipUnit}>mg/L</span>
    </div>
  );
}

export default function SignalIntelPanel() {
  const { currentMetrics: m } = useData();

  const chartData = m.doHistory.map((v, i) => ({ i, v }));
  const hasHistory = chartData.length > 1;

  return (
    <motion.section
      className={s.panel}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Anomaly Source Tag ── */}
      {m.isAnomaly && m.anomalySource && (
        <div className={s.anomalyTag}>
          <span className={s.anomalyDot} />
          <span className={s.anomalyLabel}>AUTOENCODER FLAG</span>
          <span className={s.anomalySource}>
            {SOURCE_DISPLAY[m.anomalySource] ?? m.anomalySource}
          </span>
        </div>
      )}

      {/* ── DO History Sparkline ── */}
      <div className={s.sparkSection}>
        <div className={s.sparkHeader}>
          <span className={s.sectionTitle}>DO HISTORY</span>
          <span className={s.sparkUnit}>mg/L · last {chartData.length} readings</span>
        </div>

        <div className={s.sparkWrap}>
          {hasHistory ? (
            <>
              <div className={s.sparkMinMax}>
                <span>{Math.max(...m.doHistory).toFixed(1)}</span>
                <span>{Math.min(...m.doHistory).toFixed(1)}</span>
              </div>
              <div className={s.sparkChart}>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00F2FF" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#00F2FF" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#00F2FF"
                      strokeWidth={1.5}
                      fill="url(#doGrad)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className={s.sparkEmpty}>No history yet</div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className={s.divider} />

      {/* ── Std Deviation Bars ── */}
      <div className={s.stdSection}>
        <span className={s.sectionTitle}>SIGNAL DEVIATION</span>
        <motion.div
          className={s.bars}
          variants={barVariants}
          initial="hidden"
          animate="visible"
        >
          {STD_LABELS.map(({ key, label, maxKey, unit }) => {
            const val   = m[key] ?? 0;
            const max   = STD_MAX[maxKey];
            const ratio = Math.min(1, val / max);
            const color = stdColor(ratio);
            const pct   = Math.round(ratio * 100);

            return (
              <motion.div key={key} className={s.barRow} variants={barItemVariants}>
                <div className={s.barMeta}>
                  <span className={s.barLabel}>{label}</span>
                  <span className={s.barValue} style={{ color }}>
                    {val > 0 ? `±${val.toFixed(2)} ${unit}` : '—'}
                  </span>
                </div>
                <div className={s.barTrack}>
                  <div
                    className={s.barFill}
                    style={{
                      width: `${pct}%`,
                      background: color,
                      boxShadow: pct > 80 ? `0 0 8px ${color}60` : 'none',
                    }}
                  />
                  <div className={s.barThreshold} style={{ left: '80%' }} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Current readings summary ── */}
      <div className={s.divider} />
      <div className={s.summary}>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>TURBIDITY CLASS</span>
          <span className={s.summaryValue}>{m.turbidityLevel}</span>
        </div>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>LAST PACKET</span>
          <span className={s.summaryValue}>{m.lastUpdate}</span>
        </div>
      </div>
    </motion.section>
  );
}
