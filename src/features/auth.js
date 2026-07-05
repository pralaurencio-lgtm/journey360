// ============================================================
// auth.js — member registration / sign-in and staff (leadership) sign-in.
// All accounts are per-site (namespaced by the Store).
// ============================================================

import { App, saveAccount, setSite, roleMeta, initialsOf } from '../core/state.js';
import { STAGES } from '../config/content.js';
import { ROLES } from '../config/sites.js';
import { ARR } from '../ui/ring.js';
import { go } from '../core/router.js';
import { toast } from '../ui/toast.js';

let pickedStage = null;

export async function joinView() {
  const s = App.site;
  return `<section class="block"><div class="wrap">
    <a class="backlink" onclick="J.go('home')">← Back</a>
    <div class="formcard">
      <div class="eyebrow">${s.name}</div>
      <h2 style="font-size:2rem;margin:.4rem 0 .3rem">Create your Journey Account</h2>
      <p class="muted" style="margin-bottom:22px">Free, and yours. We’ll remember where you are and suggest your next step.</p>
      <div class="grid2">
        <div class="field"><label>Name</label><input class="input" id="f-name" placeholder="First & last"></div>
        <div class="field"><label>Email</label><input class="input" id="f-email" type="email" placeholder="you@email.com"></div>
      </div>
      <div class="field"><label>Where are you today?</label>
        <div class="stages" id="stageBox">
          ${STAGES.map((st) => `<div class="stage-opt" data-stage="${st.id}" onclick="J.pickStage('${st.id}')">
            <div class="r"></div><div class="st">${st.label}</div></div>`).join('')}
        </div>
      </div>
      <button class="btn" onclick="J.join()">Create account & see my journey ${ARR}</button>
      <span class="tiny muted" style="margin-left:10px">Have one already? <a onclick="J.go('signin')" style="color:var(--ink);font-weight:600;text-decoration:underline">Sign in</a></span>
    </div></div></section>`;
}
export function pickStage(id) {
  pickedStage = id;
  document.querySelectorAll('.stage-opt').forEach((o) => o.classList.toggle('sel', o.dataset.stage === id));
}
export async function join() {
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  if (!name) return toast('Please add your name.');
  if (!email.includes('@')) return toast('Please add a valid email.');
  if (!pickedStage) return toast('Pick where you are today.');
  App.me = { name, email, stage: pickedStage, createdAt: Date.now(), completed: {}, assessments: {}, habits: {}, plan: null, groupId: null };
  App.session = { kind: 'member', user: App.me };
  await saveAccount();
  toast(`Welcome to ${App.site.short}, ${name.split(' ')[0]} 🌱`);
  go('dashboard');
}

export async function signinView() {
  return `<section class="block"><div class="wrap">
    <a class="backlink" onclick="J.go('home')">← Back</a>
    <div class="formcard" style="max-width:460px">
      <div class="eyebrow">${App.site.name}</div>
      <h2 style="font-size:1.9rem;margin:.4rem 0 .3rem">Welcome back</h2>
      <p class="muted" style="margin-bottom:20px">Enter the email you used on this site.</p>
      <div class="field"><label>Email</label><input class="input" id="si-email" type="email" placeholder="you@email.com"></div>
      <button class="btn" onclick="J.memberSignin()" style="width:100%;justify-content:center">Continue ${ARR}</button>
      <p class="tiny muted center" style="margin-top:16px">New here? <a onclick="J.go('join')" style="color:var(--ink);font-weight:600;text-decoration:underline">Start your journey</a></p>
    </div></div></section>`;
}
export async function memberSignin() {
  const email = (document.getElementById('si-email').value || '').trim().toLowerCase();
  if (App.me && App.me.email.toLowerCase() === email) {
    App.session = { kind: 'member', user: App.me };
    toast('Signed in.'); go('dashboard');
  } else {
    toast('No account with that email on this site yet.');
  }
}

export async function staffSigninView() {
  const s = App.site;
  const demo = (s.staff || []).filter((x) => ['mentor', 'guide', 'leader'].includes(x.role))
    .filter((x, i, a) => a.findIndex((y) => y.role === x.role) === i); // one per role
  return `<section class="block"><div class="wrap">
    <a class="backlink" onclick="J.go('home')">← Back to ${s.short}</a>
    <div class="formcard" style="max-width:520px">
      <div class="eyebrow">Leadership access · ${s.name}</div>
      <h2 style="font-size:1.9rem;margin:.4rem 0 .3rem">Sign in to walk with others.</h2>
      <p class="muted" style="margin-bottom:20px">For mentors, spiritual guides, and leaders. Access depends on your role.</p>
      <div class="field"><label>Work email</label><input class="input" id="staff-email" type="email" placeholder="you@${s.id}.org"></div>
      <button class="btn" onclick="J.staffSignin()" style="width:100%;justify-content:center">Sign in ${ARR}</button>
      <div style="margin-top:22px;border-top:1px solid var(--line);padding-top:16px">
        <div class="tiny muted" style="margin-bottom:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase">Demo accounts — tap a role</div>
        <div style="display:flex;flex-direction:column;gap:9px">
          ${demo.map((x) => `<button class="stage-opt" onclick="J.quickStaff('${x.id}')" style="width:100%;text-align:left">
            <div class="idot">${initialsOf(x.name)}</div>
            <div style="flex:1"><div class="st">${x.name} <span class="role-badge ${x.role}">${ROLES[x.role].label}</span></div>
            <div class="sd">${x.title} · ${x.email}</div></div><span style="color:var(--ink-3)">${ARR}</span></button>`).join('')}
        </div>
      </div>
    </div></div></section>`;
}
export async function staffSignin() {
  const email = (document.getElementById('staff-email').value || '').trim().toLowerCase();
  const st = (App.site.staff || []).find((s) => s.email.toLowerCase() === email);
  if (!st) return toast('No leadership account with that email. Try a demo account.');
  quickStaff(st.id);
}
export async function quickStaff(id) {
  const st = (App.site.staff || []).find((s) => s.id === id);
  if (!st) return;
  App.session = { kind: 'staff', user: { id: st.id, role: st.role } };
  toast(`Signed in as ${st.name} · ${roleMeta(st.role).label}`);
  go('leadership');
}
export async function signout() {
  App.session = { kind: 'guest', user: null };
  toast('Signed out.'); go('home');
}
