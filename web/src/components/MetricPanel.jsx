import { motion } from 'framer-motion';
import { useData, EMPTY_METRICS } from '../lib/DataContext';
import { tempStatus, doStatus, phStatus, turbStatus, depthStatus } from '../lib/thresholds';
import MetricCard, { DepthCard } from './MetricCard';
import s from './MetricPanel.module.css';

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

export default function MetricPanel() {
  const { currentMetrics, selectedSondeId } = useData();
  const m = currentMetrics;

  const isWaiting = m.temperature === '---';
  const src = m.anomalySource;

  const tempSt  = tempStatus(m.rawTemp);
  const doSt    = doStatus(m.rawDO);
  const phSt    = phStatus(m.rawPH);
  const turbSt  = turbStatus(m.rawTurbidity);
  const depthSt = depthStatus(m.rawDepth);

  return (
    <section className={s.panel}>
      <header className={s.panelHeader}>
        <span className={s.panelTitle}>LIVE READINGS</span>
        <span className={s.panelSub}>{isWaiting ? 'awaiting hardware…' : `updated ${m.lastUpdate}`}</span>
      </header>

      {isWaiting ? (
        <div className={s.waiting}>
          <div className={s.waitingPulse} />
          <span className={s.waitingText}>No telemetry yet</span>
          <span className={s.waitingHint}>Waiting for first sensor packet from {selectedSondeId}</span>
        </div>
      ) : (
        <motion.div
          className={s.grid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <MetricCard
            label="TEMPERATURE"
            rawValue={m.rawTemp}
            unit="°C"
            decimals={1}
            status={tempSt}
            isAnomaly={src === 'temperature'}
            sizeClass="hero"
          />
          <MetricCard
            label="DISSOLVED O₂"
            rawValue={m.rawDO}
            unit=" mg/L"
            decimals={1}
            status={doSt}
            isAnomaly={src === 'dissolved_oxygen'}
            sizeClass="hero"
          />
          <MetricCard
            label="pH LEVEL"
            rawValue={m.rawPH}
            unit=""
            decimals={1}
            status={phSt}
            isAnomaly={src === 'ph'}
          />
          <MetricCard
            label="TURBIDITY"
            rawValue={m.rawTurbidity}
            unit=" NTU"
            decimals={1}
            status={turbSt}
            isAnomaly={src === 'turbidity'}
          />
          <DepthCard
            rawValue={m.rawDepth}
            decimals={2}
            status={depthSt}
            isAnomaly={src === 'water_depth'}
          />
        </motion.div>
      )}
    </section>
  );
}
