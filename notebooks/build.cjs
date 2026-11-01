// Builds the history notebooks from src/manifest.cjs and src/<notebook>/*.cjs.
// Usage: node notebooks/build.cjs   (checks every written unit, then writes the HTML files)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const manifest = require('./src/manifest.cjs');
const SYL = require('./src/syllabus2026.cjs');
const MAINS_LINES = {};
for (const p of Object.values(require('./pyq/syllabus.cjs'))) for (const u of p.units) Object.assign(MAINS_LINES, u.lines);

const REQUIRED = ['id', 'title', 'period', 'syllabus', 'bigPicture', 'timeline', 'sections', 'historians',
  'facts', 'traps', 'pyqs', 'mains', 'revision', 'selfTest', 'glossary', 'sources'];
const HYPE = ['unshakeable', 'immortal', 'total mastery', '100%', 'world-historical', 'definitive',
  'highest-yielding', 'legendary', 'supreme martyrdom', 'epic'];
const VOID = new Set(['br', 'hr', 'img', 'wbr']);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const words = html => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const norm = s => s.replace(/<[^>]+>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function tagErrors(html) {
  const stack = [];
  for (const m of html.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)) {
    const tag = m[1].toLowerCase();
    if (VOID.has(tag) || m[0].endsWith('/>')) continue;
    if (m[0][1] === '/') {
      if (stack.pop() !== tag) return `unexpected </${tag}>`;
    } else stack.push(tag);
  }
  return stack.length ? `unclosed <${stack.join('>, <')}>` : null;
}

function allStrings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => allStrings(x, out));
  return out;
}

function check(u, file) {
  const errs = [], warns = [];
  for (const k of REQUIRED) {
    const v = u[k];
    if (v == null || (Array.isArray(v) && !v.length) || v === '') errs.push(`missing ${k}`);
  }
  allStrings(u).forEach(s => {
    const e = tagErrors(s);
    if (e) errs.push(`markup: ${e} in "${s.slice(0, 60)}…"`);
    HYPE.forEach(h => { if (new RegExp(`(^|\\W)${h.replace(/[.*+?^${}()|[\]\\%]/g, '\\$&')}(\\W|$)`).test(s.toLowerCase())) warns.push(`hype word "${h}" in "${s.slice(0, 50)}…"`); });
  });
  const seen = new Map();
  (u.facts || []).forEach(f => {
    const n = norm(f);
    if (seen.has(n)) errs.push(`duplicate fact: ${f.slice(0, 60)}`);
    seen.set(n, true);
  });
  (u.mains || []).forEach(m => {
    const w = words(m.answer);
    if (w > m.words * 1.3) warns.push(`model answer ${w} words > limit ${m.words}: ${m.q.slice(0, 50)}`);
  });
  if ((u.selfTest || []).length < 8) warns.push('fewer than 8 self-test questions');
  return { errs: errs.map(e => `${file}: ${e}`), warns: warns.map(w => `${file}: ${w}`) };
}

function renderUnit(u, meta) {
  const sec = (n, title, body, cls = '') =>
    `<section class="block ${cls}"><h3><span class="num">${n}</span>${title}</h3>${body}</section>`;
  const list = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

  const m = meta.map;
  const line = (id, text) => `<span class="lid">${id}</span> ${text}`;
  const syllabus = `<div class="syl">
    <div><b>Prelims 2026</b>${list(m.pre.map(id => line(id, meta.syl.prelims[id])))}</div>
    <div><b>Mains 2026 (GS Paper I)</b>${m.mains.length ? list(m.mains.map(id => line(id, MAINS_LINES[id]))) : '<p>Background for Mains; no line of its own.</p>'}</div>
    </div>
    <p class="label">Topics this unit covers</p>${list(u.syllabus.prelims)}
    ${m.note ? `<p class="weight">${m.note}</p>` : ''}
    ${u.syllabus.weight ? `<p class="weight">${u.syllabus.weight}</p>` : ''}`;

  const timeline = `<ol class="timeline">${u.timeline.map(([d, t]) =>
    `<li><span class="when">${d}</span><span class="what">${t}</span></li>`).join('')}</ol>`;

  const core = u.sections.map((s, i) =>
    `<div class="topic"><h4>${meta.num}.${i + 1} ${s.title}</h4>${s.html}</div>`).join('');

  const pyq = (u.pyqs.verified.length
    ? `<table class="pyq"><tr><th>Exam</th><th>Question</th><th>Marks</th></tr>${u.pyqs.verified.map(p =>
      `<tr><td>${p.exam} ${p.year}</td><td>${p.q}</td><td>${p.marks || '—'}</td></tr>`).join('')}</table>`
    : '') + `<p class="note">${u.pyqs.note}</p>`;

  const mains = u.mains.map(m => `<div class="mains">
      <p class="mq"><span class="tag">${m.marks} marks · ${m.words} words${m.pyq ? ' · ' + m.pyq : ''}</span> ${m.q}</p>
      <p class="label">How to frame it</p>${list(m.outline)}
      <details><summary>Model answer (${words(m.answer)} words)</summary><div class="answer">${m.answer}</div></details>
    </div>`).join('');

  const test = `<ol class="test">${u.selfTest.map(t =>
    `<li><p>${t.q}</p><details><summary>Answer</summary><p>${t.a}</p></details></li>`).join('')}</ol>`;

  const gloss = `<table class="gloss"><tr><th>हिन्दी</th><th>English</th><th>Meaning</th></tr>${u.glossary.map(([h, e, m]) =>
    `<tr><td lang="hi">${h}</td><td>${e}</td><td>${m}</td></tr>`).join('')}</table>`;

  return `<article class="unit" id="${u.id}">
  <header class="unit-head"><p class="kicker">Unit ${u.id} · ${u.period}</p><h2>${u.title}</h2></header>
  ${sec(1, 'Where this fits in the syllabus', syllabus)}
  ${sec(2, 'The big picture', u.bigPicture + timeline)}
  ${sec(3, 'Core notes', core)}
  ${sec(4, 'What historians say', u.historians)}
  ${sec(5, 'Prelims fact bank', list(u.facts) + `<p class="label trap-label">Exam traps</p>` + list(u.traps), 'facts')}
  ${sec(6, 'Previous-year questions (RAS)', pyq)}
  ${sec(7, 'Mains answer writing', mains)}
  ${sec(8, 'One-screen revision card', list(u.revision), 'card')}
  ${sec(9, 'Self-test', test)}
  ${sec(10, 'Glossary (हिन्दी ↔ English)', gloss)}
  <section class="block sources"><h3>Sources used for this unit</h3>${list(u.sources)}</section>
</article>`;
}

function renderNotebook(key, nb, units) {
  const nav = nb.parts.map(p => `<p class="part">${p.name}</p><ul>${p.units.map(([id, title, file]) =>
    file ? `<li><a href="#${id}"><span>${id}</span>${esc(title)}</a></li>`
         : `<li class="planned" title="Planned"><span>${id}</span>${esc(title)}</li>`).join('')}</ul>`).join('');
  const written = units.length, total = nb.parts.reduce((a, p) => a + p.units.length, 0);
  const syl = SYL[key];
  const body = units.map(({ u, num }) => renderUnit(u, { num, map: syl.units[u.id], syl })).join('\n');
  const isWritten = new Set(units.map(x => x.u.id));
  const coverRow = (id, text) => {
    const hits = Object.entries(syl.units).filter(([, v]) => v.pre.includes(id) || v.mains.includes(id)).map(([uid]) => uid);
    const cell = hits.length
      ? hits.map(uid => isWritten.has(uid) ? `<a href="#${uid}">${uid}</a>` : `<span class="planned">${uid} (planned)</span>`).join(' ')
      : syl.elsewhere[id] ? `<i>${esc(syl.elsewhere[id])}</i>` : '<b class="gap">Not covered</b>';
    const extra = hits.length && syl.elsewhere[id] ? `<br><i>${esc(syl.elsewhere[id])}</i>` : '';
    return `<tr><td><span class="lid">${id}</span></td><td>${esc(text)}</td><td>${cell}${extra}</td></tr>`;
  };
  const coverage = `<details class="coverage"><summary>2026 syllabus coverage map: every line and the units that cover it</summary>
  <table><tr><th>Line</th><th>2026 syllabus</th><th>Units</th></tr>
  <tr><th colspan="3">Prelims</th></tr>${Object.entries(syl.prelims).map(([id, t]) => coverRow(id, t)).join('')}
  <tr><th colspan="3">Mains, GS Paper I</th></tr>${syl.mains.map(id => coverRow(id, MAINS_LINES[id])).join('')}
  </table><p class="note">Mains line IDs match the RAS Mains PYQ Database, so a line's past questions can be looked up there.</p></details>`;
  const css = fs.readFileSync(path.join(ROOT, 'src', 'notebook.css'), 'utf8');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nb.short)} Notebook</title>
<style>${css}</style>
</head>
<body>
<button class="menu" onclick="document.body.classList.toggle('nav-open')" aria-label="Contents">☰ Contents</button>
<nav class="side"><p class="brand">${esc(nb.title)}</p><p class="prog">${written} of ${total} units written</p>${nav}</nav>
<main>
  <div class="tools">
    <button data-theme="sepia">Sepia</button><button data-theme="light">Light</button><button data-theme="dark">Dark</button>
    <button data-size="-1">A−</button><button data-size="1">A+</button>
  </div>
  <header class="book-head"><h1>${esc(nb.title)}</h1><p>${nb.intro}</p>
  <p class="howto"><b>How to use each unit:</b> read 1–4 for understanding, use 5 for Prelims revision, 6–7 for Mains practice, and 8–9 the day before the exam. Greyed units in the contents are planned but not written yet.</p>
  ${coverage}</header>
  ${body}
</main>
<script>
(function(){
  var b=document.body, s=16;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function theme(t){b.dataset.theme=t;set('nb-theme',t)}
  function size(d){s=Math.max(13,Math.min(22,s+d));document.documentElement.style.fontSize=s+'px';set('nb-size',s)}
  theme(get('nb-theme')||'sepia'); var sv=parseInt(get('nb-size'),10); if(sv){s=sv;size(0)}
  document.querySelectorAll('[data-theme]').forEach(function(x){x.onclick=function(){theme(x.dataset.theme)}});
  document.querySelectorAll('[data-size]').forEach(function(x){x.onclick=function(){size(+x.dataset.size)}});
  document.querySelectorAll('nav a').forEach(function(a){a.onclick=function(){b.classList.remove('nav-open')}});
})();
</script>
</body>
</html>`;
}

let failed = false;
for (const [key, nb] of Object.entries(manifest)) {
  const units = [];
  nb.parts.forEach(p => p.units.forEach(([id, , file]) => {
    if (!file) return;
    const u = require(path.join(ROOT, 'src', key, file));
    if (u.id !== id) console.error(`${file}: id ${u.id} does not match manifest ${id}`), failed = true;
    if (!SYL[key].units[id]) console.error(`${file}: unit ${id} is not mapped in src/syllabus2026.cjs`), failed = true;
    const { errs, warns } = check(u, file);
    errs.forEach(e => console.error('ERROR ' + e));
    warns.forEach(w => console.warn('warn  ' + w));
    if (errs.length) failed = true;
    units.push({ u, num: id });
  }));
  if (failed) continue;
  const out = path.join(ROOT, nb.file);
  fs.writeFileSync(out, renderNotebook(key, nb, units));
  console.log(`wrote ${path.relative(process.cwd(), out)} (${units.length} unit${units.length === 1 ? '' : 's'})`);
}
process.exit(failed ? 1 : 0);
