---
name: meeting-to-action
description: >-
  Use this skill when the user provides meeting notes, transcripts, or discussion points
  to extract key decisions, open questions, and owner-assigned action items with deadlines.
---

# Meeting Synthesizer & Action Tracker

This skill transforms unstructured meeting notes, conversation transcripts, or discussion logs into clean, executive-ready meeting minutes and accountability trackers.

## Procedure

### 1. Context & Overview
Identify and format:
- **Meeting Title / Topic**: Clear title reflecting the objective.
- **Date & Attendees**: Date, participants, and absentees (if available).
- **Core Purpose**: 1–2 sentences summarizing the main focus of the discussion.

### 2. Key Decisions Made
List explicit agreements and decisions reached during the meeting:
- State the decision clearly.
- Note the rationale or context behind it.
- Mark any superseded decisions or changes from previous policy.

### 3. Action Items & Accountability Tracker
Present every task in a structured markdown table:

| # | Action Item / Deliverable | Owner | Deadline | Priority | Dependencies / Notes |
|---|---------------------------|-------|----------|----------|----------------------|
| 1 | [Specific verb-first task] | [Name] | [Date/TBD] | High/Med/Low | [Prerequisite or blocker] |

*Rules for Action Items:*
- Every action item **must** start with an active verb (e.g., "Draft", "Send", "Coordinate", "Review").
- Assign a specific owner if mentioned; if unassigned, mark as `[Unassigned - Needs Owner]`.
- Provide specific due dates or time horizons rather than vague statements.

### 4. Discussion Highlights by Topic
Summarize the main points discussed under clear topical headings. Keep paragraphs punchy with bullet points highlighting pros, cons, and opinions expressed.

### 5. Open Questions & Parking Lot
Capture unresolved issues or topics postponed for future meetings:
- Questions requiring further data or external stakeholder input.
- "Parking Lot" items deferred to prevent derailment.
- Recommended follow-up date or next scheduled sync.
