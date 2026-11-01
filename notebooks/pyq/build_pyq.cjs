// Builds ../RAS_Mains_PYQ_Database.html from syllabus.cjs and mains/<year>.cjs.
// Run from the notebooks folder: node pyq/build_pyq.cjs
// Marks of a question tagged with several lines are split equally between them.
const fs = require('fs');
const path = require('path');

const S = require('./syllabus.cjs');
const YEARS = fs.readdirSync(path.join(__dirname, 'mains'))
  .filter(f => /^\d{4}\.cjs$/.test(f)).map(f => +f.slice(0, 4)).sort();
const D = YEARS.map(y => require(`./mains/${y}.cjs`));
const GS = [1, 2, 3];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = x => (Math.round(x * 2) / 2).toString();

// Syllabus index: line id -> {paperKey, unit, label}
const LINES = {};
const UNITS = [];
for (const [pk, p] of Object.entries(S)) for (const u of p.units) {
  UNITS.push({ pk, name: u.name, ids: Object.keys(u.lines) });
  for (const [id, label] of Object.entries(u.lines)) LINES[id] = { pk, unit: u.name, label };
}
const isOld = id => id.startsWith('OLD');

// Aggregate GS papers: marks per line per year, marks per unit per year
const lineYear = {};   // id -> {year: marks}
const lineCount = {};  // id -> questions
const unitYear = {};   // unit -> {year: marks}
const allQ = [];       // flat bank
for (const d of D) for (const p of [1, 2, 3, 4]) for (const q of d.papers[p] || []) {
  allQ.push({ year: d.year, paper: p, ...q });
  if (!GS.includes(p)) continue;
  const share = q.m / q.t.length;
  for (const t of q.t) {
    (lineYear[t] ||= {})[d.year] = (lineYear[t][d.year] || 0) + share;
    lineCount[t] = (lineCount[t] || 0) + 1;
    const u = LINES[t].unit;
    (unitYear[u] ||= {})[d.year] = (unitYear[u][d.year] || 0) + share;
  }
}
const total = id => Object.values(lineYear[id] || {}).reduce((a, b) => a + b, 0);
const yearsAsked = id => Object.keys(lineYear[id] || {}).length;

// Rajasthan angle: question names Rajasthan, or sits on a Rajasthan-only line
const RAJ_LINE = /^(RH|RE|GR|RP|LW8|LW9|CA2)/;
const isRaj = q => /Rajasthan|राजस्थान/i.test(q.q) || q.t.some(t => RAJ_LINE.test(t));

// Directive word = how the question opens
const DIRECTIVES = [
  ['critically evaluate / examine / analyse', /^critically (evaluate|examine|analy[sz]e)/],
  ['what / who / which / where / when', /^(what|who|which|where|when)\b/],
  ['define', /^define/], ['name / list / mention / state / give / identify', /^(name|list|mention|state|give|identify|write (down )?(any|the names?))/],
  ['explain', /^explain/], ['discuss', /^discuss/], ['describe', /^describe/],
  ['write a note / comment', /^(write a (short |brief |detailed )?note|comment)/],
  ['differentiate / distinguish / compare', /^(differentiate|distinguish|compare|write any two differences|give any two differences)/],
  ['evaluate / examine / analyse / assess', /^(evaluate|examine|analy[sz]e|assess)/],
  ['why / how', /^(why|how|in what)/], ['elaborate / enumerate / highlight', /^(elaborate|enumerate|highlight|elucidate|outline|illustrate)/],
];
const directiveOf = q => {
  const s = q.q.replace(/^['"‘“]/, '').toLowerCase();
  for (const [name, re] of DIRECTIVES) if (re.test(s)) return name;
  return 'other';
};

// ---------- HTML pieces ----------
const gsQ = allQ.filter(q => GS.includes(q.paper));

function unitTable() {
  let h = `<tr><th>Unit</th>${YEARS.map(y => `<th>${y}</th>`).join('')}<th>Avg</th></tr>`;
  for (const pk of ['paper1', 'paper2', 'paper3']) {
    h += `<tr><th colspan="${YEARS.length + 2}" class="grp">${esc(S[pk].title || pk)}</th></tr>`;
    for (const u of UNITS.filter(u => u.pk === pk)) {
      const v = unitYear[u.name] || {};
      const avg = YEARS.reduce((a, y) => a + (v[y] || 0), 0) / YEARS.length;
      h += `<tr><td>${esc(u.name)}</td>${YEARS.map(y => `<td class="n">${v[y] ? fmt(v[y]) : '—'}</td>`).join('')}<td class="n"><b>${fmt(avg)}</b></td></tr>`;
    }
  }
  return h;
}

function heat(m) {
  if (!m) return '';
  const a = Math.min(1, m / 25);
  return ` style="background:rgba(155,90,44,${(0.12 + a * 0.55).toFixed(2)})"`;
}

function lineTable() {
  let h = `<tr><th>ID</th><th>Syllabus line</th>${YEARS.map(y => `<th>${y}</th>`).join('')}<th>Total</th><th>Cycles</th><th>Qs</th></tr>`;
  for (const pk of ['paper1', 'paper2', 'paper3']) {
    h += `<tr><th colspan="${YEARS.length + 5}" class="grp">${esc(S[pk].title || pk)}</th></tr>`;
    for (const u of UNITS.filter(u => u.pk === pk)) {
      h += `<tr><td colspan="${YEARS.length + 5}" class="unit">${esc(u.name)}</td></tr>`;
      for (const id of u.ids) {
        const v = lineYear[id] || {};
        const never = !isOld(id) && !lineYear[id];
        h += `<tr class="${never ? 'never' : ''}${isOld(id) ? ' old' : ''}"><td><a href="#bank" data-tag="${id}" class="tag">${id}</a></td><td>${esc(LINES[id].label)}${never ? ' <span class="pill">never asked</span>' : ''}</td>`
          + YEARS.map(y => `<td class="n"${heat(v[y])}>${v[y] ? fmt(v[y]) : ''}</td>`).join('')
          + `<td class="n"><b>${lineYear[id] ? fmt(total(id)) : '0'}</b></td><td class="n">${yearsAsked(id)}/${YEARS.length}</td><td class="n">${lineCount[id] || 0}</td></tr>`;
      }
    }
  }
  return h;
}

function topTable(n) {
  const ids = Object.keys(lineYear).filter(id => !isOld(id)).sort((a, b) => total(b) - total(a)).slice(0, n);
  return `<tr><th>#</th><th>Line</th><th>Unit</th><th>Marks (${YEARS.length} cycles)</th><th>Cycles asked</th></tr>`
    + ids.map((id, i) => `<tr><td class="n">${i + 1}</td><td><b>${id}</b> · ${esc(LINES[id].label)}</td><td>${esc(LINES[id].unit)}</td><td class="n">${fmt(total(id))}</td><td class="n">${yearsAsked(id)}/${YEARS.length}</td></tr>`).join('');
}

function neverList() {
  const ids = Object.keys(LINES).filter(id => !isOld(id) && LINES[id].pk !== 'paper4' && !lineYear[id]);
  return `<ul>${ids.map(id => `<li><b>${id}</b> — ${esc(LINES[id].label)} <span class="sub">(${esc(LINES[id].unit)})</span></li>`).join('')}</ul>`;
}

function directiveTable() {
  const bands = [2, 5, 10];
  const c = {};
  for (const q of gsQ) { const k = directiveOf(q); (c[k] ||= {})[q.m] = (c[k][q.m] || 0) + 1; }
  const tot = Object.fromEntries(bands.map(b => [b, gsQ.filter(q => q.m === b).length]));
  const names = [...DIRECTIVES.map(d => d[0]), 'other'].filter(n => c[n]);
  return `<tr><th>Question opens with</th>${bands.map(b => `<th>${b}-mark (${tot[b]})</th>`).join('')}</tr>`
    + names.map(n => `<tr><td>${esc(n)}</td>${bands.map(b => {
      const v = (c[n] || {})[b] || 0;
      return `<td class="n">${v ? `${v} <span class="sub">(${Math.round(v / tot[b] * 100)}%)</span>` : ''}</td>`;
    }).join('')}</tr>`).join('');
}

function rajTable() {
  return `<tr><th>Cycle</th><th>Rajasthan-angle marks (of 600)</th><th>Share</th><th>Questions</th></tr>`
    + D.map(d => {
      const qs = GS.flatMap(p => d.papers[p]).filter(isRaj);
      const m = qs.reduce((a, q) => a + q.m, 0);
      return `<tr><td>${d.year}</td><td class="n">${m}</td><td class="n">${(m / 6).toFixed(1)}%</td><td class="n">${qs.length}</td></tr>`;
    }).join('');
}

function oldTable() {
  return `<tr><th>Cycle</th><th>Marks on topics outside the 2026 syllabus (of 600)</th><th>Main sources</th></tr>`
    + D.map(d => {
      const by = {};
      for (const p of GS) for (const q of d.papers[p]) for (const t of q.t) if (isOld(t)) by[t] = (by[t] || 0) + q.m / q.t.length;
      const m = Object.values(by).reduce((a, b) => a + b, 0);
      const top = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([t, v]) => `${t} ${fmt(v)}`).join(', ');
      return `<tr><td>${d.year}</td><td class="n">${fmt(m)}</td><td>${esc(top)}</td></tr>`;
    }).join('');
}

function patternTable() {
  return `<tr><th>Cycle</th><th>Held</th>${GS.map(p => `<th>Paper ${p}: 2 / 5 / 10-markers</th>`).join('')}</tr>`
    + D.map(d => `<tr><td>${d.year}</td><td>${esc(d.held)}</td>${GS.map(p => {
      const c = m => d.papers[p].filter(q => q.m === m).length;
      return `<td class="n">${c(2)} / ${c(5)} / ${c(10)}</td>`;
    }).join('')}</tr>`).join('');
}

function p4Table() {
  return `<tr><th>Cycle</th><th>Hindi Part C (essay)</th><th>English paragraph / theme</th></tr>`
    + D.map(d => {
      const p4 = d.papers[4] || [];
      const hi = p4.filter(q => q.t.includes('HI3') && q.m >= 10 && /निबंध/.test(q.q)).map(q => esc(q.q)).join('<br>');
      const en = p4.filter(q => /^E3[23]$/.test(String(q.n))).map(q => esc(q.q)).join('<br>');
      return `<tr><td>${d.year}</td><td>${hi || '—'}</td><td>${en || '—'}</td></tr>`;
    }).join('');
}

function bankRows() {
  return allQ.map(q => `<tr data-y="${q.year}" data-p="${q.paper}" data-t=" ${q.t.join(' ')} "><td>${q.year}</td><td>P${q.paper}</td><td>${esc(q.n)}</td><td class="n">${q.m}</td><td>${q.t.map(t => `<span class="tg">${t}</span>`).join(' ')}</td><td>${esc(q.q)}</td></tr>`).join('');
}

// ---------- headline numbers for the findings ----------
const recurring = Object.keys(lineYear).filter(id => !isOld(id) && yearsAsked(id) === YEARS.length).sort((a, b) => total(b) - total(a));
const neverIds = Object.keys(LINES).filter(id => !isOld(id) && LINES[id].pk !== 'paper4' && !lineYear[id]);
const twoMark = gsQ.filter(q => q.m === 2);
const factual2 = twoMark.filter(q => directiveOf(q) === 'what / who / which / where / when' || directiveOf(q) === 'define' || directiveOf(q).startsWith('name')).length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RAS Mains PYQ Database</title>
<style>
:root{--bg:#faf6ee;--card:#fffdf8;--ink:#2a241c;--muted:#7a6f60;--line:#e6dccb;--accent:#9b5a2c;--good:#2f6b45;--warn:#9a3b2a;--soft:#f3ebdd}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1f1d1a;--card:#282521;--ink:#ece4d6;--muted:#a69a88;--line:#3a352e;--accent:#d69a62;--good:#7fc39a;--warn:#e08a74;--soft:#302c26}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 Georgia,'Iowan Old Style',serif}
main{max-width:1040px;margin:0 auto;padding:40px 16px 80px}
h1{font-size:2.1rem;line-height:1.2;margin:0 0 6px}
h2{font-size:1.45rem;margin:56px 0 12px;padding-top:12px;border-top:1px solid var(--line)}
p,li{max-width:76ch}
.sub{color:var(--muted);font-family:system-ui,sans-serif;font-size:.85rem}
nav.toc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:24px 0;font-family:system-ui,sans-serif;font-size:.9rem}
nav.toc ol{margin:6px 0 0;padding-left:20px;columns:2 240px}
a{color:var(--accent)}
table{border-collapse:collapse;width:100%;margin:12px 0;font-family:system-ui,sans-serif;font-size:.84rem;background:var(--card)}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--soft)}
th.grp{background:var(--accent);color:var(--bg)}
td.unit{background:var(--soft);font-weight:600}
td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
tr.never td{color:var(--warn)}
tr.old td{color:var(--muted);font-style:italic}
.pill{font-size:.7rem;border:1px solid var(--warn);border-radius:99px;padding:0 6px;white-space:nowrap}
.tbl{overflow-x:auto}
.box{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:12px 16px;margin:16px 0}
.box.good{border-left-color:var(--good)} .box.warn{border-left-color:var(--warn)}
.box b.l{display:block;font-family:system-ui,sans-serif;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-family:system-ui,sans-serif}
.kpi span{display:block;font-size:.8rem;color:var(--muted)}
.big{font-size:1.8rem;font-weight:600;color:var(--accent)}
.tg{display:inline-block;font-size:.72rem;background:var(--soft);border-radius:4px;padding:0 4px;margin:1px 0}
.filters{display:flex;flex-wrap:wrap;gap:8px;font-family:system-ui,sans-serif;font-size:.88rem;margin:12px 0}
.filters input,.filters select{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
.filters input{flex:1 1 220px}
#bank td:last-child{min-width:280px}
</style>
</head>
<body>
<main>
<h1>RAS Mains PYQ Database</h1>
<p class="sub">Every RAS Mains question from ${YEARS.length} exam cycles (${YEARS.join(', ')}), tagged to the 2026 syllabus · built ${new Date().toISOString().slice(0, 10)} by pyq/build_pyq.cjs · 2013 not yet included (no copy found)</p>

<div class="kpis">
<div class="kpi"><span>Questions in the bank</span><b class="big">${allQ.length}</b> entries</div>
<div class="kpi"><span>GS questions (Papers I–III)</span><b class="big">${gsQ.length}</b></div>
<div class="kpi"><span>2026 lines asked every cycle</span><b class="big">${recurring.length}</b></div>
<div class="kpi"><span>2026 lines never asked</span><b class="big">${neverIds.length}</b></div>
</div>

<nav class="toc"><b>Contents</b><ol>
<li><a href="#findings">Findings</a></li>
<li><a href="#units">Marks per unit, every cycle</a></li>
<li><a href="#top">Most-tested syllabus lines</a></li>
<li><a href="#never">Lines never asked</a></li>
<li><a href="#directives">How questions are asked</a></li>
<li><a href="#raj">Rajasthan share</a></li>
<li><a href="#old">Topics outside the 2026 syllabus</a></li>
<li><a href="#pattern">Paper pattern</a></li>
<li><a href="#p4">Paper IV essays and themes</a></li>
<li><a href="#lines">Every syllabus line, every cycle</a></li>
<li><a href="#bank">Full question bank</a></li>
<li><a href="#method">Method and limits</a></li>
</ol></nav>

<h2 id="findings">1. Findings</h2>
<div class="box good"><b class="l">1 · The marks blueprint is fixed</b>
RPSC gives each unit almost the same marks every cycle. Accounting, Law, Management and Sociology get about 20 marks each every time (18–21). Ethics has held 65–70 since it moved to Paper II in 2018, Science and Technology 60–71, Public Administration 53–64 and Indian Polity 33–42 (table 2). Time can be split by unit weight from day one. Nothing in a unit is "optional".</div>
<div class="box good"><b class="l">2 · A core of lines comes back every cycle</b>
${recurring.length} lines of the 2026 syllabus were asked in all ${YEARS.length} cycles. The heaviest are ${recurring.slice(0, 8).map(id => `${id} (${esc(LINES[id].label.split(':')[0])})`).join(', ')}. Notes for these get the most depth and the most answer practice (table 3).</div>
<div class="box warn"><b class="l">3 · ${neverIds.length} lines have never been asked, mostly because they are new in 2026</b>
Those include Bharatiya Nyaya Sanhita and BNSS 2023, GST, accounting standards, computerised accounting, e-governance, leadership theories, workplace communication and ethics case studies (list 4). Old papers cannot show how RPSC will frame these, so they are covered from the syllabus and current material. They are where a well-prepared candidate pulls ahead of one who only drilled old papers.</div>
<div class="box"><b class="l">4 · Short questions are recall questions</b>
${twoMark.length} of the ${gsQ.length} GS questions are 2-mark, 15-word answers. ${Math.round(factual2 / twoMark.length * 100)}% of those open with what/who/which, define, or name/list/mention. They test exact facts: names, years, sections, districts, definitions. 10-mark questions mostly ask to discuss, describe or explain (table 5). Notes need a precise fact layer, and the answer-writing drills need two separate formats.</div>
<div class="box"><b class="l">5 · About a sixth to a quarter of GS marks carry a Rajasthan angle</b>
Questions that name Rajasthan or sit on a Rajasthan-only line took 16–24% of the 600 GS marks in each cycle (table 6). On top of that, many India-level questions reward a Rajasthan example. Every notebook keeps a Rajasthan box per topic.</div>
<div class="box warn"><b class="l">6 · 7–16% of old marks are on topics the 2026 syllabus dropped</b>
These are mostly old accounting and finance theory, personality and psychology theory, older administration topics, and in 2016 the whole Reasoning unit (table 7). Old questions on these lines are not practised. Their marks move to the new lines in finding 3.</div>
<div class="box"><b class="l">7 · The pattern itself moves a little</b>
Paper II in 2024 had 18 five-mark questions where earlier cycles had 14 (table 8). The 2026 scheme should be checked against the first paper set under it, and mocks should follow the newest pattern, not an average.</div>

<h2 id="units">2. Marks per unit, every cycle (GS Papers I–III)</h2>
<div class="tbl"><table>${unitTable()}</table></div>

<h2 id="top">3. Most-tested syllabus lines (2026 lines only)</h2>
<div class="tbl"><table>${topTable(25)}</table></div>

<h2 id="never">4. 2026 syllabus lines never asked in these cycles</h2>
${neverList()}

<h2 id="directives">5. How questions are asked (GS, all cycles)</h2>
<div class="tbl"><table>${directiveTable()}</table></div>

<h2 id="raj">6. Rajasthan share of GS marks</h2>
<div class="tbl"><table>${rajTable()}</table></div>
<p class="sub">Counted when the question names Rajasthan or is tagged to a Rajasthan-only line (RH, RE, GR, RP, Rajasthan tenancy/land revenue law, Rajasthan schemes).</p>

<h2 id="old">7. Marks on topics outside the 2026 syllabus</h2>
<div class="tbl"><table>${oldTable()}</table></div>

<h2 id="pattern">8. Paper pattern by cycle</h2>
<div class="tbl"><table>${patternTable()}</table></div>

<h2 id="p4">9. Paper IV: essay and theme topics</h2>
<div class="tbl"><table>${p4Table()}</table></div>

<h2 id="lines">10. Every syllabus line, every cycle (marks)</h2>
<p class="sub">Darker cells = more marks. Red rows = never asked. Grey italic rows = topics outside the 2026 syllabus. Click an ID to see its questions in the bank.</p>
<div class="tbl"><table>${lineTable()}</table></div>

<h2 id="bank">11. Full question bank</h2>
<div class="filters">
<input id="q" type="search" placeholder="Search text or a tag such as RH3">
<select id="fy"><option value="">All cycles</option>${YEARS.map(y => `<option>${y}</option>`).join('')}</select>
<select id="fp"><option value="">All papers</option><option value="1">Paper I</option><option value="2">Paper II</option><option value="3">Paper III</option><option value="4">Paper IV</option></select>
<span id="cnt" class="sub"></span>
</div>
<div class="tbl"><table id="bankT"><tr><th>Cycle</th><th>Paper</th><th>Q</th><th>Marks</th><th>Tags</th><th>Question</th></tr>${bankRows()}</table></div>

<h2 id="method">12. Method and limits</h2>
<ul>
<li>Source: scans of the RPSC question papers published by Adda247, read page by page. The English version is recorded (RPSC treats it as standard), except for Hindi-only Paper IV items.</li>
<li>Questions are numbered straight through each paper. 2016, 2018 and 2021 restart numbering in every unit on the printed paper.</li>
<li>Each question is tagged to one or more lines of the 2026 syllabus (pyq/syllabus.cjs). Topics the 2026 list no longer has are tagged OLD-*. A question with several tags has its marks split equally. Tags are judgement calls and can be corrected in the data files.</li>
<li>Missing: RAS Mains 2013 (same scheme as 2016). Add it as pyq/mains/2013.cjs and rebuild. Every table updates.</li>
</ul>
</main>
<script>
(function(){
  var rows=[].slice.call(document.querySelectorAll('#bankT tr[data-y]'));
  var q=document.getElementById('q'),fy=document.getElementById('fy'),fp=document.getElementById('fp'),cnt=document.getElementById('cnt');
  function run(){
    var s=q.value.trim().toLowerCase(),y=fy.value,p=fp.value,n=0;
    rows.forEach(function(r){
      var ok=(!y||r.dataset.y===y)&&(!p||r.dataset.p===p)&&(!s||r.dataset.t.toLowerCase().indexOf(' '+s+' ')>=0||r.textContent.toLowerCase().indexOf(s)>=0);
      r.style.display=ok?'':'none'; if(ok)n++;
    });
    cnt.textContent=n+' questions';
  }
  [q,fy,fp].forEach(function(el){el.addEventListener('input',run)});
  [].forEach.call(document.querySelectorAll('a.tag'),function(a){a.addEventListener('click',function(){q.value=a.dataset.tag;fy.value='';fp.value='';run();})});
  run();
})();
</script>
</body>
</html>
`;

const out = path.join(__dirname, '..', 'RAS_Mains_PYQ_Database.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out}: ${allQ.length} entries, ${gsQ.length} GS questions, ${YEARS.length} cycles`);
