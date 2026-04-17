# Verifiable Developer Portfolio MVP

Verifiable Developer Portfolio MVP is a monorepo that explores how developer portfolio data can be represented as verifiable credentials.

The project combines portfolio authoring, GitHub evidence collection, issuer review, credential issuance, and recruiter-facing verification into a single local-first system.

## Overview

Traditional developer portfolios typically rely on static text, links, and unverifiable claims. This project experiments with a different model:

- a developer curates portfolio data and supporting evidence
- GitHub activity is synced and summarized as portfolio evidence
- an issuer/admin reviews submitted evidence
- approved evidence is issued as a verifiable credential
- a recruiter can inspect and verify the issued credential

The current implementation is optimized for local development and end-to-end demonstration rather than production deployment.

## Features

### Portfolio
- Edit profile metadata such as name, headline, location, bio, and portfolio slug
- Manage featured projects and highlights
- Add non-GitHub achievements such as awards, completions, and certifications
- Publish a public portfolio page

### GitHub integration
- GitHub OAuth start/callback flow
- Profile and repository sync
- Repository evidence summaries based on authored commits and authored/merged pull requests
- Aggregated GitHub evidence snapshot for portfolio display

### Credential workflow
- Submit credential requests for review
- Review requests from an issuer/admin queue
- Approve or reject requests
- Issue credentials after review

### Verification
- Public recruiter-facing verification page
- Verification summary based on:
  - signature validity
  - issuer identity
  - credential status
  - expiry state
- Registry controls for:
  - `active`
  - `suspended`
  - `revoked`

### Supported credential types
- `GitHubAccountOwnershipCredential`
- `GitHubContributionCredential`
- `PortfolioAchievementCredential`

## Architecture

### Stack
- **Frontend**: React, Vite, TypeScript
- **Backend**: Express, Node.js, TypeScript
- **Database**: SQLite
- **Credential format**: JWT-based Verifiable Credentials
- **DID method**: `did:jwk`

### High-level flow
1. A developer edits portfolio content
2. GitHub evidence is connected and synced
3. A credential request is submitted
4. An issuer/admin reviews the request
5. A credential is issued if approved
6. A recruiter opens the public portfolio or verification page
7. The recruiter verifies signature, status, issuer, and expiry

## Repository structure

```text
apps/
  api/      Express API for portfolio, GitHub sync, review, issuance, and verification
  web/      React frontend for dashboard, public portfolio, verification, and legacy tools
packages/
  shared/   Shared DID, JOSE, VC schema, RBAC, and validation logic
docs/
  architecture.md
  final-submission-checklist.md
  portfolio-gap-analysis.md
  portfolio-p0-implementation-plan.md
  setup-and-demo.md
  threat-model.md
```

## Components

### `apps/web`
Frontend application that provides:
- portfolio dashboard
- public portfolio page
- recruiter verification page
- legacy RBAC demo routes

### `apps/api`
Backend service that provides:
- portfolio CRUD APIs
- GitHub OAuth and sync APIs
- credential request/review APIs
- credential issuance APIs
- verification APIs
- legacy issuer/wallet/verifier APIs

### `packages/shared`
Shared library containing:
- DID helpers
- JOSE / JWT VC helpers
- shared schemas and types
- RBAC helpers
- validation utilities

## Local development

### Run locally

```bash
cd C:\Sjw_dev\Coding\did-vc-rbac-mvp
copy .env.example .env
npm install
npm run seed
npm run dev
```

Default endpoints:
- Web: <http://localhost:5173>
- API: <http://localhost:3001>

### Environment variables

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

If GitHub OAuth is not configured, the seeded local data can still be used to demonstrate the main portfolio and verification flows.

## Commands

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

## Demo path

Recommended demo order:
1. Dashboard
2. Public Portfolio
3. Credential Request
4. Approve and Issue
5. Recruiter Verification

## Documentation

- Final submission checklist: `docs/final-submission-checklist.md`
- Setup and demo guide: `docs/setup-and-demo.md`
- Demo talk track: `docs/demo-talk-track.md`
- Demo Q&A cheatsheet: `docs/demo-qa-cheatsheet.md`
- Architecture notes: `docs/architecture.md`
- Gap analysis: `docs/portfolio-gap-analysis.md`
- Implementation plan: `docs/portfolio-p0-implementation-plan.md`
- Threat model: `docs/threat-model.md`

## Limitations

Current limitations include:
- GitHub evidence is stronger than a simple repository summary, but it is not a full historical GitHub event ingestion system
- Admin review is local-first and not designed for hardened multi-user production use
- SQLite is used for simplicity and local development convenience
- UI quality is sufficient for MVP demonstration, but not aimed at production-grade design-system completeness

## Legacy routes

This repository originally started as a DID/VC-based RBAC demo. Legacy routes are still included for compatibility and reference:

- `/issuer`
- `/wallet`
- `/verifier`
- `/admin`
- `/audit`
- `/dev`

In the current version, these routes are intentionally separated behind a `Legacy Tools` flow so the main product narrative remains focused on the portfolio system.
