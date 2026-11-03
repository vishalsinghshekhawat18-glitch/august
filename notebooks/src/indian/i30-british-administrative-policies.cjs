module.exports = {
  id: 'I30',
  title: 'British Administrative Policies',
  period: '1772 – 1947',

  syllabus: {
    prelims: ['Land revenue settlements; civil services; judiciary; police; army; education policy; press laws; policy towards princely states'],
    mains: ['GS-I: British administrative structure; land revenue systems; education policy'],
    weight: 'Tier C. The three land revenue systems and education milestones (1813, 1835, 1854, 1882, 1904, 1917, 1944) are high-yield for both papers.',
  },

  bigPicture: `
<p>British rule rested on a set of institutions built between Warren Hastings and Curzon: a <b>land revenue</b>
system to extract the surplus, a <b>civil service</b> to run the state, a <b>judiciary</b> and codified law, a
<b>police</b> and an <b>army</b> to maintain order, and an <b>education</b> policy to train subordinate staff and spread
Western ideas. The guiding aims were revenue, order and the security of British rule — with liberal and utilitarian
ideas (Bentinck, Macaulay) and paternalism (after 1857) shaping the style.</p>
<div class="box why"><p>Questions ask you to compare land revenue systems and to trace education policy by milestone.</p></div>`,

  timeline: [
    ['1772', 'Warren Hastings: five-year farming of revenue; district collectors'],
    ['1793', 'Permanent Settlement (Cornwallis); Cornwallis Code'],
    ['1813', 'Charter Act: Rs 1 lakh for education'],
    ['1820', 'Ryotwari in Madras (Munro)'],
    ['1822', 'Mahalwari begins (Holt Mackenzie)'],
    ['1833', 'Mahalwari revised by R.M. Bird (Regulation IX)'],
    ['1835', 'Macaulay\'s Minute; English Education Act'],
    ['1854', 'Wood\'s Despatch'],
    ['1857', 'Universities of Calcutta, Bombay, Madras'],
    ['1860–62', 'IPC (1860), CrPC; Police Act (1861); High Courts (1862)'],
    ['1878', 'Vernacular Press Act'],
    ['1882', 'Hunter Commission'],
    ['1904', 'Indian Universities Act'],
    ['1917', 'Sadler Commission'],
    ['1937', 'Wardha scheme (Basic Education)'],
    ['1944', 'Sargent Plan'],
  ],

  sections: [
    { title: 'Land revenue systems', html: `
<div class="tbl"><table>
<tr><th></th><th>Permanent Settlement (Zamindari)</th><th>Ryotwari</th><th>Mahalwari</th></tr>
<tr><td>Year / by</td><td>1793, <b>Cornwallis</b> (John Shore)</td><td>1820, <b>Thomas Munro</b> (Alexander Read, Baramahal 1792)</td><td>1822, <b>Holt Mackenzie</b>; revised 1833 by <b>R.M. Bird</b> and James Thomason</td></tr>
<tr><td>Areas</td><td>Bengal, Bihar, Odisha, Varanasi, north Madras — about 19% of British India</td><td>Madras, Bombay, Assam, Coorg — about 51%</td><td>North-West Provinces, Punjab, Central Provinces — about 30%</td></tr>
<tr><td>Settled with</td><td>Zamindars as owners</td><td>Individual cultivators (ryots)</td><td>Village community / mahal (estate), jointly</td></tr>
<tr><td>Revenue</td><td>Fixed permanently: 10/11 to the state, 1/11 to the zamindar</td><td>Revised every 20–30 years; very high (45–55% initially)</td><td>Periodically revised; high (66% initially, reduced to 50%)</td></tr>
<tr><td>Features</td><td><b>Sunset law</b> — estates auctioned if revenue unpaid by sunset of due date</td><td>Direct relation between state and peasant</td><td>Village headmen (lambardars) collected</td></tr>
</table></div>
<p><b>Effects:</b> Permanent Settlement secured revenue and created a loyal landlord class, but the state lost future
increases, absentee landlordism and sub-infeudation (patnidari) grew, and peasants became tenants-at-will. Ryotwari
and Mahalwari made peasants owners on paper but high, rigid demands drove them to moneylenders, causing indebtedness and
land alienation. All three commercialised land.</p>
<p><b>Bengal after 1793 (NCERT Class XII):</b> the revenue was fixed high while prices were low in the 1790s, the zamindars' troops and courts were taken away, and many defaulted. At the <b>Burdwan auction of 1797</b> most buyers were the raja's own agents, and over 95% of the sale was fictitious: zamindars kept their estates through benami purchases, transfers to women of the family and endless re-bidding. In the villages, rich peasants called <b>jotedars</b> (also haoladars, gantidars or mandals) controlled land, trade and credit, worked land through sharecroppers (<b>adhiyars</b> or bargadars) and often withheld rent from the zamindars. The <b>Fifth Report</b> (1813) to Parliament, with petitions, collectors' reports and revenue tables, shaped later views of rural Bengal.</p>
<p><b>Why later settlements were not permanent:</b> rising prices after 1810 benefited only the Bengal zamindars, and officials influenced by Ricardo held that a landowner should keep only the "average rent", the state taxing the surplus. Ryotwari demands of the 1820s were so high that peasants fled; prices fell after 1832 and the famine of 1832–34 drove ryots into debt.</p>
<div class="box concept"><p><b>Why the British tried three systems.</b> Land revenue was the Company's main income, and
it needed it to be large, regular and easy to collect. In Bengal (1793) Cornwallis chose <b>zamindars</b> as owners,
hoping that fixed revenue would make them improving landlords like English gentry and give the Company a loyal class
and a secure income. When rising prices showed that a permanent demand meant giving up future gains, officials in
Madras and Bombay, influenced by Ricardo's theory of rent, settled directly with the <b>ryot</b> and revised the demand
periodically. In the north-west, where villages held land jointly, the <b>mahal</b> was the natural unit. The common
thread was the state's claim to the surplus; in every system the demand was high and rigid, and peasants fell into
debt.</p></div>
` },

    { title: 'Civil services, judiciary, police, army', html: `
<ul>
<li><b>Civil service:</b> <b>Cornwallis</b> — "father of the civil services" — separated commercial and administrative
functions, raised salaries, banned private trade; <b>Fort William College</b> (Wellesley, 1800); Haileybury College
(1806); open competition (1853); Satyendranath Tagore first Indian ICS (1863); maximum age lowered to 19 (1876, Lytton),
leading to protests; Statutory Civil Service (1879); Aitchison Commission (1886); Islington Commission (1912); Lee
Commission (1924); exam held simultaneously in India from 1922.</li>
<li><b>Judiciary:</b> Warren Hastings — district diwani and faujdari adalats (1772), with the Sadar Diwani and Sadar Nizamat Adalats at Calcutta as appeal courts; maulvis and pandits advised the European judges; eleven pandits compiled a digest of Hindu law (1775), translated by N.B. Halhed, and a digest of Muslim law followed (1778); Supreme Court (1774); <b>Cornwallis
Code (1793)</b> — separation of revenue and judicial functions; Bentinck abolished provincial circuit courts and used
Indian languages in lower courts; IPC (1860, drafted by Macaulay's Law Commission); <b>High Courts</b> (1862, Calcutta,
Bombay, Madras); Federal Court (1937). <b>Ilbert Bill</b> (1883) controversy over Indian judges trying Europeans.</li>
<li><b>Police:</b> Cornwallis — thanas under daroghas; superintendent of police post (Bentinck); <b>Police Act of 1861</b>;
Police Commission (Fraser, 1902, under Curzon) — CID set up.</li>
<li><b>Army:</b> after 1857 the European proportion raised; artillery kept British; "martial races" theory; "divide and
rule" in regiments (by caste, region); Peel Commission (1859); Indianisation slow.</li>
</ul>` },

    { title: 'Education policy', html: `
<div class="tbl"><table>
<tr><th>Milestone</th><th>Content</th></tr>
<tr><td>Calcutta Madrasa (1781, Warren Hastings); Asiatic Society (1784, William Jones); Sanskrit College, Benaras (1791, Jonathan Duncan)</td><td>Orientalist phase</td></tr>
<tr><td><b>Charter Act 1813</b></td><td>Rs 1 lakh annually for education</td></tr>
<tr><td>Orientalist–Anglicist controversy</td><td>Orientalists (H.T. Prinsep) vs Anglicists</td></tr>
<tr><td><b>Macaulay's Minute (1835)</b>; English Education Act (Bentinck)</td><td>English as medium; Western learning; <b>downward filtration theory</b> — educate the upper classes, who would educate the masses</td></tr>
<tr><td>Thomason (NWP, 1843–53)</td><td>Vernacular education in villages</td></tr>
<tr><td><b>Wood's Despatch (1854)</b> — "Magna Carta of English education in India"</td><td>Education departments in provinces; universities on the London model (1857); grants-in-aid; vernacular primary schools; teacher training; women's education; rejected downward filtration in principle</td></tr>
<tr><td><b>Hunter Commission (1882–83)</b></td><td>Primary education to local bodies (district and municipal boards); emphasis on primary and secondary education; women's education</td></tr>
<tr><td><b>Indian Universities Act (1904)</b>, Curzon</td><td>Raleigh Commission (1902); more government control of universities; seen as a move against nationalism</td></tr>
<tr><td>Government resolution 1913</td><td>Policy of removing illiteracy; but refused compulsory education (Gokhale's Bill of 1911 rejected)</td></tr>
<tr><td><b>Sadler Commission (1917–19)</b></td><td>Calcutta University; 12-year school course; Intermediate stage; Board of secondary education</td></tr>
<tr><td>Montford Reforms (1919)</td><td>Education transferred to provincial ministers</td></tr>
<tr><td>Hartog Committee (1929)</td><td>Warned of wastage and stagnation; consolidation of primary education</td></tr>
<tr><td><b>Wardha Scheme / Basic Education (1937)</b></td><td>Gandhi's Nai Talim: education through crafts in the mother tongue; Zakir Hussain Committee</td></tr>
<tr><td><b>Sargent Plan (1944)</b></td><td>Universal free compulsory education for ages 6–14 within 40 years</td></tr>
</table></div>
<ul>
<li><b>Orientalists:</b> William Jones, H.T. Colebrooke and N.B. Halhed studied Sanskrit and Persian texts; the Asiatic Society published <i>Asiatick Researches</i>. They held that India's civilisation had been great in the past and had declined. <b>Anglicists:</b> James Mill wanted "useful" Western science; Macaulay called Oriental colleges "temples of darkness".</li>
<li><b>Missionaries:</b> the Company kept them out of its territory until 1813, so William Carey and others worked from Danish <b>Serampore</b> (press 1800, college 1818). After 1857 the government avoided direct support for missionary schools.</li>
<li><b>William Adam's reports</b> (1830s) on Bengal and Bihar found over 1 lakh <b>pathshalas</b> teaching over 20 lakh children: no fixed fees, printed books, buildings or timetable, and closed at harvest so peasant children could attend. After 1854 government pandits supervised four or five schools each and grants went only to pathshalas that accepted timetables, textbooks, examinations and fees — which pushed out poor children who worked at harvest.</li>
<li><b>Nationalist alternatives:</b> Gandhi held that colonial education bred inferiority and wanted teaching in Indian languages, joined to handwork; Tagore founded <b>Santiniketan</b> (1901) for creative learning in nature, adding science and arts; Aurobindo (Bombay speech, 1908) asked for national education in the vernacular, using modern science.</li>
</ul>` },

    { title: 'Press and policy towards princely states', html: `
<ul>
<li><b>Press laws:</b> Censorship Act (1799, Wellesley); Licensing Regulations (1823, John Adam); <b>Metcalfe</b> —
"liberator of the Indian press" (1835); Licensing Act (1857); Registration Act (1867); <b>Vernacular Press Act (1878,
Lytton)</b> — "gagging act", repealed by Ripon (1882); Newspapers (Incitement to Offences) Act (1908); Indian Press Act
(1910); Press Act of 1931 (during Civil Disobedience).</li>
<li><b>Print in India (NCERT Class X):</b> the first press came to <b>Goa</b> with Portuguese missionaries in the mid-16th century (Jesuits printed tracts in Konkani). From 1780 <b>James Augustus Hickey</b> edited the weekly <i>Bengal Gazette</i>, which printed gossip about Company officials. Reform debates moved into print: Rammohun Roy's <i>Sambad Kaumudi</i> (1821) was answered by the orthodox <i>Samachar Chandrika</i>; the ulama used cheap lithographic presses for Urdu and Persian religious texts. Tilak's writing in <i>Kesari</i> led to his imprisonment in 1908.</li>
<li><b>Princely states:</b> ring-fence (Warren Hastings) → subordinate isolation (Lord Hastings) → annexation (Dalhousie)
→ after 1858, <b>subordinate union</b> — no more annexation, adoption recognised, but intervention for "misrule";
Chamber of Princes (1921); Butler Committee (1927) — paramountcy supreme.</li>
</ul>` },
    { title: 'Reference: Governors-General and Viceroys, 1773–1947', html: `
<p>Prelims often asks "during whose tenure" an Act, war or reform took place. Only the main events are listed.</p>
<div class="tbl"><table>
<tr><th>Name</th><th>Tenure</th><th>Main events</th></tr>
<tr><th colspan="3">Governors-General of Bengal (Regulating Act, 1773)</th></tr>
<tr><td><b>Warren Hastings</b></td><td>1773–85</td><td>Regulating Act (1773); Rohilla War (1774); First Anglo-Maratha War — Treaty of Salbai (1782); Second Anglo-Mysore War; Pitt's India Act (1784); Asiatic Society (1784, William Jones)</td></tr>
<tr><td><b>Cornwallis</b></td><td>1786–93</td><td>Third Anglo-Mysore War — Treaty of Seringapatam (1792); Permanent Settlement (1793); Cornwallis Code; reorganised civil services and police</td></tr>
<tr><td><b>John Shore</b></td><td>1793–98</td><td>Charter Act (1793); policy of non-intervention; Battle of Kharda (1795, Marathas defeat the Nizam)</td></tr>
<tr><td><b>Wellesley</b></td><td>1798–1805</td><td>Subsidiary Alliance (1798); Fourth Anglo-Mysore War — Tipu killed (1799); Fort William College (1800); Treaty of Bassein (1802); Second Anglo-Maratha War</td></tr>
<tr><td><b>Minto I</b></td><td>1807–13</td><td>Treaty of Amritsar with Ranjit Singh (1809)</td></tr>
<tr><td><b>Lord Hastings (Moira)</b></td><td>1813–23</td><td>Anglo-Nepal War — Treaty of Sugauli (1816); Pindari campaign; Third Anglo-Maratha War — Peshwaship abolished (1818); treaties with the Rajput states (1817–18)</td></tr>
<tr><td><b>Amherst</b></td><td>1823–28</td><td>First Anglo-Burmese War — Treaty of Yandabo (1826); Barrackpore mutiny (1824)</td></tr>
<tr><td><b>William Bentinck</b></td><td>1828–35</td><td>Sati abolished (1829); thuggee suppressed (Sleeman); Mysore taken over (1831); became first Governor-General of India under the Charter Act (1833); English Education Act (1835, Macaulay)</td></tr>
<tr><th colspan="3">Governors-General of India (Charter Act, 1833)</th></tr>
<tr><td><b>Charles Metcalfe</b></td><td>1835–36</td><td>Press restrictions lifted — "liberator of the Indian press"</td></tr>
<tr><td><b>Auckland</b></td><td>1836–42</td><td>First Anglo-Afghan War (1839–42)</td></tr>
<tr><td><b>Ellenborough</b></td><td>1842–44</td><td>Sindh annexed (1843, Charles Napier); slavery abolished (Act V of 1843)</td></tr>
<tr><td><b>Hardinge I</b></td><td>1844–48</td><td>First Anglo-Sikh War — Treaty of Lahore (1846)</td></tr>
<tr><td><b>Dalhousie</b></td><td>1848–56</td><td>Doctrine of Lapse (Satara 1848, Jhansi and Nagpur 1854); Second Anglo-Sikh War — Punjab annexed (1849); Second Anglo-Burmese War (1852); first railway (1853), telegraph, Post Office Act (1854); Wood's Despatch (1854); Awadh annexed (1856)</td></tr>
<tr><td><b>Canning</b></td><td>1856–62</td><td>Hindu Widows' Remarriage Act (1856); universities at Calcutta, Bombay, Madras (1857); Revolt of 1857; Government of India Act (1858) — became the first Viceroy; Indian Penal Code (1860); Indian Councils Act and High Courts Act (1861)</td></tr>
<tr><th colspan="3">Viceroys (Government of India Act, 1858)</th></tr>
<tr><td><b>Elgin I</b></td><td>1862–63</td><td>Wahabi movement suppressed; died at Dharamshala</td></tr>
<tr><td><b>John Lawrence</b></td><td>1864–69</td><td>Anglo-Bhutan War (1865); Orissa famine (1866); "masterly inactivity" towards Afghanistan</td></tr>
<tr><td><b>Mayo</b></td><td>1869–72</td><td>Financial decentralisation (1870); first (non-synchronous) census (1872); Mayo College, Ajmer founded in his name; assassinated in the Andamans (1872)</td></tr>
<tr><td><b>Northbrook</b></td><td>1872–76</td><td>Deposition of the Gaekwad of Baroda (1875); visit of the Prince of Wales (1875–76)</td></tr>
<tr><td><b>Lytton</b></td><td>1876–80</td><td>Royal Titles Act (1876) and Delhi Durbar (1877) during the great famine; Vernacular Press Act and Arms Act (1878); ICS age cut to 19; Second Anglo-Afghan War (1878)</td></tr>
<tr><td><b>Ripon</b></td><td>1880–84</td><td>First synchronous census (1881); Factory Act (1881); Vernacular Press Act repealed (1882); local self-government resolution (1882); Hunter Education Commission (1882); Ilbert Bill (1883)</td></tr>
<tr><td><b>Dufferin</b></td><td>1884–88</td><td>Indian National Congress founded (1885); Third Anglo-Burmese War — Upper Burma annexed (1886)</td></tr>
<tr><td><b>Lansdowne</b></td><td>1888–94</td><td>Factory Act (1891); Age of Consent Act (1891); Indian Councils Act (1892); Durand Line (1893)</td></tr>
<tr><td><b>Elgin II</b></td><td>1894–99</td><td>Famine (1896–97) and plague; Chapekar brothers kill Rand (1897)</td></tr>
<tr><td><b>Curzon</b></td><td>1899–1905</td><td>NWFP created (1901); Police Commission (1902); Universities Act and Ancient Monuments Preservation Act (1904); Tibet expedition (1904); Partition of Bengal (1905)</td></tr>
<tr><td><b>Minto II</b></td><td>1905–10</td><td>Muslim League founded (1906); Surat split (1907); Morley–Minto Reforms (1909)</td></tr>
<tr><td><b>Hardinge II</b></td><td>1910–16</td><td>Delhi Durbar (1911) — partition annulled, capital moved to Delhi; bomb thrown at Hardinge (1912)</td></tr>
<tr><td><b>Chelmsford</b></td><td>1916–21</td><td>Lucknow Pact (1916); August Declaration (1917); Rowlatt Act and Jallianwala Bagh (1919); Government of India Act (1919); Non-Cooperation launched (1920)</td></tr>
<tr><td><b>Reading</b></td><td>1921–26</td><td>Moplah rebellion (1921); Chauri Chaura (1922); Rowlatt Act repealed (1922); Swaraj Party (1923); Kakori (1925)</td></tr>
<tr><td><b>Irwin</b></td><td>1926–31</td><td>Simon Commission (1927–28); Nehru Report (1928); Lahore session (1929); Dandi March (1930); First Round Table Conference; Gandhi–Irwin Pact (1931)</td></tr>
<tr><td><b>Willingdon</b></td><td>1931–36</td><td>Second and Third Round Table Conferences; Communal Award and Poona Pact (1932); Government of India Act (1935)</td></tr>
<tr><td><b>Linlithgow</b></td><td>1936–43</td><td>Provincial elections (1937); Second World War; August Offer (1940); Cripps Mission and Quit India (1942) — the longest-serving Viceroy</td></tr>
<tr><td><b>Wavell</b></td><td>1943–47</td><td>Shimla Conference (1945); INA trials and RIN mutiny (1946); Cabinet Mission and Interim Government (1946)</td></tr>
<tr><td><b>Mountbatten</b></td><td>Mar–Aug 1947</td><td>3 June Plan; Indian Independence Act; partition — last Viceroy and first Governor-General of independent India</td></tr>
</table></div>
<p>After independence: Mountbatten (1947–48), then <b>C. Rajagopalachari</b> (1948–50), the only Indian Governor-General.</p>` },

    { title: 'Colonial cities and hill stations', html: `
<ul>
<li><b>Three presidency cities:</b> Madras (1639), Calcutta (1690) and Bombay (given to the Company 1661 and leased 1668) grew at the expense of older towns, first as export depots, then as entry points for British goods. Railways (from 1853) made railway towns such as Jamalpur, Waltair and Bareilly.</li>
<li><b>Bombay:</b> the commercial capital, half of India's trade by 1900 (including Malwa opium to China); after the Suez Canal (1869) it called itself <i>Urbs Prima in Indis</i>; the one-room tenement, the <b>chawl</b>, was its typical housing.</li>
<li><b>After 1857:</b> "Civil Lines" were built as safe European enclaves; sanitary rules from the 1860s–70s sharpened the White Town/Black Town divide.</li>
<li><b>Hill stations:</b> Shimla was founded during the Gurkha War (1815–16) and became the summer seat of government in 1864 (John Lawrence); British interest in <b>Mount Abu</b> followed the Maratha war of 1818; Darjeeling was taken from Sikkim in 1835.</li>
</ul>
<div class="box bridge"><p><b>How this unit connects.</b></p>
<ul>
<li><b>Roots:</b> the Mughal zamindar and pargana records (I23); the Diwani of Bengal (I27).</li>
<li><b>Constitutional frame:</b> the Acts under which these institutions were built (I29).</li>
<li><b>Effects:</b> drain, deindustrialisation and commercialisation (I31); peasant and tribal revolts against
revenue demands and forest laws (I33, I34); the Revolt of 1857 (I32).</li>
<li><b>Ideas:</b> English education and the rise of reformers and early nationalists (I35, I36).</li>
<li><b>Rajasthan:</b> British policy in the Rajput states, Mayo College and Mount Abu (R15).</li>
</ul></div>
` },
  ],

  historians: `
<p><b>Ranajit Guha</b> (<i>A Rule of Property for Bengal</i>) traced the Physiocratic ideas behind the Permanent
Settlement. <b>Eric Stokes</b> (<i>The English Utilitarians and India</i>) showed the utilitarian influence on Bentinck,
Macaulay and the ryotwari. <b>Gauri Viswanathan</b> (<i>Masks of Conquest</i>) analysed English education as an
instrument of rule. <b>B.B. Misra</b> wrote on the bureaucracy.</p>`,

  facts: [
    "James Augustus Hickey's Bengal Gazette (1780) was the first newspaper in India.",
    "William Adam's reports of the 1830s counted over 1 lakh pathshalas in Bengal and Bihar.",
    "Tagore founded Santiniketan in 1901.",
    "Shimla became the official summer capital in 1864 under John Lawrence.",
    "Jotedars were rich peasants of Bengal who controlled land, trade and moneylending in the villages.",
    "The Fifth Report on the Company's administration was submitted to Parliament in 1813.",
    "N.B. Halhed translated the digest of Hindu law compiled by eleven pandits (1775).",
    "Edmund Burke led the impeachment of Warren Hastings, which lasted seven years.",
    'Amherst was Governor-General during the First Anglo-Burmese War (Treaty of Yandabo, 1826).',
    'Auckland was Governor-General during the First Anglo-Afghan War (1839–42); Ellenborough annexed Sindh (1843).',
    'Lansdowne was Viceroy when the Indian Councils Act (1892) was passed and the Durand Line drawn (1893).',
    'The Permanent Settlement was introduced by Cornwallis in 1793.',
    'Under the Permanent Settlement the zamindar kept 1/11 of the revenue.',
    'The sunset law applied under the Permanent Settlement.',
    'Thomas Munro introduced the ryotwari system in Madras in 1820.',
    'Holt Mackenzie devised the Mahalwari system in 1822.',
    'Cornwallis is called the father of the civil services in India.',
    'Satyendranath Tagore was the first Indian to join the ICS (1863).',
    'The Indian Penal Code was enacted in 1860.',
    'The High Courts of Calcutta, Bombay and Madras were set up in 1862.',
    'Macaulay\'s Minute on education was written in 1835.',
    'Wood\'s Despatch (1854) is called the Magna Carta of English education in India.',
    'The universities of Calcutta, Bombay and Madras were founded in 1857.',
    'The Hunter Commission was appointed in 1882.',
    'The Indian Universities Act was passed in 1904 under Curzon.',
    'The Sadler Commission (1917) examined Calcutta University.',
    'The Sargent Plan was presented in 1944.',
    'Lytton passed the Vernacular Press Act in 1878.',
    'Metcalfe is called the liberator of the Indian press.',
  ],

  traps: [
    "Sanskrit College, Benaras: Jonathan Duncan (1791), not William Jones; Fort William College: Richard Wellesley, not Arthur Wellesley.",
    'Permanent (Cornwallis 1793); Ryotwari (Munro 1820); Mahalwari (Mackenzie 1822, Bird 1833).',
    'Downward filtration: Macaulay; Wood\'s Despatch moved away from it.',
    'Vernacular Press Act: Lytton (1878), repealed by Ripon (1882).',
    'Hunter Commission: primary education; Sadler: university; Raleigh: university (1902).',
  ],

  pyqs: {
    verified: [
      { exam: 'UPSC Pre', year: '2020', marks: null, q: "Why did Wellesley establish Fort William College, Calcutta? — <b>Answer:</b> to train British civil servants for administration in India." },
      { exam: 'UPSC Pre', year: '2018', marks: null, q: "Wood's Despatch: (1) introduced grants-in-aid; (2) recommended universities; (3) recommended English as the medium at all levels. Which are true? — <b>Answer:</b> 1 and 2 only." },
      { exam: 'UPSC Pre', year: '2018', marks: null, q: "Which led to the introduction of English education: the Charter Act of 1813, the General Committee of Public Instruction, the Orientalist–Anglicist controversy? — <b>Answer:</b> all three." },
      { exam: 'UPSC Pre', year: '2018', marks: null, q: "Match: Sanskrit College, Benaras – William Jones; Calcutta Madrasa – Warren Hastings; Fort William College – Arthur Wellesley. Which are correct? — <b>Answer:</b> only the Calcutta Madrasa pair." },
    ],
    note: 'No verified RAS Mains question on this unit yet. The history sections of the RAS Prelims 2021, 2023 and 2024 papers had no question on this unit (checked against RPSC final answer keys; 2018 not checked, key unavailable).',
  },

  mains: [
    {
      q: 'Compare the Permanent Settlement, Ryotwari and Mahalwari systems.', marks: 10, words: 100,
      outline: ['Settled with', 'Revenue', 'Areas', 'Effects'],
      answer: '<p>The Permanent Settlement (Cornwallis, 1793) in Bengal and Bihar made zamindars owners and fixed revenue permanently, with the sunset law for defaulters. Ryotwari (Munro, 1820) in Madras and Bombay settled directly with cultivators, with revenue revised every 20–30 years. Mahalwari (Mackenzie, 1822; Bird, 1833) in the North-West Provinces and Punjab settled with village communities jointly. Zamindari secured fixed revenue and a loyal landlord class but caused absentee landlordism and sub-infeudation; ryotwari and mahalwari imposed high, rigid demands, pushing peasants into debt and land loss. All commercialised land.</p>',
    },
    {
      q: 'Why is Wood\'s Despatch called the Magna Carta of English education?', marks: 5, words: 50,
      outline: ['Provisions'],
      answer: '<p>Wood\'s Despatch (1854) created a comprehensive system: provincial education departments, universities at Calcutta, Bombay and Madras (1857), grants-in-aid, vernacular primary schools, teacher training and women\'s education — shaping Indian education for decades.</p>',
    },
    {
      q: 'What was the sunset law?', marks: 2, words: 15,
      outline: ['Answer'],
      answer: '<p>Zamindar\'s estate was auctioned if revenue was unpaid by sunset of due date.</p>',
    },
  ],

  revision: [
    'Land: Permanent 1793 (Cornwallis), Ryotwari 1820 (Munro), Mahalwari 1822/1833.',
    'Civil service: Cornwallis; Fort William College 1800; open competition 1853; Tagore 1863.',
    'Judiciary: Cornwallis Code 1793; IPC 1860; High Courts 1862; Ilbert Bill 1883.',
    'Education: 1813, 1835 (Macaulay), 1854 (Wood), 1882 (Hunter), 1904 (Universities), 1917 (Sadler), 1937 (Wardha), 1944 (Sargent).',
    'Press: Metcalfe 1835, VPA 1878, Press Act 1910.',
  ],

  selfTest: [
    { q: 'Who introduced the Permanent Settlement?', a: 'Lord Cornwallis (1793).' },
    { q: 'With whom was the ryotwari settlement made?', a: 'Individual cultivators.' },
    { q: 'Who revised the Mahalwari system in 1833?', a: 'R.M. Bird.' },
    { q: 'What was the downward filtration theory?', a: 'Educate the upper classes, who would educate the masses.' },
    { q: 'Which document is the Magna Carta of English education?', a: 'Wood\'s Despatch (1854).' },
    { q: 'Which commission handed primary education to local bodies?', a: 'Hunter Commission (1882).' },
    { q: 'Who passed the Vernacular Press Act?', a: 'Lord Lytton (1878).' },
    { q: 'Who was the first Indian ICS officer?', a: 'Satyendranath Tagore.' },
    { q: 'Why did Cornwallis make the revenue permanent?', a: 'To secure a fixed income and create a loyal, improving landlord class.' },
    { q: 'Why were ryotwari and mahalwari settlements not made permanent?', a: 'Rising prices showed a fixed demand lost future revenue; Ricardo\'s rent theory favoured periodic revision.' },
    { q: 'Why did Macaulay favour English education?', a: 'To create a class of Indians, English in taste and opinion, to serve the government and spread Western learning.' },
    { q: 'How did the 1854 grant rules hurt village pathshalas?', a: 'Fixed timetables, fees and exams pushed out poor children who worked at harvest.' },
  ],

  glossary: [
    ['स्थायी बंदोबस्त', 'Permanent Settlement', 'Zamindari system of 1793.'],
    ['रैयतवाड़ी', 'Ryotwari', 'Settlement with peasants.'],
    ['महालवाड़ी', 'Mahalwari', 'Settlement with village communities.'],
    ['अधोमुखी निस्यंदन', 'Downward filtration', 'Education via the elite.'],
    ['लंबरदार', 'Lambardar', 'Village headman collecting revenue.'],
  ],

  sources: [
    'Bipan Chandra, <i>History of Modern India</i>, chs. 7–8.',
    'Spectrum, <i>A Brief History of Modern India</i>.',
    'NCERT Class 8, <i>Our Pasts III</i>, chs. 3, 8. — standard text for this rewrite',
    'Ranajit Guha, <i>A Rule of Property for Bengal</i>.',
  ],
};
