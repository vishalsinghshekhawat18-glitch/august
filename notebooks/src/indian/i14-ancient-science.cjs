module.exports = {
  id: 'I14',
  title: 'Science and Technology in Ancient India',
  period: 'c. 2600 BCE – 1200 CE',

  syllabus: {
    prelims: ['Mathematics, astronomy, medicine, metallurgy and technology in ancient India; scientists and their works'],
    mains: ['GS-I: Contribution of ancient India to science and technology'],
    weight: 'Scientist–work matching (Aryabhata, Brahmagupta, Bhaskara, Charaka, Sushruta, Nagarjuna) is a Prelims staple; a Mains question on ancient Indian science is common.',
  },

  bigPicture: `
<p>Ancient India made lasting contributions to science: the <b>decimal place-value system with zero</b>, which spread
through the Arab world to Europe; astronomy that calculated eclipses and the earth's rotation; <b>Ayurveda</b> with
systematic medicine and surgery; and metallurgy that produced rust-free iron and high-carbon steel.</p>
<p>Much of this knowledge was practical — tied to ritual (geometry of altars), the calendar, agriculture, crafts and
health — and was written in Sanskrit treatises (<i>shastras</i>) and passed through teacher lineages.</p>
<div class="box why"><p>Use concrete evidence (Bakhshali manuscript, Gwalior zero, iron pillar) rather than general
claims — examiners value precision over pride.</p></div>`,

  timeline: [
    ['c. 2600–1900 BCE', 'Harappan standard weights, measures, town planning'],
    ['c. 800–500 BCE', 'Sulbasutras: geometry for altars'],
    ['c. 4th c. BCE', 'Panini\'s Ashtadhyayi'],
    ['c. 1st–3rd c. CE', 'Charaka Samhita and Sushruta Samhita take shape'],
    ['499 CE', 'Aryabhatiya'],
    ['c. 505 CE', 'Varahamihira\'s Panchasiddhantika'],
    ['628 CE', 'Brahmagupta\'s Brahmasphutasiddhanta'],
    ['876 CE', 'Gwalior inscription: early dated zero in India'],
    ['1150 CE', 'Bhaskara II\'s Siddhanta Shiromani (Lilavati)'],
  ],

  sections: [
    { title: 'Mathematics', html: `
<ul>
<li><b>Sulbasutras</b> (Baudhayana, Apastamba, Katyayana): geometry for building fire altars; Baudhayana states the
relation known as Pythagoras' theorem; approximations of √2.</li>
<li><b>Pingala</b> (Chhandasutra): binary-like patterns in metres.</li>
<li><b>Decimal place-value system and zero</b>: the <b>Bakhshali manuscript</b> (dated variously, 3rd–7th c.) uses a dot
for zero; the <b>Gwalior inscription</b> (876 CE) has a written zero; Brahmagupta gave rules for zero and negative
numbers.</li>
<li><b>Aryabhata</b> (Aryabhatiya, 499): value of π ≈ 3.1416; sine tables; algebra.</li>
<li><b>Brahmagupta</b> (Brahmasphutasiddhanta, 628, at Bhinmal): rules for zero and negatives; quadratic equations; its
Arabic translation spread Indian numerals.</li>
<li><b>Bhaskara II</b> (Siddhanta Shiromani, 1150; parts Lilavati and Bijaganita): arithmetic, algebra, early ideas
of calculus.</li>
<li>Arab scholars called the numerals "Hindu numerals" (Al-Khwarizmi); Europe called them "Arabic numerals".</li>
</ul>` },

    { title: 'Astronomy', html: `
<ul>
<li><b>Vedanga Jyotisha</b> (Lagadha): earliest astronomical text, for the ritual calendar.</li>
<li><b>Aryabhata</b>: earth rotates on its axis; eclipses caused by shadows of earth and moon (not Rahu); length of the
year. India's first satellite (1975) was named after him.</li>
<li><b>Varahamihira</b>: <i>Panchasiddhantika</i> (summary of five astronomical systems including Greek-influenced
Romaka and Paulisha); <i>Brihatsamhita</i> (encyclopaedia: astronomy, weather, architecture, gems).</li>
<li><b>Brahmagupta</b> and <b>Bhaskara I</b> refined calculations; Bhaskara II discussed gravitation-like attraction.</li>
</ul>` },

    { title: 'Medicine (Ayurveda)', html: `
<div class="tbl"><table>
<tr><th>Scholar</th><th>Work</th><th>Contribution</th></tr>
<tr><td><b>Charaka</b></td><td><i>Charaka Samhita</i></td><td>Internal medicine (kayachikitsa); diagnosis, diet, three doshas (vata, pitta, kapha); physician's oath; court of Kanishka (tradition)</td></tr>
<tr><td><b>Sushruta</b></td><td><i>Sushruta Samhita</i></td><td>Surgery (shalya): over 100 instruments, plastic surgery (rhinoplasty), cataract surgery; dissection for anatomy — "father of surgery"</td></tr>
<tr><td>Vagbhata</td><td><i>Ashtanga Hridaya</i></td><td>Synthesis of Charaka and Sushruta</td></tr>
<tr><td>Jivaka</td><td>—</td><td>Physician of Bimbisara (trained at Taxila)</td></tr>
<tr><td>Madhava</td><td><i>Madhava Nidana</i></td><td>Diagnosis (pathology), c. 7th–8th c.</td></tr>
<tr><td>Palakapya</td><td><i>Hastyayurveda</i></td><td>Veterinary science (elephants)</td></tr>
</table></div>
<p>Ayurveda's eight branches (ashtanga) included medicine, surgery, paediatrics, toxicology and rejuvenation.</p>` },

    { title: 'Metallurgy, chemistry and technology', html: `
<ul>
<li><b>Harappan</b>: bronze casting by the lost-wax method; standard weights; Lothal dockyard.</li>
<li><b>Iron</b>: from c. 1000 BCE; the <b>Mehrauli iron pillar</b> (Gupta, about 7 m) shows rust resistance due to high
phosphorus and a protective film; iron beams at Konark and Puri (13th c.).</li>
<li><b>Wootz steel</b> (south India): high-carbon crucible steel exported to make "Damascus" swords.</li>
<li><b>Zinc</b> distillation at <b>Zawar</b> (Rajasthan) — among the earliest in the world (c. 9th c. CE onward for
large-scale production; mining much earlier).</li>
<li><b>Copper</b>: Sultanganj Buddha (Gupta, cast copper).</li>
<li><b>Chemistry</b>: Rasashastra (mercury, metals for medicine) associated with a later <b>Nagarjuna</b>
(<i>Rasaratnakara</i>); dyes, glass, cosmetics.</li>
<li><b>Linguistics</b>: <b>Panini</b>'s <i>Ashtadhyayi</i> — a formal grammar of Sanskrit with about 4,000 rules, admired
by modern linguists; Patanjali's <i>Mahabhashya</i>.</li>
<li><b>Architecture</b>: Vastu and Shilpa shastras; Mayamata, Manasara.</li>
</ul>` },
  ],

  historians: `
<p><b>Debiprasad Chattopadhyaya</b> (<i>Science and Society in Ancient India</i>) argued that empirical science
(Ayurveda) flourished but was later held back by caste prejudice against manual work and by religious orthodoxy.
<b>Kim Plofker</b> (<i>Mathematics in India</i>) gives a careful account of mathematical texts and their dating;
historians warn against inflated claims not supported by texts.</p>`,

  facts: [
    'Baudhayana\'s Sulbasutra states the Pythagorean relation.',
    'The Bakhshali manuscript uses a dot for zero.',
    'The Gwalior inscription (876 CE) has an early written zero.',
    'Aryabhata wrote the Aryabhatiya (499) and gave π ≈ 3.1416.',
    'Brahmagupta wrote the Brahmasphutasiddhanta (628) at Bhinmal.',
    'Bhaskara II wrote Siddhanta Shiromani; Lilavati is its arithmetic part.',
    'Varahamihira wrote Panchasiddhantika and Brihatsamhita.',
    'Lagadha wrote the Vedanga Jyotisha.',
    'Charaka Samhita deals with internal medicine; Sushruta Samhita with surgery.',
    'Sushruta described rhinoplasty and cataract surgery.',
    'Vagbhata wrote Ashtanga Hridaya.',
    'Palakapya wrote Hastyayurveda.',
    'Wootz steel was made in south India.',
    'Zinc was distilled at Zawar (Rajasthan).',
    'Panini wrote the Ashtadhyayi.',
  ],

  traps: [
    'Brahmagupta (628, Bhinmal) gave rules for zero; Aryabhata (499) used place value but not a zero symbol.',
    'Bhaskara I (7th c.) ≠ Bhaskara II (12th c., Lilavati).',
    'Charaka = medicine; Sushruta = surgery.',
    'Nagarjuna the Buddhist philosopher (Madhyamika) is often distinguished from the later alchemist Nagarjuna.',
  ],

  pyqs: {
    verified: [],
    note: 'No verified RAS Mains question on this unit yet. The history sections of the RAS Prelims 2021, 2023 and 2024 papers had no question on this unit (checked against RPSC final answer keys; 2018 not checked, key unavailable).',
  },

  mains: [
    {
      q: 'Discuss the contribution of ancient India to mathematics and astronomy.', marks: 10, words: 100,
      outline: ['Sulbasutras', 'Zero and place value', 'Aryabhata', 'Brahmagupta, Bhaskara', 'Spread'],
      answer: '<p>The Sulbasutras used advanced geometry, including the Pythagorean relation, for altars. The decimal place-value system with zero — seen in the Bakhshali manuscript and the Gwalior inscription — was India\'s greatest gift. Aryabhata (499) calculated π, explained eclipses and earth\'s rotation. Brahmagupta (628) gave rules for zero and negative numbers; Varahamihira compiled astronomical systems; Bhaskara II\'s Lilavati advanced arithmetic and algebra. Translated into Arabic, these ideas reached Europe as "Arabic numerals", shaping world science.</p>',
    },
    {
      q: 'Describe the contribution of Charaka and Sushruta to medicine.', marks: 5, words: 50,
      outline: ['Charaka', 'Sushruta'],
      answer: '<p>Charaka\'s Samhita systematised internal medicine — diagnosis, diet, the three doshas — and set ethical standards for physicians. Sushruta\'s Samhita founded surgery, describing over 100 instruments, rhinoplasty, cataract operations and dissection for anatomy. Together they laid the foundations of Ayurveda.</p>',
    },
    {
      q: 'What is wootz steel?', marks: 2, words: 15,
      outline: ['Answer'],
      answer: '<p>High-carbon crucible steel from south India, exported to make Damascus swords.</p>',
    },
  ],

  revision: [
    'Maths: Sulbasutras (Baudhayana); zero — Bakhshali, Gwalior 876; Aryabhata 499 (π); Brahmagupta 628; Bhaskara II 1150 (Lilavati).',
    'Astronomy: Vedanga Jyotisha (Lagadha); Aryabhata (rotation, eclipses); Varahamihira.',
    'Medicine: Charaka (medicine), Sushruta (surgery), Vagbhata, Madhava, Palakapya.',
    'Technology: lost-wax bronze, Mehrauli pillar, wootz, Zawar zinc; Panini.',
  ],

  selfTest: [
    { q: 'Which text states the Pythagorean relation in India?', a: 'Baudhayana\'s Sulbasutra.' },
    { q: 'Where is an early dated written zero found?', a: 'The Gwalior inscription (876 CE).' },
    { q: 'Who wrote the Aryabhatiya?', a: 'Aryabhata (499 CE).' },
    { q: 'Who wrote Lilavati?', a: 'Bhaskara II.' },
    { q: 'Who is called the father of surgery?', a: 'Sushruta.' },
    { q: 'Which text is a summary of five astronomical systems?', a: 'Varahamihira\'s Panchasiddhantika.' },
    { q: 'Where was zinc distilled in ancient India?', a: 'Zawar (Rajasthan).' },
    { q: 'Who wrote the Ashtadhyayi?', a: 'Panini.' },
  ],

  glossary: [
    ['शुल्बसूत्र', 'Sulbasutra', 'Geometry texts for altars.'],
    ['शून्य', 'Shunya', 'Zero.'],
    ['आयुर्वेद', 'Ayurveda', 'Science of life (medicine).'],
    ['शल्य चिकित्सा', 'Shalya chikitsa', 'Surgery.'],
    ['त्रिदोष', 'Tridosha', 'Vata, pitta, kapha.'],
    ['रसशास्त्र', 'Rasashastra', 'Alchemy / metallic medicine.'],
  ],

  sources: [
    'Kim Plofker, <i>Mathematics in India</i>.',
    'Debiprasad Chattopadhyaya, <i>Science and Society in Ancient India</i>.',
    'D.M. Bose et al., <i>A Concise History of Science in India</i>.',
    'Upinder Singh, <i>A History of Ancient and Early Medieval India</i>.',
  ],
};
