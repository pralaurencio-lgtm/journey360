// ============================================================
// public.js — the public, no-login surface for each site.
//   home · pillar detail · public "Groups & Goals" dashboard (also the join screen)
// ============================================================

import { App } from '../core/state.js';
import { PILLARS, ORDER } from '../config/content.js';
import { ringSVG, ARR } from '../ui/ring.js';
import { groupStats, loadGM } from './community.js';
import { currentMemberRecord } from '../core/state.js';

export async function homeView() {
  const s = App.site;
  const demo = App.me ? currentMemberRecord().progress : { belong: 100, discover: 62, grow: 38, serve: 16 };
  const core = `<div class="big">360°</div><div class="small">The whole journey</div>`;
  return `<section class="hero"><div class="wrap"><div class="hero-grid">
    <div>
      <div class="eyebrow">${s.name}</div>
      <h1>${s.wordmark}</h1>
      <div class="path">${s.tagline.split(' ').map((w) => `<b>${w}</b>`).join(' ')}</div>
      <p class="lede">${s.blurb}</p>
      <div class="hero-cta">
        <button class="btn" onclick="J.go('${App.me ? 'dashboard' : 'join'}')">${App.me ? 'Continue your journey' : 'Start your journey'} ${ARR}</button>
        <a class="btn ghost" onclick="J.go('pillar','belong')">See how it works</a>
      </div>
    </div>
    ${ringSVG(demo, { labels: true, size: 360, core, animate: true })}
  </div></div></section>

  <section class="block"><div class="wrap">
    <div class="sec-head"><div class="eyebrow">Four movements</div>
      <h2>You can enter at any point — most people begin by belonging.</h2>
      <p>Community usually comes before commitment. The door is relationships; everything else grows from there.</p></div>
    <div class="pillars">${ORDER.map((k) => { const p = PILLARS[k]; return `<div class="pcard" style="--pc:${p.color}" onclick="J.go('pillar','${k}')">
      <div class="emo">${p.emoji}</div><h3>${p.name}</h3><div class="tag">${p.tagline}</div>
      <div class="q">“${p.question}”</div><div class="go">Explore ${ARR}</div></div>`; }).join('')}</div>
  </div></section>`;
}

export async function pillarView(k) {
  const p = PILLARS[k]; if (!p) return homeView();
  const res = p.resources.map((r) => `<div class="res"><div class="chk" style="--pc:${p.color}"></div>
    <div><div class="rtitle">${r.title} ${r.public ? '<span class="pill-tag pub">Open to all</span>' : r.assess ? '<span class="pill-tag assess">Assessment</span>' : '<span class="pill-tag mem">Members</span>'}</div>
    <div class="ract">${r.assess ? `<button class="btn sm" onclick="J.go('${App.me ? 'assess' : 'join'}'${App.me ? `,'${r.assess}'` : ''})">Start</button>` : App.me ? '' : `<button class="btn sm ghost" onclick="J.go('join')">Sign in to track</button>`}</div>
    </div></div>`).join('');
  return `<section class="detail-hero" style="--pc:${p.color}"><div class="wrap">
    <a class="backlink" onclick="J.go('home')">← All movements</a>
    <div class="eyebrow" style="color:${p.color}">${p.emoji} Movement · ${ORDER.indexOf(k) + 1} of 4</div>
    <h1>${p.name}</h1><div class="path" style="color:${p.color}">${p.tagline}</div>
    <div class="qbanner"><span class="k">Key question</span> “${p.question}”</div></div></section>
    <section class="block" style="--pc:${p.color};padding-top:30px"><div class="wrap"><div class="res-grid">${res}</div></div></section>`;
}

// Public groups dashboard — how every group is reaching its goals.
// Doubles as the join / switch-group screen for signed-in members.
export async function groupsView() {
  const gm = await loadGM();
  const ranked = App.site.groups.map((g) => ({ g, s: groupStats(g, gm) })).sort((a, b) => b.s.pct - a.s.pct);
  const cards = ranked.map(({ g, s }) => {
    const mine = App.me && App.me.groupId === g.id;
    return `<div class="gcard"><div class="ghead"><div class="gemo" style="background:${g.color}22">${g.emoji}</div>
      <div><div class="gname">${g.name}</div><div class="gleader">${s.count} members</div></div>
      <div class="gpct" style="color:${g.color}">${s.pct}%</div></div>
      <div class="gdesc">${g.desc}</div><div class="ggoal">🎯 ${g.goal.label}</div>
      <div class="track"><div class="fill" style="width:${s.pct}%;background:${g.color}"></div></div>
      ${App.me ? `<button class="btn sm ${mine ? 'ghost' : ''}" style="margin-top:14px;width:100%;justify-content:center" onclick="J.joinGroup('${g.id}')">${mine ? 'You’re in this group ✓' : 'Join this group'}</button>` : ''}</div>`;
  }).join('');
  return `<section class="wrap block">
    <div class="eyebrow">Community</div>
    <h1 style="font-size:clamp(2rem,4.5vw,2.9rem);font-weight:600;margin:.3rem 0 6px">Groups &amp; goals</h1>
    <p class="muted" style="max-width:60ch;margin-bottom:24px">Every group is working toward a goal together. ${App.me ? 'Pick one to join — you can switch anytime.' : 'This is a live look at how each one is doing.'}</p>
    <div class="gcards">${cards}</div>
    ${App.me ? '' : `<div class="center" style="margin-top:26px"><button class="btn" onclick="J.go('join')">Start your journey to join ${ARR}</button></div>`}
    <div style="height:30px"></div></section>`;
}
