# TDC Website Revamp — Design Direction, Content & Layout Plan

Date: 2026-07-21 · Status: **Draft v2 — direction locked (Hybrid A+B), plan under discussion**

## 1. Goals & positioning

- Replace the current (down) site with a vibrant "gradient energy" redesign that still converts.
- Positioning: **Perth's creative & AI partner for small business** — local, friendly, personal.
- Voice: confident, warm, a little cheeky. Plain English, no agency jargon. Existing copy is reused and tightened, not rewritten from scratch.

## 2. Locked design decisions

| Decision | Choice |
|---|---|
| Direction | **Hybrid A+B**: Overprint shapes + oversized punctuation as the concept; soft gradient glows used sparingly as section backgrounds |
| Base look | Cream background + vibrant overlapping shapes |
| Palette | `#755095` `#A57ACC` `#BF94E3` `#FFDEBF` `#FFA61E` `#F97E14` + cerise `#E0369B`, teal `#14B8A6` accent |
| Typography | Baloo 2 (headlines) + Inter (body), Google Fonts |
| Icons | **Custom inline SVG** drawn in the motif language (overlapping circles/bubbles/punctuation). No emojis — they read poorly and screen readers announce them literally |
| Build | Fresh static HTML/CSS/vanilla JS, no framework, no build step |
| Hosting | Vercel (static deploy; redirects via `vercel.json`) |

## 3. CSS toolkit (from css-loaders.com family — Temani Afif)

- **Loaders** (css-loaders.com/flipping): perspective-flip square loaders recolored to the palette (one flips marigold→cerise out of the box). Use: contact-form submit state, lazy image placeholders. Always paired with visible text ("Sending…") and disabled under `prefers-reduced-motion`.
- **css-shape.com**: clip-path recipes for speech bubbles, blobs, arches — motif shapes in pure CSS instead of image assets.
- **css-pattern.com**: subtle single-color background patterns (dots/grids) for texture on cream sections if needed.
- **css-generators.com**: wavy/scalloped section-divider generators for the A↔B section transitions.

## 4. Accessibility — WCAG 2.2 AA (Australian standard)

Screen-reader support and AA conformance are build requirements, not a polish pass.
(Australia's standard references WCAG 2.x AA; WCAG 3 is still a draft — we build to 2.2 AA.)

**Measured contrast (on cream `#FFF8EF` unless noted):**

| Pair | Ratio | Use |
|---|---|---|
| Ink `#2A1E3F` on cream | 14.7 | Body text ✓ |
| Purple `#755095` on cream | 5.97 | Coloured text ✓ |
| Ink on marigold `#FFA61E` | 7.91 | **Primary button** ✓ |
| White on purple | 6.29 | Dark sections / alt button ✓ |
| Ink on peach / lilac / teal | 12.1 / 6.3 / 6.2 | Tinted cards ✓ |
| Cerise `#E0369B` on cream | 3.85 | Large headlines (≥24px bold) only |
| Orange / marigold / teal on cream | 2.5 / 1.9 / 2.4 | **Decorative graphics only — never text** |
| White on orange | 2.62 | **Banned** (no white-on-orange buttons) |

**Rules baked into the build:**
- Semantic landmarks (`header/nav/main/footer`), one `h1` per page, logical heading order, skip-to-content link.
- Buttons: ink-on-marigold primary, ink-outline secondary, white-on-purple on dark bands. 44×44px minimum touch targets.
- Gradient headline ink restricted to display sizes and the cerise→purple range (all stops ≥3:1); accent words otherwise flat purple.
- Decorative shapes/punctuation are `aria-hidden` presentational CSS/SVG; informative images get real alt text.
- Visible `:focus-visible` outline (2px ink, 2px offset) on everything interactive; `aria-current="page"` in nav.
- Forms: `<label>` per field, errors linked via `aria-describedby`, no placeholder-as-label.
- `prefers-reduced-motion`: kills loaders, flips, parallax, scroll animations.
- Blend-mode/glow layers sit behind text layers; text never renders on top of unpredictable blend regions without a solid/scrim base.

## 5. Sitemap

```
/               Home
/services       Services (3 pillars + process + pricing philosophy)
/work           Portfolio
/about          About Tim / TDC
/contact        Contact
/blog           Blog index
/blog/…         4 existing posts (restyled)
```

Redirects (`vercel.json` 301s): `/process.html → /services#process`, `/cyber-security.html → /services#security`, `/ai-tools.html → /services#ai`, plus `.html → clean-URL` equivalents.

## 6. Services — 4 flavoured sections

Each section has its own sub-theme (visual: `prototype/services-flavours.html`); every sub-palette borrows an anchor from the master system so the page stays one site. All pairings contrast-measured AA.

| # | Section | Services | Flavour |
|---|---|---|---|
| 1 | **Web, Brand & Marketing** | Custom Website Development · Strategic Brand Identity · Localized SEO · Managed Ad Campaigns | Master sunset system (cream/overprint) |
| 2 | **AI & Automation** (`#ai`) | AI Strategy & Navigation · Workflow Automation · AI Content Support · Smart Chatbots · Custom AI Agents · Data Insights | Bold light: white cards, 2px black keylines, hard offset shadows; blue `#2450F0` headings, yellow `#FFD21E` badges (ink text), green `#0B7A55` links, greys `#555C6B` |
| 3 | **Cyber Security** (`#security`) | Security Health Check · Ongoing Protection (from cyber-security.html) | Deep plum `#46204F` band, white + glass (8% white) cards, lilac `#D9B8EC` support text, marigold CTA |
| 4 | **Training & Coaching** (`#training`) | Training & Empowerment · Grow & Support Plan · Future-Proofing | Green/blue gradient mist, frosted 72%-white cards, deep green `#0B6B52` + blue `#1D5FA8` type, teal decorative |

**Pricing philosophy strip** (after section 4, back on cream): Project-Based Pricing · Transparent Process · Flexible Models.

Sub-theme contrast anchors (all measured): white on plum 13.3 · ink on yellow 13.4 · blue on white 6.0 · deep green on mist 5.9 · white on blue 6.0 · white on deep green 6.5.

## 7. Layout & structure plan

Lo-fi wireframes: `prototype/wireframes.html` (all pages, annotated).

### Global scaffolding
- **Grid**: 12-col, `max-width: 1160px`, 24px gutters. Breakpoints: 480 / 768 / 1024.
- **Header** (all pages): sticky, cream with blur; `tdc.` logo left; nav right (Services · Work · About · Blog) + marigold **Let's talk** pill. Mobile ≤768: hamburger → full-screen overlay menu (focus-trapped, Esc closes).
- **Pre-footer CTA band** (all pages except Contact): purple bg, white display headline, marigold button, bubble motif corners.
- **Footer**: 4 columns — brand + mini motif / Pages / Services / Contact + socials; legal row (privacy · terms · ABN). Stacks to accordion-free single column on mobile.

### Home
| # | Section | Layout |
|---|---|---|
| 1 | Hero | 2-col 7/5: left = H1 + sub + primary/secondary CTA; right = overlapping-shape composition with giant closing-quote punctuation, faint gradient glow behind. Stacks (text first) on mobile |
| 2 | Pillars | 4 cards (icon, H3, blurb, link), each carrying its section's flavour accent while staying on cream. 4-col → 2-col → 1-col |
| 3 | Featured work | Asymmetric 2-col grid, 3 projects (1 large + 2 stacked). "See all work →" |
| 4 | Process teaser | Horizontal 4-step strip, oversized Baloo numerals; wavy divider above/below. Stacks vertical |
| 5 | About teaser | 2-col 5/7: photo in blob clip-path frame; short bio + link |
| 6 | Blog teaser | 2 post cards + "All articles →" |
| 7 | CTA band + footer | Global |

### Services
Hero strip (H1 + intro, master system) → sticky in-page anchor subnav (Web & Brand · AI `#ai` · Cyber `#security` · Training `#training` · Process `#process` · Pricing) → the 4 flavoured sections per §6, each: flavour band with 2-col intro + service card grid, wavy divider hand-offs between flavours → Process: vertical numbered steps, back on cream (`#process`) → Pricing philosophy: 3 tinted cards → CTA band. Subnav link states pick up each section's anchor colour on scroll (`aria-current` + scroll-spy).

### Work
Intro strip → project grid: 2-col cards (screenshot, title, outcome one-liner, tag chips, external link) → CTA band. No filters at this scale.

### About
2-col hero (photo + intro) → story (prose, 68ch measure) → CV timeline: vertical line with dot markers (existing verified timeline) → "What drives us" values in 3 tinted cards → CTA band.

### Contact
2-col 7/5: form (name, email, budget select, message, marigold submit w/ flip-loader submit state) + aside (email, phone, socials, response-time note). Success/error announced via `role="status"`.

### Blog
Index: intro + 2-col post cards (title, date, 2-line excerpt, read time). Post template: 68ch measure, ink on cream, single accent pull-quote style using oversized quote punctuation.

## 8. Build sequence (after plan sign-off)

1. Homepage prototype in the hybrid system → review.
2. Extract design tokens to `styles.css`; roll out remaining pages.
3. Blog restyle + redirects + `vercel.json` + deploy.
4. QA: responsive, keyboard/screen-reader pass (VoiceOver), axe audit, Lighthouse (a11y ≥ 95), reduced-motion check.

## 9. Open questions

- Content plan flagged "needs discussion" — waiting on Tim's specific concerns.
- Domain/DNS details for Vercel at ship time.
