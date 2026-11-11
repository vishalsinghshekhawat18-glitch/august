# Project Instructions: August Exam Tracker

## Exam Status & Forms Synchronization
- The official 8-exam status tracker lives at `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html` (created in conversation `9efe60c3-7ad1-4772-8662-28affd96322e`).
- The web app hosts this file under the dedicated **"Exam Status"** navigation tab and serves it from `public/Exam_Status_Dashboard.html`.
- Whenever `Exam_Status_Dashboard.html` is updated in `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html` or in chat `9efe60c3-7ad1-4772-8662-28affd96322e`:
  - Run `node scripts/sync-exam-status.cjs` (or `npm run sync:exam-status`).
  - Deploy to GitHub Pages via `git add public/Exam_Status_Dashboard.html; git commit -m "sync: update Exam_Status_Dashboard.html"; git push origin main`.
