// Exports the history notebooks as October Library books (October/books/<slug>/content.html).
// Usage: node notebooks/export-october.cjs   (run after build.cjs; then bump "updated" in October/subjects.json)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OCTOBER = path.join(ROOT, '..', 'October', 'books');
const manifest = require('./src/manifest.cjs');
const SLUGS = { rajasthan: 'ras-rajasthan-history', indian: 'ras-indian-history' };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const words = html => text(html).split(' ').filter(Boolean).length;
const list = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const box = (kind, label, body) => `<aside class="rd-box rd-box-${kind}"><span class="rd-box-label">${label}</span>${body}</aside>`;

// The notebooks' own callouts become reader callouts.
const boxes = html => html
  .replace(/<div class="box why">([\s\S]*?)<\/div>/g, (_, b) => box('exam', 'Exam focus', b))
  .replace(/<div class="box debate">([\s\S]*?)<\/div>/g, (_, b) => box('plain', 'Debate', b))
  .replace(/<div class="box concept">([\s\S]*?)<\/div>/g, (_, b) => box('defn', 'Concept', b))
  .replace(/<div class="box bridge">([\s\S]*?)<\/div>/g, (_, b) => box('data', 'Connections', b))
  .replace(/<div class="tbl">([\s\S]*?<\/table>)<\/div>/g, '$1');

function unit(u, partName) {
  const h3 = (id, title) => `<h3 id="${u.id.toLowerCase()}-${id}">${title}</h3>`;
  const syl = box('plain', 'Where this fits in the syllabus',
    `<p><b>Prelims:</b> ${u.syllabus.prelims.join('; ')}</p><p><b>Mains:</b> ${u.syllabus.mains.join('; ')}</p>` +
    (u.syllabus.weight ? `<p>${u.syllabus.weight}</p>` : ''));
  const timeline = `<table><thead><tr><th>When</th><th>What happened</th></tr></thead><tbody>${
    u.timeline.map(([d, t]) => `<tr><td>${d}</td><td>${t}</td></tr>`).join('')}</tbody></table>`;
  const core = u.sections.map((s, i) => `<h4>${u.id}.${i + 1} ${s.title}</h4>${boxes(s.html)}`).join('\n');
  const pyq = (u.pyqs.verified.length
    ? `<table><thead><tr><th>Exam</th><th>Question</th><th>Marks</th></tr></thead><tbody>${u.pyqs.verified.map(p =>
      `<tr><td>${p.exam} ${p.year}</td><td>${p.q}</td><td>${p.marks || '—'}</td></tr>`).join('')}</tbody></table>`
    : '') + `<p><em>${u.pyqs.note}</em></p>`;
  const mains = u.mains.map(m => box('exam', `${m.marks} marks · ${m.words} words`,
    `<p><b>${m.q}</b></p><p>How to frame it: ${m.outline.join(' → ')}</p>` +
    `<details class="rd-answer"><summary>Model answer (${words(m.answer)} words)</summary>${m.answer}</details>`)).join('\n');
  const recall = `<div class="rd-recall"><ol>${u.selfTest.map(t =>
    `<li><span class="rd-recall-q">${t.q}</span><details class="rd-answer"><summary>Show answer</summary><p>${t.a}</p></details></li>`).join('')}</ol></div>`;
  const gloss = `<table><thead><tr><th>हिन्दी</th><th>English</th><th>Meaning</th></tr></thead><tbody>${u.glossary.map(([h, e, m]) =>
    `<tr><td lang="hi">${h}</td><td>${e}</td><td>${m}</td></tr>`).join('')}</tbody></table>`;

  return `<h2 class="rd-chapter" id="${u.id.toLowerCase()}" data-toc="${u.id} · ${esc(text(u.title))}"><span class="rd-ch-no">${esc(partName)} · Unit ${u.id}</span>${u.title}<span class="rd-ch-count">${esc(u.period)}</span></h2>
${syl}
${h3('picture', 'The big picture')}
${boxes(u.bigPicture)}
${timeline}
${h3('notes', 'Core notes')}
${core}
${h3('historians', 'What historians say')}
${boxes(u.historians)}
${h3('facts', 'Prelims fact bank')}
${list(u.facts)}
${box('trap', 'Exam traps', list(u.traps))}
${h3('pyq', 'Previous-year questions (RAS)')}
${pyq}
${h3('mains', 'Mains answer writing')}
${mains}
${h3('revision', 'Revision card')}
${box('remember', 'Remember', list(u.revision))}
${h3('test', 'Self-test')}
${recall}
${h3('glossary', 'Glossary (हिन्दी ↔ English)')}
${gloss}
<p><small><b>Sources:</b> ${u.sources.join('; ')}</small></p>`;
}

for (const [key, nb] of Object.entries(manifest)) {
  const slug = SLUGS[key];
  if (!slug) continue;
  const out = [];
  let count = 0;
  nb.parts.forEach((p, pi) => {
    const units = p.units.filter(([, , file]) => file).map(([, , file]) => require(path.join(ROOT, 'src', key, file)));
    if (!units.length) return;
    const [no, name] = p.name.split(/\s+—\s+/);
    out.push(`<h1 class="rd-part" id="part-${pi + 1}" data-toc="${esc(name || p.name)}" data-count="${units.length} units"><span class="rd-part-no">${esc(no)}</span>${esc(name || p.name)}</h1>
<p class="rd-part-tally"><span><b>${units.length}</b> units</span><span><b>${units.reduce((a, u) => a + u.pyqs.verified.length, 0)}</b> verified PYQs</span><span><b>${units.reduce((a, u) => a + u.selfTest.length, 0)}</b> self-test questions</span></p>`);
    units.forEach(u => out.push(unit(u, no)));
    count += units.length;
  });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(nb.title)}</title>
</head>
<body>
${out.join('\n\n')}
</body>
</html>
`;
  const dir = path.join(OCTOBER, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.html'), html);
  console.log(`wrote October/books/${slug}/content.html (${count} units)`);
}
