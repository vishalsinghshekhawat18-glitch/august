---
name: data-insights-and-kpis
description: >-
  Use this skill when analyzing non-code business data, spreadsheets, survey results,
  financial metrics, or KPI reports to extract actionable insights, trends, and anomalies.
---

# Business Data Insights & KPI Reporting

This skill analyzes business figures, spreadsheets, survey feedback, and operational metrics without requiring code, delivering crisp executive insights and narrative summaries.

## Analysis Methodology

### 1. Descriptive Summary & Baselines
- **Volume & Totals**: Total counts, total revenue, aggregate throughput.
- **Central Tendency & Ranges**: Average, median, min/max values to understand typical performance vs. outliers.
- **Distribution**: Proportions across categories, regions, customer cohorts, or product lines.

### 2. Trend & Velocity Analysis
- **Period-over-Period Changes**: Month-over-Month (MoM) or Year-over-Year (YoY) delta percentages.
- **Trajectory**: Identifying accelerating growth, plateauing metrics, or sudden deceleration.
- **Seasonality & Cyclicality**: Distinguishing predictable periodic swings from structural shifts.

### 3. Outlier & Anomaly Detection
- Flag numbers that diverge significantly from historical baselines (e.g., unexpected spikes or drops).
- Investigate probable drivers: Was it a one-time event, data entry error, marketing campaign, or systemic issue?

### 4. Executive Narrative & "So What?" Translation
Every table or metric must answer the three fundamental questions:
1. **What happened?** (The objective observed numbers)
2. **Why did it happen?** (Root cause drivers, external factors, internal initiatives)
3. **What do we do about it?** (Operational decisions or strategic interventions required)

## Standard Deliverable Template

```markdown
# [Metric / Period] Performance Analysis

## Executive Summary
[3 bullet points summarizing the overarching headline, biggest win, and primary risk/challenge.]

## Key Performance Indicators
| Metric | Current Period | Prior Period | Delta (%) | Status (🟢/🟡/🔴) | Target / Benchmark |
|--------|----------------|--------------|-----------|------------------|--------------------|
| Revenue| $120,000       | $105,000     | +14.3%    | 🟢               | $115,000           |

## Top Insights & Drivers
- **[Key Trend 1]**: Explanation of what drove the shift and which segment contributed most.
- **[Key Trend 2]**: Secondary pattern or emerging customer behavior.

## Anomaly & Risk Watch
- [Identified vulnerability or underperforming segment requiring immediate attention]

## Recommended Next Steps
1. [Action 1: Operational adjustment based on this data]
2. [Action 2: Further investigation or resource reallocation]
```
