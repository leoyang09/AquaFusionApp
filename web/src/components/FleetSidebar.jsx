import { motion } from 'framer-motion';
import { useData } from '../lib/DataContext';
import { sondeIdToName, formatRelativeTime, signalToStrength } from '../lib/formatters';
import s from './FleetSidebar.module.css';

const sidebarVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.50 } },
};

const rowVariants = {
  hidden:   { x: 18, opacity: 0 },
  visible:  { x: 0,  opacity: 1, transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] } },
};

function BatteryBar({ level }) {
  const pct  = Math.min(100, Math.max(0, level ?? 0));
  const color = pct > 60 ? '#00FF87' : pct > 25 ? '#fbbf24' : '#FF3B5C';
  return (
    <div className={s.batteryWrap} title={`${pct}%`}>
      <div className={s.batteryTrack}>
        <div className={s.batteryFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={s.batteryPct} style={{ color }}>{pct}%</span>
    </div>
  );
}

function SignalDots({ signal }) {
  const strength = signalToStrength(signal);
  return (
    <div className={s.signalDots}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`${s.signalDot} ${i <= strength ? s.signalDotActive : ''}`}
          style={i <= strength ? { height: `${6 + i * 2}px` } : { height: `${6 + i * 2}px` }}
        />
      ))}
    </div>
  );
}

export default function FleetSidebar() {
  const {
    selectedSondeId, setSelectedSondeId,
    devicesList, alarmLatchPerSonde, lastSeenPerSonde, timeTick,
  } = useData();

  const devices = devicesList.length > 0 ? devicesList : [
    { sonde_id: 'sonde_12', location_name: 'Lake Alpha',     battery_level: 78, signal: '80', firmware: '1.2.4' },
    { sonde_id: 'sonde_45', location_name: 'River Site B',   battery_level: 34, signal: '45', firmware: '1.2.3' },
  ];

  const now = Date.now();

  return (
    <section className={s.panel}>
      <header className={s.panelHeader}>
        <span className={s.panelTitle}>FLEET STATUS</span>
        <span className={s.deviceCount}>{devices.length} UNITS</span>
      </header>

      <motion.ul
        className={s.list}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {devices.map(device => {
          const isActive  = device.sonde_id === selectedSondeId;
          const hasAlarm  = alarmLatchPerSonde[device.sonde_id] != null;
          const lastSeenMs = lastSeenPerSonde[device.sonde_id];
          const lastSeen  = lastSeenMs ? formatRelativeTime(lastSeenMs, now) : 'no data';

          return (
            <motion.li
              key={device.sonde_id}
              variants={rowVariants}
              className={`${s.device} ${isActive ? s.deviceActive : ''} ${hasAlarm ? s.deviceAlarm : ''}`}
              onClick={() => setSelectedSondeId(device.sonde_id)}
            >
              <div className={s.activeAccent} />

              <div className={s.deviceTop}>
                <div className={s.deviceName}>
                  <span
                    className={`${s.deviceDot} ${hasAlarm ? s.dotAlarm : isActive ? s.dotActive : s.dotIdle}`}
                  />
                  <span className={s.deviceLabel}>{sondeIdToName(device.sonde_id)}</span>
                  {hasAlarm && <span className={s.alarmTag}>ALARM</span>}
                </div>
                <SignalDots signal={device.signal} />
              </div>

              <div className={s.locationRow}>
                <svg width="7" height="9" viewBox="0 0 7 9" fill="none" aria-hidden="true" className={s.pinIcon}>
                  <path d="M3.5 0C1.567 0 0 1.567 0 3.5C0 6.125 3.5 9 3.5 9C3.5 9 7 6.125 7 3.5C7 1.567 5.433 0 3.5 0Z" fill="rgba(0,242,255,0.5)"/>
                  <circle cx="3.5" cy="3.5" r="1.2" fill="rgba(0,242,255,0.9)"/>
                </svg>
                <span className={s.locationName}>{device.location_name}</span>
              </div>

              <BatteryBar level={device.battery_level} />

              <div className={s.deviceMeta}>
                {device.firmware && (
                  <span className={s.firmwareTag}>FW {device.firmware}</span>
                )}
                <span className={s.lastSeen}>{lastSeen}</span>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* ── Fleet summary ── */}
      <div className={s.fleetSummary}>
        <div className={s.summaryRow}>
          <span className={s.summaryDot} style={{ background: '#00FF87' }} />
          <span className={s.summaryText}>
            {devices.filter(d => !alarmLatchPerSonde[d.sonde_id]).length} nominal
          </span>
        </div>
        <div className={s.summaryRow}>
          <span className={s.summaryDot} style={{ background: '#FF3B5C' }} />
          <span className={s.summaryText}>
            {Object.values(alarmLatchPerSonde).filter(Boolean).length} alarmed
          </span>
        </div>
      </div>
    </section>
  );
}
