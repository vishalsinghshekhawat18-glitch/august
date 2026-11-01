module.exports = {
  id: 'I50',
  title: 'Music, Dance and Theatre',
  period: 'Vedic age – 1943 CE',

  syllabus: {
    prelims: [
      'Origins: Samaveda, Bharata\'s Natyashastra; ragas and talas',
      'Medieval music: Amir Khusrau, Sangita Ratnakara, Tansen, the Bhakti composers; Hindustani and Carnatic traditions',
      'Classical dances recognised by the Sangeet Natak Akademi',
      'Theatre: Sanskrit drama, Koodiyattam, folk theatre, modern and political theatre',
    ],
    mains: ['GS-I Part B: Indian heritage — performing arts'],
    weight: 'No RAS Mains question on music or dance yet, but Prelims PI7 names medieval music directly, and IH1 is wide enough for a 5-mark question on Natyashastra, Hindustani vs Carnatic, or a classical dance. Rajasthan\'s folk dances, instruments and gharanas are in book 6.',
  },

  bigPicture: `
<p>India's performing arts start from ritual: the hymns of the <b>Samaveda</b> were sung, and <b>Bharata's
Natyashastra</b> (dated broadly between the 2nd century BCE and the 2nd century CE) treated drama, dance and music as
one art built on <b>rasa</b> (aesthetic emotion). In the medieval period temple and court patronage, the Bhakti
movement and Persian influence produced two classical systems: <b>Hindustani</b> in the north, shaped by Amir Khusrau
and Tansen, and <b>Carnatic</b> in the south, systematised by Purandara Dasa and later the Trinity. The Sangeet Natak
Akademi recognises eight classical dances. Theatre ran from Sanskrit drama through regional folk forms to the
political stage of the colonial era.</p>`,

  timeline: [
    ['c. 1000 BCE onwards', 'Samaveda: Rigvedic verses set to melody'],
    ['c. 2nd century BCE – 2nd century CE', 'Natyashastra attributed to Bharata'],
    ['13th century', 'Sangita Ratnakara by Sharngadeva (court of the Yadavas of Devagiri)'],
    ['1253–1325', 'Amir Khusrau, credited with qawwali and with developing the khayal tradition'],
    ['15th–16th century', 'Raja Man Singh Tomar of Gwalior patronises dhrupad'],
    ['16th century', 'Purandara Dasa systematises Carnatic teaching; Tansen at Akbar\'s court'],
    ['18th–19th century', 'Carnatic Trinity: Tyagaraja, Muthuswami Dikshitar, Syama Sastri'],
    ['1860', 'Nil Darpan by Dinabandhu Mitra (Bengali play on indigo planters)'],
    ['1876', 'Dramatic Performances Act to censor political plays'],
    ['1943', 'Indian People\'s Theatre Association (IPTA) founded'],
    ['1953', 'Sangeet Natak Akademi set up'],
  ],

  sections: [
    { title: 'Music', html: `
<div class="tbl"><table>
<tr><th>Feature</th><th>Hindustani</th><th>Carnatic</th></tr>
<tr><td>Region</td><td>North India</td><td>South India</td></tr>
<tr><td>Influences</td><td>Indian base with Persian and court influences</td><td>Largely indigenous, temple and devotional</td></tr>
<tr><td>Forms</td><td>Dhrupad, khayal, thumri, tappa, tarana</td><td>Kriti, varnam, kirtanam</td></tr>
<tr><td>Improvisation</td><td>Large scope; raga elaboration (alap)</td><td>Compositions central; improvisation within them</td></tr>
<tr><td>Key figures</td><td>Amir Khusrau, Swami Haridas, Tansen</td><td>Purandara Dasa, Tyagaraja, Dikshitar, Syama Sastri</td></tr>
</table></div>
<p>Instruments are classed in the Natyashastra as tata (stringed), sushira (wind), avanaddha (membrane) and ghana
(solid). <b>Amir Khusrau</b> is linked with qawwali, the sitar and tabla by tradition, though historians treat these
attributions with caution.</p>` },

    { title: 'Classical dance', html: `
<p>The Sangeet Natak Akademi recognises eight classical dances:</p>
<div class="tbl"><table>
<tr><th>Dance</th><th>State</th><th>Note</th></tr>
<tr><td>Bharatanatyam</td><td>Tamil Nadu</td><td>Revived by Rukmini Devi Arundale</td></tr>
<tr><td>Kathak</td><td>North India</td><td>Lucknow, Jaipur and Banaras gharanas</td></tr>
<tr><td>Kathakali</td><td>Kerala</td><td>Dance-drama with elaborate make-up; revived by Vallathol</td></tr>
<tr><td>Kuchipudi</td><td>Andhra Pradesh</td><td>Named after a village; tarangam on a brass plate</td></tr>
<tr><td>Odissi</td><td>Odisha</td><td>Tribhanga posture; links with the Konark sculptures</td></tr>
<tr><td>Manipuri</td><td>Manipur</td><td>Vaishnava ras lila themes</td></tr>
<tr><td>Mohiniyattam</td><td>Kerala</td><td>Graceful solo dance by women</td></tr>
<tr><td>Sattriya</td><td>Assam</td><td>From Sankardeva's sattras; recognised in 2000</td></tr>
</table></div>` },

    { title: 'Theatre', html: `
<ul>
<li><b>Sanskrit drama:</b> Bhasa, Kalidasa (Abhijnanashakuntalam), Shudraka (Mrichchhakatika), Vishakhadatta
(Mudrarakshasa); see I51 for the historical plays.</li>
<li><b>Koodiyattam</b> (Kerala): the surviving form of Sanskrit theatre; proclaimed by UNESCO in 2001 as a masterpiece
of intangible heritage.</li>
<li><b>Folk theatre:</b> Yakshagana (Karnataka), Jatra (Bengal), Nautanki (Uttar Pradesh), Tamasha (Maharashtra),
Bhavai (Gujarat); Rajasthan's Khyal and Gavari in book 6.</li>
<li><b>Colonial era:</b> Parsi theatre companies; <b>Nil Darpan</b> (1860) on indigo oppression; the
<b>Dramatic Performances Act (1876)</b>; the <b>IPTA</b> (1943) took theatre to political themes such as the Bengal
famine.</li>
</ul>` },
  ],

  historians: `
<p><b>Kapila Vatsyayan</b> (<i>Classical Indian Dance in Literature and the Arts</i>) links dance to sculpture and
texts. <b>Allyn Miner</b> and <b>Katherine Butler Brown</b> study Mughal music and question many traditional
attributions to Amir Khusrau. <b>Sunil Kothari</b> documents the classical dances.</p>`,

  facts: [
    'The Samaveda set Rigvedic verses to melody.',
    'The Natyashastra is attributed to Bharata.',
    'The Natyashastra classifies instruments into tata, sushira, avanaddha and ghana.',
    'Sangita Ratnakara was written by Sharngadeva in the 13th century.',
    'Purandara Dasa systematised the teaching of Carnatic music.',
    'The Carnatic Trinity are Tyagaraja, Muthuswami Dikshitar and Syama Sastri.',
    'Tansen was a musician at Akbar\'s court.',
    'Raja Man Singh Tomar of Gwalior patronised dhrupad.',
    'The Sangeet Natak Akademi recognises eight classical dances.',
    'Sattriya of Assam was recognised as a classical dance in 2000.',
    'Koodiyattam was proclaimed by UNESCO in 2001.',
    'Nil Darpan (1860) was written by Dinabandhu Mitra.',
    'The Dramatic Performances Act was passed in 1876.',
    'The Indian People\'s Theatre Association was founded in 1943.',
  ],

  traps: [
    'Sangita Ratnakara (Sharngadeva) ≠ Natyashastra (Bharata).',
    'Kathakali and Mohiniyattam are both from Kerala; Kuchipudi is from Andhra Pradesh.',
    'Sattriya comes from Sankardeva\'s monasteries in Assam, not Manipur.',
    'Nil Darpan is a play (Dinabandhu Mitra), not a newspaper.',
  ],

  pyqs: {
    verified: [],
    note: 'No RAS Mains question on music, dance or theatre in 2016–2024. The 2016 question on historical plays of Sanskrit literature is covered in I51.',
  },

  mains: [
    {
      q: 'Distinguish between Hindustani and Carnatic music.', marks: 5, words: 50,
      outline: ['Region and influence', 'Forms', 'Improvisation', 'Figures'],
      answer: '<p>Hindustani music developed in the north with Persian and court influence; its forms include dhrupad, khayal and thumri, with wide improvisation (Tansen, Amir Khusrau). Carnatic music in the south is temple-based and centred on compositions such as kritis (Purandara Dasa, Tyagaraja).</p>',
    },
    {
      q: 'What is the significance of the Natyashastra?', marks: 5, words: 50,
      outline: ['Author and date', 'Content', 'Rasa', 'Legacy'],
      answer: '<p>Attributed to Bharata, it is the oldest Indian treatise on drama, dance and music. It explains stagecraft, gestures, instruments and the theory of rasa, and remains the base of classical dance and aesthetic theory.</p>',
    },
    {
      q: 'What is Koodiyattam?', marks: 2, words: 15,
      outline: ['Answer'],
      answer: '<p>Kerala\'s surviving form of Sanskrit theatre, proclaimed by UNESCO in 2001.</p>',
    },
  ],

  revision: [
    'Samaveda → Natyashastra (Bharata; rasa; four instrument classes) → Sangita Ratnakara (Sharngadeva, 13th century).',
    'Hindustani: Khusrau, Man Singh Tomar (dhrupad), Haridas, Tansen. Carnatic: Purandara Dasa, Trinity.',
    'Eight SNA classical dances; Sattriya 2000.',
    'Theatre: Sanskrit drama, Koodiyattam (UNESCO 2001), folk forms, Nil Darpan 1860, Act 1876, IPTA 1943.',
  ],

  selfTest: [
    { q: 'Which Veda is the source of Indian music?', a: 'The Samaveda.' },
    { q: 'Who wrote the Sangita Ratnakara?', a: 'Sharngadeva (13th century).' },
    { q: 'Name the four classes of instruments in the Natyashastra.', a: 'Tata, sushira, avanaddha, ghana.' },
    { q: 'Who are the Carnatic Trinity?', a: 'Tyagaraja, Muthuswami Dikshitar and Syama Sastri.' },
    { q: 'Which Gwalior ruler patronised dhrupad?', a: 'Raja Man Singh Tomar.' },
    { q: 'How many classical dances does the Sangeet Natak Akademi recognise?', a: 'Eight.' },
    { q: 'Which classical dance comes from Assam?', a: 'Sattriya.' },
    { q: 'Who wrote Nil Darpan?', a: 'Dinabandhu Mitra (1860).' },
    { q: 'When was the IPTA founded?', a: '1943.' },
  ],

  glossary: [
    ['रस', 'Rasa', 'Aesthetic emotion evoked in the audience.'],
    ['राग', 'Raga', 'Melodic framework.'],
    ['ताल', 'Tala', 'Rhythmic cycle.'],
    ['घराना', 'Gharana', 'Lineage or school of musicians or dancers.'],
    ['लोक नाट्य', 'Folk theatre', 'Popular regional drama.'],
  ],

  sources: [
    'NCERT Class 11, <i>An Introduction to Indian Art, Part I</i>, and CCRT material on performing arts.',
    'Kapila Vatsyayan, <i>Classical Indian Dance in Literature and the Arts</i> (1968).',
    'Sangeet Natak Akademi, list of classical dances.',
    'UNESCO Intangible Cultural Heritage list (Kutiyattam).',
  ],
};
