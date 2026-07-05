# Journey 360

A multi-tenant **discipleship platform**. One codebase runs many churches ("sites"),
each with its own branding, small groups, mentors, and members — all built around a
single pathway:

> **Belong → Discover → Grow → Serve**

People experience community *before* commitment, so the front door is relationships.
Everything else grows from there.

---

## Quick start

No build step. It's plain ES modules — just serve the folder and open it.

```bash
cd journey-360
python3 -m http.server 8000
# then open http://localhost:8000/?site=grace
```

> Open with a **server** (not `file://`) — browsers block ES-module imports on `file://`.
> Any static server works (`python3 -m http.server`, `npx serve`, VS Code Live Server…).

Pick a tenant with the `?site=` query param, or the **Site** switcher in the footer:

- `?site=grace` — *Grace Community Church* (warm theme, Gospels plan)
- `?site=hope` — *Hope Adventist Fellowship* (cool theme, Sabbath School enabled)

**Try it end-to-end**

1. **Start your journey** → create an account → land on your dashboard.
2. **Today** → start a reading plan, tick some habits, (on `hope`) study the Sabbath lesson.
3. **Groups** → join a small group. **Community** → chat with your group / mentor. **Ask** → ask the AI.
4. Footer → **For mentors & guides** → tap a demo role (Mentor / Guide / Leader).
   See everyone's progress, open a member, chat back, and review AI answers.

---

## Multi-tenancy ("multisite") in 30 seconds

- Every site is one object in [`src/config/sites.js`](src/config/sites.js): name, theme,
  reading plan, feature flags, staff, groups, demo members.
- A **theme** is just CSS variables applied at runtime, so the same components re-skin per tenant.
- All data is **namespaced by site id** (`j360:<siteId>:<scope>:<key>`), so tenants never see
  each other's members, chats, or groups.
- **Feature flags** per site (`features: { chat, ai, wellness, sabbath, groups }`) turn modules on/off.

### Add a new church

1. Copy a block in `src/config/sites.js`, change `id`, `name`, `theme`, `staff`, `groups`, `demoMembers`.
2. That's it. Visit `?site=<yourId>`. No other file needs to change.

---

## Project structure

```
journey-360/
├── index.html              # shell: nav / app / footer + loads app.css & src/app.js
├── app.css                 # one themeable stylesheet (CSS vars set per tenant)
├── src/
│   ├── app.js              # bootstrap: view registry, window.J actions, nav, router, polling
│   ├── config/
│   │   ├── sites.js        # ★ the tenant registry (add churches here)
│   │   └── content.js      # the framework: pillars, plans, Sabbath School, habits, assessments
│   ├── core/
│   │   ├── store.js        # data layer: adapters + per-tenant namespacing
│   │   ├── state.js        # app state, session, members, progress, seeding
│   │   └── router.js       # tiny hash router
│   ├── ui/
│   │   ├── ring.js         # the Journey Ring (SVG) + shared bits
│   │   └── toast.js
│   └── features/           # one file per area; each exports view fns + actions
│       ├── public.js       # home · pillar pages · public Groups & Goals dashboard
│       ├── auth.js         # member join/sign-in · staff sign-in
│       ├── member.js       # dashboard · Today (reading/habits/Sabbath) · Grow · assessments · next-step
│       ├── community.js    # group membership · live group + mentor chat
│       ├── ai.js           # Ask-AI + logging to the review queue
│       └── leadership.js   # overview · member detail (+live chat) · group goals · AI review
└── docs/
    └── PLAN.md             # vision, architecture, data model, roadmap
```

**How a feature is wired** (the pattern to copy):

1. Write an `async` view function that returns an HTML string (see `features/*.js`).
2. Register it in the `VIEWS` map in `src/app.js` under a route name.
3. Expose any button handlers on `window.J` in `src/app.js`; call them from HTML as `onclick="J.myAction('x')"`.
4. Read/write data through `App.store` (see below). Call `refresh()` to re-render.

---

## Data layer & going live

Everything reads/writes through a **Store** bound to the active site
([`src/core/store.js`](src/core/store.js)). Swap the `adapter` to change where data lives:

| Adapter | Where data lives | Use it for |
|---|---|---|
| `MemoryAdapter` | in-memory (resets on reload) | default when served locally |
| `ArtifactSharedAdapter` | `window.storage` (Claude artifacts) | the live demo layer |
| `RemoteAdapter(baseUrl, token)` | **your backend** | production |

Scopes: `{ shared: true }` = visible to everyone in the site (groups, chat, AI log);
default = the current member's private data (account, habits, plan).

**To go to production**, implement three endpoints and point `adapter` at `RemoteAdapter`:

```
GET    /kv/:key            -> { value } | 404
PUT    /kv/:key   { value }-> 200
GET    /kv?prefix=...      -> { keys: [...] }
```

Keys are already tenant-namespaced, so a single table with `(key TEXT PRIMARY KEY, value JSONB)`
works. Add auth, and enforce that a request may only touch keys for the caller's site.
See `docs/PLAN.md` for the full path.

---

## Feature status

| Area | Status |
|---|---|
| Multi-tenant sites + theming + switcher | ✅ working |
| Belong/Discover/Grow/Serve pathway + pillar pages | ✅ working |
| Member accounts, stage-seeded progress | ✅ working |
| Activity- **and** assessment-aware next step | ✅ working |
| Daily Bible reading plans (streaks) | ✅ working |
| Sabbath School (per-site flag) | ✅ working *(structure; sync official quarterly text)* |
| Healthy-habit (NEWSTART) tracking | ✅ working |
| Small-group sign-in / switch | ✅ working |
| Public **Groups & Goals** dashboard | ✅ working |
| Mentor ↔ mentee + group **chat** | ✅ live via shared store + 3s polling |
| **Ask-AI** + leader review queue | ✅ working (in-artifact Claude API) |
| Leadership: everyone's progress, member detail, notes, assignments, AI review | ✅ working |
| Real backend / auth / websockets / i18n | ⏳ see roadmap |

---

## Notes & caveats

- **Local persistence:** served locally, data uses `MemoryAdapter` and resets on reload.
  Wire up `RemoteAdapter` for durable data (that's the intended production path).
- **Chat is "near-live"** via 3-second polling of shared storage. Production should use
  websockets/SSE — same message contract.
- **AI:** the demo calls Claude directly from the browser (works inside Claude artifacts).
  **In production, proxy this through your server** so keys are never exposed; keep the
  same review-queue logging so leaders can vet answers.
- **Sabbath School** ships as *structure only* (weeks, memory texts, daily Bible references,
  original prompts). The official Adult Bible Study Guide is copyrighted — sync that text
  from your quarterly source.
- **Child safety / privacy:** if minors use this, add guardianship, restrict DMs, and keep
  human review on AI. See `docs/PLAN.md`.

---

Built around the idea that discipleship is a journey, not a funnel — and that it should be
just as easy to *run* for a leader as it is to *walk* for a member.
