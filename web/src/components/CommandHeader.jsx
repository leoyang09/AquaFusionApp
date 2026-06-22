import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData, EMPTY_METRICS } from '../lib/DataContext';
import { sondeIdToName } from '../lib/formatters';
import s from './CommandHeader.module.css';

const headerVariants = {
  hidden:   { y: -20, opacity: 0 },
  visible:  { y: 0,   opacity: 1, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

export default function CommandHeader() {
  const {
    selectedSondeId, setSelectedSondeId,
    currentMetrics, devicesList,
  } = useData();

  const [open, setOpen]     = useState(false);
  const [clock, setClock]   = useState('');

  const isAnomaly = currentMetrics.isAnomaly;

  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const sondes = devicesList.length > 0
    ? devicesList.map(d => ({
        id:    d.sonde_id,
        label: `${d.location_name}`,
        sub:   sondeIdToName(d.sonde_id),
      }))
    : [
        { id: 'sonde_12', label: 'Lake Alpha',  sub: 'Sonde #12' },
        { id: 'sonde_45', label: 'Site B — River', sub: 'Sonde #45' },
      ];

  const activeSonde = sondes.find(s => s.id === selectedSondeId) ?? sondes[0];

  return (
    <motion.header className={s.header} variants={headerVariants}>
      {/* ── Logo ── */}
      <div className={s.logo}>
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
          <path d="M9 0L18 5V15L9 20L0 15V5L9 0Z" fill="none" stroke="#00F2FF" strokeWidth="1"/>
          <path d="M9 4L14 7V13L9 16L4 13V7L9 4Z" fill="rgba(0,242,255,0.18)"/>
          <circle cx="9" cy="10" r="2" fill="#00F2FF"/>
        </svg>
        <span className={s.logoText}>AQUAFUSION</span>
        <span className={s.logoBadge}>COMMAND</span>
      </div>

      {/* ── Sonde Selector ── */}
      <div className={s.selectorWrap}>
        <button
          className={s.selectorBtn}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`${s.selectorDot} ${isAnomaly ? s.dotAnomaly : s.dotNormal}`} />
          <span className={s.selectorLabel}>{activeSonde.label}</span>
          <span className={s.selectorSub}>{activeSonde.sub}</span>
          <svg
            className={`${s.chevron} ${open ? s.chevronOpen : ''}`}
            width="10" height="6" viewBox="0 0 10 6" fill="none"
          >
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {open && (
          <ul className={s.dropdown} role="listbox">
            {sondes.map(sonde => (
              <li
                key={sonde.id}
                role="option"
                aria-selected={sonde.id === selectedSondeId}
                className={`${s.dropdownItem} ${sonde.id === selectedSondeId ? s.dropdownItemActive : ''}`}
                onClick={() => { setSelectedSondeId(sonde.id); setOpen(false); }}
              >
                <span className={`${s.dropDot} ${sonde.id === selectedSondeId ? s.dropDotActive : ''}`} />
                <span className={s.dropLabel}>{sonde.label}</span>
                <span className={s.dropSub}>{sonde.sub}</span>
                {sonde.id === selectedSondeId && (
                  <svg width="8" height="8" viewBox="0 0 8 8" className={s.checkmark}>
                    <circle cx="4" cy="4" r="3" fill="#00F2FF"/>
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── System Status ── */}
      <div className={`${s.statusBadge} ${isAnomaly ? s.statusAnomaly : s.statusNormal}`}>
        <span className={`${s.statusDot} ${isAnomaly ? s.statusDotAlarm : s.statusDotOk}`} />
        <span className={s.statusText}>
          {isAnomaly ? 'ANOMALY DETECTED' : 'ALL SYSTEMS NOMINAL'}
        </span>
      </div>

      {/* ── Clock ── */}
      <div className={s.clock}>
        <span className={s.clockLabel}>LOCAL</span>
        <span className={s.clockValue}>{clock}</span>
      </div>
    </motion.header>
  );
}
