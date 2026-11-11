# Synchronize Exam Status Dashboard

Whenever `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html` is updated (e.g. from conversation `9efe60c3-7ad1-4772-8662-28affd96322e` or direct user edits):
1. Always run `node scripts/sync-exam-status.cjs` or ensure `c:\August\public\Exam_Status_Dashboard.html` matches `C:\Users\visha\Desktop\FORM\Exam_Status_Dashboard.html`.
2. Commit and deploy to GitHub Pages (`git add public/Exam_Status_Dashboard.html; git commit -m "sync: update Exam_Status_Dashboard.html"; git push origin main`) so that `https://vishalsinghshekhawat18-glitch.github.io/august/` immediately serves the latest exam dates, registration credentials, and syllabuses.
