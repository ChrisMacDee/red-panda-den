# Red Panda Creations — Design Brief
## Ghost Portfolio & Blog · redpandacreations.co.uk

---

## 1. Project Overview

A public-facing portfolio and blog for **Chris MacDee** — puppet maker and software developer. The site lives at the base domain (`redpandacreations.co.uk`) and is powered by Ghost 5. It is the public face of the Red Panda Creations brand: a place to showcase puppet commissions, software projects, write about both crafts, and convert visitors into commission clients.

**What we need designed:** High-fidelity mockups for all six pages in both light and dark colour schemes, desktop (1280px) and mobile (390px) breakpoints. Ghost will implement the final theme from these designs.

---

## 2. About the Creator

**Chris MacDee** makes:

1. **Custom Henson-style puppets** — hand & rod puppets (think Kermit, Gonzo) and live-hands puppets (think Cookie Monster, Swedish Chef). These are bespoke, handcrafted pieces built to commission. This is the primary commercial offering of the site.

2. **Software & web development** — custom applications, self-hosted infrastructure, web projects. Secondary portfolio category; not the main revenue driver.

The tone is warm, personal, and craftsperson-led — not a corporate agency. Think independent maker who takes their work seriously and has a genuine personality.

### Photography (placeholders for now)

Real photography will be shot once puppets are complete. The designer should use placeholder images sized to the correct ratios. When shooting, Chris will produce:

- **Character portraits** — puppet posed expressively, styled lighting, personality-forward (think press shots). Used as hero/card images.
- **Technical shots** — clean front view + side view against a neutral background. Used on portfolio detail pages for reference.
- **Detail/material shots** — close-ups of foam work, fabric, mechanism, eyes. Used inside build logs.
- **In-use shots** — puppet being operated, at events, etc. Used for blog and About page.

All placeholder slots should assume portrait orientation (2:3 ratio) for puppet character shots and landscape (16:9 or 3:2) for build process and detail shots.

---

## 3. Brand Identity

### Logo

Circular badge. Crimson red (`#C2162E`) fill with white negative space. The mark is a stylised red panda face — expressive, friendly, slightly cartoony without being childish. Clean enough to work at 32px favicon size. **Use the supplied PNG asset** (attached to brief).

Two sizes in use:
- `48px` — desktop nav / footer
- `32px` — mobile nav / favicon

### Colour Palette

The site must support **both light and dark modes** (CSS `prefers-color-scheme`). The accent colour (`red-panda`) is identical in both modes.

#### Dark Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0C0C0C` | Page background |
| `bg-secondary` | `#1A1A1A` | Card / panel backgrounds |
| `bg-tertiary` | `#242424` | Subtle inset, code blocks |
| `border` | `#333333` | Dividers, card borders |
| `text-primary` | `#F5F5F5` | Body copy, headings |
| `text-muted` | `#A0A0A0` | Captions, metadata, labels |
| `accent` | `#C2162E` | Primary CTA, active states, links |
| `accent-hover` | `#D4374F` | Hover state on accent |
| `accent-muted` | `#3D1520` | Subtle accent tint (tag backgrounds) |
| `success` | `#2D8B4E` | Positive badges |
| `warning` | `#D4A843` | Warning states |

#### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#FAFAFA` | Page background |
| `bg-secondary` | `#FFFFFF` | Card / panel backgrounds |
| `bg-tertiary` | `#F0F0F0` | Subtle inset, code blocks |
| `border` | `#E0E0E0` | Dividers, card borders |
| `text-primary` | `#1A1A1A` | Body copy, headings |
| `text-muted` | `#666666` | Captions, metadata, labels |
| `accent` | `#B01830` | Primary CTA, active states, links |
| `accent-hover` | `#C2162E` | Hover state on accent |
| `accent-muted` | `#FDE8EC` | Subtle accent tint (tag backgrounds) |
| `success` | `#2D8B4E` | Positive badges |
| `warning` | `#C49A20` | Warning states |

### Typography

| Role | Font | Weights |
|------|------|---------|
| UI / Body | **Plus Jakarta Sans** | 400, 500, 600, 700 |
| Display / Data / Monospace | **JetBrains Mono** | 400, 500, 600 |

Both are Google Fonts. Body text is Plus Jakarta Sans. Code snippets, prices, counts, and the site wordmark use JetBrains Mono.

#### Type Scale (Desktop)
| Label | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `display` | 56px | 700 | Plus Jakarta Sans | Hero headline |
| `h1` | 40px | 700 | Plus Jakarta Sans | Page titles |
| `h2` | 28px | 600 | Plus Jakarta Sans | Section headings |
| `h3` | 20px | 600 | Plus Jakarta Sans | Card titles, sub-sections |
| `body-lg` | 18px | 400 | Plus Jakarta Sans | Lead paragraphs |
| `body` | 16px | 400 | Plus Jakarta Sans | Body copy |
| `body-sm` | 14px | 400 | Plus Jakarta Sans | Captions, metadata |
| `mono` | 14px | 500 | JetBrains Mono | Code, prices, counts, wordmark |
| `label` | 12px | 600 | Plus Jakarta Sans | Tags, badges, nav labels |

#### Mobile: scale all display/h1/h2 down ~20% (display → 36px, h1 → 28px, h2 → 22px).

### Spacing & Radius

- Base unit: **8px**
- Common spacing: 8, 16, 24, 32, 48, 64, 96px
- Border radius: `8px` cards/inputs, `6px` buttons/tags, `50%` avatar/logo badge
- Max content width: **1200px**, centred, with `24px` horizontal padding on mobile

### Shadows (Light Mode only — dark mode uses borders instead)
- Card: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
- Card hover: `0 4px 16px rgba(0,0,0,0.12)`

---

## 4. Design Aesthetic

**"Craftsperson's corner of the internet"** — warm, characterful, handmade feel without being rustic or amateurish. Like a well-kept maker's studio: organised but with personality. Not corporate SaaS, not artsy-chaotic.

**References / mood words:**
- Jim Henson Company website (warm, creative, character-driven)
- Dribbble portfolio of indie makers
- A little Studio Ghibli cosiness
- Confident use of the crimson accent — not shy about colour

**What to avoid:**
- Generic portfolio templates (white background, helvetica, grey grid)
- Over-designed / too many effects
- Corporate / agency cold aesthetic
- Cluttered or busy layouts

**Motion & animation (subtle only):**
- Card hover: `translateY(-2px)` + shadow increase, `200ms ease`
- Page transitions: fade-in, `150ms`
- CTA buttons: background colour shift on hover, `150ms ease`
- No bouncy spring animations, no entrance animations on scroll

---

## 5. Site Structure & Navigation

### Navigation Bar (persistent, sticky on scroll)

**Left:** Logo mark (32px) + wordmark `Red Panda Creations` in JetBrains Mono, crimson
**Right:** Nav links + `Commission me →` CTA button (accent filled)

Nav links: `Portfolio` · `Blog` · `About` · `Contact`

**Mobile:** Hamburger menu collapses to full-screen overlay. `Commission me →` stays visible as a sticky bottom bar on mobile (above safe area).

**Dark/light toggle:** Small sun/moon icon button in the nav, right of links.

### Footer

Three columns (desktop) / stacked (mobile):
- **Col 1:** Logo + tagline + social links (GitHub, maybe others TBD)
- **Col 2:** Site links (Portfolio, Blog, About, Contact, Shop)
- **Col 3:** Commission CTA — short blurb + `Start a commission →` button

Bottom bar: `© 2026 Red Panda Creations · Made with too much caffeine` — small, muted.

---

## 6. Page Designs Required

### 6.1 Home Page (`/`)

**Intent:** Orient new visitors, show the range of work, funnel to commission or portfolio.

#### Sections (top to bottom):

**Hero**
- Full-width, `min-height: 80vh`
- Centred layout: Logo mark (96px) → `display` headline → `body-lg` sub-headline → two CTA buttons
- Headline: `"Puppet maker & developer."` (or designer to suggest alternatives)
- Sub-headline: `"I build Henson-style puppets to commission and software for fun. Based in the UK."` (can be refined)
- CTAs: `Commission a puppet →` (accent filled) + `See my work` (outline)
- Background: subtle texture or very light pattern (not full-bleed image — no photo of Chris). Dark mode: near-black. Light mode: near-white.
- Accent detail: thin crimson horizontal rule or logo mark watermark at low opacity behind

**"What I make" — two-column feature strip**
- Two large cards side by side (stacked on mobile)
- Card A — Puppets: large image slot (placeholder for a hero puppet photo), title `"Henson-style Puppets"`, 2-line description, `"See puppet work →"` link
- Card B — Software: code/screenshot image slot, title `"Software & Web"`, 2-line description, `"See dev projects →"` link
- Cards use `bg-secondary` background, border, subtle hover lift

**Featured Portfolio — `"Recent work"`**
- Section heading + `"View all →"` right-aligned link
- Grid: 3 cards desktop / 1 card (swipeable carousel) mobile
- Each card: full-bleed image (2:3 portrait for puppets, 16:9 landscape for dev), category tag (crimson pill), title, 1-line excerpt
- Mix of both categories

**Blog teaser — `"From the blog"`**
- Section heading + `"Read all →"` link
- 2-column grid (desktop) / stacked (mobile): post cards with date, title, reading time, excerpt snippet
- Minimal card style — mostly typographic, small thumbnail optional

**Commission CTA strip**
- Full-width band, `bg-secondary` (dark mode) / `accent-muted` (light mode)
- Centred: icon (needle & thread? puppet silhouette? — designer's call) + heading `"Want a custom puppet?"` + 2-line description + `"Start your commission →"` button
- This is the most important conversion element on the site

---

### 6.2 Portfolio Page (`/portfolio`)

**Intent:** Show the full body of work, filterable by category.

#### Layout:

**Page header:** `h1` `"Portfolio"` + short descriptor line, left-aligned. Filter pills right (or below on mobile): `All` · `Puppets` · `Software`

**Grid:** Masonry-style or uniform card grid (designer's call — masonry works better for puppets which have irregular image ratios)
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

**Project card:**
- Image (full-width within card, variable height OK in masonry)
- Category tag (crimson pill — `Puppet` or `Software`)
- Title (`h3`)
- Short descriptor (1–2 lines, `body-sm`, muted)
- On hover: overlay with `"View project →"` or card lifts

**Puppet cards** — portrait orientation, photography-forward, detail shots important
**Software cards** — landscape orientation, screenshot or abstract graphic, tech stack tags (small grey pills: `React`, `TypeScript`, etc.)

---

### 6.3 Portfolio Detail Page (`/portfolio/:slug`)

**Intent:** Deep dive into a single piece of work. Ghost handles this as a post with a custom template.

#### Puppet project layout:
- **Hero:** Full-bleed image (or split: image left, details right on desktop)
- **Details panel:** Name, materials, type (hand & rod / live hands), year, status (available / commissioned / sold)
- **Commission CTA** if available: `"Commission something similar →"`
- **Gallery:** 4–6 image grid (photographer's lightbox behaviour)
- **Description:** long-form text, build process, materials used
- **Related:** 2–3 similar puppet cards

#### Software project layout:
- **Hero:** Screenshot or mockup, 16:9
- **Details panel:** Tech stack tags, year, links (GitHub, live site)
- **Description:** what it does, why it was built
- **Screenshots:** annotated walkthrough images
- **Related:** 2–3 similar dev cards

---

### 6.4 Blog Page (`/blog`)

**Intent:** List of all posts. Ghost handles pagination.

#### Content categories — three distinct types, each needing a visual signal:

| Category | Ghost tag | Description | Visual cue |
|----------|-----------|-------------|------------|
| **Puppet Build** | `puppet-build` | Editorial build logs — the story of making a specific puppet. Long, image-heavy, narrative-driven. Often linked from the portfolio detail page for that puppet. | Warm amber/craft pill |
| **Tutorial** | `tutorial` | Technical how-to content: puppetry techniques, coding walkthroughs, step-by-step builds. Has numbered steps, images, possibly code blocks. | Crimson pill |
| **News & Reviews** | `news` | Casual, conversational — opinions, reviews of materials/tools, event recaps, general ramblings. | Neutral grey pill |

Category pills should be visually distinct from each other (not all crimson) so readers can scan the blog feed and self-select.

#### Layout:
- **Page header:** `"Blog"` + descriptor. Category filter row below header: `All` · `Puppet Builds` · `Tutorials` · `News & Reviews`
- **Featured post** (top, full-width): large hero image, category pill, title, date, reading time, excerpt, `"Read →"` button
- **Post grid:** 2-column below (desktop), 1-column (mobile)
- Post card: thumbnail (16:9), category pill, title, date, reading time, 2-line excerpt
- Pagination: numbered, minimal

---

### 6.5 Blog Post Page (`/blog/:slug`)

**Intent:** Individual post reading experience. The template adapts slightly by category.

#### Layout:
- **Header:** Category pill, `h1` title, date · reading time · author
- **Hero image:** Full-width below header, max `600px` tall, `object-fit: cover`
- **Content column:** Max `720px` wide, centred — optimised for reading
  - Body: 18px Plus Jakarta Sans, `1.75` line-height
  - Headings: crimson accent left-border on `h2`
  - Blockquotes: left border crimson, italic, `bg-secondary` background
  - Code blocks: JetBrains Mono, `bg-tertiary`, syntax-highlighted (tutorials will have many of these)
  - Images: full-width within column, rounded `8px`
  - Image galleries: 2-column grid within the column (build logs will have many process photos)
- **Sidebar (desktop only, sticky):** Table of contents auto-generated from headings — important for long tutorials and build logs
- **Footer:** Tags · Share buttons (copy link, optional socials) · `"More posts →"`
- **Related posts:** 3-card strip below article

#### Category-specific variations to design:

**Puppet Build post** — link panel at top connecting to the portfolio piece this build documents. e.g. `"This is the build log for [Puppet Name] — view the finished piece →"`. Styled as a crimson-tinted callout card, not just a text link. These are editorial/narrative — prioritise image galleries and pull-quotes.

**Tutorial post** — numbered step callouts (styled `Step 1`, `Step 2` markers, visually prominent). Code blocks likely. Possibly a materials/tools list at the top (styled like a recipe ingredients block).

**News & Review post** — no special UI chrome. Straight prose. Relaxed, no sidebar needed on short posts (sidebar only appears if post is >1500 words or has 3+ headings).

---

### 6.5a Puppet Detail Page — Build Log Link

On the puppet portfolio detail page (section 6.3), add a **"Build story" panel** below the main details:

- If a build log post exists for this puppet: show a linked card — thumbnail, `"Puppet Build"` pill, post title (e.g. `"How I built Clarence"`), reading time, `"Read the full build →"` button
- If no build log yet: hide this section (Ghost conditional template logic handles this)
- Style: matches the blog post card but slightly more prominent — it's contextually important here

---

### 6.6 About Page (`/about`)

**Intent:** Personal introduction. Who is Chris, why puppets + code, what's the story.

#### Layout:
- **Header:** `h1` `"About"` + logo mark as decorative element
- **Intro block:** 2-column desktop — left: large photo placeholder (or illustrated avatar if no photo), right: personal bio text
- **"What I make" section:** Two feature blocks (Puppets / Software) with icons, brief description
- **Process section:** `"How a commission works"` — numbered steps (4–5 steps), illustrated or icon-based, horizontal timeline desktop / vertical mobile
- **Values / working style:** Small cards or list — `"I believe in..."` type content
- **CTA:** `"Ready to commission?"` → button

---

### 6.7 Contact Page (`/contact`)

**Intent:** Simple enquiry form. Low friction, friendly copy.

#### Layout:
- **Header:** `h1` `"Get in touch"` + 1-line subhead
- **Two column (desktop):** Left: form · Right: brief note on response time, what to expect, commission note
- **Form fields:**
  - Name (text)
  - Email (email)
  - Subject — select: `Commission enquiry` / `General question` / `Something else`
  - Message (textarea, min 4 rows)
  - Honeypot hidden field (invisible, not in the design — just note it exists)
  - Submit: `"Send message →"` accent button, full-width on mobile
- **Success state:** Replace form with friendly confirmation message + `"Back to home"` link

---

## 7. Component Library

The designer should produce a component sheet covering:

| Component | States needed |
|-----------|---------------|
| Navigation bar | Default · Scrolled (shadow) · Mobile (closed) · Mobile (open) |
| Footer | Desktop · Mobile |
| Project card — Puppet | Default · Hover |
| Project card — Software | Default · Hover |
| Blog post card | Default · Hover · Featured variant |
| Category pill — Puppet Build | Default · Hover |
| Category pill — Tutorial | Default · Hover |
| Category pill — News & Review | Default · Hover |
| Tag pill (generic) | Default · Hover |
| CTA Button — filled | Default · Hover · Focus · Disabled |
| CTA Button — outline | Default · Hover · Focus |
| Text link | Default · Hover · Visited |
| Form input | Default · Focus · Error · Disabled |
| Form select | Default · Focus · Error |
| Form textarea | Default · Focus · Error |
| Commission CTA strip | Light · Dark |
| Section heading + link | — |
| Dark/light mode toggle | Light · Dark |
| Pagination | — |
| Build log link card (portfolio detail) | Has build log · No build log (hidden) |
| Tutorial step marker (`Step N`) | — |
| Materials / tools list block | — |
| Image gallery (2-col, within post) | — |

---

## 8. Responsive Breakpoints

| Name | Width | Notes |
|------|-------|-------|
| Mobile | 390px | iPhone 14 Pro reference |
| Tablet | 768px | iPad mini reference (optional — can interpolate) |
| Desktop | 1280px | Primary design canvas |
| Wide | 1440px | Verify no layout breaks |

Mobile-first is preferred. Max content width is 1200px on desktop.

---

## 9. Ghost-Specific Notes

The designs will be implemented as a **custom Ghost 5 theme** (Handlebars templates). Some constraints to be aware of:

- Ghost renders blog content as HTML from its editor — the blog post body design needs to handle: headings h2–h4, paragraphs, bold/italic, ordered/unordered lists, blockquotes, code (inline and block), images (with captions), horizontal rules, embeds (video, bookmark cards)
- Ghost handles pagination, tags, authors automatically — these are included in the design
- Portfolio "posts" are Ghost posts with a custom tag (`#portfolio`) — Ghost routes them to a different template but the card component is shared
- The Commission/Shop link goes to `https://shop.redpandacreations.co.uk` (external Medusa storefront — separate Phase 11)
- Contact form will be a Ghost-native form or a third-party embed (Formspree / similar) — keep the design implementation-agnostic

---

## 10. Deliverables Requested

1. **Component sheet** — all components in light + dark, all states
2. **6 page designs** — desktop (1280px) + mobile (390px) for each, light + dark = **24 frames total**
3. **Design tokens** exported (colours, type, spacing) so they can be translated directly to CSS custom properties
4. **Annotated specs** on at least the nav, card, and blog post body — hover states, spacing, font sizes called out

---

## 11. What "Done" Looks Like

A developer (me) should be able to open the Figma file and implement the Ghost theme without needing to make any design decisions. Spacing, colours, font sizes, and hover states should all be explicit. The design should feel like it belongs to the same brand family as the private dashboard (same accent colour, same fonts) but be clearly a distinct, lighter, more public-facing product.
