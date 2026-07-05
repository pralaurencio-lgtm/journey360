# Journey 360 — General Plan

Vision, architecture, and roadmap. Pairs with the [README](../README.md) (setup & structure).

---

## 1. Vision & principles

**Journey 360 is a discipleship platform, not a website.** It walks a person from their
first hello to a life of service, and gives leaders the tools to walk *with* them.

The pathway is deliberately relationships-first:

```
   Belong  →  Discover  →  Grow  →  Serve
   (front     (explore     (become    (use your
    door)      Jesus &      like       gifts to
               purpose)     Christ)    bless others)
```

Design principles that shape every decision:

1. **Belonging before believing.** Community is the entry point; commitment follows.
2. **One journey, many doors.** People enter at any stage; the system meets them there.
3. **Guidance, not gates.** The next step is always suggested from real activity + assessments.
4. **Whole-person discipleship.** Spirit *and* body — Scripture, prayer, and health habits.
5. **Leaders are first-class users.** Mentors and guides get real oversight and real access.
6. **Multi-tenant from day one.** Many churches, one codebase, isolated data.
7. **Expandable by design.** Small modules with clear contracts, so features are cheap to add.

---

## 2. System architecture

```
┌──────────────────────────────────────────────────────────────┐
│  index.html  (shell: nav · #app · footer)                     │
│  app.css     (one stylesheet; CSS vars re-skinned per tenant) │
└───────────────┬──────────────────────────────────────────────┘
                │ loads
        ┌───────▼────────┐
        │   src/app.js   │  bootstrap
        │  · VIEWS map   │  route name → view fn
        │  · window.J    │  the only surface HTML calls (onclick="J.x()")
        │  · render loop │  theme → nav → view → footer → poll
        └───┬────────┬───┘
            │        │
   ┌────────▼──┐  ┌──▼───────────────┐
   │  core/    │  │   features/      │  each: async view fns + actions
   │  router   │  │  public          │  home, pillars, public groups
   │  state    │  │  auth            │  member + staff sign-in
   │  store ───┼──┤  member          │  dashboard, today, grow, assess
   │           │  │  community       │  groups + live chat
   └────┬──────┘  │  ai              │  ask-AI + review log
        │         │  leadership      │  oversight, member detail, AI review
        │         └──────────────────┘
        ▼
   ┌─────────────────────────────────────────────┐
   │  Adapter  (Memory | ArtifactShared | Remote) │  ← swap to change backend
   └─────────────────────────────────────────────┘

   config/sites.js    ← the tenant registry (branding, groups, staff, flags)
   config/content.js  ← the framework (pillars, plans, Sabbath, habits, assessments)
```

**Rendering** is string-templating into `#app` on every route change; actions mutate state
via the Store then call `refresh()`. No framework, no build — intentional, so it stays
approachable and easy to iterate. (If it grows, any view fn can be swapped for a component
without touching the rest.)

---

## 3. Multi-tenancy model

| Concern | How it's handled |
|---|---|
| **Who is a tenant** | One object in `config/sites.js` = one church/campus/ministry |
| **Selecting a tenant** | `?site=<id>` query param (or footer switcher). Roadmap: subdomain → id |
| **Data isolation** | Every key is `j360:<siteId>:<scope>:<key>`; a tenant can't read another's keys |
| **Branding** | `site.theme` = CSS variables applied at runtime; components are theme-agnostic |
| **Content overrides** | Sites pick a `plan`, toggle `features`, and define their own `groups`/`staff` |
| **Framework content** | Shared in `config/content.js` (pillars, plans, Sabbath, habits, assessments) |

This means a new church is a **config change, not a code change** — the core requirement
behind "expandable and easy to iterate."

---

## 4. Data model

Two scopes under each tenant namespace:

**Shared** (`{ shared: true }`) — everyone in the site:

| Key | Shape | Meaning |
|---|---|---|
| `groupMembers` | `{ groupId: [memberId] }` | who's in each group (live join list) |
| `chat:grp:<groupId>` | `[ {id, from, fromName, role, text, at} ]` | group chat |
| `chat:dm:<memberId>:<mentorId>` | same | 1:1 mentor ↔ mentee thread |
| `ai_log` | `[ {id, memberId, memberName, question, answer, at, status, reviewedBy} ]` | AI review queue |
| `ops` | `{ notes:{}, mentor:{}, checkins:{} }` | leader notes, mentor reassignments, check-ins |

**Personal** (default scope) — the current member on this device:

| Key | Shape | Meaning |
|---|---|---|
| `account` | `{ name, email, stage, groupId, assessments, plan, habits, sabbath, completed, createdAt }` | the member |

Derived at runtime (not stored): pathway **progress** (stage floor raised by completed steps),
reading **streaks**, habit **totals**, and each group's **goal %**.

Entities that are currently code fixtures but become tables in production: `sites`, `staff`,
`groups`, `members`. The KV design maps cleanly to `(site_id, key) → value JSONB`.

---

## 5. Roadmap

### Phase 0 — Foundation *(done)*
Multi-tenant shell, theming, the full Belong→Serve pathway, member accounts, activity- and
assessment-aware next step, reading plans, Sabbath School, habit tracking, groups + public
goals, live chat (polling), Ask-AI + review, leadership oversight. Data via swappable adapters.

### Phase 1 — Real backend & identity
- Stand up the KV/`RemoteAdapter` service (`/kv` contract) or a relational schema.
- Real auth (email magic-link / OAuth), roles enforced server-side, per-site tenancy checks.
- Move demo members/staff/groups from fixtures into the database + a tenant admin UI.
- **Proxy the AI call server-side** (never expose keys); persist the review queue.

### Phase 2 — Real-time & richer discipleship
- Websockets/SSE for chat, presence, and live dashboards (drop the 3s polling).
- Notifications (mentor gets pinged on a message or a stalled mentee; leader on flagged AI).
- Course player for Grow; official Sabbath School quarterly sync; more reading plans.
- Member-facing view of *their* mentor + the notes appropriate to share.

### Phase 3 — Scale, admin & reach
- Tenant self-service onboarding (a church signs itself up, themes itself, invites leaders).
- Analytics: cohort retention, pathway funnels, group-goal trends over time.
- Internationalization (content already language-aware in the account model).
- Offline/PWA for daily reading + habits; mobile wrappers.
- Cross-site "network" reporting for denominations/multi-campus orgs.

---

## 6. Production considerations

- **Security:** enforce tenant + role authorization on the server for every key; never trust
  the client. Rate-limit chat and AI. Sanitize all user text on render (the app already escapes).
- **AI safety:** keep human-in-the-loop review; add a safety system prompt + classifier; always
  route crisis/medical/abuse topics to a real person, never AI-only.
- **Child safety & privacy:** if minors participate, add guardian consent, disable open DMs for
  minors, keep all AI answers reviewed, and minimize stored personal data. Follow local law
  (GDPR / COPPA equivalents).
- **Data ownership:** each church owns its tenant's data; support export and deletion.
- **Content licensing:** Sabbath School / devotional text is copyrighted — integrate official
  sources rather than reproducing them. Bible *references* are free; full text may need a
  licensed API.
- **Accessibility:** semantic markup, focus states, and reduced-motion are in place; keep them
  as components evolve.

---

## 7. From demo storage to production, concretely

1. Deploy a tiny KV service implementing `GET/PUT /kv/:key` and `GET /kv?prefix=`.
2. In `src/core/store.js`, set `export const adapter = RemoteAdapter('https://api.yourchurch.app', token)`.
3. Add auth: issue the `token` on sign-in; server derives `siteId` + role from it and
   authorizes each key.
4. Migrate `config/sites.js` fixtures into the DB; keep `sites.js` for theme/flags or move those in too.
5. Swap polling for websockets in `features/community.js` (`refreshChat`) — the message shape stays.
6. Move the AI `fetch` in `features/ai.js` behind your server endpoint.

Nothing above changes the view layer — that's the point of the Store/adapter boundary.
