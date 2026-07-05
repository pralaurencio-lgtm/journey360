// ============================================================
// ring.js — the signature Journey Ring (4 arcs = Belong/Discover/Grow/Serve)
// plus a few shared UI atoms.
// ============================================================

import { PILLARS, ORDER } from '../config/content.js';

function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function arc(cx, cy, r, a1, a2) {
  const [x1, y1] = polar(cx, cy, r, a1), [x2, y2] = polar(cx, cy, r, a2);
  const large = (a2 - a1) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function ringSVG(progress, opts = {}) {
  const { labels = true, showPct = false, size = 340, core = null, animate = false } = opts;
  const c = size / 2, r = size * 0.30, gap = 4;
  const quad = { belong: [0, 90], discover: [90, 180], grow: [180, 270], serve: [270, 360] };
  let arcs = '', lbls = '';
  ORDER.forEach((k, i) => {
    const [a, b] = quad[k]; const s = a + gap, e = b - gap;
    const pct = Math.max(0, Math.min(100, progress[k] || 0));
    arcs += `<path class="arc-track" d="${arc(c, c, r, s, e)}"/>` +
      `<path class="arc-fill" d="${arc(c, c, r, s, e)}" stroke="${PILLARS[k].color}" pathLength="100" style="stroke-dasharray:${pct} 100;${animate ? `animation-delay:${i * 0.14}s` : ''}"/>`;
    if (labels) {
      const mid = (a + b) / 2; const [lx, ly] = polar(c, c, r + size * 0.11, mid);
      lbls += `<text class="emo" x="${lx.toFixed(1)}" y="${(ly - 6).toFixed(1)}" text-anchor="middle">${PILLARS[k].emoji}</text>` +
        `<text class="lbl" x="${lx.toFixed(1)}" y="${(ly + 12).toFixed(1)}" text-anchor="middle">${PILLARS[k].name}</text>` +
        (showPct ? `<text class="pct" x="${lx.toFixed(1)}" y="${(ly + 27).toFixed(1)}" text-anchor="middle">${pct}%</text>` : '');
    }
  });
  return `<div class="ringwrap ${animate ? 'animate' : ''}">
    <svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px" role="img" aria-label="Journey ring">${arcs}${lbls}</svg>
    ${core ? `<div class="core">${core}</div>` : ''}</div>`;
}

export const ARR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
export const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

export function bars(progress) {
  return `<div class="bars">${ORDER.map((k) => `<div class="bar-row">
    <div class="nm">${PILLARS[k].emoji} ${PILLARS[k].name}</div>
    <div class="track"><div class="fill" style="width:${progress[k]}%;background:${PILLARS[k].color}"></div></div>
    <div class="vv">${progress[k] === 100 ? '✓' : (progress[k] || 0) + '%'}</div></div>`).join('')}</div>`;
}
