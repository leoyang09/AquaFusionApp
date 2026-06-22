import { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import s from './MetricCard.module.css';

const cardVariants = {
  hidden:   { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
  visible:  {
    clipPath: 'inset(0 0 0% 0)',
    opacity: 1,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
};

function useCountUp(target, decimals, isReady) {
  const [display, setDisplay] = useState('0');
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (!isReady || isNaN(target)) return;
    ctrlRef.current?.stop();
    ctrlRef.current = animate(0, target, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplay(v.toFixed(decimals)),
    });
    return () => ctrlRef.current?.stop();
  }, [target, decimals, isReady]);

  return display;
}

export default function MetricCard({
  label, rawValue, unit, decimals, status, isAnomaly, sizeClass,
}) {
  const isReady   = rawValue !== 0 && unit !== '---';
  const animated  = useCountUp(rawValue, decimals, isReady);
  const valueStr  = isReady ? `${animated}${unit}` : '---';

  return (
    <motion.div
      variants={cardVariants}
      className={`${s.card} ${isAnomaly ? s.cardAnomaly : ''} ${sizeClass ? s[sizeClass] : ''}`}
    >
      {isAnomaly && <div className={s.stripeOverlay} />}

      <div className={s.top}>
        <span
          className={s.statusPill}
          style={{ background: status.bg, color: status.color }}
        >
          <span className={s.statusDot} style={{ background: status.color }} />
          {status.label}
        </span>
      </div>

      <div className={s.valueRow}>
        <span className={`${s.value} ${isAnomaly ? s.valueAnomaly : ''}`}>
          {valueStr}
        </span>
      </div>

      <div className={s.label}>{label}</div>
    </motion.div>
  );
}

/* Special full-width card variant for Water Depth with depth bar */
export function DepthCard({ rawValue, decimals, status, isAnomaly }) {
  const isReady  = rawValue !== 0;
  const animated = useCountUp(rawValue, decimals, isReady);
  const pct      = Math.min(100, (rawValue / 5.0) * 100);

  return (
    <motion.div
      variants={cardVariants}
      className={`${s.card} ${s.depthCard} ${isAnomaly ? s.cardAnomaly : ''}`}
    >
      {isAnomaly && <div className={s.stripeOverlay} />}

      <div className={s.depthRow}>
        <div className={s.depthLeft}>
          <span className={s.label}>WATER DEPTH</span>
          <span className={`${s.value} ${s.depthValue}`}>
            {isReady ? `${animated}${' m'}` : '---'}
          </span>
          <span
            className={s.statusPill}
            style={{ background: status.bg, color: status.color }}
          >
            <span className={s.statusDot} style={{ background: status.color }} />
            {status.label}
          </span>
        </div>

        <div className={s.depthBarWrap}>
          <div className={s.depthBarTrack}>
            <div
              className={s.depthBarFill}
              style={{
                height: `${pct}%`,
                background: `linear-gradient(to top, ${status.color}, rgba(0,242,255,0.3))`,
              }}
            />
            {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(tick => (
              <div
                key={tick}
                className={s.depthTick}
                style={{ bottom: `${(tick / 5.0) * 100}%` }}
              >
                <span className={s.depthTickLabel}>{tick}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
