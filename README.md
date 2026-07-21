<div align="center">

# tdc<span>.</span> — The Daly Creative, v27

**Websites that work harder than your last one.**

![Status](https://img.shields.io/badge/status-live-46B450?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20vanilla%20JS-755095?style=for-the-badge)
![Build](https://img.shields.io/badge/build%20step-none%20%F0%9F%8E%89-FFA61E?style=for-the-badge)
![WCAG](https://img.shields.io/badge/WCAG%202.2-AA-E0369B?style=for-the-badge)
![Deployed on](https://img.shields.io/badge/deployed%20on-Vercel-0D0D12?style=for-the-badge&logo=vercel)

![Frameworks harmed](https://img.shields.io/badge/frameworks%20harmed%20in%20production-0-14B8A6)
![Dependencies](https://img.shields.io/badge/npm%20dependencies-0-F97E14)
![Coffee](https://img.shields.io/badge/powered%20by-Fremantle%20coffee-6B3178)

<img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" width="360" alt="Neon 'the internet' animation">

*The 2026 revamp of [The Daly Creative](https://tdc-website-v27.vercel.app) — web design, branding & AI strategy from Fremantle, WA.*

</div>

---

## 🌅 What is this?

Version 27 (twenty-six were character development) of the TDC website: a fully static,
zero-dependency site in a **"sunset overprint"** design system — overlapping multiply-blend
shapes, oversized punctuation, and a purple-to-orange palette sampled from an actual
Pinterest pin. It loads fast because there is genuinely nothing to load.

**Why no framework?** Because a brochure site with a build pipeline is like a toastie
with a supply chain. `git push` → live in ~30 seconds. That's the pipeline.

## 🗂 Structure

```
├── index.html            ← home
├── services.html         ← 4 flavoured worlds: Web/Brand · AI · Cyber · Training
├── work.html             ← portfolio + client logos
├── about.html            ← Tim's story, timeline, credentials
├── contact.html          ← form (formsubmit.co) + details
├── blog/                 ← index + 4 articles
├── 404.html              ← for pages gone walkabout
├── assets/
│   ├── css/styles.css    ← the whole design system, tokens first
│   ├── js/main.js        ← nav, scroll-spy, reveals (~90 lines, no deps)
│   └── img/              ← brand/ · people/ · portfolio/ · clients/
├── prototype/            ← style tiles, wireframes & flavour boards that shaped all this
├── archive/              ← the old site + unused source assets (excluded from deploys)
├── docs/                 ← design/content plan (excluded from deploys)
└── vercel.json           ← clean URLs + 301s from the old world
```

## 🎨 The design system, in one table

| Token | Hex | Job |
|---|---|---|
| Deep purple | `#755095` | Headlines' favourite colour |
| Lilac | `#BF94E3` | Soft shapes, cyber accents |
| Marigold | `#FFA61E` | Primary buttons (ink text — 7.9:1) |
| Orange | `#F97E14` | The full stop in `tdc.` — decorative only, it fails as text and knows it |
| Cerise | `#E0369B` | Large display text & shape overlaps |
| Plum | `#46204F` | Cyber security section, CTA bands |
| Cream | `#FFF8EF` | The stage everything stands on |

Headlines: **Baloo 2** · Body: **Inter** · Icons: hand-rolled overlapping-circle SVG/CSS
(emojis were considered and politely escorted from the building).

## ♿ Accessibility

WCAG 2.2 AA is a build requirement here, not a retrofit: semantic landmarks, one `h1`
per page, skip links, `:focus-visible` everywhere, 44px touch targets, `aria-current`
nav states, form errors wired via `aria-describedby`, decorative shapes `aria-hidden`,
and every colour pairing contrast-measured (receipts in [`docs/`](docs/superpowers/specs/2026-07-21-tdc-revamp-content-plan.md)).
Animations sit behind `prefers-reduced-motion` — the flip-loader simply doesn't exist
for people who didn't ask for it.

## 🛠 Develop

```bash
node prototype/serve.mjs   # → http://127.0.0.1:8642 (mirrors Vercel's clean URLs)
```

That's it. No install. If that command feels too heavy, please lie down.

## 🚀 Deploy

Push to `main`. Vercel does the rest (project: `thedalycreative/tdc-website-v27`).

> ⚠️ `robots.txt` currently blocks all crawlers — staging mode. Delete it (and this
> line) when the real domain points here.

## 📚 Resources & credits

- [css-loaders.com/flipping](https://css-loaders.com/flipping/) — the flip loader (recoloured), by Temani Afif
- [css-shape.com](https://css-shape.com/) / [css-pattern.com](https://css-pattern.com/) / [css-generators.com](https://css-generators.com/) — shape & divider techniques
- [Baloo 2](https://fonts.google.com/specimen/Baloo+2) & [Inter](https://fonts.google.com/specimen/Inter) — Google Fonts
- [formsubmit.co](https://formsubmit.co/) — contact form backend for the backend-less
- [Shields.io](https://shields.io/) — the badge wall above
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) — the accessibility receipts

---

<div align="center">

Made with strategy, sunsets and an irresponsible number of overlapping circles
in **Fremantle, Western Australia** 🌇

*"Design without strategy is decoration." — Tim Daly, who also builds the strategy*

</div>
