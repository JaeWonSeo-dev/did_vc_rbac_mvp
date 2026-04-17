# Verifiable Developer Portfolio MVP

A portfolio-first DID/VC prototype that turns developer evidence into issuer-reviewed credentials a recruiter can inspect and verify.

This repository is a **submission-ready, demo-ready MVP** focused on one product story:

> A developer curates portfolio evidence, connects GitHub activity, requests issuer review, receives verifiable credentials, and shares a public portfolio that recruiters can verify through signature, status, and expiry checks.

---

## 1. What this project is

Traditional developer portfolios mostly rely on self-written claims, screenshots, and links.
This project explores a stronger model:

- portfolio data is curated by the developer
- GitHub activity is collected as supporting evidence
- achievements outside GitHub can also be included
- evidence is reviewed by an issuer/admin
- approved claims are issued as verifiable credentials
- recruiters can open a verification page and inspect whether the credential is still trustworthy

This is not meant to be a production SaaS yet.
It is a **local-first end-to-end MVP** built to demonstrate the full product flow clearly.

---

## 2. Core value

The main idea is simple:

- a normal portfolio shows claims
- this portfolio tries to show **claims backed by verifiable proof**

A recruiter can check:
- whether the credential signature is valid
- which issuer signed it
- whether the issuer still marks it as active
- whether the credential has expired

So the product is not just a GitHub dashboard or a static profile page.
It is a **verifiable developer portfolio**.

---

## 3. What the MVP demonstrates

### Portfolio authoring
- edit profile metadata such as name, headline, location, bio, and slug
- manage featured projects and project highlights
- add non-GitHub achievements such as awards, completions, and certifications
- publish a public portfolio page

### GitHub evidence flow
- GitHub OAuth start/callback flow
- GitHub profile and repository sync
- repository evidence summaries based on authored commits and authored/merged pull requests
- aggregated GitHub evidence snapshot for portfolio display

### Credential workflow
- submit credential requests for review
- review requests from an issuer/admin queue
- approve or reject requests
- issue credentials after review

### Recruiter verification
- open a public portfolio page
- inspect issued credentials
- open a recruiter-facing verification page
- read a final verification decision based on:
  - signature validity
  - issuer identity
  - registry status
  - expiry state

### Registry state controls
- `active`
- `suspended`
- `revoked`

### Supported credential types
- `GitHubAccountOwnershipCredential`
- `GitHubContributionCredential`
- `PortfolioAchievementCredential`

---

## 4. Demo flow in one sentence

**Developer edits portfolio → connects GitHub → submits evidence → issuer reviews and issues credential → recruiter verifies it.**

Recommended demo order:
1. Dashboard
2. Public Portfolio
3. Credential Request
4. Approve and Issue
5. Recruiter Verification

---

## 5. Tech stack

- **Frontend**: React, Vite, TypeScript
- **Backend**: Express, Node.js, TypeScript
- **Database**: SQLite
- **Credential format**: JWT-based Verifiable Credentials
- **DID method**: `did:jwk`

---

## 6. Repository structure

```text
apps/
  api/      Express API for portfolio, GitHub sync, review, issuance, and verification
  web/      React frontend for dashboard, public portfolio, verification, and legacy tools
packages/
  shared/   Shared DID, JOSE, VC schema, RBAC, and validation logic
docs/
  architecture.md
  demo-qa-cheatsheet.md
  demo-talk-track.md
  final-submission-checklist.md
  portfolio-gap-analysis.md
  portfolio-p0-implementation-plan.md
  setup-and-demo.md
  threat-model.md
```

---

## 7. Quick start

From the repository root:

```bash
cd C:\Sjw_dev\Coding\did-vc-rbac-mvp
copy .env.example .env
npm install
npm run seed
npm run dev
```

Default local URLs:
- Web: <http://localhost:5173>
- API: <http://localhost:3001>

If GitHub OAuth is not configured, seeded local data is still enough to demonstrate the main portfolio and verification flows.

---

## 8. Minimal environment variables

```env
PORT=3001
WEB_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/app.db
KEYSTORE_DIR=./data/keystore
WALLET_STORAGE_DIR=./data/wallets
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:5173/github/callback
```

For local GitHub OAuth testing, configure a GitHub OAuth app with:
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173/github/callback`

---

## 9. Commands

```bash
npm install
npm run seed
npm run dev
npm run build
npm test
npm --workspace @did-vc-rbac/api run test
npm --workspace @did-vc-rbac/web run test
npm --workspace @did-vc-rbac/shared run test
```

---

## 10. Seeded demo routes

This repo includes a local seeded demo persona.

- dashboard: <http://localhost:5173/>
- public portfolio: <http://localhost:5173/portfolio/sjw-dev>
- recruiter verification: open any credential card from the dashboard or portfolio page

The seeded demo is intended to make presentation and evaluation possible even without live OAuth setup.

---

## 11. Verification before submission/demo

Run:

```bash
npm test
npm run build
```

Expected:
- tests pass
- build succeeds
- dashboard loads
- public portfolio route works
- recruiter verification route works
- request review and approval flow works
- credential status changes reflect correctly in verification UI

---

## 12. Documentation

- Setup and demo guide: `docs/setup-and-demo.md`
- Final submission checklist: `docs/final-submission-checklist.md`
- Demo talk track: `docs/demo-talk-track.md`
- Demo Q&A cheatsheet: `docs/demo-qa-cheatsheet.md`
- Architecture notes: `docs/architecture.md`
- Threat model: `docs/threat-model.md`
- Gap analysis: `docs/portfolio-gap-analysis.md`
- P0 implementation plan: `docs/portfolio-p0-implementation-plan.md`

---

## 13. Current scope and honest limitations

This repository can honestly be described as:
- **demo-ready**
- **submission-ready MVP**
- **portfolio-first DID/VC prototype**

It should not be oversold as:
- production-ready SaaS
- hardened multi-tenant trust infrastructure
- full historical GitHub forensic attribution system

Current MVP limitations include:
- GitHub evidence is stronger than a simple repository summary, but still not a full event-ingestion pipeline
- admin review is local-first and not designed as hardened production multi-user auth
- SQLite is used for MVP simplicity and demo convenience
- UI quality is intentionally MVP-level rather than production design-system quality

---

## 14. Legacy routes

This repository originally started from a DID/VC-based RBAC demo.
Legacy routes are still present for compatibility and reference:

- `/issuer`
- `/wallet`
- `/verifier`
- `/admin`
- `/audit`
- `/dev`

They are intentionally separated from the main portfolio-first story so the primary demo remains focused on the developer portfolio product.

---

## 15. One-line pitch

> Verifiable Developer Portfolio MVP turns GitHub work, curated projects, and non-GitHub achievements into issuer-reviewed credentials that recruiters can inspect and verify through signature, status, and expiry checks.
