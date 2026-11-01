module.exports = {
  id: 'I09',
  title: 'The Sangam Age',
  period: 'c. 3rd century BCE – 3rd century CE',

  syllabus: {
    prelims: ['Sangam literature; Cheras, Cholas, Pandyas; society and economy of the far south'],
    mains: ['GS-I: Ancient south India — Sangam polity, society, economy'],
    weight: 'Mostly Prelims: Sangam texts, kingdoms and capitals, tinai landscapes.',
  },

  bigPicture: `
<p>"Sangam" refers to assemblies of Tamil poets said to have met at Madurai under Pandya patronage. The poems that
survive — about 2,400 — describe the far south (Tamilakam) between roughly the 3rd century BCE and the 3rd century CE,
ruled by three crowned dynasties, the <b>Cheras</b>, <b>Cholas</b> and <b>Pandyas</b>, and many chiefs.</p>
<p>It was a society of warrior chiefs, bards, farmers and traders, linked by sea to Rome and South-East Asia. The
literature is secular and vivid, describing love (<i>akam</i>) and war and public life (<i>puram</i>).</p>
<div class="box why"><p>Sangam texts are among the few early Indian sources independent of Sanskrit traditions —
they show regional diversity in ancient India.</p></div>`,

  timeline: [
    ['3rd c. BCE', 'Ashoka\'s edicts name Cholas, Pandyas, Keralaputras, Satiyaputras'],
    ['c. 1st c. BCE', 'Hathigumpha inscription mentions a confederacy of Tamil states'],
    ['c. 1st–2nd c. CE', 'Peak of Indo-Roman trade; Muziris, Arikamedu, Kaveripattinam'],
    ['c. 3rd–6th c. CE', 'Kalabhra interregnum'],
  ],

  sections: [
    { title: 'Sangam literature', html: `
<ul>
<li>Tradition speaks of three Sangams at Madurai; only works of the third survive.</li>
<li><b>Tolkappiyam</b> (Tolkappiyar): Tamil grammar and poetics.</li>
<li><b>Ettuttogai</b> (Eight Anthologies) and <b>Pattuppattu</b> (Ten Idylls) — the core Sangam corpus.</li>
<li><b>Patinenkilkanakku</b> (18 minor works), including the <b>Tirukkural</b> of <b>Tiruvalluvar</b> — ethics,
wealth and love.</li>
<li>Epics (slightly later): <b>Silappadikaram</b> (Ilango Adigal; Kannagi and Kovalan) and <b>Manimekalai</b>
(Sittalai Sattanar; Buddhist) — the "twin epics".</li>
<li>Themes: <b>akam</b> (inner — love) and <b>puram</b> (outer — war, kings, generosity).</li>
</ul>` },

    { title: 'The three kingdoms', html: `
<div class="tbl"><table>
<tr><th>Dynasty</th><th>Region and capital</th><th>Emblem</th><th>Port</th><th>Famous ruler</th></tr>
<tr><td><b>Chera</b></td><td>Kerala; Vanji (Karur)</td><td>Bow</td><td>Muziris, Tondi</td><td>Senguttuvan ("Red Chera"); started the Pattini (Kannagi) cult</td></tr>
<tr><td><b>Chola</b></td><td>Kaveri delta; Uraiyur, later Puhar</td><td>Tiger</td><td>Kaveripattinam (Puhar)</td><td><b>Karikala</b>: battle of Venni; built the Kallanai dam on the Kaveri (tradition)</td></tr>
<tr><td><b>Pandya</b></td><td>Madurai</td><td>Fish</td><td>Korkai (pearls)</td><td>Nedunjeliyan (battle of Talaiyalanganam); patrons of the Sangam</td></tr>
</table></div>
<p>Smaller chiefs (<i>velir</i>) such as Pari and Ay were celebrated for generosity.</p>` },

    { title: 'Society, economy and polity', html: `
<ul>
<li><b>Tinai</b> — five landscapes, each with its occupation and theme: <b>kurinji</b> (hills; hunting), <b>mullai</b>
(forest/pasture; herding), <b>marutam</b> (riverine plains; farming), <b>neytal</b> (coast; fishing, salt), <b>palai</b>
(dry land; raiding).</li>
<li>Kingship hereditary; king advised by the <b>sabha/manram</b>; revenue from land (karai), tribute and plunder.</li>
<li>Hero stones (<i>nadukal</i>) for warriors who died in battle.</li>
<li>Society: varna was weak; groups such as the <i>panar</i> and <i>viraliyar</i> (bards), <i>vellalar</i> (landowners),
<i>kadaisiyar</i> (labourers). Women poets: Avvaiyar, Nachchellaiyar.</li>
<li>Religion: <b>Murugan</b> (chief deity, with Kurinji), Mayon (Vishnu), Kotravai (war goddess); Vedic sacrifices and
Buddhism and Jainism spread later.</li>
<li>Trade: pepper, pearls, muslin, ivory to Rome; Roman coins found widely; Yavanas resident at ports.</li>
</ul>` },
  ],

  historians: `
<p><b>K.A. Nilakanta Sastri</b> (<i>A History of South India</i>) set the standard chronology. <b>R. Champakalakshmi</b> and
<b>Rajan Gurukkal</b> argue that Sangam society was a chiefdom-level, pre-state society organised by kinship and
redistribution of plunder, not a full state. Dating the poems is difficult; the 3rd c. BCE–3rd c. CE range is broad.</p>`,

  facts: [
    'Sangam assemblies were held at Madurai under Pandya patronage (tradition).',
    'Tolkappiyam is a work of Tamil grammar by Tolkappiyar.',
    'The Sangam corpus: Ettuttogai and Pattuppattu.',
    'The Tirukkural was written by Tiruvalluvar.',
    'Silappadikaram was written by Ilango Adigal; Manimekalai by Sittalai Sattanar.',
    'Chera emblem: bow; Chola: tiger; Pandya: fish.',
    'Karikala Chola is credited with the Kallanai dam.',
    'Senguttuvan Chera started the Pattini cult of Kannagi.',
    'Korkai was the Pandya pearl port; Muziris the Chera port.',
    'The five tinai: kurinji, mullai, marutam, neytal, palai.',
    'Murugan was the chief deity of the Sangam Tamils.',
    'Hero stones are called nadukal.',
  ],

  traps: [
    'Silappadikaram and Manimekalai are post-Sangam epics, not part of the eight anthologies.',
    'Puhar = Kaveripattinam (Chola port); Korkai (Pandya); Muziris (Chera).',
    'Akam = love (inner); puram = war and public life (outer).',
  ],

  pyqs: {
    verified: [],
    note: 'No verified RAS Mains question on this unit yet. The history sections of the RAS Prelims 2021, 2023 and 2024 papers had no question on this unit (checked against RPSC final answer keys; 2018 not checked, key unavailable).',
  },

  mains: [
    {
      q: 'Describe the society and economy of the Sangam age.', marks: 5, words: 50,
      outline: ['Tinai', 'Social groups', 'Trade'],
      answer: '<p>Sangam society was organised by five landscapes (tinai) — hills, pasture, plains, coast and dry land — each with its occupation. Bards, landowners, labourers and warrior chiefs formed society; varna was weak. Farming in the river plains and sea trade with Rome in pepper, pearls and textiles brought wealth.</p>',
    },
    {
      q: 'What are akam and puram?', marks: 2, words: 15,
      outline: ['Meanings'],
      answer: '<p>Two Sangam poetic themes: akam (love, inner life) and puram (war, kings, public life).</p>',
    },
  ],

  revision: [
    'Texts: Tolkappiyam; Ettuttogai, Pattuppattu; Tirukkural; twin epics Silappadikaram, Manimekalai.',
    'Chera (bow, Vanji, Muziris, Senguttuvan); Chola (tiger, Uraiyur/Puhar, Karikala); Pandya (fish, Madurai, Korkai).',
    'Tinai: kurinji, mullai, marutam, neytal, palai. Murugan. Nadukal. Roman trade.',
  ],

  selfTest: [
    { q: 'Where were the Sangam assemblies held?', a: 'Madurai, under the Pandyas.' },
    { q: 'Who wrote the Tirukkural?', a: 'Tiruvalluvar.' },
    { q: 'Who wrote Silappadikaram?', a: 'Ilango Adigal.' },
    { q: 'What was the Chola emblem?', a: 'The tiger.' },
    { q: 'Which Chola ruler is credited with the Kallanai dam?', a: 'Karikala.' },
    { q: 'Which landscape was associated with farming?', a: 'Marutam.' },
    { q: 'Who was the chief Sangam deity?', a: 'Murugan.' },
    { q: 'Which was the Pandya pearl port?', a: 'Korkai.' },
  ],

  glossary: [
    ['संगम', 'Sangam', 'Assembly of poets.'],
    ['तिणै', 'Tinai', 'Landscape-based ecological zone.'],
    ['अकम / पुरम', 'Akam / Puram', 'Love / war themes.'],
    ['नडुकल', 'Nadukal', 'Hero stone.'],
    ['वेलिर', 'Velir', 'Chiefs.'],
  ],

  sources: [
    'K.A. Nilakanta Sastri, <i>A History of South India</i>.',
    'Upinder Singh, <i>A History of Ancient and Early Medieval India</i>, ch. 8.',
    'NCERT (old), R.S. Sharma, <i>Ancient India</i>.',
  ],
};
