export function tempStatus(v) {
  if (v >= 10 && v <= 20) return { label: 'Optimal',      color: '#00FF87', bg: 'rgba(0,255,135,0.10)' };
  if (v >= 5  && v <= 25) return { label: 'Marginal',     color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  return                          { label: 'Out of Range', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' };
}

export function doStatus(v) {
  if (v >= 7) return { label: 'Optimal', color: '#00FF87', bg: 'rgba(0,255,135,0.10)' };
  if (v >= 5) return { label: 'Low',     color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  return             { label: 'Hypoxic', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' };
}

export function phStatus(v) {
  if (v >= 6.5 && v <= 8.5) return { label: 'Neutral',  color: '#00FF87', bg: 'rgba(0,255,135,0.10)' };
  if (v >= 5.5 && v <= 9.5) return { label: 'Marginal', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  return                            { label: 'Critical', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' };
}

export function turbStatus(v) {
  if (v <= 10) return { label: 'Clear',    color: '#00FF87', bg: 'rgba(0,255,135,0.10)' };
  if (v <= 25) return { label: 'Moderate', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  return              { label: 'High',     color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' };
}

export function depthStatus(v) {
  if (v >= 0.5 && v <= 3.0) return { label: 'Normal',   color: '#00FF87', bg: 'rgba(0,255,135,0.10)' };
  if (v >= 0.2 && v <= 5.0) return { label: 'Marginal', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' };
  return                            { label: 'Critical', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' };
}

/* Max expected std-deviation per sensor channel (used to normalise deviation bars 0→100%) */
export const STD_MAX = {
  temperature:       5.0,
  dissolved_oxygen:  3.0,
  ph:                2.0,
  turbidity:         30.0,
  water_depth:       2.0,
};

export function stdColor(ratio) {
  if (ratio < 0.5) return '#00FF87';
  if (ratio < 0.8) return '#fbbf24';
  return '#FF3B5C';
}
