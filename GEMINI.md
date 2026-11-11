# Project Instructions: August Exam Tracker

## Exam Status & Forms Synchronization
- The official 8-exam status tracker lives at `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html` (created in conversation `9efe60c3-7ad1-4772-8662-28affd96322e`).
- The web app hosts this file under the dedicated **"Exam Status"** navigation tab and serves it from `public/Exam_Status_Dashboard.html`.
- Whenever `Exam_Status_Dashboard.html` is updated in `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html` or in chat `9efe60c3-7ad1-4772-8662-28affd96322e`:
  - Run `node scripts/sync-exam-status.cjs` (or `npm run sync:exam-status`).
  - Deploy to GitHub Pages via `git add public/Exam_Status_Dashboard.html; git commit -m "sync: update Exam_Status_Dashboard.html"; git push origin main`.

## Opportunities Radar & Autonomous Scanning
- The Opportunities Radar continuously monitors and lists competitive exams, professional certifications, and career opportunities tailored for Vishal Singh Shekhawat (B.Tech Electrical Engineering + M.A. Economics VMOU Kota, DOB: 31-10-1996).
- Accessible in the web app under the dedicated **"Opportunities"** navigation tab on the left sidebar.
- Source data lives at `src/data/opportunities.json` and `public/opportunities.json`.
- Runs on a 24-hour autonomous schedule via Antigravity scheduler:
  - Run scan script: `node scripts/scan-opportunities.cjs` (or `npm run scan:opportunities`).
  - Deploy updates to GitHub Pages: `git add src/data/opportunities.json public/opportunities.json; git commit -m "sync: opportunities radar update"; git push origin main`.
