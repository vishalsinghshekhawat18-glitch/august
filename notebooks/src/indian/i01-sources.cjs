module.exports = {
  id: 'I01',
  title: 'Sources and How Historians Work',
  period: 'All periods (focus: ancient India)',

  syllabus: {
    prelims: ['Sources of ancient Indian history: literary, archaeological, epigraphic, numismatic, foreign accounts'],
    mains: ['GS-I: Indian history — the basis for every ancient and medieval topic'],
    weight: 'Rarely a full Mains question by itself, but source facts (decipherment, first inscriptions, foreign travellers) are steady Prelims material and strengthen every answer.',
  },

  bigPicture: `
<p>History is built from <b>evidence</b>. For ancient India, written texts are few, late or religious, so historians
combine four kinds of sources: <b>literary</b> (religious and secular texts), <b>epigraphic</b> (inscriptions),
<b>numismatic</b> (coins) and <b>archaeological</b> (sites and objects), plus <b>accounts of foreign visitors</b>.</p>
<p>Each source has a bias: court poets praise their patrons, religious texts present ideals, foreign visitors
misunderstand. The historian's craft is to compare sources, date them and ask who wrote them and why.</p>
<div class="box why"><p>A good Mains answer cites evidence: "The Allahabad pillar inscription shows…" is stronger than a
bare claim. This unit gives you the vocabulary of evidence for the whole notebook.</p></div>`,

  timeline: [
    ['1784', 'Asiatic Society of Bengal founded by William Jones'],
    ['1837', 'James Prinsep deciphers Brahmi (Ashokan edicts)'],
    ['1861', 'Archaeological Survey of India; Alexander Cunningham first Director-General'],
    ['1902', 'John Marshall becomes Director-General of the ASI'],
    ['1915', 'Ashoka named "Devanampiya Ashoka" in the Maski edict'],
    ['1921–22', 'Harappa (Daya Ram Sahni) and Mohenjodaro (R.D. Banerji) excavated'],
  ],

  sections: [
    { title: 'Literary sources', html: `
<div class="tbl"><table>
<tr><th>Type</th><th>Examples</th><th>Value and limits</th></tr>
<tr><td>Vedic literature</td><td>Four Vedas, Brahmanas, Aranyakas, Upanishads</td><td>Main source for c. 1500–600 BCE; religious, little chronology</td></tr>
<tr><td>Epics and Puranas</td><td>Ramayana, Mahabharata; 18 Puranas</td><td>Dynastic lists (Puranas) useful but composed and revised over centuries</td></tr>
<tr><td>Buddhist texts</td><td>Tripitaka, Jatakas, Dipavamsa, Mahavamsa (Sri Lanka)</td><td>Social and economic life of the 6th c. BCE onwards</td></tr>
<tr><td>Jain texts</td><td>Agamas, Kalpasutra, Parishishtaparvan</td><td>Mahavira, Magadha, Chandragupta Maurya traditions</td></tr>
<tr><td>Dharmashastras</td><td>Manusmriti, Yajnavalkya Smriti</td><td>Norms of society and law — ideals, not always practice</td></tr>
<tr><td>Secular works</td><td>Arthashastra, Mudrarakshasa, Harshacharita (Banabhatta), Rajatarangini (Kalhana, 1148)</td><td>Kalhana's work is the closest to a critical history in ancient India</td></tr>
<tr><td>Sangam literature</td><td>Tamil poems (c. 3rd c. BCE – 3rd c. CE)</td><td>Society of the far south (I09)</td></tr>
</table></div>` },

    { title: 'Inscriptions and coins', html: `
<p><b>Epigraphy</b> (the study of inscriptions) gives dated, contemporary, official evidence.</p>
<ul>
<li>Scripts: <b>Brahmi</b> (written left to right; ancestor of most Indian scripts) and <b>Kharosthi</b> (right to left,
north-west). <b>James Prinsep</b> deciphered Brahmi in <b>1837</b>.</li>
<li><b>Milestones in epigraphy:</b> Colin Mackenzie collected over 8,000 inscriptions in the 1810s; Cunningham
published the Ashokan inscriptions (1877); <i>Epigraphia Carnatica</i> (1886) and <i>Epigraphia Indica</i> (1888)
began; D.C. Sircar wrote <i>Indian Epigraphy</i> (1965–66). Limits of inscriptions: faint or damaged letters, uncertain
meanings, and silence on everyday life.</li>
<li><b>Texts as sources:</b> the Critical Edition of the Mahabharata, led by V.S. Sukthankar at the Bhandarkar
Oriental Research Institute, Pune (1919–1966), compared manuscripts from all over India and showed both a common core
and wide regional variation. B.B. Lal's excavation at Hastinapura (1951–52) tried to match the Mahabharata with archaeology.</li>
<li>Earliest deciphered inscriptions: <b>Ashoka's edicts</b> (3rd c. BCE), mostly in Prakrit; also Greek and Aramaic in
the north-west.</li>
<li>Key inscriptions: Hathigumpha (Kharavela), Junagadh (Rudradaman, 150 CE — first long Sanskrit inscription), Allahabad
pillar (Samudragupta, by Harishena), Aihole (Pulakeshin II, by Ravikirti), Uttaramerur (Chola village assemblies).</li>
<li>Land grants on copper plates (from the Gupta period) show agrarian change and the rise of landed intermediaries.</li>
</ul>
<p><b>Numismatics</b> (the study of coins): punch-marked coins (silver, from c. 6th–5th c. BCE); Indo-Greek coins with
portraits and names; Kushan gold coins; Gupta gold coins (the dinara); the decline in coin finds after the Guptas is
used in the debate on early medieval "feudalism".</p>` },

    { title: 'Archaeology', html: `
<ul>
<li><b>Museums and heritage law:</b> Indian Museum, Calcutta (1814); Government Museum, Madras (1851); Cunningham's
<i>Bhilsa Topes</i> (1854) on Sanchi; Indian Treasure Trove Act (1878) let the government acquire antiquities found
in the ground; John Marshall's <i>Conservation Manual</i> (1923); foundation of the National Museum, New Delhi
(1955).</li>
<li>The <b>Archaeological Survey of India</b> was founded in <b>1861</b> under <b>Alexander Cunningham</b>, who identified
many Buddhist sites using Xuanzang's account.</li>
<li><b>John Marshall</b> (DG from 1902) directed the Harappan excavations; <b>Mortimer Wheeler</b> introduced stratigraphic
digging (1940s).</li>
<li>Dating methods: <b>stratigraphy</b> (layers), <b>radiocarbon (C-14)</b>, dendrochronology, thermoluminescence.</li>
<li>Archaeology is the only source for prehistory and the Harappan civilisation, whose script is undeciphered.</li>
</ul>` },

    { title: 'Foreign accounts', html: `
<div class="tbl"><table>
<tr><th>Visitor</th><th>Period</th><th>Work and value</th></tr>
<tr><td>Herodotus</td><td>5th c. BCE</td><td>Histories: north-west India under the Persians</td></tr>
<tr><td><b>Megasthenes</b></td><td>Chandragupta Maurya's court</td><td><i>Indica</i> (survives in quotations): Pataliputra, "seven castes"</td></tr>
<tr><td>Author of the <i>Periplus of the Erythraean Sea</i></td><td>1st c. CE</td><td>Ports and Indo-Roman trade</td></tr>
<tr><td>Ptolemy, Pliny</td><td>1st–2nd c. CE</td><td>Geography; Pliny complained of Roman gold drain to India</td></tr>
<tr><td><b>Faxian</b> (Fa-hien)</td><td>Chandragupta II (c. 399–414)</td><td>Buddhism, peaceful Gupta society; did not name the king</td></tr>
<tr><td><b>Xuanzang</b> (Hiuen Tsang)</td><td>Harsha (c. 630–645)</td><td><i>Si-yu-ki</i>; studied at Nalanda</td></tr>
<tr><td>Yijing (I-tsing)</td><td>Late 7th c.</td><td>Nalanda; Buddhist practice</td></tr>
<tr><td><b>Al-Biruni</b></td><td>With Mahmud of Ghazni</td><td><i>Kitab-ul-Hind</i> (c. 1030): Indian science, religion, society. Born in Khwarizm (973), taken to Ghazni as a hostage (1017), learnt Sanskrit; wrote in Arabic, 80 chapters. Named three barriers to understanding India: language, religious difference and local insularity. Relied on Brahmanical texts and accepted their account of caste, but rejected the idea of pollution as against nature</td></tr>
</table></div>
<div class="box debate"><p>Foreign accounts are valuable outsiders' views but often misread Indian society:
Megasthenes' "seven castes" mixes occupation with varna, and his claim that India had no slavery contradicts Indian
texts.</p></div>` },
  ],

  historians: `
<p>Colonial scholars (James Mill, V.A. Smith) saw ancient India as static and despotic; nationalist historians (R.C.
Majumdar, K.P. Jayaswal) stressed its glories; Marxist historians (D.D. Kosambi, R.S. Sharma, Romila Thapar) used
sources to study economy and society. <b>Kosambi</b> combined texts, archaeology and fieldwork. Today historians such
as <b>Upinder Singh</b> stress weighing all source types together.</p>`,

  facts: [
    'James Prinsep deciphered Brahmi in 1837.',
    'Kharosthi was written right to left; Brahmi left to right.',
    'The Asiatic Society of Bengal was founded by William Jones in 1784.',
    'The ASI was founded in 1861; Alexander Cunningham was its first Director-General.',
    'The Maski edict (found 1915) names Ashoka directly.',
    'Rudradaman\'s Junagadh inscription (150 CE) is the first long Sanskrit inscription.',
    'Harishena composed the Allahabad pillar inscription of Samudragupta.',
    'Ravikirti composed the Aihole inscription of Pulakeshin II.',
    'Kalhana wrote the Rajatarangini (1148) on Kashmir.',
    'Megasthenes wrote Indica at Chandragupta Maurya\'s court.',
    'Faxian visited during the reign of Chandragupta II.',
    'Xuanzang visited during Harsha\'s reign and studied at Nalanda.',
    'Al-Biruni wrote Kitab-ul-Hind.',
    "Al-Biruni's Kitab-ul-Hind, in Arabic, has 80 chapters.",
    'The Periplus of the Erythraean Sea describes 1st-century Indo-Roman trade.',
  ],

  traps: [
    'Prinsep deciphered Brahmi; the Harappan script is still undeciphered.',
    'NCERT Class 12 gives 1838 for Prinsep\'s decipherment of Brahmi; most references give 1837. If both appear in options, prefer 1837.',
    'Faxian (Gupta) ≠ Xuanzang (Harsha) ≠ Yijing (late 7th c.).',
    'Junagadh: Rudradaman (Sanskrit, 150 CE); also Skandagupta\'s inscription on the same rock.',
    'Megasthenes\' Indica survives only in quotations by later Greek writers.',
  ],

  pyqs: {
    verified: [
      { exam: 'UPSC Pre', year: '2023', marks: null, q: "With what were Alexander Rea, A.H. Longhurst, Robert Sewell, James Burgess and Walter Elliot associated? — <b>Answer:</b> archaeological excavations." },
    ],
    note: 'No verified RAS Mains question on this unit yet. The history sections of the RAS Prelims 2021, 2023 and 2024 papers had no question on this unit (checked against RPSC final answer keys; 2018 not checked, key unavailable).',
  },

  mains: [
    {
      q: 'Discuss the importance of inscriptions as a source of ancient Indian history.', marks: 5, words: 50,
      outline: ['Nature', 'Examples', 'Limits'],
      answer: '<p>Inscriptions are contemporary, often dated and official. Ashoka\'s edicts reveal his dhamma; the Allahabad pillar records Samudragupta\'s conquests; the Uttaramerur inscription details Chola village assemblies; land grants show agrarian change. Yet prashastis exaggerate, so they must be checked against coins, texts and archaeology.</p>',
    },
    {
      q: 'Who was James Prinsep?', marks: 2, words: 15,
      outline: ['Identity'],
      answer: '<p>Official of the Asiatic Society who deciphered Brahmi in 1837, unlocking Ashoka\'s edicts.</p>',
    },
  ],

  revision: [
    'Four source types + foreign accounts.',
    'Prinsep 1837 (Brahmi); Jones 1784 (Asiatic Society); ASI 1861 (Cunningham); Marshall 1902.',
    'Inscriptions: Ashoka, Hathigumpha, Junagadh 150 CE, Allahabad, Aihole, Uttaramerur.',
    'Coins: punch-marked → Indo-Greek → Kushan gold → Gupta dinara.',
    'Visitors: Megasthenes, Periplus, Faxian, Xuanzang, Yijing, Al-Biruni.',
  ],

  selfTest: [
    { q: 'Who deciphered Brahmi, and when?', a: 'James Prinsep, 1837.' },
    { q: 'Who was the first Director-General of the ASI?', a: 'Alexander Cunningham (1861).' },
    { q: 'Which is the first long inscription in Sanskrit?', a: 'Rudradaman\'s Junagadh inscription (150 CE).' },
    { q: 'Who composed the Allahabad pillar inscription?', a: 'Harishena.' },
    { q: 'In whose reign did Faxian visit India?', a: 'Chandragupta II.' },
    { q: 'What is Kitab-ul-Hind?', a: 'Al-Biruni\'s account of India (c. 1030).' },
    { q: 'Which edict names Ashoka directly?', a: 'Maski (also Gujarra and others).' },
    { q: 'Which ancient Indian text is closest to a critical history?', a: 'Kalhana\'s Rajatarangini.' },
  ],

  glossary: [
    ['अभिलेख', 'Abhilekh', 'Inscription.'],
    ['मुद्राशास्त्र', 'Numismatics', 'Study of coins.'],
    ['पुरालेखशास्त्र', 'Epigraphy', 'Study of inscriptions.'],
    ['प्रशस्ति', 'Prashasti', 'Eulogistic inscription.'],
    ['आहत सिक्के', 'Punch-marked coins', 'Earliest Indian coins.'],
    ['स्तरविन्यास', 'Stratigraphy', 'Study of layers at a site.'],
  ],

  sources: [
    'Upinder Singh, <i>A History of Ancient and Early Medieval India</i>, ch. 1.',
    'R.S. Sharma, <i>India\'s Ancient Past</i>, chs. 1–3.',
    'NCERT, <i>Themes in Indian History</i> Part I.',
  ],
};
