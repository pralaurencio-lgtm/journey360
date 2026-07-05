// ============================================================
// content.js — the Journey 360 discipleship framework.
// Shared by every site. A site may override pieces via sites.js.
// ============================================================

export const ORDER = ['belong', 'discover', 'grow', 'serve'];

export const PILLARS = {
  belong: {
    key: 'belong', name: 'Belong', emoji: '🤝', color: 'var(--belong)',
    tagline: 'Find community. Find support. Find hope.',
    question: 'Where can I find people who care?',
    resources: [
      { id: 'b1', title: 'Submit a prayer request', public: true },
      { id: 'b2', title: 'Schedule a meeting' },
      { id: 'b3', title: 'Find a small group' },
      { id: 'b4', title: 'Family support' },
      { id: 'b5', title: 'Pastoral care' },
      { id: 'b6', title: 'Find a church near you' },
      { id: 'b7', title: 'Community events' },
    ],
  },
  discover: {
    key: 'discover', name: 'Discover', emoji: '🔍', color: 'var(--discover)',
    tagline: 'Discover Jesus. Discover truth. Discover purpose.',
    question: 'Why am I here, and what does God want for my life?',
    resources: [
      { id: 'd1', title: 'Start a Bible study' },
      { id: 'd2', title: 'Ask a faith question' },
      { id: 'd3', title: 'Spiritual foundations' },
      { id: 'd4', title: 'Discovering purpose' },
      { id: 'd5', title: 'Strengths assessment', assess: 'strengths' },
      { id: 'd6', title: 'Calling exploration' },
    ],
  },
  grow: {
    key: 'grow', name: 'Grow', emoji: '🌱', color: 'var(--grow)',
    tagline: 'Become more like Christ.',
    question: 'How do I keep growing?',
    resources: [
      { id: 'g1', title: 'Prayer course', course: true },
      { id: 'g2', title: 'Bible reading plans', course: true },
      { id: 'g3', title: 'Christian habits' },
      { id: 'g4', title: 'Family discipleship', course: true },
      { id: 'g5', title: 'Leadership foundations', course: true },
      { id: 'g6', title: 'Character development' },
    ],
  },
  serve: {
    key: 'serve', name: 'Serve', emoji: '✨', color: 'var(--serve)',
    tagline: 'Use your gifts to bless others.',
    question: 'How can God use me?',
    resources: [
      { id: 's1', title: 'Spiritual gifts assessment', assess: 'gifts' },
      { id: 's2', title: 'Ministry opportunities' },
      { id: 's3', title: 'Leadership training' },
      { id: 's4', title: 'Volunteer matching' },
      { id: 's5', title: 'Mentor someone' },
    ],
  },
};

export const STAGES = [
  { id: 'community',   label: 'Looking for community', floor: { belong: 15,  discover: 0,   grow: 0,  serve: 0 } },
  { id: 'exploring',   label: 'Exploring faith',       floor: { belong: 55,  discover: 10,  grow: 0,  serve: 0 } },
  { id: 'newbeliever', label: 'New believer',          floor: { belong: 100, discover: 25,  grow: 0,  serve: 0 } },
  { id: 'growing',     label: 'Growing disciple',      floor: { belong: 100, discover: 100, grow: 30, serve: 0 } },
  { id: 'volunteer',   label: 'Ministry volunteer',    floor: { belong: 100, discover: 100, grow: 65, serve: 20 } },
  { id: 'leader',      label: 'Leader',                floor: { belong: 100, discover: 100, grow: 90, serve: 70 } },
];
export const stageLabel = (id) => (STAGES.find((s) => s.id === id) || {}).label || 'Getting started';

// ---------- Bible reading plans (references generated so they stay valid) ----------
export function buildPlan(books, perDay) {
  const days = [];
  books.forEach((b) => {
    for (let c = 1; c <= b.ch; c += perDay) {
      const end = Math.min(c + perDay - 1, b.ch);
      days.push(end > c ? `${b.name} ${c}–${end}` : `${b.name} ${c}`);
    }
  });
  return days;
}
const GOSPELS = [{ name: 'Matthew', ch: 28 }, { name: 'Mark', ch: 16 }, { name: 'Luke', ch: 24 }, { name: 'John', ch: 21 }];
const FOUNDATIONS = [{ name: 'John', ch: 21 }, { name: 'Romans', ch: 16 }, { name: 'James', ch: 5 }];

export const PLANS = {
  gospels:     { id: 'gospels',     name: 'The Gospels',     emoji: '✝️', blurb: 'Meet Jesus in Matthew, Mark, Luke, and John.', days: buildPlan(GOSPELS, 3) },
  proverbs:    { id: 'proverbs',    name: 'A Proverb a Day', emoji: '🪔', blurb: 'One chapter of wisdom each day for a month.', days: buildPlan([{ name: 'Proverbs', ch: 31 }], 1) },
  foundations: { id: 'foundations', name: 'Faith Foundations', emoji: '📜', blurb: 'John, Romans, and James — the essentials.', days: buildPlan(FOUNDATIONS, 2) },
};

// ---------- Sabbath School (structure only; sync official quarterly text separately) ----------
export const SABBATH_DAYS = ['Sabbath', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const SABBATH = {
  quarter: 'This Quarter · Walking with Jesus',
  note: 'Structure only. Official lesson text comes from the Adult Bible Study Guide — sync from your quarterly.',
  weeks: [
    { n: 1, title: 'The God Who Seeks Us', memory: 'Luke 19:10', days: [
      { read: 'Luke 19:1–10',  focus: 'The shepherd who goes after the one.' },
      { read: 'Genesis 3:8–9', focus: '“Where are you?” — God takes the first step.' },
      { read: 'Luke 15:1–7',   focus: 'Heaven’s joy over one who is found.' },
      { read: 'Luke 15:8–10',  focus: 'Searching until the lost is recovered.' },
      { read: 'Luke 15:11–24', focus: 'A Father watching the road home.' },
      { read: 'John 4:1–26',   focus: 'Jesus seeks one person at a well.' },
      { read: 'Revelation 3:20', focus: 'Reflect: where is Jesus knocking today?' },
    ] },
    { n: 2, title: 'Belonging Before Believing', memory: 'Mark 2:15', days: [
      { read: 'Mark 2:13–17',   focus: 'Jesus eats with those still on the outside.' },
      { read: 'Luke 5:27–32',   focus: 'A table becomes a doorway to faith.' },
      { read: 'John 1:35–46',   focus: '“Come and see” precedes “I believe.”' },
      { read: 'Acts 2:42–47',   focus: 'A community people wanted to belong to.' },
      { read: 'Romans 15:7',    focus: 'Welcome one another as Christ welcomed you.' },
      { read: 'Luke 10:38–42',  focus: 'Presence over performance.' },
      { read: 'Hebrews 10:24–25', focus: 'Reflect: who can you welcome this week?' },
    ] },
    { n: 3, title: 'Growing Deep', memory: 'Colossians 2:6–7', days: [
      { read: 'Colossians 2:6–15', focus: 'Rooted and built up in him.' },
      { read: 'Psalm 1',          focus: 'The tree planted by the water.' },
      { read: 'John 15:1–11',     focus: 'Abiding is the secret of fruit.' },
      { read: '2 Peter 1:3–11',   focus: 'Adding to your faith, step by step.' },
      { read: 'Galatians 5:16–25', focus: 'The fruit the Spirit grows in us.' },
      { read: 'Philippians 3:7–14', focus: 'Pressing on toward maturity.' },
      { read: 'Ephesians 3:14–21', focus: 'Reflect: where do you need deeper roots?' },
    ] },
    { n: 4, title: 'Sent to Serve', memory: 'Matthew 20:28', days: [
      { read: 'Matthew 20:20–28', focus: 'Greatness is measured in service.' },
      { read: 'John 13:1–17',     focus: 'The towel and the basin.' },
      { read: '1 Corinthians 12:1–11', focus: 'Gifts given for the common good.' },
      { read: 'Romans 12:3–13',   focus: 'Using what you’ve been given.' },
      { read: '1 Peter 4:8–11',   focus: 'Serving as stewards of grace.' },
      { read: 'Matthew 25:31–40', focus: 'Meeting Jesus in the least of these.' },
      { read: 'Isaiah 6:1–8',     focus: 'Reflect: “Here am I. Send me.”' },
    ] },
  ],
};

// ---------- Healthy habits (NEWSTART) ----------
export const HABITS = [
  { id: 'nutrition',  name: 'Nutrition',  emoji: '🥗', desc: 'A wholesome, plant-forward meal' },
  { id: 'exercise',   name: 'Exercise',   emoji: '🏃', desc: 'Move your body ~30 minutes' },
  { id: 'water',      name: 'Water',      emoji: '💧', desc: '6–8 glasses through the day' },
  { id: 'sunlight',   name: 'Sunlight',   emoji: '☀️', desc: 'A little time outdoors' },
  { id: 'air',        name: 'Fresh air',  emoji: '🌬️', desc: 'Deep breathing, open windows' },
  { id: 'rest',       name: 'Rest',       emoji: '😴', desc: '7–8 hours of sleep' },
  { id: 'temperance', name: 'Temperance', emoji: '⚖️', desc: 'Say no to what harms' },
  { id: 'trust',      name: 'Trust',      emoji: '🙏', desc: 'Prayer & quiet time with God' },
];

// ---------- Assessments (compact engine data) ----------
export const ASSESSMENTS = {
  strengths: {
    pillar: 'discover', title: 'Strengths', emoji: '🧭',
    questions: [
      { t: 'I come alive when I bring people together.', c: 'Connector' },
      { t: 'I quickly notice when someone is discouraged.', c: 'Encourager' },
      { t: 'I love understanding why things are true.', c: 'Thinker' },
      { t: 'Give me a project and I’ll make it happen.', c: 'Builder' },
      { t: 'I turn messy situations into clear plans.', c: 'Organizer' },
      { t: 'I’m always imagining new ideas and ways to express things.', c: 'Creator' },
    ],
    results: {
      Connector:  { name: 'Connector',  tags: ['Small groups', 'Hospitality', 'Welcome team'] },
      Encourager: { name: 'Encourager', tags: ['Care ministry', 'Mentoring', 'Prayer'] },
      Thinker:    { name: 'Thinker',    tags: ['Teaching', 'Apologetics', 'Bible study'] },
      Builder:    { name: 'Builder',    tags: ['Church planting', 'Projects', 'New ministries'] },
      Organizer:  { name: 'Organizer',  tags: ['Operations', 'Coordination', 'Serving teams'] },
      Creator:    { name: 'Creator',    tags: ['Worship', 'Media', 'Creative arts'] },
    },
  },
  gifts: {
    pillar: 'serve', title: 'Spiritual Gifts', emoji: '✨',
    questions: [
      { t: 'Explaining Scripture so it clicks energizes me.', c: 'Teaching' },
      { t: 'I’m drawn to sit with people who are hurting.', c: 'Mercy' },
      { t: 'I can see where a group needs to go and rally people.', c: 'Leadership' },
      { t: 'Making people feel welcome comes naturally.', c: 'Hospitality' },
      { t: 'I find joy in giving generously.', c: 'Giving' },
      { t: 'I know the words to build a discouraged person up.', c: 'Encouragement' },
      { t: 'I’d rather quietly meet a need than be up front.', c: 'Serving' },
      { t: 'I love telling others about Jesus.', c: 'Evangelism' },
    ],
    results: {
      Teaching:     { name: 'Teaching',     tags: ['Bible study leader', 'Teaching', 'Discipleship'] },
      Mercy:        { name: 'Mercy',        tags: ['Care ministry', 'Visitation', 'Grief support'] },
      Leadership:   { name: 'Leadership',   tags: ['Team lead', 'Ministry director', 'Coaching'] },
      Hospitality:  { name: 'Hospitality',  tags: ['Welcome team', 'Meals', 'Groups host'] },
      Giving:       { name: 'Giving',       tags: ['Generosity team', 'Benevolence', 'Stewardship'] },
      Encouragement:{ name: 'Encouragement',tags: ['Mentoring', 'Prayer team', 'Follow-up'] },
      Serving:      { name: 'Serving',      tags: ['Setup/ops', 'Facilities', 'Support teams'] },
      Evangelism:   { name: 'Evangelism',   tags: ['Outreach', 'Guest follow-up', 'Events'] },
    },
  },
};
