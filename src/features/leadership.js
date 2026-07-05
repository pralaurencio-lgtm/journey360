// ============================================================
// leadership.js — the back-end for mentors, guides, and leaders.
//   overview (everyone's progress, scoped by role) · member detail (+ live chat)
//   · group goals · AI review queue
// ============================================================

import {
  App, currentStaff, staffById, scopedMembers, memberById, canView, canReassign,
  effMentor, memberOverall, needsFollowup, ago, initialsOf,
} from '../core/state.js';
import { PILLARS, ORDER, stageLabel } from '../config/content.js';
import { ROLES } from '../config/sites.js';
import { ringSVG, bars, ARR } from '../ui/ring.js';
import { groupStats, loadGM, bubbles, dmChannelFor } from './community.js';
import { go, refresh } from '../core/router.js';
import { toast } from '../ui/toast.js';

// shared ops (notes / mentor overrides / check-ins)
async function loadOps() {
  const ops = (await App.store.get('ops', { shared: true })) || { notes: {}, mentor: {}, checkins: {} };
  App.cacheMentor = ops.mentor || {};
  App.ops = ops;
  return ops;
}
async function saveOps() { await App.store.set('ops', App.ops, { shared: true }); }

function banner() {
  const st = currentStaff();
  return `<div class="lead-banner"><div class="wrap">
    <div class="lb-l"><span class="dotpulse"></span> Leadership · ${App.site.short}</div>
    <div class="lb-role">${st.name} · ${st.title}</div></div></div>`;
}
function leadTabs(active) {
  const tabs = [['leadership', 'Overview'], ['leadgroups', 'Groups & goals'], ['aireview', 'AI review']];
  return `<div class="subnav"><div class="wrap subnav-in">
    ${tabs.map(([v, l]) => `<a class="${active === v ? 'on' : ''}" onclick="J.go('${v}')">${l}</a>`).join('')}</div></div>`;
}

// ---------- overview ----------
export async function leadershipView() {
  const st = currentStaff(); if (!st) { go('staff-signin'); return ''; }
  await loadOps();
  const scope = scopedMembers();
  const L = App.cacheLead || (App.cacheLead = { q: '', follow: false });
  let rows = scope.slice();
  if (L.q) { const q = L.q.toLowerCase(); rows = rows.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)); }
  if (L.follow) rows = rows.filter(needsFollowup);
  rows.sort((a, b) => memberOverall(b) - memberOverall(a));

  const avg = (k) => scope.length ? Math.round(scope.reduce((a, m) => a + m.progress[k], 0) / scope.length) : 0;
  const overallAvg = scope.length ? Math.round(scope.reduce((a, m) => a + memberOverall(m), 0) / scope.length) : 0;
  const follow = scope.filter(needsFollowup).length;

  const table = rows.length ? rows.map((m) => {
    const mentor = staffById(effMentor(m));
    const mini = ORDER.map((k) => `<div class="mb"><div class="mt"><div class="mf" style="width:${m.progress[k]}%;background:${PILLARS[k].color}"></div></div><div class="ml">${PILLARS[k].name[0]}</div></div>`).join('');
    return `<tr class="mrow" onclick="J.go('member','${m.id}')">
      <td><div class="m-name">${m.name} ${m.isYou ? '<span class="you-tag">You</span>' : ''} ${needsFollowup(m) ? '<span class="flag">Follow up</span>' : ''}</div><div class="m-mail">${m.email}</div></td>
      <td>${stageLabel(m.stage)}</td><td><div class="minibars">${mini}</div></td>
      <td><span class="ov">${memberOverall(m)}%</span></td>
      <td class="mentor-cell">${mentor ? mentor.name : '<span class="none">Unassigned</span>'}</td>
      <td>${ago(m.lastDays)}</td></tr>`;
  }).join('') : '<tr><td colspan="6"><div class="empty">No members match.</div></td></tr>';

  return `${banner()}${leadTabs('leadership')}<section class="wrap" style="padding-top:26px">
    <div class="eyebrow">${st.role === 'mentor' ? 'Your mentees' : 'Everyone’s progress'}</div>
    <h1 style="font-size:clamp(1.9rem,4vw,2.6rem);font-weight:600;margin-top:.3rem">Welcome, ${st.name.split(' ')[0]}.</h1>
    <div style="margin-top:.5rem"><span class="role-badge ${st.role}">${ROLES[st.role].label}</span></div>
    <div class="caps">${ROLES[st.role].caps.map((c) => `<span>${c}</span>`).join('')}</div>
    <div class="statgrid">
      <div class="stat"><div class="n">${scope.length}</div><div class="l">${st.role === 'mentor' ? 'People you mentor' : 'Members'}</div></div>
      <div class="stat"><div class="n">${overallAvg}%</div><div class="l">Average progress</div></div>
      <div class="stat ${follow ? 'warn' : ''}"><div class="n">${follow}</div><div class="l">Need follow-up</div></div>
      <div class="stat"><div class="n">${scope.filter((m) => m.joinedDays <= 30).length}</div><div class="l">Joined ≤ 30 days</div></div>
    </div>
    <div class="avgblock"><h4>Average progress across ${st.role === 'mentor' ? 'your mentees' : 'the community'}</h4>
      <div class="bars" style="max-width:100%">${ORDER.map((k) => `<div class="bar-row"><div class="nm">${PILLARS[k].emoji} ${PILLARS[k].name}</div>
        <div class="track"><div class="fill" style="width:${avg(k)}%;background:${PILLARS[k].color}"></div></div><div class="vv">${avg(k)}%</div></div>`).join('')}</div></div>
    <div class="toolbar"><div class="search"><input placeholder="Search name or email…" value="${L.q.replace(/"/g, '&quot;')}" oninput="J.leadFilter('q',this.value)"></div>
      <div class="toggle ${L.follow ? 'on' : ''}" onclick="J.leadFilter('follow',${!L.follow})">⚑ Needs follow-up</div></div>
    <div class="mtable-wrap"><table class="mtable"><thead><tr>
      <th>Member</th><th>Stage</th><th>Belong · Discover · Grow · Serve</th><th>Overall</th><th>Mentor</th><th>Last active</th>
    </tr></thead><tbody>${table}</tbody></table></div>
    <p class="tiny muted" style="margin-top:12px">Tap any member to open their journey, chat, or leave a note.</p><div style="height:36px"></div></section>`;
}
export function leadFilter(field, val) { App.cacheLead = App.cacheLead || { q: '', follow: false }; App.cacheLead[field] = val; refresh(); }

// ---------- member detail ----------
export async function memberDetailView(id) {
  const st = currentStaff(); if (!st) { go('staff-signin'); return ''; }
  await loadOps();
  const m = memberById(id);
  if (!m) return `${banner()}<section class="wrap block"><a class="backlink" onclick="J.go('leadership')">← Back</a><div class="empty">Member not found.</div></section>`;
  if (!canView(m)) return `${banner()}<section class="wrap block"><a class="backlink" onclick="J.go('leadership')">← Back</a>
    <div class="formcard center" style="max-width:480px"><h3 style="font-size:1.4rem">Not assigned to you</h3>
    <p class="muted" style="margin-top:.5rem">Mentors see only their own mentees.</p></div></section>`;

  const mentor = staffById(effMentor(m));
  const core = `<div class="big">${memberOverall(m)}%</div><div class="small">Overall</div>`;
  const notes = (App.ops.notes[m.id] || []).map((n) => ({ ...n, type: 'note' }));
  const checks = (App.ops.checkins[m.id] || []).map((c) => ({ ...c, type: 'checkin' }));
  const timeline = [...notes, ...checks].sort((a, b) => b.at - a.at);

  const assignCtrl = canReassign()
    ? `<div class="assign-row"><span class="muted" style="font-size:.86rem">Mentor:</span>
        <select onchange="J.assignMentor('${m.id}',this.value)"><option value="">Unassigned</option>
        ${App.site.staff.filter((s) => s.role === 'mentor' || s.role === 'guide').map((s) => `<option value="${s.id}" ${effMentor(m) === s.id ? 'selected' : ''}>${s.name} — ${ROLES[s.role].label}</option>`).join('')}</select></div>`
    : `<div class="muted" style="font-size:.88rem">Mentor: <b style="color:var(--ink)">${mentor ? mentor.name : 'Unassigned'}</b></div>`;

  // live conversation (same channel the member uses)
  App.cacheChat = dmChannelFor(m);
  const msgs = (await App.store.get(App.cacheChat, { shared: true })) || [];

  return `${banner()}<section class="wrap" style="padding-top:24px">
    <a class="backlink" onclick="J.go('leadership')">← ${st.role === 'mentor' ? 'Your mentees' : 'All members'}</a>
    <div class="dash-top" style="padding-top:14px"><div>
      <h1>${m.name} ${m.isYou ? '<span class="you-tag">You</span>' : ''}</h1>
      <div class="md-meta"><span>${m.email}</span><span>Joined ${m.joinedDays === 0 ? 'today' : m.joinedDays + ' days ago'}</span><span>Active ${ago(m.lastDays)}</span></div>
      <div class="stage-chip" style="margin-top:10px">📍 ${stageLabel(m.stage)}</div> ${needsFollowup(m) ? '<span class="flag">Needs follow-up</span>' : ''}
      <div style="margin-top:14px">${assignCtrl}</div>${bars(m.progress)}
    </div>${ringSVG(m.progress, { labels: true, showPct: true, size: 300, core, animate: true })}</div>

    <div class="nextstep"><div><div class="ns-k">Suggested next step</div><h3>${suggestFor(m)}</h3>
      <p>Based on where ${m.name.split(' ')[0]} is right now.</p></div>
      <button class="btn" onclick="J.toast('Suggestion sent to ${m.name.split(' ')[0]}.')">Suggest it ${ARR}</button></div>

    <div class="dgrid">
      <div class="panel"><h3>Assessments</h3>
        ${['strengths', 'gifts'].map((t) => { const d = m.assessments[t]; return `<div class="item"><div class="il"><div class="idot">${t === 'gifts' ? '✨' : '🧭'}</div><div><div class="nm">${t === 'gifts' ? 'Spiritual Gifts' : 'Strengths'}</div><div class="rst">${d ? 'Result: <b>' + d.name + '</b>' : 'Not taken'}</div></div></div></div>`; }).join('')}
        <div style="margin-top:14px"><div class="note-compose">
          <textarea id="note-${m.id}" placeholder="Add a private note — a conversation, a prayer request, something to remember…"></textarea>
          <div style="display:flex;gap:.6rem;margin-top:10px"><button class="btn sm" onclick="J.addNote('${m.id}')">Save note</button>
          <button class="btn sm ghost" onclick="J.logCheckin('${m.id}')">Log check-in ✓</button></div></div>
          <div class="timeline">${timeline.length ? timeline.map((t) => `<div class="tnote ${t.type === 'checkin' ? 'checkin' : ''}"><div class="tav">${t.type === 'checkin' ? '✓' : '✎'}</div>
            <div><div><span class="tby">${t.by}</span> <span class="twhen">· ${new Date(t.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
            <div class="ttext">${(t.text || 'Checked in.').replace(/</g, '&lt;')}</div></div></div>`).join('') : '<div class="tiny muted" style="padding:12px 0">No notes yet.</div>'}</div>
        </div>
      </div>

      <div class="panel"><h3>Conversation</h3><div class="sub">Live 1:1 with ${m.name.split(' ')[0]} — same thread they see.</div>
        <div class="chat"><div class="chat-msgs" id="chatmsgs" style="height:300px">${bubbles(msgs, st.id)}</div>
          <div class="chat-input"><input id="chatinput" placeholder="Message ${m.name.split(' ')[0]}…" onkeydown="if(event.key==='Enter')J.sendChat()">
            <button class="btn" onclick="J.sendChat()">Send</button></div></div></div>
    </div><div style="height:40px"></div></section>`;
}
function suggestFor(m) {
  const p = m.progress;
  for (const k of ORDER) if (p[k] < 100) return `${PILLARS[k].name} — ${PILLARS[k].resources[0].title.toLowerCase()}`;
  return 'Invite them to mentor someone new.';
}
export async function addNote(id) {
  const el = document.getElementById('note-' + id); const text = (el.value || '').trim(); if (!text) return toast('Write something first.');
  const st = currentStaff();
  await loadOps(); (App.ops.notes[id] = App.ops.notes[id] || []).push({ by: `${st.name} · ${ROLES[st.role].label}`, text, at: Date.now() });
  await saveOps(); toast('Note saved.'); refresh();
}
export async function logCheckin(id) {
  const st = currentStaff(); await loadOps();
  (App.ops.checkins[id] = App.ops.checkins[id] || []).push({ by: st.name, text: 'Checked in.', at: Date.now() });
  await saveOps(); toast('Check-in logged.'); refresh();
}
export async function assignMentor(id, staffId) {
  await loadOps(); App.ops.mentor[id] = staffId || null; App.cacheMentor = App.ops.mentor;
  await saveOps(); const s = staffById(staffId); toast(s ? `Assigned to ${s.name}.` : 'Unassigned.'); refresh();
}

// ---------- group goals ----------
export async function leadGroupsView() {
  const st = currentStaff(); if (!st) { go('staff-signin'); return ''; }
  const gm = await loadGM();
  const cards = App.site.groups.map((g) => {
    const s = groupStats(g, gm); const leader = staffById(g.leader);
    return `<div class="gcard"><div class="ghead"><div class="gemo" style="background:${g.color}22">${g.emoji}</div>
      <div><div class="gname">${g.name}</div><div class="gleader">Led by ${leader ? leader.name : '—'} · ${s.count} members</div></div>
      <div class="gpct" style="color:${g.color}">${s.pct}%</div></div>
      <div class="ggoal">🎯 ${g.goal.label}</div>
      <div class="track"><div class="fill" style="width:${s.pct}%;background:${g.color}"></div></div></div>`;
  }).join('');
  return `${banner()}${leadTabs('leadgroups')}<section class="wrap block" style="padding-top:24px">
    <div class="eyebrow">Groups & goals</div><h1 style="font-size:clamp(1.8rem,4vw,2.4rem);font-weight:600;margin:.3rem 0 18px">How every group is doing</h1>
    <div class="gcards">${cards}</div><div style="height:30px"></div></section>`;
}

// ---------- AI review ----------
export async function aiReviewView() {
  const st = currentStaff(); if (!st) { go('staff-signin'); return ''; }
  const log = ((await App.store.get('ai_log', { shared: true })) || []).slice().reverse();
  const pending = log.filter((x) => x.status === 'pending').length;
  const items = log.length ? log.map((x) => `<div class="airow ${x.status}">
    <div class="aihead"><div><span class="aiwho">${x.memberName}</span> <span class="aiwhen">· ${new Date(x.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div>
      <span class="aistatus ${x.status}">${x.status === 'pending' ? 'Needs review' : x.status === 'approved' ? 'Approved' + (x.reviewedBy ? ' · ' + x.reviewedBy : '') : 'Flagged'}</span></div>
    <div class="aiq">Q: ${esc(x.question)}</div><div class="aia">${esc(x.answer)}</div>
    ${x.status === 'pending' ? `<div class="aiacts"><button class="btn sm" onclick="J.reviewAI('${x.id}','approved')">Approve</button>
      <button class="btn sm ghost" onclick="J.reviewAI('${x.id}','flagged')">Flag for follow-up</button></div>` : ''}</div>`).join('')
    : '<div class="empty">No AI questions yet. When members ask, answers land here for review.</div>';
  return `${banner()}${leadTabs('aireview')}<section class="wrap block" style="padding-top:24px">
    <div class="eyebrow">AI review queue</div><h1 style="font-size:clamp(1.8rem,4vw,2.4rem);font-weight:600;margin:.3rem 0 6px">Check the AI’s answers</h1>
    <p class="muted" style="margin-bottom:16px">${pending} awaiting review. Approve good answers or flag ones that need a human follow-up.</p>
    <div class="ailist">${items}</div><div style="height:30px"></div></section>`;
}
export async function reviewAI(id, status) {
  const st = currentStaff();
  const log = (await App.store.get('ai_log', { shared: true })) || [];
  const row = log.find((x) => x.id === id); if (row) { row.status = status; row.reviewedBy = st.name; }
  await App.store.set('ai_log', log, { shared: true });
  toast(status === 'approved' ? 'Approved.' : 'Flagged for follow-up.'); refresh();
}
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
