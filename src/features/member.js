// ============================================================
// member.js — the signed-in member experience.
//   dashboard  · today (reading + habits + Sabbath School) · grow · assessments
//   plus the activity- & assessment-aware next-step engine.
// ============================================================

import { App, saveAccount, currentMemberRecord, memberOverall } from '../core/state.js';
import { PILLARS, ORDER, PLANS, SABBATH, SABBATH_DAYS, HABITS, ASSESSMENTS, stageLabel } from '../config/content.js';
import { ringSVG, bars, ARR } from '../ui/ring.js';
import { go, refresh } from '../core/router.js';
import { toast } from '../ui/toast.js';

const need = () => { if (!App.me) { go('join'); return false; } return true; };

// ---------- reading plan helpers ----------
const planDayIndex = () => App.me.plan ? Math.min(Math.floor((Date.now() - App.me.plan.start) / 864e5), PLANS[App.me.plan.id].days.length - 1) : 0;
const todayReading = () => App.me.plan ? PLANS[App.me.plan.id].days[planDayIndex()] : null;
const isTodayRead = () => !!(App.me.plan && (App.me.plan.done || []).includes(planDayIndex()));
function readingStreak() {
  if (!App.me.plan) return 0;
  const done = new Set(App.me.plan.done || []); let i = planDayIndex(), n = 0;
  if (!done.has(i)) i--;
  while (i >= 0 && done.has(i)) { n++; i--; }
  return n;
}
const todayKey = () => new Date().toISOString().slice(0, 10);
const habitCount = (k) => Object.values(App.me.habits[k] || {}).filter(Boolean).length;

// ---------- next step (activity + assessments) ----------
export function nextStep() {
  const p = currentMemberRecord().progress;
  const A = App.me.assessments || {};
  const R = (title, body, cta, view, param) => ({ title, body, cta, view, param });
  if (!App.me.groupId) return R('Join a small group', 'Relationships are the front door. Find people to walk with.', 'Browse groups', 'groups', null);
  if (p.belong < 100) return R('Find people who care', 'Keep settling into community through a Belong resource.', 'Go to Belong', 'pillar', 'belong');
  if (!A.strengths) return R('Take the Strengths assessment', 'You’ve found community — now discover how you’re wired.', 'Start Strengths', 'assess', 'strengths');
  if (p.discover < 100) return R('Keep exploring your purpose', `Your top strength is ${A.strengths.name}. See where it points in Discover.`, 'Go to Discover', 'pillar', 'discover');
  if (!App.me.plan) return R('Start a daily Bible reading plan', 'A steady rhythm in Scripture turns growth into a habit.', 'Choose a plan', 'today', null);
  if (!isTodayRead()) { const s = readingStreak(); return R('Do today’s reading', s > 1 ? `You’re on a ${s}-day streak — keep it going.` : 'Today’s passage is waiting.', 'Open today', 'today', null); }
  if (p.grow < 100) return R('Build your next habit', 'You’re growing well. Add a course or habit from Grow.', 'Go to Grow', 'grow', null);
  if (!A.gifts) return R('Take the Spiritual Gifts assessment', 'Now discover how God has equipped you to serve others.', 'Start Spiritual Gifts', 'assess', 'gifts');
  if (p.serve < 100) return R('Explore ministry opportunities', `Your top gift is ${A.gifts.name}. Find a place to use it.`, 'See where to serve', 'pillar', 'serve');
  return R('Mentor someone new', 'You’ve walked the whole journey — help someone else begin.', 'Talk to your mentor', 'community', null);
}

// ---------- dashboard ----------
export async function dashboardView() {
  if (!need()) return '';
  const m = currentMemberRecord();
  const overall = memberOverall(m);
  const ns = nextStep();
  const grp = App.site.groups.find((g) => g.id === App.me.groupId);
  const core = `<div class="big">${overall}%</div><div class="small">Overall</div>`;
  return `${memberTabs('dashboard')}
    <section class="wrap"><div class="dash-top">
      <div>
        <div class="eyebrow">My journey</div>
        <h1>Welcome back, ${m.name.split(' ')[0]}.</h1>
        <div class="stage-chip">📍 ${stageLabel(m.stage)}</div>
        ${bars(m.progress)}
        <div style="margin-top:16px" class="muted tiny">${grp ? `In group: <b style="color:var(--ink)">${grp.emoji} ${grp.name}</b>` : 'Not in a group yet.'}</div>
      </div>
      ${ringSVG(m.progress, { labels: true, showPct: true, size: 320, core, animate: true })}
    </div>
    <div class="nextstep"><div><div class="ns-k">Your next step</div><h3>${ns.title}</h3><p>${ns.body}</p></div>
      <button class="btn" onclick="J.go('${ns.view}'${ns.param ? `,'${ns.param}'` : ''})">${ns.cta} ${ARR}</button></div>
    <div style="height:36px"></div></section>`;
}

// ---------- today (daily rhythm) ----------
export async function todayView() {
  if (!need()) return '';
  return `${memberTabs('today')}<section class="wrap block" style="padding-top:20px">
    <div class="eyebrow">Your daily rhythm</div>
    <h1 style="font-size:clamp(1.9rem,4vw,2.6rem);font-weight:600;margin:.3rem 0 6px">Today with God</h1>
    <div class="today-grid">
      <div>${readingCard()}${App.site.features.sabbath ? sabbathCard() : ''}</div>
      <div>${habitsCard()}</div>
    </div><div style="height:30px"></div></section>`;
}

function readingCard() {
  if (!App.me.plan) {
    return `<div class="panel"><h3>Bible reading plan</h3><div class="sub">Pick a rhythm to read through Scripture.</div>
      ${Object.values(PLANS).map((p) => `<div class="item"><div class="il"><div class="idot">${p.emoji}</div>
        <div><div class="nm">${p.name}</div><div class="rst">${p.blurb} · ${p.days.length} days</div></div></div>
        <button class="btn sm" onclick="J.startPlan('${p.id}')">Start</button></div>`).join('')}</div>`;
  }
  const plan = PLANS[App.me.plan.id], done = isTodayRead(), streak = readingStreak();
  return `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center">
      <div><h3>${plan.emoji} ${plan.name}</h3><div class="sub">Day ${planDayIndex() + 1} of ${plan.days.length} · 🔥 ${streak}-day streak</div></div>
    </div>
    <div class="reading-today"><div class="rlabel">Today’s reading</div><div class="rref">${todayReading()}</div></div>
    <button class="btn ${done ? 'ghost' : ''}" onclick="J.markReading()" style="width:100%;justify-content:center;margin-top:12px">${done ? 'Read ✓ — well done' : 'Mark today complete'}</button>
    <div class="tiny muted" style="margin-top:10px">Change plan? <a onclick="J.startPlan('')" style="color:var(--ink);text-decoration:underline;cursor:pointer">pick another</a></div></div>`;
}

function sabbathCard() {
  const wk = SABBATH.weeks[0]; // production: compute current week by date
  const jsDay = new Date().getDay(); // 0 Sun ... 6 Sat
  const todayIdx = jsDay === 6 ? 0 : jsDay + 1; // Sabbath=0, Sun=1 ... Fri=6
  return `<div class="panel" style="margin-top:20px"><h3>📖 Sabbath School</h3>
    <div class="sub">${SABBATH.quarter} · Week ${wk.n}: ${wk.title}</div>
    <div class="memory">Memory text · ${wk.memory}</div>
    <div class="sabbath-days">
      ${wk.days.map((d, i) => {
        const key = `w${wk.n}d${i}`, done = App.me.sabbath && App.me.sabbath[key];
        return `<div class="sday ${i === todayIdx ? 'now' : ''} ${done ? 'done' : ''}" onclick="J.toggleSabbath('${key}')">
          <div class="sdname">${SABBATH_DAYS[i]}${i === todayIdx ? ' · today' : ''}</div>
          <div class="sdread">${d.read}</div><div class="sdfocus">${d.focus}</div></div>`;
      }).join('')}
    </div>
    <div class="tiny muted" style="margin-top:10px">${SABBATH.note}</div></div>`;
}

function habitsCard() {
  const k = todayKey(), today = App.me.habits[k] || {};
  // last 7 days mini
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5); const kk = d.toISOString().slice(0, 10); days.push({ lbl: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], n: habitCount(kk) }); }
  return `<div class="panel"><h3>🌿 Healthy habits</h3><div class="sub">Caring for the body is part of following Jesus. ${Object.values(today).filter(Boolean).length}/${HABITS.length} today.</div>
    <div class="habit-grid">
      ${HABITS.map((h) => `<div class="habit ${today[h.id] ? 'on' : ''}" onclick="J.toggleHabit('${h.id}')">
        <div class="hemo">${h.emoji}</div><div class="hn">${h.name}</div><div class="hd">${h.desc}</div></div>`).join('')}
    </div>
    <div class="week7"><div class="w7label">Last 7 days</div><div class="w7row">
      ${days.map((d) => `<div class="w7col"><div class="w7bar" style="height:${6 + d.n * 5}px;background:${d.n ? 'var(--grow)' : 'rgba(27,29,54,.12)'}"></div><div class="w7lbl">${d.lbl}</div></div>`).join('')}
    </div></div></div>`;
}

// ---------- grow (assessments + courses) ----------
export async function growView() {
  if (!need()) return '';
  const A = App.me.assessments || {};
  const arow = (id, name, emoji) => { const d = A[id]; return `<div class="item"><div class="il"><div class="idot">${emoji}</div>
    <div><div class="nm">${name}</div><div class="rst">${d ? 'Result: <b>' + d.name + '</b>' : 'Not started'}</div></div></div>
    <button class="btn sm ${d ? 'ghost' : ''}" onclick="J.go('assess','${id}')">${d ? 'Retake' : 'Start'}</button></div>`; };
  const courses = PILLARS.grow.resources.filter((r) => r.course);
  return `${memberTabs('grow')}<section class="wrap block" style="padding-top:20px">
    <div class="eyebrow">Grow</div><h1 style="font-size:clamp(1.9rem,4vw,2.6rem);font-weight:600;margin:.3rem 0 18px">Keep becoming like Christ</h1>
    <div class="dgrid">
      <div class="panel"><h3>My assessments</h3><div class="sub">How you’re wired, and how you’re equipped.</div>
        ${arow('strengths', 'Strengths', '🧭')}${arow('gifts', 'Spiritual Gifts', '✨')}</div>
      <div class="panel"><h3>My courses</h3><div class="sub">Habits that keep you growing.</div>
        ${courses.map((c) => `<div class="item"><div class="il"><div class="idot">📘</div><div class="nm">${c.title}</div></div>
          <button class="btn sm ghost" onclick="J.toast('Course player coming soon')">Continue</button></div>`).join('')}</div>
    </div><div style="height:30px"></div></section>`;
}

// ---------- assessments (compact engine) ----------
export async function assessView(type) {
  if (!need()) return '';
  const A = ASSESSMENTS[type]; if (!A) return dashboardView();
  const q = App.cacheQuiz;
  if (q && q.type === type && q.done) {
    const r = q.result;
    return `<section class="wrap block assess-shell center"><div class="eyebrow">${A.emoji} ${A.title} · result</div>
      <div class="result-hero"><p class="muted">Your top ${type === 'gifts' ? 'gift' : 'strength'} is</p>
      <div class="rname">${r.name}</div><div class="tag-row">${r.tags.map((t) => `<span>${t}</span>`).join('')}</div></div>
      <div style="display:flex;gap:.7rem;justify-content:center;margin-top:24px;flex-wrap:wrap">
        <button class="btn" onclick="J.go('dashboard')">See my dashboard ${ARR}</button>
        <button class="btn ghost" onclick="J.startAssess('${type}')">Retake</button></div></section>`;
  }
  if (!q || q.type !== type) { App.cacheQuiz = { type, i: 0, answers: [] }; }
  const qz = App.cacheQuiz, item = A.questions[qz.i], pct = Math.round(qz.i / A.questions.length * 100);
  const scale = [['Strongly disagree', 1], ['Disagree', 2], ['Neutral', 3], ['Agree', 4], ['Strongly agree', 5]];
  return `<section class="wrap block assess-shell"><a class="backlink" onclick="J.go('grow')">← Save & exit</a>
    <div class="eyebrow">${A.emoji} ${A.title}</div>
    <div class="qprog"><div class="qf" style="width:${pct}%"></div></div>
    <div class="tiny muted" style="margin-bottom:14px">Question ${qz.i + 1} of ${A.questions.length}</div>
    <div class="statement">“${item.t}”</div>
    <div class="scale">${scale.map(([lab, v]) => `<button onclick="J.answer(${v})">${lab}<span class="dot"></span></button>`).join('')}</div></section>`;
}
export function startAssess(type) { App.cacheQuiz = { type, i: 0, answers: [] }; go('assess', type); }
export async function answer(v) {
  const q = App.cacheQuiz, A = ASSESSMENTS[q.type];
  q.answers.push({ c: A.questions[q.i].c, v }); q.i++;
  if (q.i >= A.questions.length) {
    const score = {}; q.answers.forEach((a) => score[a.c] = (score[a.c] || 0) + a.v);
    const top = Object.keys(score).sort((x, y) => score[y] - score[x])[0];
    q.done = true; q.result = A.results[top];
    App.me.assessments = App.me.assessments || {}; App.me.assessments[q.type] = { name: q.result.name, tags: q.result.tags };
    await saveAccount();
  }
  refresh();
}

// ---------- daily actions ----------
export async function startPlan(id) {
  if (!id) { App.me.plan = null; await saveAccount(); return refresh(); }
  App.me.plan = { id, start: Date.now(), done: [] }; await saveAccount(); toast(`Started ${PLANS[id].name}.`); refresh();
}
export async function markReading() {
  const i = planDayIndex(); App.me.plan.done = App.me.plan.done || [];
  const at = App.me.plan.done.indexOf(i);
  if (at >= 0) App.me.plan.done.splice(at, 1); else App.me.plan.done.push(i);
  await saveAccount(); refresh();
}
export async function toggleHabit(id) {
  const k = todayKey(); App.me.habits[k] = App.me.habits[k] || {}; App.me.habits[k][id] = !App.me.habits[k][id];
  await saveAccount(); refresh();
}
export async function toggleSabbath(key) {
  App.me.sabbath = App.me.sabbath || {}; App.me.sabbath[key] = !App.me.sabbath[key];
  await saveAccount(); refresh();
}

// ---------- member sub-nav ----------
export function memberTabs(active) {
  const tabs = [['dashboard', 'My Journey'], ['today', 'Today'], ['grow', 'Grow'], ['community', 'Community'], ['ask', 'Ask']];
  return `<div class="subnav"><div class="wrap subnav-in">
    ${tabs.map(([v, l]) => `<a class="${active === v ? 'on' : ''}" onclick="J.go('${v}')">${l}</a>`).join('')}
  </div></div>`;
}
