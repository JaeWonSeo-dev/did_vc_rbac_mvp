# Verifiable Developer Portfolio MVP

Verifiable Developer Portfolio MVP is a personal project that demonstrates how a developer portfolio can be turned into a **verifiable credential-based presentation flow**.

Instead of showing only a GitHub link or a static resume, this project lets a developer collect GitHub activity, curated projects, and non-GitHub achievements, then move that evidence through an **issuer review and credential issuance flow** so a recruiter can inspect and verify it.

---

## 1. Project Purpose

This project was built to simulate a portfolio platform that combines:
- developer portfolio management
- GitHub evidence collection
- DID / VC based credential issuance
- recruiter-facing credential verification

The main goal is not production deployment, but a **complete and convincing MVP / personal project demo** that shows the following idea clearly:

> A developer should be able to present career evidence as verifiable credentials, and a recruiter should be able to verify that evidence through issuer signature, credential status, and expiry information.

---

## 2. Main Features

### Portfolio management
- Edit developer profile information
- Manage portfolio slug, bio, headline, and location
- Add featured projects and highlights
- Add non-GitHub achievements such as awards, completions, and certifications

### GitHub evidence integration
- GitHub OAuth connection flow
- GitHub profile and repository sync
- Evidence summary based on authored commits and authored / merged pull requests
- Repository-level evidence snapshots for demo use

### Credential workflow
- Submit credential requests for review
- Admin / issuer review queue
- Approve or reject requested evidence
- Issue verifiable credentials after review

### Supported credential types
- `GitHubAccountOwnershipCredential`
- `GitHubContributionCredential`
- `PortfolioAchievementCredential`

### Recruiter verification
- Public portfolio page
- Recruiter-facing verification page
- Credential trust decision based on:
  - signature validity
  - issuer identity
  - registry status
  - expiry
- Credential status controls:
  - `active`
  - `suspended`
  - `revoked`

---

## 3. Intended Use

This project is intended for:
- personal portfolio demonstration
- MVP simulation
- academic / presentation demo
- DID / VC based portfolio concept validation

This project is **not intended to be a production-ready service**.

It is designed to be:
- easy to run locally
- easy to explain during a demo
- complete enough to show the end-to-end flow

---

## 4. System Overview

The system is organized as a monorepo with three main parts.

### Frontend (`apps/web`)
React + Vite frontend that provides:
- portfolio dashboard
- public portfolio page
- recruiter verification page
- legacy RBAC demo routes

### Backend (`apps/api`)
Express backend that provides:
- portfolio data APIs
- GitHub OAuth and sync APIs
- credential request / review APIs
- credential issuance APIs
- recruiter verification APIs
- legacy issuer / wallet / verifier flows

### Shared package (`packages/shared`)
Shared logic for:
- DID helpers
- JOSE / JWT VC handling
- VC schemas and types
- RBAC and validation helpers

---

## 5. System Architecture

### Core stack
- **Frontend**: React, Vite
- **Backend**: Express, Node.js, TypeScript
- **Database**: SQLite
- **Credential format**: JWT-based Verifiable Credential
- **DID method**: `did:jwk`

### Internal flow
1. Developer edits portfolio information
2. Developer connects GitHub and syncs evidence
3. Developer submits a credential request
4. Issuer / admin reviews the request
5. A credential is issued if approved
6. Recruiter opens a public portfolio or verification link
7. Recruiter checks signature, status, issuer, and expiry

---

## 6. Repository Structure

```text
apps/
  api/   Express API for portfolio, GitHub sync, credential review, issuance, verification
  web/   React frontend for dashboard, public portfolio, recruiter verification, legacy tools
packages/
  shared/ Shared DID, VC, JOSE, schema, RBAC, and validation helpers
docs/
  architecture.md
  final-submission-checklist.md
  portfolio-gap-analysis.md
  portfolio-p0-implementation-plan.md
  setup-and-demo.md
  threat-model.md
```

---

## 7. Local Run

```bash
cd C:\Sjw_dev\Coding\did-vc-rbac-mvp
copy .env.example .env
npm install
npm run seed
npm run dev
```

Default local endpoints:
- Web: <http://localhost:5173>
- API: <http://localhost:3001>

---

## 8. Environment Variables

Minimal local configuration:

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

If GitHub OAuth is not configured, the application can still be demonstrated locally using seeded demo data.

---

## 9. Available Commands

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

## 10. Demo Flow

Recommended demo order:
1. Dashboard
2. Public Portfolio
3. Credential Request
4. Approve and Issue
5. Recruiter Verification

This order is enough to demonstrate the core value of the project clearly.

---

## 11. Documentation

- Final submission checklist: `docs/final-submission-checklist.md`
- Setup and demo guide: `docs/setup-and-demo.md`
- Architecture notes: `docs/architecture.md`
- Gap analysis: `docs/portfolio-gap-analysis.md`
- Implementation plan: `docs/portfolio-p0-implementation-plan.md`
- Threat model: `docs/threat-model.md`

---

## 12. Current Scope and Limitations

This project is intentionally scoped as a **demo-ready MVP**.

Current limitations include:
- GitHub evidence is stronger than a simple repo summary, but it is still not a full historical GitHub event ingestion system
- Admin review is local-first and not hardened for real multi-user production use
- SQLite is used for simplicity and local demo convenience
- UI polish is sufficient for demonstration, but not aimed at production-grade design system completeness

---

## 13. Legacy Note

This repository originally started from a DID / VC based RBAC demo.

Legacy routes are still included for compatibility and reference:
- `/issuer`
- `/wallet`
- `/verifier`
- `/admin`
- `/audit`
- `/dev`

In the current version, these routes are separated behind a **Legacy Tools** flow so the main product narrative remains focused on the verifiable developer portfolio.

---

## 14. Summary

This project demonstrates a complete personal-project-level MVP for a **verifiable developer portfolio system**.

It is suitable for:
- project presentation
- portfolio demonstration
- MVP simulation
- DID / VC concept showcase

It is not a production SaaS product, but it is complete enough to clearly demonstrate the problem, the proposed solution, and the end-to-end user flow.
