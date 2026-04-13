# Verifiable Developer Portfolio MVP

A local DID/VC portfolio product that turns developer evidence into recruiter-friendly, verifiable credentials.

## Product definition
This project lets a developer:
- create a DID-backed portfolio identity
- sync GitHub account and repository evidence
- edit a public portfolio with bio, projects, and highlights
- issue portfolio credentials from synced evidence
- share a recruiter verification page that shows issuer, signature validity, credential status, and expiry clearly

The codebase started as a DID/VC RBAC demo. The RBAC pieces still exist as legacy surfaces, but the portfolio product is now the primary frontend narrative.

## MVP scope
### Included now
- portfolio dashboard for editing bio, slug, and featured projects/highlights
- public portfolio page
- recruiter verification page
- GitHub OAuth bootstrap endpoints
- GitHub evidence sync and local persistence
- two VC types:
  - `GitHubAccountOwnershipCredential`
  - `GitHubContributionCredential`
- VC verification with issuer, subject, status, and expiry shown in the UI

### Still intentionally simplified
- GitHub contribution counts are estimated from synced repository metadata, not full commit/PR graph ingestion
- issuer trust and credential status are local SQLite records
- default seed/demo data is local-first for fast review
- legacy issuer/wallet/verifier routes remain for reuse and backward compatibility

## Repository layout
```text
apps/
  api/   Express API for portfolio, GitHub sync, issuance, verification, and legacy RBAC flows
  web/   React UI for dashboard, public portfolio, recruiter verification, and legacy tools
packages/
  shared/ Shared DID, JOSE, VC schema, and legacy RBAC helpers
docs/
  architecture.md
  portfolio-gap-analysis.md
  portfolio-p0-implementation-plan.md
  threat-model.md
```

## Main user flows
### Developer
1. Open the dashboard.
2. Edit bio, headline, portfolio slug, featured projects, and highlights.
3. Connect GitHub through OAuth.
4. Sync GitHub evidence.
5. Issue portfolio credentials.
6. Share the public portfolio or direct verification link.

### Recruiter
1. Open a portfolio link.
2. Review featured projects and synced GitHub evidence.
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
- **Frontend**: React + Vite, portfolio-first layout, legacy RBAC tools behind a collapsed section
- **Backend**: Express modules for portfolio data, GitHub OAuth/sync, issuance, verification, plus legacy issuer/wallet/verifier services
- **Persistence**: SQLite for users, GitHub sync data, portfolio projects, portfolio credentials, verification logs, and legacy auth state
- **VC format**: JWT VC using `did:jwk` for local simplicity

## MVP gaps still remaining
- real GitHub activity ingestion for commits, PRs, and merged PR evidence instead of heuristics
- richer credential status UX for revoked/suspended edge cases on the public page
- stronger issuer/admin review flow before issuing credentials
- better visual design and component reuse beyond inline styles
- deployment docs for a shareable online demo

## Legacy note
The original admin-console RBAC demo is still available under legacy routes (`/issuer`, `/wallet`, `/verifier`, `/admin`, `/audit`, `/dev`). It is no longer the primary story of the product.
