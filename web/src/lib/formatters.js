export function formatRelativeTime(tsMs, now = Date.now()) {
  const diffSec = Math.floor((now - tsMs) / 1000);
  if (diffSec < 60)  return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export function getTurbidityLevel(ntu) {
  if (ntu < 5)  return 'Low';
  if (ntu < 20) return 'Moderate';
  return 'High';
}

export function sondeIdToName(id) {
  const m = id.match(/^sonde_(\w+)$/i);
  if (m) return `Sonde #${m[1]}`;
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatAlarmAge(latchedAtMs) {
  const diff = Date.now() - latchedAtMs;
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function signalToStrength(signal) {
  if (!signal) return 3;
  const n = parseInt(signal, 10);
  if (!isNaN(n)) return Math.min(5, Math.max(1, Math.round((n / 100) * 5)));
  const map = { excellent: 5, strong: 4, good: 3, weak: 2, poor: 1 };
  return map[signal.toLowerCase()] ?? 3;
}
