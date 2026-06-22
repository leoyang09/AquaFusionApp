import { motion, useReducedMotion } from 'framer-motion';
import { useData } from './lib/DataContext';
import CommandHeader   from './components/CommandHeader';
import MetricPanel     from './components/MetricPanel';
import SignalIntelPanel from './components/SignalIntelPanel';
import FleetSidebar    from './components/FleetSidebar';
import DiagnosticStrip from './components/DiagnosticStrip';
import s from './App.module.css';

// SVG grid background as a data URI
const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(0%2C242%2C255%2C0.04)' stroke-width='0.5'/%3E%3C/svg%3E")`;

const bgVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export default function App() {
  const shouldReduce = useReducedMotion();
  const { currentMetrics } = useData();
  const hasAlarm = currentMetrics?.isAnomaly;

  return (
    <motion.div
      className={`${s.root} ${hasAlarm ? s.rootAlarm : ''}`}
      style={{ backgroundImage: GRID_SVG }}
      variants={bgVariants}
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
    >
      <div className={s.scanline} aria-hidden="true" />

      <div className={`${s.grid} ${hasAlarm ? s.gridAlarm : ''}`}>
        <CommandHeader />
        <MetricPanel />
        <SignalIntelPanel />
        <FleetSidebar />
        <DiagnosticStrip />
      </div>
    </motion.div>
  );
}
