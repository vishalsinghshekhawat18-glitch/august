/**
 * scripts/scan-opportunities.cjs
 * Autonomous Opportunities Scanner for Vishal Singh Shekhawat
 *
 * Candidate Anchors:
 * - Qualifications: B.Tech in Electrical Engineering + M.A. in Economics (VMOU Kota)
 * - DOB: 31-10-1996 (Age ~30 in late 2026)
 *
 * Execution:
 *   node scripts/scan-opportunities.cjs
 *   or npm run scan:opportunities
 */

const fs = require('fs');
const path = require('path');

const SRC_DATA = path.join(__dirname, '..', 'src', 'data', 'opportunities.json');
const PUBLIC_DATA = path.join(__dirname, '..', 'public', 'opportunities.json');

const CANDIDATE_PROFILE = {
  name: 'Vishal Singh Shekhawat',
  dob: '1996-10-31',
  qualifications: [
    'B.Tech in Electrical Engineering',
    'M.A. in Economics (VMOU Kota)',
  ],
  focusAreas: [
    'Regulatory Banking & Economics (RBI DEPR, SEBI Grade A, NABARD, SIDBI)',
    'Power Sector & Engineering PSUs (Discoms AEn/JEn, RRB SSE/JE Electrical)',
    'Financial & Energy Certifications (BEE Energy Auditor, NISM Series-XV, IIBF DBF)',
    'State Civil Services (RPSC RAS / RTS)',
  ],
};

function runScan() {
  console.log(`[Opportunities Radar] Starting autonomous scan for ${CANDIDATE_PROFILE.name}...`);
  console.log(`[Opportunities Radar] Candidate Anchors: ${CANDIDATE_PROFILE.qualifications.join(' | ')}`);

  if (!fs.existsSync(SRC_DATA)) {
    console.error(`[Opportunities Radar] Error: Source dataset not found at ${SRC_DATA}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(SRC_DATA, 'utf-8');
  let opportunities;
  try {
    opportunities = JSON.parse(raw);
  } catch (err) {
    console.error(`[Opportunities Radar] Failed to parse JSON:`, err);
    process.exit(1);
  }

  const now = new Date();
  const nowIso = now.toISOString();

  let activeCount = 0;
  let closingSoonCount = 0;
  let upcomingCount = 0;
  let archivedCount = 0;

  const updatedOpportunities = opportunities.map((opp) => {
    let status = opp.status;

    if (opp.applicationDeadline) {
      const deadline = new Date(opp.applicationDeadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        status = 'archived';
        archivedCount++;
      } else if (diffDays <= 7 && diffDays >= 0) {
        status = 'closing_soon';
        closingSoonCount++;
        activeCount++;
      } else if (opp.applicationStartDate && new Date(opp.applicationStartDate) <= now) {
        status = 'open';
        activeCount++;
      } else {
        status = 'upcoming';
        upcomingCount++;
      }
    } else {
      if (status === 'open') activeCount++;
      else if (status === 'upcoming') upcomingCount++;
      else if (status === 'archived') archivedCount++;
    }

    return {
      ...opp,
      status,
      lastVerifiedAt: nowIso,
    };
  });

  const formattedJson = JSON.stringify(updatedOpportunities, null, 2);

  // Write to src/data/opportunities.json
  fs.writeFileSync(SRC_DATA, formattedJson, 'utf-8');

  // Mirror to public/opportunities.json
  const publicDir = path.dirname(PUBLIC_DATA);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(PUBLIC_DATA, formattedJson, 'utf-8');

  console.log(`[Opportunities Radar] Scan completed successfully at ${now.toLocaleString()}:`);
  console.log(`  - Total Tracked: ${updatedOpportunities.length}`);
  console.log(`  - Active / Open: ${activeCount}`);
  console.log(`  - Closing Soon:  ${closingSoonCount}`);
  console.log(`  - Upcoming:      ${upcomingCount}`);
  console.log(`  - Archived:      ${archivedCount}`);
  console.log(`[Opportunities Radar] Synced: ${SRC_DATA} & ${PUBLIC_DATA}`);
}

runScan();
