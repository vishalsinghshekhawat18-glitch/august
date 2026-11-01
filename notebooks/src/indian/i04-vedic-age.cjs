module.exports = {
  id: 'I04',
  title: 'The Vedic Age',
  period: 'c. 1500 – 600 BCE',

  syllabus: {
    prelims: ['Vedic literature; early and later Vedic polity, society, economy and religion'],
    mains: ['GS-I: Vedic age — society, polity, religion; Indian knowledge tradition'],
    weight: 'Comparison of early and later Vedic periods is a classic Mains question; Prelims asks Vedic literature (which Veda, which Upanishad), rivers and assemblies.',
  },

  bigPicture: `
<p>The Vedic age is named after the <b>Vedas</b>, the oldest texts of India, composed in Sanskrit by people who called
themselves <b>Aryas</b>. It has two phases:</p>
<ul>
<li><b>Early (Rig Vedic), c. 1500–1000 BCE:</b> pastoral, tribal society in the land of seven rivers (Sapta Sindhu,
Punjab); cattle as wealth; tribal chiefs checked by assemblies; nature gods (Indra, Agni).</li>
<li><b>Later Vedic, c. 1000–600 BCE:</b> movement east into the Ganga–Yamuna doab; iron and agriculture; territorial
kingdoms; the varna system hardens; elaborate sacrifices; the Upanishads question ritual.</li>
</ul>
<div class="box why"><p>The shift from tribe (jana) to territory (janapada) and from cattle to land prepared the way for
the Mahajanapadas (I05). Learn the comparison as a table.</p></div>`,

  timeline: [
    ['c. 1500–1000 BCE', 'Rig Veda composed; Sapta Sindhu region'],
    ['c. 1400 BCE', 'Boghazkoi inscription (Anatolia) names Indra, Mitra, Varuna, Nasatyas'],
    ['c. 1000 BCE', 'Painted Grey Ware and iron in the Ganga–Yamuna doab'],
    ['c. 1000–600 BCE', 'Later Vedic texts: Sama, Yajur, Atharva, Brahmanas, Upanishads'],
  ],

  sections: [
    { title: 'Vedic literature', html: `
<div class="tbl"><table>
<tr><th>Text</th><th>Contents</th></tr>
<tr><td><b>Rig Veda</b></td><td>1,028 hymns in 10 mandalas; mandalas 2–7 oldest ("family books"); 10th has the <b>Purusha Sukta</b> (first mention of four varnas) and Nasadiya Sukta (creation). <b>Gayatri Mantra</b> (mandala 3, to Savitr)</td></tr>
<tr><td>Sama Veda</td><td>Rig Vedic hymns set to melody — root of Indian music</td></tr>
<tr><td>Yajur Veda</td><td>Sacrificial formulas; Shukla (white) and Krishna (black)</td></tr>
<tr><td>Atharva Veda</td><td>Charms, spells, medicine, popular beliefs</td></tr>
<tr><td>Brahmanas</td><td>Explanations of ritual (Shatapatha Brahmana)</td></tr>
<tr><td>Aranyakas</td><td>"Forest texts": meditation on ritual</td></tr>
<tr><td><b>Upanishads</b></td><td>About 108; philosophy of <b>Brahman</b> and <b>Atman</b>; "Satyameva Jayate" from the <b>Mundaka</b> Upanishad</td></tr>
<tr><td>Vedangas</td><td>Six aids: shiksha (phonetics), kalpa (ritual), vyakarana (grammar), nirukta (etymology), chhanda (metre), jyotisha (astronomy)</td></tr>
</table></div>
<p>The Vedas are called <b>shruti</b> ("heard"); later texts (smritis, epics, Puranas) are <b>smriti</b> ("remembered").</p>` },

    { title: 'Early and later Vedic periods compared', html: `
<div class="tbl"><table>
<tr><th></th><th>Early Vedic (Rig Vedic)</th><th>Later Vedic</th></tr>
<tr><td>Region</td><td>Sapta Sindhu (Punjab, Afghanistan edges); Saraswati most praised river</td><td>Ganga–Yamuna doab; Kuru–Panchala the centre; later Kosala, Videha</td></tr>
<tr><td>Economy</td><td>Pastoral; cattle as wealth (<i>gavishti</i> = search for cows = war); some barley farming</td><td>Settled agriculture; iron (<i>shyama ayas</i>) for clearing forests; rice, wheat; crafts</td></tr>
<tr><td>Polity</td><td>Tribal chief (<i>rajan</i>) of a jana; assemblies <b>sabha</b>, <b>samiti</b>, vidatha, gana; women attended sabha and vidatha</td><td>Territorial kingdoms (rashtra); king grows powerful; rituals Rajasuya, Ashvamedha, Vajapeya; ratnins (officials, e.g. <i>bhagadugha</i> — tax collector, <i>sangrahitri</i> — treasurer); assemblies decline; women excluded</td></tr>
<tr><td>Society</td><td>Varna fluid; division mainly Arya–Dasa; women relatively free (Apala, Ghosha, Lopamudra composed hymns)</td><td>Four varnas rigid; Shudras subordinate; gotra; three ashramas (fourth later); women's status declines</td></tr>
<tr><td>Religion</td><td>Nature gods: Indra (most hymns, 250), Agni (200), Varuna (rita, cosmic order), Soma; simple sacrifices for material gain</td><td>Prajapati, Vishnu, Rudra rise; elaborate sacrifices dominated by priests; Upanishads reject ritual for knowledge</td></tr>
</table></div>
<p>The <b>Battle of Ten Kings</b> (<i>Dasharajna</i>), on the Parushni (Ravi), in which <b>Sudas</b> of the Bharata tribe
defeated a confederacy, is described in the Rig Veda (mandala 7).</p>` },

    { title: 'Rivers and geography', html: `
<div class="tbl"><table>
<tr><th>Vedic name</th><th>Modern name</th></tr>
<tr><td>Sindhu</td><td>Indus</td></tr>
<tr><td>Vitasta</td><td>Jhelum</td></tr>
<tr><td>Asikni</td><td>Chenab</td></tr>
<tr><td>Parushni</td><td>Ravi</td></tr>
<tr><td>Vipasha</td><td>Beas</td></tr>
<tr><td>Shutudri</td><td>Sutlej</td></tr>
<tr><td>Gomati / Kubha / Krumu</td><td>Gomal / Kabul / Kurram</td></tr>
<tr><td>Drishadvati</td><td>Ghaggar–Chautang (identification debated)</td></tr>
</table></div>` },

    { title: 'The Aryan question', html: `
<div class="box debate"><p>Where did the Vedic people come from? The older "invasion" theory is rejected. Most
historians and linguists accept <b>migrations</b> of Indo-European-speaking groups into the subcontinent in the second
millennium BCE, based on language families (Sanskrit's links with Avestan, Greek, Latin), the Boghazkoi inscription
and recent genetic studies. A minority argues for an indigenous origin, identifying the Vedic and Harappan cultures.
"Aryan" is a linguistic and cultural term in the Vedas, not a racial one.</p></div>` },
  ],

  historians: `
<p><b>Max Müller</b> dated the Rig Veda to c. 1200 BCE; <b>B.G. Tilak</b> argued for an Arctic home and much earlier
dates. <b>R.S. Sharma</b> (<i>Looking for the Aryans</i>; <i>Material Culture and Social Formations</i>) used the Vedas to
trace the change from pastoral tribes to agrarian states. <b>Romila Thapar</b> (<i>From Lineage to State</i>)
analysed later Vedic society as a "lineage society" moving towards kingship.</p>`,

  facts: [
    'Early iron (c. 1000 BCE) has been found at Atranjikhera (Etah, UP) with Painted Grey Ware.',
    'Among the Later Vedic ratnins, the bhagadugha collected taxes and the sangrahitri was the treasurer.',
    'The Rig Veda has 1,028 hymns in 10 mandalas.',
    'The Purusha Sukta (10th mandala) first mentions the four varnas.',
    'The Gayatri Mantra is in the 3rd mandala, addressed to Savitr.',
    '"Satyameva Jayate" comes from the Mundaka Upanishad.',
    'The Battle of Ten Kings was won by Sudas on the Parushni (Ravi).',
    'Indra has the most hymns in the Rig Veda; Agni the second most.',
    'Varuna upheld rita (cosmic order).',
    'Sabha and samiti were Rig Vedic assemblies.',
    'Iron is called shyama ayas (black metal) in later Vedic texts.',
    'Painted Grey Ware is associated with the later Vedic period.',
    'The Boghazkoi inscription (c. 1400 BCE) mentions Vedic gods.',
    'Vedas are shruti; epics, Puranas and smritis are smriti.',
    'There are six Vedangas.',
  ],

  traps: [
    'Purusha Sukta (varnas) is in the 10th mandala; Gayatri in the 3rd.',
    'Parushni = Ravi; Asikni = Chenab; Vitasta = Jhelum; Shutudri = Sutlej; Vipasha = Beas.',
    'Satyameva Jayate — Mundaka Upanishad, not the Rig Veda.',
    'Women attended sabha and vidatha in the early Vedic period, not the later.',
  ],

  pyqs: {
    verified: [
      { exam: 'RAS Pre', year: '2021', marks: null, q: 'Match: Vrihi, Mudga, Yava, Ikshu. — <b>Answer (RPSC final key):</b> Vrihi – rice; Mudga – mung; Yava – barley (जौ; printed "millet" in the English version); Ikshu – sugarcane' },
    ],
    note: 'No verified RAS Mains question on this unit yet. RAS Pre questions come from the history sections of the 2021, 2023 and 2024 papers, paraphrased, with answers as per the RPSC final answer keys (2018 not used: its key was not available).',
  },

  mains: [
    {
      q: 'Compare the polity and society of the early and later Vedic periods.', marks: 10, words: 100,
      outline: ['Region and economy', 'Polity', 'Society', 'Religion', 'Conclusion'],
      answer: '<p>The early Vedic people lived in Sapta Sindhu as pastoral tribes; later Vedic people moved into the Ganga–Yamuna doab and, with iron, took to settled agriculture. Early rajans were tribal chiefs checked by sabha and samiti; later kings ruled territories, performed Rajasuya and Ashvamedha, and assemblies declined. Early varna was fluid and women joined assemblies and composed hymns; later the four varnas hardened, Shudras were subordinated and women\'s status fell. Simple nature worship gave way to priest-dominated sacrifice, challenged by the Upanishads. The shift prepared the ground for the Mahajanapadas.</p>',
    },
    {
      q: 'What is the significance of the Upanishads?', marks: 5, words: 50,
      outline: ['What they are', 'Ideas', 'Influence'],
      answer: '<p>The Upanishads, the last part of the Vedas, turned from ritual to knowledge. They teach that Atman (self) and Brahman (ultimate reality) are one, and discuss karma, rebirth and moksha. They influenced Buddhism, Jainism and Vedanta, and gave India "Satyameva Jayate".</p>',
    },
    {
      q: 'What was the Dasharajna?', marks: 2, words: 15,
      outline: ['Meaning'],
      answer: '<p>Rig Vedic Battle of Ten Kings on the Parushni (Ravi), won by Sudas of the Bharatas.</p>',
    },
  ],

  revision: [
    'Texts: 4 Vedas → Brahmanas → Aranyakas → Upanishads; 6 Vedangas; shruti vs smriti.',
    'Rig Veda: 1,028 hymns, 10 mandalas; Purusha Sukta (10th), Gayatri (3rd).',
    'Early: Sapta Sindhu, cattle, rajan + sabha/samiti, fluid varna, Indra/Agni/Varuna.',
    'Later: doab, iron, agriculture, kingdoms, rituals, rigid varna, Upanishads.',
    'Dasharajna: Sudas, Parushni.',
  ],

  selfTest: [
    { q: 'How many hymns does the Rig Veda have?', a: '1,028.' },
    { q: 'Which hymn first mentions the four varnas?', a: 'The Purusha Sukta (Rig Veda, 10th mandala).' },
    { q: 'Which Upanishad gives "Satyameva Jayate"?', a: 'The Mundaka Upanishad.' },
    { q: 'What is the modern name of the Parushni?', a: 'Ravi.' },
    { q: 'Who won the Battle of Ten Kings?', a: 'Sudas of the Bharata tribe.' },
    { q: 'Which god has the most hymns in the Rig Veda?', a: 'Indra.' },
    { q: 'Name two Rig Vedic assemblies.', a: 'Sabha and samiti (also vidatha, gana).' },
    { q: 'What was "shyama ayas"?', a: 'Iron ("black metal") in later Vedic texts.' },
  ],

  glossary: [
    ['श्रुति', 'Shruti', '"Heard" — the Vedas.'],
    ['स्मृति', 'Smriti', '"Remembered" — later texts.'],
    ['सभा / समिति', 'Sabha / Samiti', 'Vedic assemblies.'],
    ['ऋत', 'Rita', 'Cosmic and moral order.'],
    ['गविष्टि', 'Gavishti', '"Search for cows" — war.'],
    ['जन / जनपद', 'Jana / Janapada', 'Tribe / territory of a tribe.'],
    ['आश्रम', 'Ashrama', 'Stage of life.'],
  ],

  sources: [
    'R.S. Sharma, <i>India\'s Ancient Past</i>, chs. 10–12.',
    'Upinder Singh, <i>A History of Ancient and Early Medieval India</i>, ch. 5.',
    'Romila Thapar, <i>From Lineage to State</i>.',
    'NCERT (old), R.S. Sharma, <i>Ancient India</i>.',
  ],
};
