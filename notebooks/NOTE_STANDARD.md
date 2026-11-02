# Note standard for the RAS history notebooks

Approved on 2 Nov 2026 after the I50 pilot (commit 14d3d32). The notebooks are the student's only reading
source. They must teach a topic for understanding, not only list what to revise.

## Two layers in every unit

1. **Understand.** Explanatory prose written for the first reading. Each section follows the same path:
   context → cause → how it worked → change or consequence → significance. Use tables only for comparison,
   and bullets only for genuine lists.
2. **Revise.** Kept separate so revision stays fast: `facts`, `traps`, `revision`, `timeline` and `glossary`.

## Depth by exam weight

| Tier | Who | Understand layer |
|---|---|---|
| A | Units with repeated RAS Mains or Prelims questions | about 1,800–2,500 words |
| B | Units with some RAS questions, or a syllabus line likely to be asked | about 1,000–1,500 words |
| C | Units with no RAS question on record | about 500–800 words, plus bridges |

Weight comes from RAS questions linked in each unit's `pyqs.verified`. All RAS Mains history questions in
`pyq/mains/` must be linked to their units before tiers are final.

## Required pieces

- **Concept boxes** (`<div class="box concept">`) for each core idea, such as iqta, mansab, the Doctrine of Lapse,
  rasa or nagara. Each box says what the idea is, why it arose, how it worked (with an example) and what changed it.
- **A Connections box** (`<div class="box bridge">`) at the end of the last section: what came before, what
  follows, the related art, religion or economy units, and how Rajasthan fits in.
- **An exam box** (`<div class="box why">`) in the big picture that says how to read the unit.
- **Self-tests:** at least 8, with at least 3 asking "why", "how" or "connect".
- **Model answers** within 1.3 times the word limit, including at least one analytical answer for Tier A and B units.
- **Verification:** each rewritten unit is checked against one standard text (NCERT for Indian history; a
  standard Rajasthan text for Rajasthan) and names it in `sources`. Errors found become traps.

## Rules that still apply

- Only verifiable facts. RAS questions use the RPSC final answer key; UPSC questions use known-correct answers.
- No hype words (the build warns). Our own words, not copied text.
- Run `node build.cjs` after every unit, then `node export-october.cjs` before publishing.

## Tiers (2 Nov 2026, after linking all 58 Indian and Rajasthan history Mains questions)

Score = Mains marks + 2 per RAS Prelims question (Prelims data: 2021, 2023, 2024 only).

- **Tier A (score 14+), rewrite order:** I49, I48, R03, I06, I35, I20, R20, R17, I39, R21, I32, R14.
- **Tier B (score 8–13):** I31, I37, I38, R09, R19, I43, I51, R01, R02, I08, R15.
- **Tier C:** all other units. I50 was piloted at Tier B depth.

Rajasthan art, literature and religion questions (RH4–RH9) belong to book 6 and are not linked here.
