// ============================================================
// ai.js — "Ask a question" AI companion.
// Calls the in-artifact Claude API, shows the answer, and logs every Q&A to a
// shared review queue so leaders can check the AI's responses.
//
// Production note: move the API call server-side (never expose keys client-side)
// and keep this same logging contract.
// ============================================================

import { App } from '../core/state.js';
import { ARR } from '../ui/ring.js';
import { refresh } from '../core/router.js';
import { toast } from '../ui/toast.js';

const SUGGESTED = [
  'What does it mean to abide in Christ?',
  'How do I start reading the Bible?',
  'Why does God allow suffering?',
  'What is prayer, really?',
];

export async function askView() {
  if (!App.me) { const { go } = await import('../core/router.js'); go('join'); return ''; }
  const { memberTabs } = await import('./member.js');
  const thread = App.cacheAsk || [];
  return `${memberTabs('ask')}<section class="wrap block" style="padding-top:20px">
    <div class="eyebrow">Ask</div>
    <h1 style="font-size:clamp(1.9rem,4vw,2.6rem);font-weight:600;margin:.3rem 0 6px">Ask a question</h1>
    <p class="muted" style="max-width:60ch;margin-bottom:16px">Ask anything about faith, the Bible, or your journey. A guide reviews these answers, and for anything heavy please also talk to a real person on your team.</p>
    <div class="ask-thread" id="askthread">${thread.map(renderTurn).join('') || suggestions()}</div>
    <div class="chat-input" style="margin-top:14px"><input id="askinput" placeholder="Type your question…" onkeydown="if(event.key==='Enter')J.askAI()">
      <button class="btn" onclick="J.askAI()">Ask ${ARR}</button></div>
    <div style="height:24px"></div></section>`;
}
function suggestions() {
  return `<div class="suggests">${SUGGESTED.map((q) => `<button class="sugg" onclick="J.askAIWith(this.textContent)">${q}</button>`).join('')}</div>`;
}
function renderTurn(t) {
  if (t.role === 'user') return `<div class="cmsg me"><div class="cbub"><div class="ctext">${esc(t.text)}</div></div></div>`;
  return `<div class="cmsg"><div class="cav">AI</div><div class="cbub ai"><div class="cmeta">Journey companion <span class="cwhen">· reviewed by your team</span></div><div class="ctext">${esc(t.text)}</div></div></div>`;
}
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function askAIWith(text) { const el = document.getElementById('askinput'); if (el) el.value = text; askAI(); }

export async function askAI() {
  const el = document.getElementById('askinput'); const q = (el.value || '').trim(); if (!q) return;
  App.cacheAsk = App.cacheAsk || [];
  App.cacheAsk.push({ role: 'user', text: q });
  App.cacheAsk.push({ role: 'ai', text: '…thinking…' });
  el.value = ''; renderAskThread();

  let answer = '';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 1000,
        system: `You are the Journey 360 companion for ${App.site.name}, a warm, biblically grounded discipleship assistant. Be concise and encouraging, ground answers in Scripture where relevant, and for serious pastoral, medical, or crisis matters gently point the person to their mentor or pastor. A human leader reviews your answers.`,
        messages: [{ role: 'user', content: q }],
      }),
    });
    const data = await res.json();
    answer = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  } catch (e) { answer = ''; }
  if (!answer) answer = 'I couldn’t reach the answer service just now. Please try again, and for anything important reach out to your mentor.';

  App.cacheAsk[App.cacheAsk.length - 1] = { role: 'ai', text: answer };
  renderAskThread();

  // log to shared review queue
  await App.store.push('ai_log', {
    id: 'a' + Date.now(), memberId: 'me', memberName: App.me.name,
    question: q, answer, at: Date.now(), status: 'pending', reviewedBy: null,
  }, { shared: true });
  toast('Sent. Your leaders will review this answer.');
}

function renderAskThread() {
  const box = document.getElementById('askthread'); if (!box) return;
  box.innerHTML = (App.cacheAsk || []).map(renderTurn).join('');
  box.scrollTop = box.scrollHeight;
}
