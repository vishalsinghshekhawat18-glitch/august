module.exports = {
  id: 'R14',
  title: 'Administrative and Revenue System of Medieval Rajasthan',
  period: 'c. 1500 – 1818 CE',

  syllabus: {
    prelims: ['Administrative and revenue system of the Rajput states', 'Jagirdari system; terms of land revenue'],
    mains: ['GS-I Part A: Major dynasties, their administrative and revenue system'],
    weight: 'Tier A. Asked every recent year: RAS Mains 2024 (revenue system, 10 marks; "Hath ka Kurab", 2 marks) and 2023 ("Dyodhidar", 2 marks). Learn the technical terms precisely.',
  },

  bigPicture: `
<p>Medieval Rajput states were run on two principles:</p>
<ol>
<li><b>The clan as brotherhood.</b> The ruler was the head of a clan; his kinsmen shared the land as
<b>jagirdars</b> (also called samants or thakurs) in return for military service. This is the <b>jagirdari</b> (or
samanti) system.</li>
<li><b>Mughal-style administration.</b> From the late 16th century, Rajput rulers serving the Mughals copied Mughal
offices (diwan, bakhshi), revenue methods (measurement, cash rates) and record-keeping, and used Mughal backing to
make their nobles more dependent on them.</li>
</ol>
<p>Land revenue — the state's share of the crop — was the main income, collected by sharing the crop, estimating
it, or fixing cash rates, plus many extra cesses.</p>
<div class="box why"><p>Mains questions here test vocabulary: rekh, chakri, khalsa, bhom, sasan, batai, kankut,
lag-baag, tazim, hath ka kurab, dyodhidar. Every term in the fact bank is a possible 2-mark question.</p></div>`,

  timeline: [
    ['Before c. 1570', 'Clan-based "brotherhood" polity; land shared among kinsmen'],
    ['1570s onwards', 'Rajput rulers enter Mughal service; Mughal offices and methods adopted'],
    ['17th century', 'Muhnot Nainsi compiles Marwar ra Pargana ri Vigat (revenue and village data)'],
    ['18th century', 'Ijara (revenue farming) spreads; heavier cesses; Maratha tribute'],
    ['1818 onwards', 'British paramountcy; rulers reduce nobles\' powers further (R15)'],
  ],

  sections: [
    { title: 'How a Rajput state worked: from brotherhood to state', html: `
<p>To understand the terms in this unit, start with the idea behind them. A Rajput state grew out of a <b>clan</b>.
When a Rathore, Kachhwaha or Guhil chief conquered a region, he shared it with his brothers, sons and cousins, who
settled in villages and forts across it. They saw themselves less as his servants than as his <b>bhai-bandh</b>
(brothers), co-owners of the land their ancestors had won. The chief was the head of the family, first among equals,
and his kinsmen owed him loyalty and armed support in war.</p>
<div class="box concept"><p><b>The clan "brotherhood" and its limits.</b> In this early system, a kinsman's land was
almost his by right: the ruler could not easily take it back, and a noble who felt slighted could leave and serve
another ruler, or rebel. Succession disputes drew in the nobles, who often decided which prince became ruler. This
made the state strong in war, since every noble had a stake in defending the land, but weak in peace, since the ruler
depended on his nobles' goodwill. The central story of Rajput administration from the 16th century is the ruler's
effort to turn these brothers into <b>servants</b>, whose land was a grant from him for service and could be
withdrawn.</p></div>
<div class="box concept"><p><b>The Mughal effect.</b> When Rajput rulers entered Mughal service from the 1570s, they
became <b>mansabdars</b>, and the emperor recognised their home states as <b>watan jagirs</b>, hereditary lands that
would not be transferred. This gave the ruler a powerful new backer: the emperor recognised his succession, and Mughal
rank and pay made him richer than any of his nobles. Rulers then copied the Mughal system at home. They appointed a
<b>diwan</b> and <b>bakhshi</b>, measured land and fixed cash rates, kept detailed revenue records, and assessed each
noble's jagir at a recorded income (<b>rekh</b>) that fixed the service (<b>chakri</b>) he owed. Jagirs became grants
that the ruler could transfer, resume or confiscate. The terms in the next sections, from rekh to tagir, are the tools
of this centralisation.</p></div>
<div class="box debate"><p><b>Was it "feudal"?</b> James Tod, writing in the 1820s, compared Rajput states to medieval
European feudalism: land held from a lord in return for military service, ranked nobles, succession fees and court
honours. The likeness is real, and it is why the word stuck. Later historians point to three differences. First, the
bond was one of <b>kinship</b>, not a contract between strangers: most great jagirdars were the ruler's own clan.
Second, from the 17th century the ruler could <b>transfer and resume</b> jagirs, which European lords could rarely do
to their vassals. Third, the system was shaped by the <b>Mughal mansab</b>, a salaried imperial service rather than a
feudal one. A balanced answer says the system had feudal features but was a clan-based polity moving, under Mughal
influence, towards a centralised state.</p></div>` },

    { title: 'The ruler and central administration', html: `
<p>The ruler was the source of all authority, but in theory he ruled as the servant of the clan deity — in Mewar the
Rana called himself the <i>diwan</i> of <b>Eklingji</b>.</p>
<div class="tbl"><table>
<tr><th>Office</th><th>Function</th></tr>
<tr><td><b>Pradhan</b> (Mewar: also Musahib)</td><td>Chief minister; usually a leading noble</td></tr>
<tr><td><b>Diwan</b></td><td>Finance and revenue; often the most powerful official after Mughal contact</td></tr>
<tr><td><b>Bakhshi</b></td><td>Army: recruitment, pay, muster of jagirdars' contingents</td></tr>
<tr><td>Khansama</td><td>Royal household and stores</td></tr>
<tr><td><b>Dyodhidar</b></td><td>Officer in charge of the <i>dyodhi</i> (palace gateway): controlled access to the ruler and the inner palace, and managed palace security and household business</td></tr>
<tr><td>Kotwal</td><td>Police and order in the capital</td></tr>
<tr><td>Hakim</td><td>Head of a pargana (district): revenue, justice and order</td></tr>
<tr><td>Faujdar</td><td>Military officer of a region</td></tr>
<tr><td>Kanungo, Patwari, Chaudhari, Patel</td><td>Revenue records and village-level collection</td></tr>
</table></div>
<p>Units: state → <b>pargana</b> (under a hakim) → <b>village</b> (patel, patwari, and a village panchayat for local
disputes).</p>
<p>Many of these offices came from the Mughal model, and their spread shows the ruler's growing control. The
<b>diwan</b>, often from a literate service caste rather than from the ruling clan, owed his position to the ruler
alone, and so was a counterweight to the great nobles. The <b>dyodhidar</b> (RAS Mains 2023) mattered because access to
the ruler was itself a form of power: whoever controlled the gateway controlled who could petition, plead or plot.</p>` },

    { title: 'The jagirdari system', html: `
<p><b>Land categories:</b></p>
<div class="tbl"><table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td><b>Khalsa</b></td><td>Crown land, administered directly by the ruler's officials</td></tr>
<tr><td><b>Jagir</b> (patta)</td><td>Land assigned to a noble in return for service</td></tr>
<tr><td><b>Bhom</b></td><td>Hereditary land held by <b>bhomias</b> in return for local duties such as guarding villages and roads; hard to take back</td></tr>
<tr><td><b>Sasan</b> / Muafi</td><td>Revenue-free grants to Brahmins, Charans and religious persons; grants to temples were called <b>doli</b></td></tr>
</table></div>
<p><b>Obligations of a jagirdar:</b></p>
<ul>
<li><b>Rekh</b>: the assessed annual income of a jagir, recorded by the state; dues were calculated on it.</li>
<li><b>Chakri</b>: military service — a set number of horsemen in proportion to the rekh.</li>
<li><b>Succession fee</b> on inheriting the jagir — called <b>talwar bandhai</b> (sword-tying) in Mewar and
<b>hukmnama</b> in Marwar; plus <i>nazrana</i> (gifts) on occasions.</li>
<li>Penalties: <b>kaid</b> (temporary resumption to khalsa) or <b>tagir</b> (confiscation).</li>
</ul>
<p><b>Ranks of nobles:</b></p>
<ul>
<li><b>Mewar:</b> the <b>Solah</b> (16 first-class nobles), the <b>Battis</b> (32 second-class), and the <b>Gol</b>
(lesser nobles).</li>
<li><b>Marwar:</b> <b>Rajvi</b> (the ruler's close kin, for three generations free of rekh and chakri), then the
sardars, <b>muddi</b> and <b>ganayat</b> nobles.</li>
<li><b>Jaipur:</b> the <b>Barah Kotri</b> — twelve branches of Kachhwaha nobles (traditionally organised by Prithviraj of
Amber).</li>
</ul>
<p><b>Court honours</b> marked a noble's rank:</p>
<ul>
<li><b>Tazim</b>: the ruler rose to receive the noble — single (<i>ikevadi</i>) or double (<i>dohri</i>) tazim.</li>
<li><b>Hath ka kurab</b> (Marwar): the noble touched the ruler's knee or garment, and the ruler placed his hand on the
noble's shoulder and drew it to his own chest — one of the highest honours.</li>
<li><b>Banh pasav</b>: the ruler taking the noble's arm — a lesser honour.</li>
</ul>
<div class="box concept"><p><b>Why honours mattered.</b> Honours such as tazim and hath ka kurab (RAS Mains 2024) may
look like ceremony, but they were a tool of rule. A ruler who could not yet take land from a powerful noble could still
rank him publicly: who stood where at court, whom the ruler rose to greet, whom he embraced. Because a noble's standing
among his clan and peers depended on these signs, the right to grant or withhold them gave the ruler leverage. Rank by
the ruler's favour slowly replaced rank by birth alone, the same shift the rekh and chakri system made in land.</p></div>` },

    { title: 'Land revenue: methods of assessment', html: `
<p>The state's share was usually <b>one-quarter to one-half</b> of the produce, depending on the crop, irrigation and
the cultivator's status.</p>
<div class="tbl"><table>
<tr><th>Method</th><th>How it worked</th></tr>
<tr><td><b>Batai</b> (crop-sharing)</td><td>The crop itself was divided: <b>khet batai</b> (standing crop divided in the field), <b>lank batai</b> (harvested sheaves divided before threshing), <b>raas batai</b> (grain heap divided after threshing)</td></tr>
<tr><td><b>Kankut</b></td><td>Officials estimated (<i>kut</i>) the yield of the standing crop (<i>kan</i>) and fixed the share in advance</td></tr>
<tr><td><b>Zabti</b></td><td>Fixed cash rate per bigha, by crop — mainly for cash crops (cotton, sugarcane, indigo, tobacco); adopted from Mughal practice</td></tr>
<tr><td><b>Mukata</b></td><td>A lump sum, in cash or kind, fixed for a field or a whole village</td></tr>
<tr><td><b>Ijara</b></td><td>Revenue farming: the right to collect revenue sold to the highest bidder; spread in the 18th century and led to oppression</td></tr>
</table></div>
<p><b>Land by irrigation:</b> <b>barani</b> (rain-fed), <b>chahi</b> (well-irrigated), <b>talabi</b> (tank-irrigated);
irrigated land paid more.</p>
<p><b>Cultivators:</b> in Marwar, <b>bapidar</b> peasants had hereditary occupancy rights; <b>gair-bapidar</b> peasants
were tenants-at-will who could be evicted.</p>
<div class="box concept"><p><b>Why so many methods?</b> Each method shared risk differently between the state and the
peasant. Under <b>batai</b> the state took a share of whatever grew, so in a bad year both lost; it suited rain-fed land
where harvests swung widely, but it needed officials at every field or threshing floor. <b>Kankut</b> saved that labour
by estimating the crop in advance, but estimates could be inflated. <b>Zabti</b> fixed a cash rate per bigha, which gave
the state a predictable income and suited valuable cash crops on irrigated land, but put the whole risk of a bad year on
the peasant. <b>Mukata</b> and <b>ijara</b> went further, handing a fixed sum to a village or a revenue farmer; the
ijaradar, who had paid in advance, squeezed peasants to recover his money. That is why the spread of ijara in the 18th
century, when rulers needed cash for Maratha tribute and wars, made the peasants' burden much heavier.</p></div>` },

    { title: 'Cesses, taxes and the burden on peasants', html: `
<p>On top of land revenue, the state and jagirdars collected numerous cesses called <b>lag-baag</b> (lag = cess, baag =
levy). Examples:</p>
<ul>
<li>House tax (<i>ghar ginti</i>) and plough tax (<i>hal</i>).</li>
<li>Levies on festivals, marriages and visits of the ruler or jagirdar.</li>
<li><b>Begar</b>: forced unpaid labour for the jagirdar or state.</li>
<li>Trade taxes: <b>rahdari</b> (transit duty on goods passing through), <b>mapa</b> (tax on goods sold in markets),
<b>dan</b> (customs).</li>
</ul>
<p>In jagir areas the jagirdar collected both revenue and cesses, often with little check. The multiplication of
lag-baag and begar in the 19th and early 20th centuries became the main grievance of the <b>peasant movements</b>
(Bijolia, Begun, Shekhawati — R17).</p>
<p><b>Sources:</b> Muhnot Nainsi's <i>Marwar ra Pargana ri Vigat</i>; <i>arhsatta</i> (crop and revenue registers);
<i>sanad parwana bahi</i> (Marwar orders); Jaipur's <i>arzdashts</i> and revenue records. These records, unusual in
their detail, are why historians such as Dilbagh Singh and B.L. Bhadani can reconstruct village life in Rajasthan more
fully than in many other regions.</p>
<p><b>What came after.</b> After the 1818 treaties, British protection let rulers and jagirdars raise demands without
fear of revolt, and cesses and begar multiplied. Rulers also used British support to reduce the nobles' powers further
(R15). The peasant movements of the 20th century (R17) were aimed at exactly the system described here, and after
integration the Rajasthan Land Reforms and Resumption of Jagirs Act (1952) and the Tenancy Act (1955) abolished it
(R23).</p>
<div class="box bridge"><p><b>How this unit connects.</b></p>
<ul>
<li><b>Mughal models:</b> mansab and jagir, zabt, the diwan and bakhshi (I23); the Rajputs and the Mughals (R13).</li>
<li><b>Dynasties:</b> Mewar (R07, R08), Marwar (R09), Amber–Jaipur (R11) and the other states (R10, R12).</li>
<li><b>Sources:</b> Nainsi's <i>Vigat</i> and <i>Khyat</i>, bahis and arhsattas (R01).</li>
<li><b>After:</b> British paramountcy and the nobles (R15); peasant movements against lag-baag and begar (R17);
changes in administration and revenue, and the end of jagirdari (R23).</li>
<li><b>India:</b> Sultanate iqta (I18) and Mughal revenue (I23) for comparison.</li>
</ul></div>` },
  ],

  historians: `
<p><b>G.D. Sharma</b> (<i>Rajput Polity</i>) traced the shift from a clan "brotherhood" to a more centralised state as
rulers, backed by Mughal recognition, gained control over succession and jagir assignments. <b>Dilbagh Singh</b>
(<i>The State, Landlords and Peasants: Rajasthan in the 18th Century</i>) used Jaipur revenue records to show village
structure, revenue rates and the spread of ijara. <b>B.L. Bhadani</b> (<i>Peasants, Artisans and Entrepreneurs</i>)
did the same for Marwar using Nainsi's <i>Vigat</i>.</p>
<p>Historians debate how "feudal" the system was. Tod called it feudal, comparing it to medieval Europe; later
historians point to differences — the clan bond, the ruler's right to transfer jagirs, and the influence of the Mughal
mansab system.</p>`,

  facts: [
    'Khalsa = crown land; jagir = land assigned for service.',
    'Bhom land was held hereditarily by bhomias for local guard duties.',
    'Sasan (muafi) = revenue-free grants to Brahmins and Charans; doli = grants to temples.',
    'Rekh was the assessed income of a jagir, on which dues were calculated.',
    'Chakri was the military service owed by a jagirdar.',
    'The succession fee was talwar bandhai in Mewar and hukmnama in Marwar.',
    'Kaid = temporary resumption of a jagir; tagir = confiscation.',
    'Mewar nobles: Solah (16), Battis (32) and Gol.',
    'Marwar: Rajvi nobles were close kin, free of rekh and chakri for three generations.',
    'Jaipur nobles were organised as the Barah Kotri.',
    'Tazim: the ruler rose to receive a noble (ikevadi or dohri).',
    'Hath ka kurab: the ruler placed his hand on a noble\'s shoulder and drew it to his own chest (Marwar).',
    'The Dyodhidar was in charge of the palace gateway and access to the ruler.',
    'Khet, lank and raas are the three types of batai.',
    'Kankut = estimation of the standing crop.',
    'Zabti = cash rate per bigha, mainly for cash crops.',
    'Ijara = revenue farming to the highest bidder.',
    'Barani = rain-fed; chahi = well-irrigated; talabi = tank-irrigated.',
    'Bapidar peasants had hereditary rights; gair-bapidar were tenants-at-will (Marwar).',
    'Lag-baag = cesses; begar = forced labour; rahdari = transit duty.',
    'Muhnot Nainsi wrote Marwar ra Pargana ri Vigat.',
  ],

  traps: [
    'Rekh is an assessment of income, not a tax rate; chakri is service, not money.',
    'Bhom (hereditary, for local service) ≠ jagir (resumable, for military service).',
    'Lank batai is before threshing; raas batai is after threshing.',
    'Kankut estimates the standing crop; batai divides the actual crop.',
    'Talwar bandhai (Mewar) and hukmnama (Marwar) are the same kind of succession fee.',
    'Hath ka kurab is an honour, not a tax.',
  ],

  pyqs: {
    verified: [
      { exam: 'RAS Mains', year: '2024', marks: 10, q: 'Describe the revenue system of medieval Rajasthan. <i>(paraphrased)</i>' },
      { exam: 'RAS Mains', year: '2024', marks: 2, q: 'What was meant by "Hath ka Kurab" in Marwar? <i>(paraphrased)</i>' },
      { exam: 'RAS Mains', year: '2023', marks: 2, q: 'Who were the Dyodhidars? <i>(paraphrased)</i>' },
    ],
    note: 'Listed by RajRAS; wording paraphrased. The history sections of the RAS Prelims 2021, 2023 and 2024 papers had no question on this unit (checked against RPSC final answer keys; 2018 not checked, key unavailable).',
  },

  mains: [
    {
      q: 'How did contact with the Mughals change administration in the Rajput states?', marks: 10, words: 100,
      outline: ['Before: clan brotherhood', 'Watan jagir and imperial backing', 'Mughal offices and records', 'Rekh–chakri and transferable jagirs', 'Limits'],
      answer: '<p>Before the Mughals, a Rajput state was a clan "brotherhood": kinsmen held land almost by right and often decided succession. Mughal service from the 1570s changed this. The emperor recognised the ruler&#39;s home state as a watan jagir and backed his succession, while imperial rank and pay made him richer than his nobles. Rulers copied Mughal institutions: the diwan and bakhshi, land measurement, zabti cash rates and detailed revenue records. Each jagir was assessed at a rekh that fixed the chakri owed, and jagirs became grants the ruler could transfer, resume (kaid) or confiscate (tagir). Yet clan loyalties survived, and when Mughal power declined in the 18th century, nobles again grew powerful. Mughal contact thus moved Rajput states towards centralisation without completing it.</p>',
    },
    {
      q: 'Describe the revenue system of medieval Rajasthan.', marks: 10, words: 100, pyq: 'RAS Mains 2024',
      outline: ['Land categories', 'State share', 'Methods: batai, kankut, zabti, mukata, ijara', 'Cesses', 'Assessment'],
      answer: '<p>Land was khalsa (crown), jagir (for service), bhom (hereditary) or sasan (revenue-free). The state took one-quarter to one-half of the produce. Methods included batai — khet, lank or raas — kankut (estimating the standing crop), zabti (cash rates per bigha for cash crops, from Mughal practice), mukata (fixed lump sums) and, in the 18th century, ijara (revenue farming). Irrigated land (chahi, talabi) paid more than barani. Patwaris, kanungos and hakims kept records. Numerous cesses (lag-baag) and begar added to the burden, later fuelling peasant movements.</p>',
    },
    {
      q: 'Explain the main features of the jagirdari system in Rajasthan.', marks: 5, words: 50,
      outline: ['Basis', 'Obligations', 'Ranks', 'Control'],
      answer: '<p>Jagirdars, mostly the ruler\'s kinsmen, held land for service. Their jagir\'s assessed income (rekh) fixed their military service (chakri) and dues; heirs paid a succession fee (talwar bandhai or hukmnama). Ranks such as Mewar\'s Solah and Battis, and honours such as tazim, marked status. Rulers could resume (kaid) or confiscate (tagir) jagirs.</p>',
    },
    {
      q: 'What was "Hath ka Kurab"?', marks: 2, words: 15, pyq: 'RAS Mains 2024',
      outline: ['Meaning'],
      answer: '<p>A high Marwar court honour: the ruler touched a noble\'s shoulder, then his own chest.</p>',
    },
    {
      q: 'Who were the Dyodhidars?', marks: 2, words: 15, pyq: 'RAS Mains 2023',
      outline: ['Meaning'],
      answer: '<p>Officers controlling the palace gateway (dyodhi), access to the ruler and palace security.</p>',
    },
  ],

  revision: [
    'Offices: pradhan, diwan, bakhshi, khansama, dyodhidar, kotwal; pargana — hakim; village — patel, patwari.',
    'Land: khalsa, jagir (patta), bhom, sasan/doli.',
    'Jagirdar: rekh (assessed income), chakri (service), talwar bandhai/hukmnama (succession), kaid/tagir.',
    'Ranks: Mewar Solah–Battis–Gol; Marwar Rajvi; Jaipur Barah Kotri.',
    'Honours: tazim (ikevadi, dohri), hath ka kurab, banh pasav.',
    'Revenue: ¼–½; batai (khet, lank, raas), kankut, zabti, mukata, ijara.',
    'Land: barani, chahi, talabi. Peasants: bapidar vs gair-bapidar.',
    'Cesses: lag-baag, begar, rahdari, mapa.',
  ],

  selfTest: [
    { q: 'What is khalsa land?', a: 'Crown land administered directly by the ruler\'s officials.' },
    { q: 'What was rekh?', a: 'The assessed annual income of a jagir, used to calculate dues and service.' },
    { q: 'What was talwar bandhai?', a: 'The succession fee paid in Mewar when an heir inherited a jagir.' },
    { q: 'Who were the Solah and Battis?', a: 'The 16 first-class and 32 second-class nobles of Mewar.' },
    { q: 'What was the Barah Kotri?', a: 'The twelve branches of Kachhwaha nobles of Jaipur.' },
    { q: 'Distinguish lank batai and raas batai.', a: 'Lank: sheaves divided before threshing. Raas: grain divided after threshing.' },
    { q: 'What was kankut?', a: 'Estimation of the yield of the standing crop to fix the state\'s share.' },
    { q: 'What was ijara?', a: 'Revenue farming: collection rights sold to the highest bidder.' },
    { q: 'Who were bapidar peasants?', a: 'Marwar peasants with hereditary occupancy rights.' },
    { q: 'What is lag-baag?', a: 'Cesses and levies collected in addition to land revenue.' },
    { q: 'What did a dyodhidar do?', a: 'Controlled the palace gateway and access to the ruler.' },
    { q: 'How did Mughal service change the Rajput ruler\'s position over his nobles?', a: 'Imperial recognition of succession, Mughal rank and wealth, and Mughal-style offices and records let him treat jagirs as grants he could transfer or resume.' },
    { q: 'Why did the spread of ijara increase the burden on peasants?', a: 'The revenue farmer paid in advance and squeezed peasants to recover his money and make a profit.' },
    { q: 'Why were court honours such as tazim politically important?', a: 'They let the ruler rank nobles by his favour, giving him leverage over powerful kinsmen.' },
  ],

  glossary: [
    ['खालसा', 'Khalsa', 'Crown land.'],
    ['जागीर / पट्टा', 'Jagir / Patta', 'Land assigned for service.'],
    ['भोम', 'Bhom', 'Hereditary land held for local service.'],
    ['सासण', 'Sasan', 'Revenue-free grant.'],
    ['रेख', 'Rekh', 'Assessed income of a jagir.'],
    ['चाकरी', 'Chakri', 'Military service.'],
    ['तलवार बंधाई', 'Talwar bandhai', 'Succession fee (Mewar).'],
    ['हुक्मनामा', 'Hukmnama', 'Succession fee (Marwar).'],
    ['ताजीम', 'Tazim', 'Honour of the ruler rising.'],
    ['हाथ का कुरब', 'Hath ka kurab', 'High honour of the ruler\'s touch.'],
    ['ड्योढ़ीदार', 'Dyodhidar', 'Keeper of the palace gateway.'],
    ['बटाई', 'Batai', 'Crop-sharing.'],
    ['कणकूत', 'Kankut', 'Estimate of standing crop.'],
    ['इजारा', 'Ijara', 'Revenue farming.'],
    ['लाग-बाग', 'Lag-baag', 'Cesses.'],
    ['बेगार', 'Begar', 'Forced labour.'],
  ],

  sources: [
    'G.D. Sharma, <i>Rajput Polity: A Study of Politics and Administration of the State of Marwar, 1638–1749</i>.',
    'Dilbagh Singh, <i>The State, Landlords and Peasants: Rajasthan in the 18th Century</i>.',
    'B.L. Bhadani, <i>Peasants, Artisans and Entrepreneurs: Economy of Marwar in the Seventeenth Century</i>.',
    'G.N. Sharma, <i>Social Life in Medieval Rajasthan</i>; <i>Rajasthan ka Itihas</i>.',
    'Rima Hooja, <i>A History of Rajasthan</i> — standard text for this rewrite.',
  ],
};
