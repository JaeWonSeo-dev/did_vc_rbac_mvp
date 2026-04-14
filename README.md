# Verifiable Developer Portfolio MVP

A local DID/VC portfolio product that turns developer evidence into recruiter-friendly, verifiable credentials.

## Product definition
This project lets a developer:
- create a DID-backed portfolio identity
- sync GitHub account and repository evidence
- add non-GitHub evidence such as awards, completions, and manual achievements
- edit a public portfolio with bio, projects, and highlights
- submit credential requests for issuer/admin review
- issue portfolio credentials from reviewed evidence
- share a recruiter verification page that shows issuer, signature validity, credential status, and expiry clearly

The codebase started as a DID/VC RBAC demo. The RBAC pieces still exist as legacy surfaces, but the portfolio product is now the primary frontend narrative.

## MVP scope
### Included now
- portfolio dashboard for editing bio, slug, featured projects, achievements, and evidence highlights
- public portfolio page
- recruiter verification page
- GitHub OAuth bootstrap endpoints
- GitHub evidence sync and local persistence
- richer GitHub evidence modeling with observed contribution counts, merged PR counts, proof points, and sync-window summaries
- credential request → issuer/admin review → approve/reject workflow
- three VC types:
  - `GitHubAccountOwnershipCredential`
  - `GitHubContributionCredential`
  - `PortfolioAchievementCredential`
- VC verification with issuer, subject, status, status meaning, and expiry shown in the UI
- admin-side registry controls to mark portfolio credentials as active, suspended, or revoked and immediately reflect that on recruiter verification pages

### Still intentionally simplified
- GitHub contribution counts are still MVP-practical and partly heuristic; they are stronger than before, but not yet a full commit graph / PR event ingestion pipeline
- issuer trust and credential status are local SQLite records
- admin review is intentionally local-first rather than multi-user auth hardened
- default seed/demo data is local-first for fast review
- legacy issuer/wallet/verifier routes remain for reuse and backward compatibility

## Repository layout
```text
apps/
  api/   Express API for portfolio, GitHub sync, credential requests/review, issuance, verification, and legacy RBAC flows
  web/   React UI for dashboard, public portfolio, recruiter verification, and legacy tools
packages/
  shared/ Shared DID, JOSE, VC schema, and legacy RBAC helpers
docs/
  architecture.md
  portfolio-gap-analysis.md
  portfolio-p0-implementation-plan.md
  setup-and-demo.md
  threat-model.md
```

## Main user flows
### Developer
1. Open the dashboard.
2. Edit bio, headline, portfolio slug, featured projects, and highlights.
3. Add awards, completions, certifications, and manual achievements.
4. Connect GitHub through OAuth.
5. Sync GitHub evidence.
6. Submit a credential request for issuer review.
7. Receive an approval/rejection decision and issued credential.
8. Share the public portfolio or direct verification link.

### Issuer / Admin
1. Open the review queue in the dashboard.
2. Inspect the request payload and evidence summary.
3. Approve and issue a credential, or reject with a reviewer note.

### Recruiter
1. Open a portfolio link.
2. Review featured projects, non-GitHub achievements, and synced GitHub evidence.
3. Open a credential verification page.
4. Confirm signature validity, issuer DID, status, and expiry.

## Local run
```bash
cd C:\Sjw_dev\Coding\did-vc-rbac-mvp
copy .env.example .env
npm install
npm run seed
npm run dev
```

For GitHub OAuth setup, demo order, and share-ready validation steps, see `docs/setup-and-demo.md`.

Endpoints:
- Web: <http://localhost:5173>
- API: <http://localhost:3001>

## Commands
```bash
npm install
npm run seed
npm run dev
npm run build
npm test
npm --workspace @did-vc-rbac/api run test
npm --workspace @did-vc-rbac/shared run test
npm --workspace @did-vc-rbac/web run test
```

## Current architecture notes
- **Frontend**: React + Vite, portfolio-first layout, local issuer/admin review panel, legacy RBAC tools behind a collapsed section
- **Backend**: Express modules for portfolio data, GitHub OAuth/sync, credential requests/review, issuance, verification, plus legacy issuer/wallet/verifier services
- **Persistence**: SQLite for users, GitHub sync data, portfolio projects, achievements, credential requests, portfolio credentials, verification logs, and legacy auth state
- **VC format**: JWT VC using `did:jwk` for local simplicity

## Remaining gaps
- real GitHub activity ingestion for user-specific commits, authored PRs, merged PRs, and starred evidence instead of partial repo-level inference
- deeper claim derivation for manual evidence (today it can issue a `PortfolioAchievementCredential`, but issuer review and supporting proof are still local-first)
- stronger multi-user auth and authorization around issuer/admin review surfaces
- better visual design and component reuse beyond inline styles
- deployment docs for a shareable online demo

## Legacy note
The original admin-console RBAC demo is still available under legacy routes (`/issuer`, `/wallet`, `/verifier`, `/admin`, `/audit`, `/dev`). It is no longer the primary story of the product.
