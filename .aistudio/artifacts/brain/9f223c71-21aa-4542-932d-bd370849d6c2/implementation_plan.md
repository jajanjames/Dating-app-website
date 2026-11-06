# Naam Dating (നാം) — Mobile Responsiveness, Optical Alignment & Tactile UX Plan

This update resolves the mobile top navigation bar overlap, optically centers the Hero hand-held iPhone mockup across both mobile (`375px–430px`) and desktop (`1440px`) viewports, and introduces scroll-triggered Bento micro-interactions and live toggles tailored for mobile touchscreens.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both design and UX choices below reflect your confirmed preferences from our clarification step while preserving 100% of the desktop Figma design and SEO architecture.

- **Confirmed Decision 1 (Mobile Top Navigation Bar)**: Use a **clean pill bar with an expandable mobile menu sheet** on mobile viewports (`< 768px`) so the `FAQ` link never crowds or overlaps the `naam` logo or `Download App` button. On desktop (`>= 768px`), the exact single-row Figma pill header remains unchanged.
- **Confirmed Decision 2 (Mobile Tactile Experience)**: Implement **scroll-triggered Bento card micro-interactions and live toggles** so mobile users automatically see each card's interactive controls awaken as they scroll into view, paired with responsive touch feedback on tap.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers a seamless, native-feeling mobile and desktop web experience for **Naam Dating (നാം)** (`naamdating.com`), fixing mobile header crowding and phone mockup optical centering while making the 5 Bento showcase cards come alive on mobile scroll and touch.
- **Target Audience / Persona**: Global Malayali singles browsing on iOS and Android smartphones (from Instagram, WhatsApp, or Google Search) as well as desktop browsers.
- **Key Value**: Eliminates visual friction on mobile screens (zero overlapping links, dead-center Hero phone alignment) and builds instant product trust through responsive, genuine micro-interactions.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Top Pill Navigation & Expandable Mobile Menu Sheet**:
     - On mobile screens, the top floating pill header cleanly displays the official `naam` logo on the left and the `Download App` pill + a 44×44px menu toggle button on the right.
     - Tapping the menu toggle smoothly opens a rounded card sheet right below the pill containing single-line links for **Why Naam**, **Women's Safety**, **Global Community**, **FAQ**, **Privacy Policy**, and **Terms of Use**, closing automatically when any link is tapped.
  2. **Optical Hero Phone Centering (Mobile & Desktop)**:
     - Because the hand and wrist in the Hero mockup image (`Group_12_34a08f7b.png`, `653×763`) extend to the right side of the transparent canvas, the iPhone screen's center axis sits at `42.1%` of the image width (`7.9%` left of the image's bounding-box center).
     - Applying a calibrated optical offset (`translate-x-[7.9%]`) inside a centered, mobile-proportioned container aligns the iPhone screen dead-center beneath the `naam` logo, subtitle, `[App Store]` / `[Playstore]` buttons, and `"Loved By 10,000+ Users"` across every screen width.
  3. **Scroll-Triggered Mobile Bento Micro-Interactions & Live Toggles**:
     - On mobile devices (where cursor hover does not exist), an `IntersectionObserver` detects as each Bento card enters the active viewport zone and smoothly reveals its interactive pill bar (`data-in-view="true"`) with a subtle spring lift on the card artwork.
     - Users can tap each card's interactive control on mobile or desktop:
       - **Card 1 (Selfie-Verified Singles)**: Toggles a live `"Liked · Match Ready ♥"` state with a tactile pulse on the verification card.
       - **Card 2 (Women-First Privacy Shield)**: Toggles live photo privacy blur (`blur(5px)`) on and off so users can test the anti-screenshot privacy shield firsthand.
       - **Card 3 (Global Malayali Community)**: Cycles live active member counts across time zones (`Kochi IST`, `Dubai GST`, `London & NYC`, `20+ Countries`).
       - **Card 4 (Block Contacts)**: Cycles through on-device contact hash states (`Hide from known contacts ✓`, `Family & Relatives Blocked ✓`, `100% Mutual Invisibility ✓`).
       - **Card 5 (Switch Modes)**: Interactive segmented toggle for `Casual`, `Serious`, and `Marriage` intentions with smooth visual elevation.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Crisp editorial minimalism matching the Figma design (`#F5F5F3` warm stone hero surface, `#FFFFFF` main canvas, `#F6F6F6` Bento cards).
  - *Color Palette & Mood*: Charcoal black (`#111111` / `#1D1D1F`), muted zinc (`#52525B`), brand rose-pink (`#F01264` / `#FF004D`), and royal purple (`#6C3CE9`).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` paired with `Noto Sans Malayalam` for Malayalam script (`നാം`), maintaining single-line `whitespace-nowrap` discipline on all navigation links, buttons, and interactive pills.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Responsive Top Pill Header with Expandable Mobile Drawer**
  - *Chosen Approach*: Keep `Why Naam`, `Women's Safety`, `Global Community`, and `FAQ` inline on `md:` (`>= 768px`) screens, and move `FAQ` + section links into a clean, animated mobile dropdown sheet triggered from a 44×44px menu button on `< 768px` screens across all 3 pages (`index.html`, `privacy.html`, `terms.html`).
  - *Why*: Prevents the `FAQ` link from colliding with the `naam` logo or `Download App` button on `320px–430px` phones while giving mobile users effortless thumb access to all sections.
- **Decision 2: Viewport-Aware Scroll Awakening for Bento Cards**
  - *Chosen Approach*: Use a lightweight vanilla TypeScript `IntersectionObserver` that sets `data-in-view="true"` when a Bento card enters the middle of the mobile viewport, paired with compositor-only CSS transitions (`transform`, `opacity`, `filter`).
  - *Why*: Gives mobile visitors the same "wow" interactive discovery as desktop hover without requiring extra taps to discover hidden controls, while maintaining zero layout shift (CLS = 0).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                Static Semantic HTML5 DOM (Zero-JS Indexing)              │
│   ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐   │
│   │     index.html     │  │    privacy.html    │  │    terms.html    │   │
│   └─────────┬──────────┘  └─────────┬──────────┘  └────────┬─────────┘   │
└─────────────┼───────────────────────┼──────────────────────┼─────────────┘
              │                       │                      │
              ▼                       ▼                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│            Progressive Enhancement Layer (Vanilla TypeScript)            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Mobile Pill Header & Expandable Menu Sheet Controller           │  │
│  │    - Toggles aria-expanded, backdrop, & smooth link auto-close     │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ 2. Viewport IntersectionObserver (Scroll-Triggered Bento Awakening)│  │
│  │    - Reveals live interactive pill bars & subtle visual lift       │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ 3. Tactile Bento Micro-Interaction Controllers (5 Cards)           │  │
│  │    - Verified Like, Privacy Blur, Time-Zone Hub, Contact Blocker,  │  │
│  │      and Casual / Serious / Marriage Intention Switcher            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - **Mobile Menu Controller**: Binds `[data-mobile-menu-btn]` and `[data-mobile-menu-panel]` across `index.html`, `privacy.html`, and `terms.html`; handles `aria-expanded` toggling, Escape key dismissal, outside-click dismissal, and smooth scroll on anchor click.
  - **Optical Hero Phone Wrapper**: Uses `translate-x-[7.9%]` inside an `overflow-hidden` hero section with responsive `max-w-[340px] sm:max-w-[530px]` sizing so the iPhone screen bezel is centered at `50%` viewport width on both mobile and desktop.
  - **Bento Card Scroll & Tap Handlers**: Combines `IntersectionObserver` (`threshold: 0.45`) with pointer and touch listeners so interactive pills are visible and responsive on mobile touchscreens as well as desktop pointers.
