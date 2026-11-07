# Naam Dating (നാം) — "Join Waitlist" CTA & 2-Step WhatsApp OTP Waitlist Integration Plan

This update replaces the **App Store** and **Playstore** buttons with **Join Waitlist** CTAs and connects them to the live Naam Dating backend (`https://naam.gredin.app`) for a 2-step waitlist registration and WhatsApp OTP verification flow.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both product decisions below directly implement your confirmed choices from our clarification step and address the API's CORS behavior discovered during the live trial run.

- **Confirmed Decision 1 (CTA Replacement)**: Remove the dual **App Store** and **Playstore** buttons and replace them with a sleek black pill **Join Waitlist** button in both the Hero section and the bottom phone showcase section (plus the top navigation bar CTA).
- **Confirmed Decision 2 (2-Step Waitlist Flow)**: Implement **Step 1 (Submit Details)** via `POST /users/submit` (`name`, `countryCode`, `phoneNumber`, `gender`) followed by **Step 2 (Verify WhatsApp OTP)** via `POST /users/verify-otp` (`phoneNumber`, `otp`) and `POST /users/resend-otp` (`phoneNumber`).
- **Technical Discovery (CORS Proxy)**: During our trial test, `https://naam.gredin.app/users/submit` returned `201 Created` (`{"userId":"...","message":"OTP sent successfully"}`), while browser `OPTIONS` preflight requests returned `404 Cannot OPTIONS /users/submit`. Routing requests through a lightweight `/api/users/*` server proxy guarantees 100% reliability in all desktop and mobile browsers without CORS errors.

---

## 1. Overview & Core Concept

- **What It Does**: Allows Malayali singles visiting `naamdating.com` to tap **Join Waitlist**, submit their name, country code (`+91`, `+971`, `+44`, `+1`, etc.), phone number, and gender (`MALE`, `FEMALE`, `OTHER`), receive an instant OTP on WhatsApp from `https://naam.gredin.app/users/submit`, and verify their spot via `https://naam.gredin.app/users/verify-otp`.
- **Target Audience / Persona**: Global Malayali singles in Kerala, Bengaluru, Dubai, the UK, Canada, and the US signing up for early access on mobile and desktop.
- **Key Value**: Converts website visitors into verified, phone-authenticated waitlist members via WhatsApp OTP in under 30 seconds.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **"Join Waitlist" Primary CTA Buttons**:
     - Replaces the `[App Store]` and `[Playstore]` buttons in the Hero section and in the second phone showcase section with a centered black pill **Join Waitlist** button (`#111111`), preserving the curved arrow and `"Loved By 10,000+ Users"` social proof right below it.
     - Updates the top navigation pill CTA to **Join Waitlist** so every call-to-action on the page opens the interactive waitlist modal/sheet.
  2. **Step 1 — Submit Details (`POST /users/submit`)**:
     - Clicking **Join Waitlist** opens a responsive modal (centered dialog on desktop, smooth bottom-sheet style on mobile) styled in Naam's `#F5F5F3` / `#FFFFFF` / `#111111` palette:
       - **Full Name**: Text input (`name`, required, min 2 characters).
       - **Country Code & WhatsApp Phone Number**: Country calling code selector (`+91` IN, `+971` UAE, `+44` UK, `+1` US/CA, `+61` AU, `+49` DE, `+65` SG, `+966` SA, `+974` QA, etc.) paired with a numeric phone input (`phoneNumber`).
       - **Gender**: 3-option segmented pill selector mapping to the exact API enum (`FEMALE`, `MALE`, `OTHER`).
       - **Action**: Tapping **Send WhatsApp OTP** validates inputs, displays a loading spinner, and posts to `/api/users/submit`.
  3. **Step 2 — Verify WhatsApp OTP (`POST /users/verify-otp` & `POST /users/resend-otp`)**:
     - Upon `201 Created`, transitions smoothly to Step 2 displaying the formatted WhatsApp number (`+91 9876543210`) and a `"Change number"` link.
     - **OTP Input**: 6-digit numeric verification input (`inputmode="numeric"`, `autocomplete="one-time-code"` for automatic mobile OTP autofill).
     - **Resend OTP**: Includes a **Resend OTP on WhatsApp** button (`POST /api/users/resend-otp`) with a 30-second countdown timer.
     - **Action**: Tapping **Verify & Join Waitlist** posts `{ phoneNumber, otp }` to `/api/users/verify-otp`.
  4. **Step 3 — Verified Waitlist Confirmation**:
     - Upon successful OTP verification, displays a verified confirmation screen with the user's name and verified WhatsApp number, saving the verified state in `localStorage` so the user sees their confirmed waitlist status.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Proxy for `https://naam.gredin.app/users/*`**
  - *Chosen Approach*: Forward `/api/users/submit`, `/api/users/verify-otp`, and `/api/users/resend-otp` from the local server to `https://naam.gredin.app/users/*`.
  - *Why*: `https://naam.gredin.app` does not currently respond to browser `OPTIONS` preflight requests (`404 Cannot OPTIONS`). Proxying server-to-server eliminates browser CORS blocks while forwarding exact HTTP status codes and error messages from `naam.gredin.app`.
- **Decision 2: Global Malayali Diaspora Country Code Presets**
  - *Chosen Approach*: Provide instant presets for top Malayali regions (`+91` India, `+971` UAE, `+44` UK, `+1` US/Canada, `+61` Australia, `+49` Germany, `+966` Saudi Arabia, `+974` Qatar, `+965` Kuwait, `+968` Oman, `+65` Singapore, `+353` Ireland, `+64` New Zealand).
  - *Why*: Matches Naam's global Malayali audience and ensures the `countryCode` always includes the leading `+` required by `SubmitUserDto`.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                 Browser Client (Mobile & Desktop DOM)                    │
│  ┌──────────────────────────┐        ┌────────────────────────────────┐  │
│  │  "Join Waitlist" Buttons │───────▶│   2-Step Waitlist Modal UI     │  │
│  │  (Hero, Navbar, Showcase)│        │  • Step 1: Name, Phone, Gender │  │
│  └──────────────────────────┘        │  • Step 2: 6-Digit WhatsApp OTP│  │
│                                      │  • Step 3: Verified Pass State │  │
│                                      └───────────────┬────────────────┘  │
└──────────────────────────────────────────────────────┼───────────────────┘
                                                       │ POST /api/users/*
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  CORS-Safe Proxy Layer (/api/users/*)                    │
└──────────────────────────────────────────────────────┬───────────────────┘
                                                       │ HTTPS POST
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│             Live Naam Backend (https://naam.gredin.app)                  │
│  • POST /users/submit     -> { name, countryCode, phoneNumber, gender }  │
│  • POST /users/verify-otp -> { phoneNumber, otp }                        │
│  • POST /users/resend-otp -> { phoneNumber }                             │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `SubmitUserDto`: `{ name: string, countryCode: string, phoneNumber: string, gender: "MALE" | "FEMALE" | "OTHER" }`
  - `VerifyOtpDto`: `{ phoneNumber: string, otp: string }`
  - `ResendOtpDto`: `{ phoneNumber: string }`
- **Interactive Component & State Mapping**:
  - **Form Validation**: Checks non-empty name, numeric phone number (6–14 digits), and valid gender selection (`MALE | FEMALE | OTHER`) before enabling submission; displays clear inline error messages if the API returns `400`/`401`/`429`.
  - **OTP Verification & Resend**: Supports 6-digit numeric entry, mobile `one-time-code` autofill, 30s resend cooldown, and back-to-Step-1 phone editing.
