// ============================================================
// store.js — the data layer.
//
// Everything the app reads/writes goes through a Store bound to one site.
// Keys are namespaced:  j360:<siteId>:<scope>:<key>
//   scope 'shared' -> visible to everyone in the site (groups, chat, ai log)
//   scope 'me'     -> the current browser's member (account, habits, plan)
//
// Swap the ADAPTER to change where data lives. Three are provided:
//   MemoryAdapter          — in-memory, resets on reload (default when served locally)
//   ArtifactSharedAdapter  — uses window.storage (works inside Claude artifacts)
//   RemoteAdapter(baseUrl) — talks to YOUR backend (skeleton; wire it up for production)
// ============================================================

export function MemoryAdapter() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async set(k, v) { m.set(k, JSON.stringify(v)); return true; },
    async list(prefix) { return [...m.keys()].filter((k) => k.startsWith(prefix)); },
  };
}

// Uses the Claude-artifact shared storage API if present, mirrors to memory otherwise.
export function ArtifactSharedAdapter() {
  if (typeof window === 'undefined' || !window.storage) return MemoryAdapter();
  const mem = MemoryAdapter();
  return {
    async get(k) {
      try { const r = await window.storage.get(k, true); if (r && r.value) return JSON.parse(r.value); } catch (e) {}
      return mem.get(k);
    },
    async set(k, v) {
      await mem.set(k, v);
      try { await window.storage.set(k, JSON.stringify(v), true); } catch (e) {}
      return true;
    },
    async list(prefix) {
      try { const r = await window.storage.list(prefix, true); if (r && r.keys) return r.keys; } catch (e) {}
      return mem.list(prefix);
    },
  };
}

// Production skeleton — implement these three endpoints on your server.
export function RemoteAdapter(baseUrl, token) {
  const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  return {
    async get(k) {
      const r = await fetch(`${baseUrl}/kv/${encodeURIComponent(k)}`, { headers: h });
      if (r.status === 404) return null;
      return (await r.json()).value ?? null;
    },
    async set(k, v) {
      await fetch(`${baseUrl}/kv/${encodeURIComponent(k)}`, { method: 'PUT', headers: h, body: JSON.stringify({ value: v }) });
      return true;
    },
    async list(prefix) {
      const r = await fetch(`${baseUrl}/kv?prefix=${encodeURIComponent(prefix)}`, { headers: h });
      return (await r.json()).keys ?? [];
    },
  };
}

// Pick the adapter here. Local dev falls back to memory automatically.
export const adapter = ArtifactSharedAdapter();

export function makeStore(siteId) {
  const ns = (scope, key) => `j360:${siteId}:${scope}:${key}`;
  return {
    siteId,
    async get(key, { shared = false } = {}) { return adapter.get(ns(shared ? 'shared' : 'me', key)); },
    async set(key, val, { shared = false } = {}) { return adapter.set(ns(shared ? 'shared' : 'me', key), val); },
    async push(key, item, opts = {}) {
      const arr = (await this.get(key, opts)) || [];
      arr.push(item);
      await this.set(key, arr, opts);
      return arr;
    },
    async list(prefix, { shared = false } = {}) { return adapter.list(ns(shared ? 'shared' : 'me', prefix)); },
  };
}
