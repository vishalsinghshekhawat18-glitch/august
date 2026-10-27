---
name: typography-and-font-styling
description: >-
  Use this skill when choosing font pairings, setting up typographic hierarchies,
  styling rich typography for print or digital publications, coffee table books, and magazines.
---

# Rich Typography & Editorial Font Styling

This skill provides art direction, font curation, and typographic science to make books, magazines, and long-form publications visually commanding, elegant, and effortlessly readable.

## 1. Curated Editorial Font Pairing Palettes

Use these battle-tested pairings categorized by publication aesthetic (all available as free Google Fonts or system fonts, alongside classic foundry equivalents):

### Palette A: Editorial Luxury & High Fashion (Vogue / Harper's Bazaar style)
* **Aesthetic**: Dramatic contrast, razor-thin serifs, refined haute-couture elegance.
* **Display / Headline**: `Playfair Display` or `Bodoni Moda` (Classic: *Didot*, *Bodoni MT*)
* **Body / Reading**: `EB Garamond` or `Cormorant` at 10.5–11pt (Classic: *Adobe Garamond Pro*)
* **Accent / Kicker / Folio**: `Montserrat` (All Caps, letter-spacing +150–200)

### Palette B: Classic Literary & Literary Journalism (The New Yorker / Atlantic style)
* **Aesthetic**: Warm, intellectual, traditional, built for fatigue-free sustained reading.
* **Display / Headline**: `Cormorant Garamond` (Semi-bold or Medium Italic)
* **Body / Reading**: `Libre Baskerville` or `Lora` with 1.6 line-height (Classic: *Baskerville*, *Caslon*)
* **Accent / Byline**: `Source Sans 3` or `Newsreader Italic`

### Palette C: Provocative Tech & Modern Culture (Wired / Fast Company style)
* **Aesthetic**: Bold, kinetic, contemporary, unapologetic display weights.
* **Display / Headline**: `Syne` (Bold/ExtraBold) or `Space Grotesk`
* **Body / Reading**: `Inter` or `Plus Jakarta Sans` with clean geometric legibility
* **Accent / Data Callouts**: `JetBrains Mono` or `Space Mono` (Uppercase, track +120)

### Palette D: Warm Nordic & Independent Publishing (Kinfolk / Cereal style)
* **Aesthetic**: Spacious, tactile, serene, generous whitespace, understated luxury.
* **Display / Headline**: `Fraunces` (Soft serif with distinctive optical sizing)
* **Body / Reading**: `Newsreader` or `Literata`
* **Accent / Captions**: `Work Sans` or `DM Sans` (Light / Regular)

---

## 2. The 11-Tier Typographic Hierarchy Stack

Every magazine-style spread or chapter uses this strict hierarchy:

| Level | Element | Typographic Treatment | Relative Size Ratio |
|---|---|---|---|
| **1** | **Kicker / Eyebrow** | Uppercase Sans or Mono, Small size, Wide Tracking (+150 to +250) | 0.75× Body |
| **2** | **Display Headline (Hed)** | High-contrast Serif or Bold Grotesque, Tight Leading (1.0–1.1×) | 3.5× to 5.0× Body |
| **3** | **Standfirst / Subtitle (Dek)** | Elegant Italic Serif or Medium Sans, 2–3 sentences bridging to story | 1.3× to 1.5× Body |
| **4** | **Byline & Credit** | Subtle small caps or medium weight sans, with bullet or dash dividers | 0.85× Body |
| **5** | **Drop Capital** | Stylized 2-line or 3-line initial cap anchored to the baseline | 3.0× to 4.0× Body |
| **6** | **Lead-In Paragraph** | Slightly larger font size or small-caps first 4–6 words | 1.15× Body |
| **7** | **Body Text** | Proportional serif or readable grotesque, 1.5–1.65× leading | 1.0× (Baseline) |
| **8** | **Section Header (Sub-hed)** | Distinctive weight, extra margin-top (2.5×) to signal topic shift | 1.5× to 2.0× Body |
| **9** | **Pull Quote** | Oversized italic display serif, generous whitespace, hanging quote mark | 2.0× to 2.8× Body |
| **10** | **Stat / Big Number** | ExtraBold display numeral + compact 2-line small-text explanation | 4.0× to 6.0× Numeral |
| **11** | **Folio & Running Header** | Subtle muted sans or mono, page number bolded, tracked +100 | 0.7× Body |

---

## 3. The Golden Rules of Micro-Typography

1. **The Measure (Line Length)**:
   - Ideal body line length is **45 to 75 characters per line** (including spaces).
   - Lines shorter than 40 feel frantic; lines longer than 85 cause reading fatigue and eye-tracking errors.
2. **Leading (Line-Height)**:
   - For Display headlines: Tight leading (**100% to 110%** of font size). Never let display text float apart.
   - For Body text: Comfortable leading (**145% to 165%** of font size).
3. **Small Caps & Tracking**:
   - Never use "fake" artificial small caps (scaled down capitals). Use true OpenType small caps (`font-variant-caps: all-small-caps`).
   - Whenever using ALL CAPS or Small Caps, **always add letter-spacing (tracking)** of +10% to +20% (`letter-spacing: 0.12em`).
4. **Punctuation Polish**:
   - Replace dumb typewriter quotes (`" "`, `' '`) with curly smart quotes (`“ ”`, `‘ ’`).
   - Use em-dashes (`—`) without spaces or en-dashes (`–`) with thin spaces for parenthetical thoughts.
   - Use non-breaking spaces before units or between numbers (e.g., `\$50&nbsp;million`).

---

## 4. Quick CSS Styling Snippet for Instant Magazine Rendering

```css
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Montserrat:wght@400;600;700&display=swap');

:root {
  --font-display: 'Bodoni Moda', serif;
  --font-body: 'EB Garamond', Georgia, serif;
  --font-accent: 'Montserrat', sans-serif;
}

.kicker {
  font-family: var(--font-accent);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9933e;
  font-weight: 600;
}

.hed {
  font-family: var(--font-display);
  font-size: 3.5rem;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0.5rem 0 1rem;
}

.dek {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.35rem;
  line-height: 1.4;
  color: #4a4a4a;
  margin-bottom: 2rem;
}

.drop-cap::first-letter {
  font-family: var(--font-display);
  float: left;
  font-size: 4.2rem;
  line-height: 0.8;
  padding-top: 4px;
  padding-right: 10px;
  padding-bottom: 2px;
  color: #1a1a1a;
}
```
