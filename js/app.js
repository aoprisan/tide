/* Tide — the real app.
 * Vanilla JS, no dependencies. All state lives in localStorage; insights are
 * computed from the sessions you log by riding waves out. Tone is never shaming.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Static content
 * ------------------------------------------------------------------ */
const HABITS = {
  food:  { key:'food',  emoji:'🍔', label:'Food / snacking',  pull:'food',         tally:'snacks skipped', cost:4, photo:'🥗' },
  drink: { key:'drink', emoji:'🍷', label:'Alcohol',          pull:'a drink',      tally:'drinks passed',  cost:5, photo:'🌅' },
  smoke: { key:'smoke', emoji:'🚬', label:'Cigarette / vape', pull:'a cigarette',  tally:'cigs skipped',   cost:6, photo:'🫁' },
};

const ACTIONS = [
  { id:'water', e:'💧', t:'Glass of water' },
  { id:'walk',  e:'🚶', t:'60-sec walk' },
  { id:'text',  e:'💬', t:'Text an anchor' },
  { id:'teeth', e:'🪥', t:'Brush teeth' },
  { id:'game',  e:'🎮', t:'2-min game' },
  { id:'breath',e:'🫁', t:'10 deep breaths' },
];

const TRIGGERS = [
  'Stress / after work', 'Boredom', 'Social / others doing it', 'After a meal',
  'Tired', 'Lonely', 'Celebrating', 'Just habit',
];

const REASSURES = [
  "This feeling will rise, peak, and pass — whether or not you act on it. You don't have to do anything but watch it move.",
  "Notice where you feel it in your body. You're not fighting it. You're just letting it be there.",
  "Cravings are loudest right before they fade. You're near the top of the wave now.",
  "Feel that? It's already starting to soften. You're doing the hard part by just staying.",
  "Almost through. Every second you wait, it loses a little more of its grip.",
];

const TABS = [
  { id:'v-home',     key:'home',     label:'Home',     path:'M3 12l9-8 9 8M5 10v10h14V10' },
  { id:'v-insights', key:'insights', label:'Insights', path:'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3' },
  { id:'v-anchor',   key:'anchor',   label:'Anchor',   path:'M12 3v18M12 7a4 4 0 100-8M5 13a7 7 0 0014 0' },
];

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
const KEY = 'tide.state.v1';
const DEFAULT_STATE = {
  v: 1, onboarded: false, name: '',
  habits: [],            // subset of food/drink/smoke
  reasons: [],           // {id, habit:'all'|key, text}
  note: '',              // note from a strong day
  people: [],            // {id, name, role, phone}
  plans: [],             // {id, habit, text}
  sessions: [],          // {id, ts, habit, before, after, outcome:'good'|'mid'|'slip', actions:[], triggers:[]}
};

let state = load();

function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign({}, DEFAULT_STATE, JSON.parse(raw));
  } catch (e) { /* fall through to default */ }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}
const uid = () => Math.random().toString(36).slice(2, 9);
const el = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ *
 * Date helpers (local time)
 * ------------------------------------------------------------------ */
function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function dayKey(ts){ const d = startOfDay(ts); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */
function go(id){
  stopWave();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  el(id).classList.add('active');
  document.querySelector('.app').scrollTop = 0;
  if (id === 'v-home')     renderHome();
  if (id === 'v-insights') renderInsights();
  if (id === 'v-anchor')   renderAnchor();
}
window.go = go;

function renderTabs(){
  document.querySelectorAll('.tabs').forEach(nav => {
    const active = nav.dataset.tab;
    nav.innerHTML = TABS.map(t =>
      `<div class="tab ${t.key === active ? 'on' : ''}" onclick="go('${t.id}')">
         <svg viewBox="0 0 24 24"><path d="${t.path}"/></svg>${t.label}</div>`
    ).join('');
  });
}

/* ------------------------------------------------------------------ *
 * Onboarding
 * ------------------------------------------------------------------ */
function ob(from, to){
  el(from).classList.remove('active');
  el(to).classList.add('active');
}
window.ob = ob;

let obHabits = [];
function wireOnboarding(){
  el('ob-habits').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      const h = b.dataset.habit;
      b.classList.toggle('sel');
      obHabits = b.classList.contains('sel')
        ? [...obHabits, h]
        : obHabits.filter(x => x !== h);
      el('ob2next').disabled = obHabits.length === 0;
    });
  });
}

function finishOnboarding(){
  state.onboarded = true;
  state.habits = obHabits.length ? obHabits : ['food'];
  state.name = el('ob-name').value.trim();
  const r = el('ob-reason').value.trim();
  if (r) state.reasons.push({ id: uid(), habit: 'all', text: r });
  save();
  renderFlowHabits();
  go('v-home');
}
window.finishOnboarding = finishOnboarding;

/* ------------------------------------------------------------------ *
 * Home
 * ------------------------------------------------------------------ */
function greetWhen(){
  const d = new Date();
  const day = d.toLocaleDateString(undefined, { weekday:'long' });
  const h = d.getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `${day} ${part}` + (state.name ? `, ${state.name}` : '');
}

function renderHome(){
  el('greet-when').textContent = greetWhen();
  const ridden = wavesRidden();
  el('greet-line').textContent =
    ridden === 0 ? "You've got this." :
    "One wave at a time.";

  const m = money();
  el('home-stats').innerHTML = `
    <div class="stat"><b>${ridden}</b><span>waves ridden</span></div>
    <div class="stat"><b>${calmStreak()}${calmStreak() === 1 ? ' day' : ' days'}</b><span>calm streak</span></div>
    <div class="stat"><b>£${m}</b><span>saved</span></div>`;

  const plan = el('home-plan');
  if (state.plans.length){
    plan.querySelector('span').textContent = "Review your if-then plans for a tough moment";
  } else {
    plan.querySelector('span').textContent = "Set up your reasons & plans for a tough moment";
  }
}

/* ------------------------------------------------------------------ *
 * Stats / computations
 * ------------------------------------------------------------------ */
const ridden = (s) => s.outcome !== 'slip';
function wavesRidden(){ return state.sessions.filter(ridden).length; }

function money(){
  let m = 0;
  for (const s of state.sessions){
    const cost = (HABITS[s.habit] || {}).cost || 0;
    if (s.outcome === 'good') m += cost;
    else if (s.outcome === 'mid') m += cost / 2;
  }
  return Math.round(m);
}

function tallyFor(habit){
  let n = 0;
  for (const s of state.sessions){
    if (s.habit !== habit) continue;
    if (s.outcome === 'good') n += 1;
    else if (s.outcome === 'mid') n += 0.5;
  }
  return Math.round(n);
}

function winRate(){
  const total = state.sessions.length;
  if (!total) return null;
  const good = state.sessions.filter(s => s.outcome === 'good').length;
  return Math.round((good / total) * 100);
}

function calmStreak(){
  if (!state.sessions.length) return 0;
  const slipDays = new Set(state.sessions.filter(s => s.outcome === 'slip').map(s => dayKey(s.ts)));
  const firstDay = startOfDay(Math.min(...state.sessions.map(s => s.ts)));
  let streak = 0;
  let d = startOfDay(Date.now());
  while (d >= firstDay && streak < 400){
    if (slipDays.has(dayKey(d.getTime()))) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ------------------------------------------------------------------ *
 * Insights
 * ------------------------------------------------------------------ */
function heatColor(count, max){
  if (!count) return '#e7eef5';
  const cols = ['#bfe9e2', '#6fd9c9', '#2DD4BF', '#1c8f80'];
  const r = count / max;
  const i = Math.min(cols.length - 1, Math.floor(r * cols.length));
  return cols[i];
}

function renderInsights(){
  const body = el('insights-body');
  const total = state.sessions.length;

  if (total < 1){
    body.innerHTML = `
      <div class="card"><div class="empty">
        Nothing to show just yet.<br><br>
        Every time you ride a wave out, Tide quietly learns when your urges hit,
        what sets them off, and what actually helps — and shows it back to you here.
        <br><br>No logging chores. Just open the button when you need it.
      </div></div>`;
    return;
  }

  let html = '';

  // win rate
  const wr = winRate();
  html += `<div class="card">
      <h3>Win rate</h3>
      <div class="winrate">${wr}%</div>
      <p>of ${total} urge${total === 1 ? '' : 's'} ridden out (didn't fully give in).</p>
    </div>`;

  // heatmap: day-of-week × 3h buckets
  const grid = Array.from({ length: 7 }, () => new Array(8).fill(0));
  let hmax = 0;
  for (const s of state.sessions){
    const d = new Date(s.ts);
    const dow = (d.getDay() + 6) % 7;          // Mon=0 .. Sun=6
    const bucket = Math.floor(d.getHours() / 3); // 0..7
    grid[dow][bucket]++;
    hmax = Math.max(hmax, grid[dow][bucket]);
  }
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let heat = '<div class="heatwrap">';
  for (let r = 0; r < 7; r++){
    heat += `<div class="heatline"><span class="rl">${dayLabels[r]}</span><div class="heat-row">`;
    for (let c = 0; c < 8; c++){
      heat += `<div style="background:${heatColor(grid[r][c], hmax)}"></div>`;
    }
    heat += '</div></div>';
  }
  heat += `<div class="heat-axis"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div></div>`;
  html += `<div class="card">
      <h3>When urges hit</h3>
      ${heat}
      <div class="legend"><span>cooler</span>
        <i style="background:#e7eef5"></i><i style="background:#bfe9e2"></i><i style="background:#6fd9c9"></i><i style="background:#2DD4BF"></i><i style="background:#1c8f80"></i>
        <span>your hot spots</span></div>
    </div>`;

  // triggers
  const trigCount = {};
  let trigTotal = 0;
  for (const s of state.sessions){
    for (const t of (s.triggers || [])){ trigCount[t] = (trigCount[t] || 0) + 1; trigTotal++; }
  }
  if (trigTotal){
    const top = Object.entries(trigCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
    html += `<div class="card"><h3>What sets them off</h3>` +
      top.map(([t, n]) => {
        const pct = Math.round((n / trigTotal) * 100);
        return `<div class="trigtag"><span>${t}</span><span>${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div>`;
      }).join('') + `</div>`;
  }

  // what helps
  const help = [];
  for (const a of ACTIONS){
    const used = state.sessions.filter(s => (s.actions || []).includes(a.id));
    if (!used.length) continue;
    const good = used.filter(s => s.outcome === 'good').length;
    help.push({ a, n: used.length, rate: Math.round((good / used.length) * 100) });
  }
  help.sort((x, y) => y.rate - x.rate || y.n - x.n);
  if (help.length){
    html += `<div class="card"><h3>What actually helps you</h3>
      <p style="margin-bottom:8px">Ranked by how often it ended in riding the wave out:</p>` +
      help.slice(0, 4).map(h =>
        `<div class="trigtag"><span>${h.a.e} ${h.a.t}</span><span>${h.rate}%</span></div><div class="bar"><i style="width:${h.rate}%"></i></div>`
      ).join('') + `</div>`;
  }

  // savings
  const cells = state.habits.map(k => {
    const H = HABITS[k];
    return `<div class="s"><b>${tallyFor(k)}</b><span>${H.tally}</span></div>`;
  }).join('');
  html += `<div class="card"><h3>What you've kept</h3>
      <div class="savings">
        <div class="s"><b>£${money()}</b><span>not spent</span></div>
        ${cells}
      </div></div>`;

  body.innerHTML = html;
}

/* ------------------------------------------------------------------ *
 * Anchor
 * ------------------------------------------------------------------ */
let anchorFilter = 'all';

function renderAnchor(){
  const body = el('anchor-body');
  const habitPills = state.habits.map(k =>
    `<button class="pill ${anchorFilter === k ? 'on' : ''}" onclick="setAnchorFilter('${k}')">${HABITS[k].emoji} ${HABITS[k].label.split(' ')[0]}</button>`
  ).join('');

  const reasons = state.reasons.filter(r => anchorFilter === 'all' || r.habit === 'all' || r.habit === anchorFilter);
  const reasonRows = reasons.length
    ? reasons.map(r =>
        `<div class="reason-row"><span class="dot"></span>${escapeHtml(r.text)}
           <button class="del" onclick="delReason('${r.id}')" aria-label="Remove">×</button></div>`).join('')
    : `<div class="empty">No reasons yet. Add the ones that matter — you'll see them mid-craving.</div>`;

  const peopleRows = state.people.length
    ? state.people.map(p =>
        `<div class="person"><div class="av">${escapeHtml((p.name[0] || '?').toUpperCase())}</div>
           <div class="meta"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.role || 'Anchor person')}</span></div>
           <div class="act">
             <button onclick="textPerson('${p.id}')">Text</button>
             <button class="del" onclick="delPerson('${p.id}')">Remove</button>
           </div></div>`).join('')
    : `<div class="empty">Add one or two people. A tap during a tough moment opens a pre-written "having a hard time" text.</div>`;

  const plans = state.plans.filter(p => anchorFilter === 'all' || p.habit === 'all' || p.habit === anchorFilter);
  const planRows = plans.length
    ? plans.map(p => `<p style="margin-top:8px">${escapeHtml(p.text)}
        <button class="del" onclick="delPlan('${p.id}')" style="background:none;border:none;color:#c2ccd8;cursor:pointer;font-size:15px">×</button></p>`).join('')
    : `<div class="empty">An "if-then" plan beats an in-the-moment decision. Add one below.</div>`;

  body.innerHTML = `
    <div class="pillbar">
      <button class="pill ${anchorFilter === 'all' ? 'on' : ''}" onclick="setAnchorFilter('all')">All</button>
      ${habitPills}
    </div>

    <div class="card">
      <h3>Why I'm doing this</h3>
      ${reasonRows}
      <div class="add-row">
        <input class="text-input" id="reason-input" type="text" placeholder="Add a reason…">
        <button onclick="addReason()">Add</button>
      </div>
    </div>

    <div class="card" style="background:linear-gradient(160deg,#f7ead0,#efd9ad)">
      <h3 style="color:#5c4318">A note from a strong day</h3>
      <textarea class="note-area" id="note-area" placeholder="Write to your future self, for when the wanting gets loud…">${escapeHtml(state.note)}</textarea>
      <div class="save-hint" id="note-hint">Saved automatically.</div>
    </div>

    <div class="card">
      <h3>My anchor people</h3>
      ${peopleRows}
      <div class="add-row"><input class="text-input" id="person-name" type="text" placeholder="Name"></div>
      <div class="add-row">
        <input class="text-input" id="person-phone" type="tel" placeholder="Phone (optional)">
        <button onclick="addPerson()">Add</button>
      </div>
    </div>

    <div class="card">
      <h3>My if-then plans</h3>
      ${planRows}
      <div class="add-row">
        <input class="text-input" id="plan-input" type="text" placeholder="If I … → I'll …">
        <button onclick="addPlan()">Add</button>
      </div>
    </div>`;

  const ta = el('note-area');
  ta.addEventListener('input', () => { state.note = ta.value; save(); });
}

function setAnchorFilter(f){ anchorFilter = f; renderAnchor(); }
function addReason(){
  const v = el('reason-input').value.trim();
  if (!v) return;
  state.reasons.push({ id: uid(), habit: anchorFilter, text: v });
  save(); renderAnchor();
}
function delReason(id){ state.reasons = state.reasons.filter(r => r.id !== id); save(); renderAnchor(); }
function addPerson(){
  const name = el('person-name').value.trim();
  if (!name) return;
  state.people.push({ id: uid(), name, role: 'Anchor person', phone: el('person-phone').value.trim() });
  save(); renderAnchor();
}
function delPerson(id){ state.people = state.people.filter(p => p.id !== id); save(); renderAnchor(); }
function textPerson(id){
  const p = state.people.find(x => x.id === id);
  const msg = encodeURIComponent("Hey — I'm having a tough moment and trying to ride it out. Could you talk for a sec?");
  const num = (p && p.phone) ? p.phone.replace(/[^\d+]/g, '') : '';
  window.location.href = `sms:${num}?&body=${msg}`;
}
function addPlan(){
  const v = el('plan-input').value.trim();
  if (!v) return;
  state.plans.push({ id: uid(), habit: anchorFilter, text: v });
  save(); renderAnchor();
}
function delPlan(id){ state.plans = state.plans.filter(p => p.id !== id); save(); renderAnchor(); }

window.setAnchorFilter = setAnchorFilter;
window.addReason = addReason; window.delReason = delReason;
window.addPerson = addPerson; window.delPerson = delPerson; window.textPerson = textPerson;
window.addPlan = addPlan; window.delPlan = delPlan;

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ------------------------------------------------------------------ *
 * The urge flow
 * ------------------------------------------------------------------ */
const flowState = { habit: null, outcome: null, actions: [], triggers: [] };

function renderFlowHabits(){
  const list = state.habits.length ? state.habits : ['food','drink','smoke'];
  el('flow-habits').innerHTML = list.map(k =>
    `<button onclick="setHabit('${k}')"><span class="emoji">${HABITS[k].emoji}</span> ${HABITS[k].label}</button>`
  ).join('');
}

function startFlow(){ resetFlow(); go('v-flow'); }
window.startFlow = startFlow;

function resetFlow(){
  flowState.habit = null; flowState.outcome = null;
  flowState.actions = []; flowState.triggers = [];
  ['s1b','s2','s3','s4','s5','s5b','sdone'].forEach(s => el(s).classList.remove('active'));
  el('s1').classList.add('active');
  el('islider').value = 7; el('ival').textContent = '7';
}

function next(from, to){
  el(from).classList.remove('active');
  el(to).classList.add('active');
  if (to !== 's2') stopWave();
}
window.next = next;

function setHabit(k){
  flowState.habit = k;
  el('actTitle').textContent = 'Quick things instead of ' + HABITS[k].pull;
  renderActions();
  next('s1', 's1b');
}
window.setHabit = setHabit;

function renderActions(){
  // mark the action with the best historical ride-out rate, if known
  let best = null, bestRate = -1;
  for (const a of ACTIONS){
    const used = state.sessions.filter(s => (s.actions || []).includes(a.id));
    if (used.length < 2) continue;
    const rate = used.filter(s => s.outcome === 'good').length / used.length;
    if (rate > bestRate){ bestRate = rate; best = a.id; }
  }
  el('actions-grid').innerHTML = ACTIONS.map(a =>
    `<div class="qa" data-act="${a.id}" onclick="toggleAction(this,'${a.id}')">
       ${a.id === best ? '<span class="best">works for you</span>' : ''}
       <span class="e">${a.e}</span><span class="t">${a.t}</span></div>`
  ).join('');
}
function toggleAction(node, id){
  node.classList.toggle('done');
  flowState.actions = node.classList.contains('done')
    ? [...flowState.actions, id]
    : flowState.actions.filter(x => x !== id);
}
window.toggleAction = toggleAction;

function renderFlowAnchor(){
  const habit = flowState.habit;
  const pool = state.reasons.filter(r => r.habit === 'all' || r.habit === habit);
  const reason = pool.length ? pool[Math.floor(Math.random() * pool.length)].text : null;
  const photo = (HABITS[habit] && HABITS[habit].photo) || '🌊';
  el('flow-anchor').innerHTML = `
    <div class="photo">${photo}</div>
    <blockquote>${reason ? '“' + escapeHtml(reason) + '”' : 'You showed up. That’s the reason, right now.'}</blockquote>
    <div class="from">${reason ? '— your reason, in your words' : '— add your reasons in the Anchor tab'}</div>
    <div class="anchor-mini">
      <div><b>£${money()}</b><span>saved so far</span></div>
      <div><b>${calmStreak()}${calmStreak() === 1 ? ' day' : ' days'}</b><span>going strong</span></div>
    </div>`;
}

/* wave + breathing pacer */
let waveTimer = null, sec = 0;
function startWave(){
  renderFlowAnchor(); // prep step 4 content
  sec = 0; stopWave();
  waveTimer = setInterval(() => {
    sec++;
    const phase = sec % 10;
    el('breathLabel').textContent = phase < 4 ? 'breathe in' : (phase < 5 ? 'hold' : 'breathe out');
    const remain = Math.max(0, 180 - sec);
    const m = Math.floor(remain / 60), s = remain % 60;
    el('timer').textContent = remain > 0
      ? `riding the wave · ${m}:${s.toString().padStart(2, '0')} left`
      : 'the wave has passed 🌊';
    el('reassure').textContent = REASSURES[Math.min(REASSURES.length - 1, Math.floor(sec / 20))];
  }, 1000);
}
function stopWave(){ if (waveTimer){ clearInterval(waveTimer); waveTimer = null; } }
window.startWave = startWave;

function setOutcome(kind){
  flowState.outcome = kind;
  // reflect screen
  el('reflectTitle').textContent =
    kind === 'slip' ? 'No shame. What set it off?' : 'Nice. What set it off?';
  el('trigger-chips').innerHTML = TRIGGERS.map(t =>
    `<button class="chip" onclick="toggleTrigger(this,'${escapeHtml(t)}')">${t}</button>`
  ).join('');
  flowState.triggers = [];
  const after = Math.max(1, parseInt(el('islider').value, 10) - (kind === 'good' ? 3 : kind === 'mid' ? 1 : 0));
  el('aslider').value = after; el('aval').textContent = after;
  next('s5', 's5b');
}
window.setOutcome = setOutcome;

function toggleTrigger(node, t){
  node.classList.toggle('on');
  flowState.triggers = node.classList.contains('on')
    ? [...flowState.triggers, t]
    : flowState.triggers.filter(x => x !== t);
}
window.toggleTrigger = toggleTrigger;

function logSession(){
  state.sessions.push({
    id: uid(),
    ts: Date.now(),
    habit: flowState.habit || 'food',
    before: parseInt(el('islider').value, 10),
    after: parseInt(el('aslider').value, 10),
    outcome: flowState.outcome || 'good',
    actions: flowState.actions.slice(),
    triggers: flowState.triggers.slice(),
  });
  save();
  showDone(flowState.outcome || 'good');
  next('s5b', 'sdone');
}
window.logSession = logSession;

function showDone(kind){
  const e = el('doneEmoji'), t = el('doneTitle'), p = el('doneText');
  if (kind === 'good'){
    e.textContent = '🌊';
    t.textContent = "That's one more wave ridden.";
    p.textContent = "It crested and it passed — just like it always will. Logged quietly. Go be proud of yourself.";
  } else if (kind === 'mid'){
    e.textContent = '🌤️';
    t.textContent = "You slowed it down — that counts.";
    p.textContent = "A little is not the same as a lot. You stayed aware the whole time, and that's the muscle we're building.";
  } else {
    e.textContent = '💙';
    t.textContent = "Okay. That happened.";
    const streak = calmStreak();
    p.textContent = `It doesn't erase your reasons${streak ? ` or how far you've come` : ''}. You named what set it off — that makes tomorrow's urge easier to spot.`;
  }
}

function confirmClose(){ stopWave(); go('v-home'); }
window.confirmClose = confirmClose;

/* ------------------------------------------------------------------ *
 * Sample data (for "just exploring")
 * ------------------------------------------------------------------ */
function seedAndExplore(){
  state.onboarded = true;
  state.name = 'Andrei';
  state.habits = ['food', 'drink', 'smoke'];
  state.reasons = [
    { id: uid(), habit: 'all',   text: 'I want to wake up without that fog.' },
    { id: uid(), habit: 'all',   text: 'To be around for the kids at 70.' },
    { id: uid(), habit: 'smoke', text: "I'm tired of money going up in smoke." },
    { id: uid(), habit: 'all',   text: 'I want to prove to myself I can.' },
  ];
  state.note = "Future me — if you're reading this mid-craving, you already know it passes. Drink some water, go outside, and in twenty minutes you'll be so glad you didn't. I'm proud of you.";
  state.people = [
    { id: uid(), name: 'Sam', role: 'Best friend', phone: '' },
    { id: uid(), name: 'Mum', role: 'Always picks up', phone: '' },
  ];
  state.plans = [
    { id: uid(), habit: 'smoke', text: 'If I get the after-dinner smoke urge → brush teeth + start a podcast.' },
    { id: uid(), habit: 'drink', text: 'If I want a drink after a stressful day → fizzy water + 10-min walk first.' },
  ];

  // generate ~3 weeks of plausible sessions, evening-biased
  const sessions = [];
  const now = Date.now();
  const seq = [13, 11, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 1, 1, 0]; // days ago — denser recently
  const habits = ['food', 'drink', 'smoke'];
  for (let i = 0; i < 26; i++){
    const daysAgo = seq[i % seq.length] + (i % 3);
    const hour = 19 + (i % 4);                 // evenings, with some spread
    const d = new Date(now - daysAgo * 86400000);
    d.setHours(hour % 24, (i * 17) % 60, 0, 0);
    const r = (i * 7) % 10;
    const outcome = r < 7 ? 'good' : r < 9 ? 'mid' : 'slip';
    const actSet = [['walk'], ['water'], ['text'], ['walk', 'water'], ['breath'], ['teeth']][i % 6];
    const trig = [['Stress / after work'], ['Boredom'], ['Social / others doing it'], ['After a meal'], ['Tired']][i % 5];
    sessions.push({
      id: uid(), ts: d.getTime(), habit: habits[i % 3],
      before: 6 + (i % 4), after: outcome === 'good' ? 2 + (i % 2) : 4 + (i % 3),
      outcome, actions: actSet, triggers: trig,
    });
  }
  state.sessions = sessions.sort((a, b) => a.ts - b.ts);
  save();
  renderFlowHabits();
  go('v-home');
}
window.seedAndExplore = seedAndExplore;

/* ------------------------------------------------------------------ *
 * Install prompt
 * ------------------------------------------------------------------ */
let deferredPrompt = null;
function wireInstall(){
  const banner = el('install-banner');
  const btn = el('install-btn');
  const dismiss = el('install-dismiss');
  const dismissed = () => localStorage.getItem('tide.install.dismissed') === '1';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!dismissed()) banner.classList.add('show');
  });
  btn.addEventListener('click', async () => {
    banner.classList.remove('show');
    if (deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
  });
  dismiss.addEventListener('click', () => {
    banner.classList.remove('show');
    localStorage.setItem('tide.install.dismissed', '1');
  });
  window.addEventListener('appinstalled', () => banner.classList.remove('show'));

  // iOS Safari has no beforeinstallprompt — offer a hint instead
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (isIOS && !standalone && !dismissed()){
    banner.querySelector('span').textContent = "Add Tide to your home screen: tap Share, then “Add to Home Screen.”";
    btn.style.display = 'none';
    banner.classList.add('show');
  }
}

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */
function init(){
  renderTabs();
  wireOnboarding();
  renderFlowHabits();
  wireInstall();

  el('islider').addEventListener('input', function(){ el('ival').textContent = this.value; });
  el('aslider').addEventListener('input', function(){ el('aval').textContent = this.value; });

  if (state.onboarded){
    go('v-home');
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'ride') startFlow();
  } else {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    el('v-onboard').classList.add('active');
  }

  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

init();
