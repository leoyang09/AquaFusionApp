import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../lib/DataContext';
import { formatAlarmAge } from '../lib/formatters';
import s from './DiagnosticStrip.module.css';

const SOURCE_NAMES = {
  dissolved_oxygen: 'Dissolved Oxygen',
  temperature:      'Temperature',
  ph:               'pH Level',
  turbidity:        'Turbidity',
  water_depth:      'Water Depth',
};

const stripVariants = {
  hidden:   { y: 40, opacity: 0 },
  visible:  { y: 0,  opacity: 1, transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.75 } },
  exit:     { y: 16, opacity: 0, transition: { duration: 0.22 } },
};

export default function DiagnosticStrip() {
  const {
    currentMetrics: m, selectedSondeId,
    alarmLatchPerSonde, clearAlarmForSonde,
  } = useData();

  const [confirming, setConfirming] = useState(false);

  const latch      = alarmLatchPerSonde[selectedSondeId] ?? null;
  const isLatched  = latch !== null;
  const isActive   = isLatched || m.isAnomaly;

  if (!isActive) return null;

  const isCritical = isLatched;
  const sourceName = isLatched
    ? (SOURCE_NAMES[latch.source] ?? latch.source ?? 'Unknown Sensor')
    : (SOURCE_NAMES[m.anomalySource] ?? 'Unknown Sensor');

  const message = isCritical
    ? `Critical ${sourceName} reading — autoencoder anomaly flag latched`
    : `Alert: Minor deviation in ${sourceName} detected`;

  const alarmAge = isLatched ? formatAlarmAge(latch.latchedAt) : '';

  function handleReset() {
    if (!confirming) { setConfirming(true); return; }
    clearAlarmForSonde(selectedSondeId);
    setConfirming(false);
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={`${s.strip} ${isCritical ? s.stripCritical : s.stripInfo}`}
          variants={stripVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
          <div className={s.leftAccent} />

          <div className={s.inner}>
            {/* ── Icon ── */}
            <div className={`${s.iconBox} ${isCritical ? s.iconCrit : s.iconInfo}`}>
              <span className={s.iconText}>!</span>
            </div>

            {/* ── Message ── */}
            <div className={s.textWrap}>
              <span className={`${s.message} ${isCritical ? s.messageCrit : s.messageInfo}`}>
                {message}
              </span>
              {alarmAge && (
                <span className={`${s.age} ${isCritical ? s.messageCrit : s.messageInfo}`}>
                  {alarmAge}
                </span>
              )}
            </div>

            {/* ── Actions ── */}
            <div className={s.actions}>
              {isLatched && (
                <button
                  className={`${s.resetBtn} ${confirming ? s.resetBtnConfirm : ''}`}
                  onClick={handleReset}
                  onBlur={() => setConfirming(false)}
                >
                  {confirming ? (
                    <>
                      <span className={s.confirmCheck}>✓</span>
                      Confirm Reset?
                    </>
                  ) : (
                    'Clear & Reset Alarm'
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
