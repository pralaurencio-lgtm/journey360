// ============================================================
// sites.js — the multi-tenant registry.
// Each entry is one "site" (a church / campus / ministry).
// To launch a new church: copy a block, change ids/theme/people. That's it.
// Data is namespaced per site id, so tenants never see each other's data.
// ============================================================

// A theme is just CSS custom properties applied at runtime, so the same
// components re-skin per tenant. Only override what you want to change.
const BASE_THEME = {
  '--paper': '#F5F1E7', '--paper-2': '#EFEADC', '--card': '#FBF8F1',
  '--ink': '#1B1D36', '--ink-2': '#4A4C6B', '--ink-3': '#7C7E96',
  '--line': 'rgba(27,29,54,.12)', '--line-2': 'rgba(27,29,54,.07)',
  '--belong': '#C8746D', '--discover': '#3C888F', '--grow': '#7C9954', '--serve': '#DDA13A',
  '--gold': '#DDA13A',
};

export const SITES = [
  {
    id: 'grace',
    name: 'Grace Community Church',
    short: 'Grace Community',
    wordmark: 'Journey 360',
    tagline: 'Belong. Discover. Grow. Serve.',
    blurb: 'A place to find community, discover purpose, grow in Christ, and make a difference.',
    plan: 'gospels',
    features: { chat: true, ai: true, wellness: true, sabbath: false, groups: true },
    theme: BASE_THEME,
    staff: [
      { id: 'st_david', name: 'David Okoro',   email: 'david@grace.org', role: 'mentor', title: 'Small-Groups Mentor' },
      { id: 'st_grace', name: 'Grace Lim',     email: 'grace@grace.org', role: 'mentor', title: 'Care Mentor' },
      { id: 'st_ana',   name: 'Ana Reyes',     email: 'ana@grace.org',   role: 'guide',  title: 'Spiritual Guide' },
      { id: 'st_sam',   name: 'Samuel Bright', email: 'sam@grace.org',   role: 'leader', title: 'Discipleship Pastor' },
    ],
    groups: [
      { id: 'g_new',   name: 'New Beginnings', emoji: '🌱', color: 'var(--discover)', leader: 'st_grace', desc: 'A soft landing for new believers.', goal: { label: 'Everyone reaches full Belonging', type: 'pillar', pillar: 'belong', target: 100 } },
      { id: 'g_ya',    name: 'Young Adults',   emoji: '🔥', color: 'var(--belong)',   leader: 'st_david', desc: '18–30s figuring out faith and life.', goal: { label: 'Every member completes Discover', type: 'pillar', pillar: 'discover', target: 100 } },
      { id: 'g_word',  name: 'In the Word',    emoji: '📖', color: 'var(--serve)',    leader: 'st_ana',   desc: 'Reading Scripture together.', goal: { label: 'Read the Gospels as a group', type: 'reading', target: 100 } },
      { id: 'g_serve', name: 'Hands & Feet',   emoji: '✨', color: 'var(--belong)',   leader: 'st_sam',   desc: 'Serving the city with our gifts.', goal: { label: 'Everyone serving with their gifts', type: 'pillar', pillar: 'serve', target: 60 } },
    ],
    demoMembers: [
      { id: 'm1', name: 'Maria Santos',  email: 'maria@x.com',  stage: 'exploring',   lastDays: 3,  joinedDays: 40,  mentorId: 'st_david', groupId: 'g_new',  habitDays: 22,  readingPct: 35, progress: { belong: 60, discover: 15, grow: 0, serve: 0 }, assessments: {} },
      { id: 'm2', name: 'James Carter',  email: 'james@x.com',  stage: 'newbeliever', lastDays: 6,  joinedDays: 60,  mentorId: 'st_david', groupId: 'g_new',  habitDays: 31,  readingPct: 48, progress: { belong: 100, discover: 30, grow: 5, serve: 0 }, assessments: { strengths: { name: 'Connector' } } },
      { id: 'm3', name: 'Aisha Bello',   email: 'aisha@x.com',  stage: 'growing',     lastDays: 2,  joinedDays: 180, mentorId: 'st_grace', groupId: 'g_word', habitDays: 120, readingPct: 82, progress: { belong: 100, discover: 100, grow: 45, serve: 10 }, assessments: { strengths: { name: 'Encourager' }, gifts: { name: 'Mercy' } } },
      { id: 'm4', name: 'Tom Becker',    email: 'tom@x.com',    stage: 'exploring',   lastDays: 28, joinedDays: 70,  mentorId: 'st_david', groupId: 'g_ya',   habitDays: 14,  readingPct: 12, progress: { belong: 45, discover: 5, grow: 0, serve: 0 }, assessments: {} },
      { id: 'm5', name: 'Kwame Mensah',  email: 'kwame@x.com',  stage: 'leader',      lastDays: 2,  joinedDays: 520, mentorId: 'st_ana',   groupId: 'g_serve',habitDays: 340, readingPct: 95, progress: { belong: 100, discover: 100, grow: 95, serve: 80 }, assessments: { strengths: { name: 'Builder' }, gifts: { name: 'Leadership' } } },
      { id: 'm6', name: 'Sofia Rossi',   email: 'sofia@x.com',  stage: 'newbeliever', lastDays: 35, joinedDays: 50,  mentorId: 'st_david', groupId: 'g_new',  habitDays: 9,   readingPct: 15, progress: { belong: 100, discover: 20, grow: 0, serve: 0 }, assessments: {} },
    ],
  },

  {
    id: 'hope',
    name: 'Hope Adventist Fellowship',
    short: 'Hope Fellowship',
    wordmark: 'Journey 360',
    tagline: 'Belong. Discover. Grow. Serve.',
    blurb: 'Following Jesus together — heart, mind, and body — from the first hello to a life of service.',
    plan: 'foundations',
    features: { chat: true, ai: true, wellness: true, sabbath: true, groups: true },
    // A cooler, evening-toned re-skin to show per-tenant branding.
    theme: {
      ...BASE_THEME,
      '--paper': '#F1F2ED', '--paper-2': '#E7E9E2', '--card': '#FAFBF7',
      '--ink': '#16223A', '--ink-2': '#42526B',
      '--belong': '#3E7CA8', '--discover': '#4C8C7D', '--grow': '#7C9954', '--serve': '#C98A3C',
      '--gold': '#C98A3C',
    },
    staff: [
      { id: 'st_ruth',  name: 'Ruth Adeyemi', email: 'ruth@hope.org',  role: 'mentor', title: 'Sabbath School Mentor' },
      { id: 'st_paul',  name: 'Paul Njoroge', email: 'paul@hope.org',  role: 'guide',  title: 'Spiritual Guide' },
      { id: 'st_elder', name: 'Elder Grace',  email: 'elder@hope.org', role: 'leader', title: 'Head Elder' },
    ],
    groups: [
      { id: 'h_ss',     name: 'Sabbath School A', emoji: '📖', color: 'var(--serve)',    leader: 'st_ruth',  desc: 'Weekly lesson study together.', goal: { label: 'Everyone studies the weekly lesson', type: 'reading', target: 100 } },
      { id: 'h_health', name: 'Health & Wholeness', emoji: '🌿', color: 'var(--grow)',   leader: 'st_paul',  desc: 'Living the health message.', goal: { label: '600 healthy-habit days logged', type: 'habits', target: 600 } },
      { id: 'h_youth',  name: 'Pathfinders+',    emoji: '🔥', color: 'var(--belong)',    leader: 'st_ruth',  desc: 'Youth growing in faith and service.', goal: { label: 'Every member completes Discover', type: 'pillar', pillar: 'discover', target: 100 } },
    ],
    demoMembers: [
      { id: 'hm1', name: 'Miriam Cho',   email: 'miriam@x.com', stage: 'growing',     lastDays: 1,  joinedDays: 200, mentorId: 'st_ruth', groupId: 'h_ss',     habitDays: 160, readingPct: 88, progress: { belong: 100, discover: 100, grow: 60, serve: 20 }, assessments: { gifts: { name: 'Teaching' } } },
      { id: 'hm2', name: 'Isaac Mwangi', email: 'isaac@x.com',  stage: 'volunteer',   lastDays: 4,  joinedDays: 400, mentorId: 'st_paul', groupId: 'h_health', habitDays: 280, readingPct: 76, progress: { belong: 100, discover: 100, grow: 80, serve: 45 }, assessments: { strengths: { name: 'Organizer' }, gifts: { name: 'Serving' } } },
      { id: 'hm3', name: 'Lena Fisher',  email: 'lena@x.com',   stage: 'newbeliever', lastDays: 9,  joinedDays: 45,  mentorId: 'st_ruth', groupId: 'h_youth',  habitDays: 20,  readingPct: 30, progress: { belong: 100, discover: 35, grow: 0, serve: 0 }, assessments: {} },
      { id: 'hm4', name: 'Daniel Park',  email: 'danielp@x.com',stage: 'exploring',   lastDays: 24, joinedDays: 30,  mentorId: null,      groupId: 'h_youth',  habitDays: 6,   readingPct: 9,  progress: { belong: 40, discover: 0, grow: 0, serve: 0 }, assessments: {} },
    ],
  },
];

export const DEFAULT_SITE = SITES[0].id;
export const getSite = (id) => SITES.find((s) => s.id === id) || SITES[0];
export const ROLES = {
  mentor: { label: 'Mentor', caps: ['See your mentees', 'Track progress', 'Read assessments', 'Add private notes', 'Message mentees', 'Suggest next steps'] },
  guide:  { label: 'Spiritual Guide', caps: ['See every member', 'Reassign mentors', 'Pastoral notes', 'Everything a mentor can do'] },
  leader: { label: 'Leader', caps: ['Full member directory', 'Manage assignments', 'Aggregate insights', 'Review AI answers', 'Everything a guide can do'] },
};
