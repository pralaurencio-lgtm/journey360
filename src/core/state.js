// ============================================================
// state.js — in-memory app state + session, all scoped to the active site.
// Persistent bits (account, habits, plan, group joins, chat) go through the Store.
// ============================================================

import { SITES, getSite, DEFAULT_SITE, ROLES } from '../config/sites.js';
import { makeStore } from './store.js';
import { ORDER, STAGES } from '../config/content.js';

export const App = {
  site: null,        // active site config
  store: null,       // Store bound to the site
  session: { kind: 'guest', user: null }, // 'member' | 'staff' | 'guest'
  me: null,          // the current member's persisted record (or null)
  seeded: {},        // per-site seed flags
};

export function pickSiteFromUrl() {
  const q = new URLSearchParams(location.search).get('site');
  return getSite(q || DEFAULT_SITE);
}

export async function setSite(id) {
  App.site = getSite(id);
  App.store = makeStore(App.site.id);
  App.session = { kind: 'guest', user: null };
  App.me = await App.store.get('account');
  if (App.me) App.session = { kind: 'member', user: App.me };
  await seedSite();
}

// ---------- staff / roles ----------
export const staffById = (id) => (App.site.staff || []).find((s) => s.id === id) || null;
export const currentStaff = () => (App.session.kind === 'staff' ? staffById(App.session.user.id) : null);
export const roleMeta = (role) => ROLES[role];

// ---------- members ----------
export function effMentor(m) {
  const overrides = App.cacheMentor || {};
  return overrides[m.id] !== undefined ? overrides[m.id] : m.mentorId;
}
export function currentMemberRecord() {
  if (!App.me) return null;
  return {
    id: 'me', name: App.me.name, email: App.me.email, stage: App.me.stage,
    groupId: App.me.groupId || null, mentorId: App.me.mentorId || (App.site.staff.find((s) => s.role === 'mentor') || {}).id || null,
    progress: progressFor(App.me), assessments: App.me.assessments || {},
    habitDays: totalHabitDays(App.me), readingPct: readingPct(App.me),
    joinedDays: App.me.createdAt ? Math.floor((Date.now() - App.me.createdAt) / 864e5) : 0,
    lastDays: 0, isYou: true,
  };
}
export function allMembers() {
  const list = (App.site.demoMembers || []).slice();
  const me = currentMemberRecord();
  if (me) list.unshift(me);
  return list;
}
export const memberById = (id) => allMembers().find((m) => m.id === id) || null;

export function scopedMembers() {
  const st = currentStaff();
  if (!st) return [];
  const all = allMembers();
  return st.role === 'mentor' ? all.filter((m) => effMentor(m) === st.id) : all;
}
export function canView(m) {
  const st = currentStaff();
  if (!st) return false;
  return st.role !== 'mentor' || effMentor(m) === st.id;
}
export const canReassign = () => {
  const st = currentStaff();
  return st && (st.role === 'guide' || st.role === 'leader');
};

// ---------- progress (stage floor raised by completed steps) ----------
export function progressFor(acc) {
  const out = {};
  ORDER.forEach((k) => {
    const floor = (STAGES.find((s) => s.id === acc.stage) || { floor: {} }).floor[k] || 0;
    const done = (acc.completed || {});
    // completed steps stored as {id:true}; a step is <pillarKey><n>
    const steps = Object.keys(done).filter((id) => id[0] === k[0]);
    // NOTE: simple heuristic; production would map explicitly. Floor dominates in demo.
    out[k] = Math.min(100, Math.max(floor, steps.length * 15));
  });
  return out;
}
export const memberOverall = (m) => Math.round((m.progress.belong + m.progress.discover + m.progress.grow + m.progress.serve) / 4);
export const needsFollowup = (m) => m.lastDays > 21 || (memberOverall(m) < 20 && m.lastDays >= 7);

// ---------- daily rhythm helpers (reading / habits) ----------
export const totalHabitDays = (acc) => Object.keys(acc.habits || {}).filter((k) => Object.values(acc.habits[k] || {}).some(Boolean)).length;
export function readingPct(acc) {
  if (!acc.plan) return 0;
  const p = acc.plan;
  return Math.round(((p.done || []).length) / Math.max(1, planLength(p.id)) * 100);
}
import { PLANS } from '../config/content.js';
export const planLength = (id) => (PLANS[id] ? PLANS[id].days.length : 1);

export function ago(d) { return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; }
export function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'J';
}

// ---------- persistence shortcuts for the current member ----------
export async function saveAccount() { await App.store.set('account', App.me); }

// ---------- seed shared demo data per site (chat, group members, ai log) ----------
async function seedSite() {
  if (await App.store.get('seeded', { shared: true })) return;
  const gm = {};
  (App.site.demoMembers || []).forEach((m) => { if (m.groupId) (gm[m.groupId] = gm[m.groupId] || []).push(m.id); });
  await App.store.set('groupMembers', gm, { shared: true });

  const now = Date.now();
  const firstGroup = (App.site.groups || [])[0];
  const firstMentor = (App.site.staff || []).find((s) => s.role === 'mentor');
  if (firstGroup && firstMentor) {
    await App.store.set(`chat:grp:${firstGroup.id}`, [
      { id: 's1', from: firstMentor.id, fromName: firstMentor.name, role: 'mentor', text: 'Welcome, everyone! So glad you’re here. What are you hoping for this month?', at: now - 8.6e7 },
    ], { shared: true });
    await App.store.set(`chat:dm:me:${firstMentor.id}`, [
      { id: 'd1', from: firstMentor.id, fromName: firstMentor.name, role: 'mentor', text: `Hi! I’m ${firstMentor.name.split(' ')[0]}, your mentor. However your week’s going, I’m glad you started. Anything on your mind?`, at: now - 1.7e8 },
    ], { shared: true });
  }
  await App.store.set('ai_log', [], { shared: true });
  await App.store.set('seeded', true, { shared: true });
}
