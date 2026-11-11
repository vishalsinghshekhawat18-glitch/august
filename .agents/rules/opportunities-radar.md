# Autonomous Opportunities Radar Rule

## Objective & Candidate Profile
The Opportunities Radar is an autonomous intelligence system tailored strictly for **Vishal Singh Shekhawat**.
- **DOB**: 31-10-1996 (Age: ~30 in late 2026)
- **Primary Technical Degree**: B.Tech in Electrical Engineering
- **Postgraduate Economics Degree**: M.A. in Economics (VMOU Kota)

## Monitored Tracks & Eligibility Criteria
1. **Regulatory & Central Banking**:
   - **RBI Grade B (DEPR)**: Department of Economic and Policy Research (Master's in Economics).
   - **SEBI Grade A (Assistant Manager)**: Dual eligibility in General Stream (Master's in Economics) & Engineering Stream (B.Tech Electrical).
   - **NABARD Grade A**: Rural Development Banking (General / Economics / Engineering streams).
   - **SIDBI Grade A**: General & MSME financing development.
2. **Engineering PSUs & Power Discoms**:
   - **Rajasthan Power Sector (RVUNL / RVPNL / JVVNL)**: Assistant Engineer (AEn) & Junior Engineer (JEn) Electrical.
   - **Railway Recruitment Board (RRB)**: Senior Section Engineer (SSE) & Junior Engineer (JE) Electrical.
3. **Professional Certifications & Credentials**:
   - **Bureau of Energy Efficiency (BEE)**: Certified Energy Auditor (CEA) & Energy Manager (EM) under Energy Conservation Act.
   - **NISM (National Institute of Securities Markets)**: Series-XV: Research Analyst Certification for financial & equity markets.
   - **IIBF**: Diploma in Banking & Finance (DBF / JAIIB equivalent).
4. **Think Tanks & Fellowships**:
   - **NITI Aayog**: Young Professional (Economics / Infrastructure).

## Autonomous Schedule & Execution
- **Frequency**: Every 24 hours (`0 0 * * *`) or whenever an active internet session triggers a scan.
- **Scanning Script**: `npm run scan:opportunities` (or `node scripts/scan-opportunities.cjs`).
- **Data Persistence**:
  - `src/data/opportunities.json` (Source bundle for web app)
  - `public/opportunities.json` (Live public feed for client-side background polling)
  - IndexedDB store: `opportunities` (Offline-first client cache with saved/applied user states)
- **Deployment**:
  - Whenever new notifications or deadline changes occur:
    - Run `npm run scan:opportunities`
    - Commit and push to GitHub Pages: `git add src/data/opportunities.json public/opportunities.json; git commit -m "sync: opportunities radar update"; git push origin main`
