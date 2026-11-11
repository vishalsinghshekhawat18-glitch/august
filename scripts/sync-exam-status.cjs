const fs = require('fs');
const path = require('path');

const SOURCE_PATH = 'C:\\Users\\visha\\Desktop\\FORM\\Exam_Status_Dashboard.html';
const DEST_PATH = path.resolve(__dirname, '..', 'public', 'Exam_Status_Dashboard.html');

function sync() {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.log(`[sync-exam-status] Source file not found at ${SOURCE_PATH}, skipping copy.`);
    return;
  }

  try {
    const srcStat = fs.statSync(SOURCE_PATH);
    let destStat = null;
    if (fs.existsSync(DEST_PATH)) {
      destStat = fs.statSync(DEST_PATH);
    }

    if (!destStat || srcStat.mtimeMs > destStat.mtimeMs || srcStat.size !== destStat.size) {
      fs.copyFileSync(SOURCE_PATH, DEST_PATH);
      console.log(`[sync-exam-status] Successfully synced Exam_Status_Dashboard.html (${srcStat.size} bytes) from Desktop/FORM to public/`);
    } else {
      console.log(`[sync-exam-status] public/Exam_Status_Dashboard.html is already up to date.`);
    }
  } catch (err) {
    console.error(`[sync-exam-status] Error syncing:`, err);
  }
}

if (require.main === module) {
  sync();
  if (process.argv.includes('--watch')) {
    console.log(`[sync-exam-status] Watching ${SOURCE_PATH} for changes...`);
    fs.watchFile(SOURCE_PATH, { interval: 1000 }, (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs) {
        console.log(`[sync-exam-status] Change detected in ${SOURCE_PATH}, syncing...`);
        sync();
      }
    });
  }
}

module.exports = { sync, SOURCE_PATH, DEST_PATH };
