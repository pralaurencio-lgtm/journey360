// ============================================================
// app.js — bootstrap. Wires modules into a view registry + a single global
// action surface (window.J) that the HTML calls, applies per-tenant theme,
// runs the router, and polls for live chat.
// ============================================================

import { App, setSite, pickSiteFromUrl, initialsOf } from './core/state.js';
import { SITES } from './config/sites.js';
import { mount, go, route, refresh } from './core/router.js';
import { toast } from './ui/toast.js';

import { homeView, pillarView, groupsView } from './features/public.js';
import { joinView, pickStage, join, signinView, memberSignin, staffSigninView, staffSignin, quickStaff, signout } from './features/auth.js';
import { dashboardView, todayView, growView, assessView, startAssess, answer, startPlan, markReading, toggleHabit, toggleSabbath } from './features/member.js';
import { communityView, refreshChat, chatTab, sendChat, joinGroup } from './features/community.js';
import { askView, askAI, askAIWith } from './features/ai.js';
import { leadershipView, memberDetailView, leadGroupsView, aiReviewView, leadFilter, addNote, logCheckin, assignMentor, reviewAI } from './features/leadership.js';

const VIEWS = {
  home: homeView, pillar: pillarView, groups: groupsView,
  join: joinView, signin: signinView, 'staff-signin': staffSigninView,
  dashboard: dashboardView, today: todayView, grow: growView, assess: assessView, community: communityView, ask: askView,
  leadership: leadershipView, member: memberDetailView, leadgroups: leadGroupsView, aireview: aiReviewView,
};

// ---------- global action surface ----------
window.J = {
  go, toast,
  switchSite: async (id) => { await setSite(id); const u = new URL(location.href); u.searchParams.set('site', id); history.replaceState({}, '', u); go('home'); },
  pickStage, join, memberSignin, staffSignin, quickStaff, signout,
  startAssess, answer, startPlan, markReading, toggleHabit, toggleSabbath,
  chatTab, sendChat, joinGroup,
  askAI, askAIWith,
  leadFilter, addNote, logCheckin, assignMentor, reviewAI,
};

// ---------- theme ----------
function applyTheme(site) {
  const r = document.documentElement;
  Object.entries(site.theme || {}).forEach(([k, v]) => r.style.setProperty(k, v));
}

// ---------- nav + footer ----------
function renderNav() {
  const el = document.getElementById('nav'); if (!el) return;
  const s = App.site;
  let right;
  if (App.session.kind === 'staff') {
    const st = App.site.staff.find((x) => x.id === App.session.user.id) || { name: 'Staff' };
    right = `<a class="btn ghost sm" onclick="J.go('leadership')">Leadership</a>
      <div class="nav-user" onclick="J.signout()" title="Sign out"><div class="avatar">${initialsOf(st.name)}</div></div>`;
  } else if (App.session.kind === 'member') {
    right = `<a class="btn ghost sm" onclick="J.go('dashboard')">My Journey</a>
      <div class="nav-user" onclick="J.signout()" title="Sign out"><div class="avatar">${initialsOf(App.me.name)}</div></div>`;
  } else {
    right = `<a onclick="J.go('signin')" style="color:var(--ink-2);font-weight:500;padding:.5rem .6rem">Sign in</a>
      <button class="btn" onclick="J.go('join')">Start your journey</button>`;
  }
  el.innerHTML = `<div class="wrap nav-in">
    <div class="brand" onclick="J.go('home')"><span class="brand-dot"></span>${s.wordmark}</div>
    <nav class="nav-links">
      <a onclick="J.go('pillar','belong')">Belong</a><a onclick="J.go('pillar','discover')">Discover</a>
      <a onclick="J.go('pillar','grow')">Grow</a><a onclick="J.go('pillar','serve')">Serve</a>
      <a onclick="J.go('groups')">Groups</a>
    </nav>
    <div class="nav-right">${right}</div></div>`;
}

function renderFooter() {
  const el = document.getElementById('foot'); if (!el) return;
  el.innerHTML = `<div class="wrap foot-in">
    <div><div class="brand" onclick="J.go('home')">${App.site.wordmark}</div>
      <div class="path muted">${App.site.tagline}</div>
      <div class="tiny muted" style="margin-top:8px">${App.site.name}</div></div>
    <div class="foot-links">
      <a onclick="J.go('groups')">Groups &amp; goals</a>
      <a onclick="J.go('join')">Start your journey</a>
      <a onclick="J.go('staff-signin')" style="color:var(--ink);font-weight:600">For mentors &amp; guides →</a>
      <label class="site-switch">Site
        <select onchange="J.switchSite(this.value)">
          ${SITES.map((x) => `<option value="${x.id}" ${x.id === App.site.id ? 'selected' : ''}>${x.short}</option>`).join('')}
        </select></label>
    </div></div>`;
}

// ---------- render ----------
let lastKey = '';
let pollTimer = null;
function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

async function render() {
  stopPoll();
  applyTheme(App.site);
  renderNav();
  const { view, param } = route();
  const fn = VIEWS[view] || homeView;
  const app = document.getElementById('app');
  app.innerHTML = await fn(param);
  renderFooter();

  const key = view + '/' + (param || '');
  if (key !== lastKey) { window.scrollTo(0, 0); lastKey = key; }

  // live chat polling on chat-bearing views
  if (view === 'community' || view === 'member') {
    const box = document.getElementById('chatmsgs'); if (box) box.scrollTop = box.scrollHeight;
    pollTimer = setInterval(refreshChat, 3000);
  }
}

// ---------- boot ----------
(async function boot() {
  App.site = pickSiteFromUrl();
  await setSite(App.site.id);
  mount(render);
  render();
})();
