// ============================================================
// community.js — small groups + live chat (group channel + 1:1 mentor DM).
// "Live" = shared store + 3s polling so two people see each other's messages.
// ============================================================

import { App, currentMemberRecord, currentStaff, staffById, effMentor, initialsOf } from '../core/state.js';
import { ARR } from '../ui/ring.js';
import { go, refresh } from '../core/router.js';
import { toast } from '../ui/toast.js';

export async function loadGM() { return (await App.store.get('groupMembers', { shared: true })) || {}; }

export function groupStats(g, gm) {
  const ids = new Set([...(gm[g.id] || []), ...App.site.demoMembers.filter((m) => m.groupId === g.id).map((m) => m.id)]);
  const members = App.site.demoMembers.filter((m) => ids.has(m.id));
  if (App.me && App.me.groupId === g.id) members.push(currentMemberRecord());
  const count = members.length;
  let pct = 0;
  if (g.goal.type === 'pillar') { const avg = count ? members.reduce((a, m) => a + (m.progress[g.goal.pillar] || 0), 0) / count : 0; pct = Math.min(100, Math.round(avg / g.goal.target * 100)); }
  else if (g.goal.type === 'habits') { const sum = members.reduce((a, m) => a + (m.habitDays || 0), 0); pct = Math.min(100, Math.round(sum / g.goal.target * 100)); }
  else if (g.goal.type === 'reading') { const avg = count ? members.reduce((a, m) => a + (m.readingPct || 0), 0) / count : 0; pct = Math.round(avg); }
  return { count, pct, members };
}

// ---------- identity + channels ----------
function whoAmI() {
  const st = currentStaff();
  if (st) return { id: st.id, name: st.name, role: st.role };
  if (App.me) return { id: 'me', name: App.me.name, role: 'member' };
  return { id: 'guest', name: 'Guest', role: 'guest' };
}
function myMentorId() { const me = currentMemberRecord(); return me ? effMentor(me) : (App.site.staff.find((s) => s.role === 'mentor') || {}).id; }
export function channelOf(tab) {
  if (tab === 'mentor') return `chat:dm:me:${myMentorId()}`;
  return `chat:grp:${App.me ? App.me.groupId : ''}`;
}

export function dmChannelFor(m) { return `chat:dm:${m.id}:${effMentor(m) || 'unassigned'}`; }
export function bubbles(msgs, meId) {
  if (!msgs || !msgs.length) return '<div class="tiny muted" style="padding:24px 4px">No messages yet. Say hello 👋</div>';
  return msgs.map((m) => {
    const mine = m.from === meId;
    const tag = m.role === 'mentor' ? '<span class="crole">Mentor</span>' : m.role === 'leader' ? '<span class="crole">Leader</span>' : '';
    const when = new Date(m.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const txt = (m.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<div class="cmsg ${mine ? 'me' : ''}">${mine ? '' : `<div class="cav">${initialsOf(m.fromName)}</div>`}
      <div class="cbub"><div class="cmeta">${mine ? 'You' : m.fromName} ${tag} <span class="cwhen">· ${when}</span></div>
      <div class="ctext">${txt}</div></div></div>`;
  }).join('');
}

// ---------- community view (member) ----------
export async function communityView() {
  if (!App.me) { go('join'); return ''; }
  if (!App.me.groupId) { return groupsGate(); }
  const { memberTabs } = await import('./member.js');
  const tab = App.cacheChatTab || 'group';
  App.cacheChat = channelOf(tab);
  const grp = App.site.groups.find((g) => g.id === App.me.groupId);
  const mentor = staffById(myMentorId());
  const msgs = (await App.store.get(App.cacheChat, { shared: true })) || [];
  return `${memberTabs('community')}<section class="wrap block" style="padding-top:20px">
    <div class="eyebrow">Community</div>
    <h1 style="font-size:clamp(1.9rem,4vw,2.6rem);font-weight:600;margin:.3rem 0 14px">${grp.emoji} ${grp.name}</h1>
    <div class="chat-tabs">
      <button class="ctab ${tab === 'group' ? 'on' : ''}" onclick="J.chatTab('group')">👥 Group chat</button>
      <button class="ctab ${tab === 'mentor' ? 'on' : ''}" onclick="J.chatTab('mentor')">💬 ${mentor ? mentor.name.split(' ')[0] : 'Mentor'} (mentor)</button>
      <a class="ctab" onclick="J.go('groups')" style="margin-left:auto">Switch group →</a>
    </div>
    <div class="chat"><div class="chat-msgs" id="chatmsgs">${bubbles(msgs, 'me')}</div>
      <div class="chat-input"><input id="chatinput" placeholder="Message…" onkeydown="if(event.key==='Enter')J.sendChat()">
        <button class="btn" onclick="J.sendChat()">Send</button></div></div>
    <div class="tiny muted" style="margin-top:8px">Messages update live for everyone in the channel.</div>
    <div style="height:24px"></div></section>`;
}

function groupsGate() {
  return `<section class="wrap block"><div class="formcard center" style="max-width:520px">
    <h2 style="font-size:1.6rem">Join a small group first</h2>
    <p class="muted" style="margin:.6rem 0 1rem">Chat and group life open up once you belong to a group.</p>
    <button class="btn" onclick="J.go('groups')">Browse groups ${ARR}</button></div></section>`;
}

export async function refreshChat() {
  if (!App.cacheChat) return;
  const box = document.getElementById('chatmsgs'); if (!box) return;
  const msgs = (await App.store.get(App.cacheChat, { shared: true })) || [];
  box.innerHTML = bubbles(msgs, whoAmI().id === 'guest' ? 'me' : (currentStaff() ? currentStaff().id : 'me'));
  box.scrollTop = box.scrollHeight;
}
export function chatTab(t) { App.cacheChatTab = t; refresh(); }
export async function sendChat() {
  const el = document.getElementById('chatinput'); const text = (el.value || '').trim(); if (!text) return;
  const who = whoAmI();
  await App.store.push(App.cacheChat, { id: 'c' + Date.now(), from: who.id, fromName: who.name, role: who.role, text, at: Date.now() }, { shared: true });
  el.value = ''; await refreshChat();
}

// ---------- join / switch groups ----------
export async function joinGroup(gid) {
  if (!App.me) { go('join'); return; }
  const gm = await loadGM();
  // remove from any previous group's shared list
  Object.keys(gm).forEach((k) => { gm[k] = (gm[k] || []).filter((x) => x !== 'me'); });
  (gm[gid] = gm[gid] || []).push('me');
  await App.store.set('groupMembers', gm, { shared: true });
  App.me.groupId = gid; await App.store.set('account', App.me);
  const g = App.site.groups.find((x) => x.id === gid);
  toast(`Joined ${g.name}.`); go('community');
}
