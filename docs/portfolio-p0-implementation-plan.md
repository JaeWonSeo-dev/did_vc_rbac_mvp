# Portfolio Service P0 Implementation Plan

## Goal
Refactor the current DID/VC RBAC admin-login MVP into the first usable slice of a **verifiable developer portfolio service**.

P0 is limited to these foundations:
- user/profile model
- GitHub OAuth integration skeleton
- portfolio credential schemas
- public portfolio page
- recruiter verification page

## Current reusable base

### Keep as-is or mostly as-is
- `apps/api/src/security/*` - issuer key creation and crypto helpers
- `packages/shared/src/did/*` - `did:jwk` utilities
- `packages/shared/src/jose/tokens.ts` - VC/VP signing and verification helpers
- `apps/api/src/modules/audit/service.ts` - verification / issuance audit trail
- `apps/api/src/db/client.ts` - local SQLite bootstrap

### Keep but repurpose
- `apps/api/src/modules/issuer/service.ts` - issue portfolio credentials instead of role credentials
- `apps/api/src/modules/verifier/service.ts` - add recruiter-facing VC verification response alongside login verification
- `apps/web/src/components/Layout.tsx` - change navigation and product framing
- `apps/web/src/pages/OverviewPage.tsx` - become landing/dashboard summary

### De-emphasize for now
- protected RBAC demo routes/pages (`/admin`, `/audit`, `/dev`)
- login-first verifier UX

## P0 file/module changes

### 1) Database / domain model
**File:** `apps/api/src/db/schema.ts`

Add new tables:
- `users`
  - `id TEXT PRIMARY KEY`
  - `did TEXT UNIQUE NOT NULL`
  - `display_name TEXT`
  - `headline TEXT`
  - `bio TEXT`
  - `location TEXT`
  - `avatar_url TEXT`
  - `portfolio_slug TEXT UNIQUE NOT NULL`
  - `created_at INTEGER NOT NULL`
  - `updated_at INTEGER NOT NULL`
- `github_accounts`
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `user_id TEXT NOT NULL`
  - `github_user_id TEXT`
  - `username TEXT`
  - `profile_url TEXT`
  - `access_token TEXT`
  - `scope TEXT`
  - `status TEXT NOT NULL DEFAULT 'pending'`
  - `linked_at INTEGER`
  - `updated_at INTEGER NOT NULL`
- `portfolio_projects`
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `user_id TEXT NOT NULL`
  - `name TEXT NOT NULL`
  - `description TEXT`
  - `repo_url TEXT`
  - `live_url TEXT`
  - `highlights_json TEXT NOT NULL DEFAULT '[]'`
  - `featured INTEGER NOT NULL DEFAULT 0`
  - `sort_order INTEGER NOT NULL DEFAULT 0`
- `portfolio_credentials`
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `credential_jti TEXT UNIQUE NOT NULL`
  - `user_id TEXT NOT NULL`
  - `credential_type TEXT NOT NULL`
  - `vc_jwt TEXT NOT NULL`
  - `summary_json TEXT NOT NULL`
  - `status TEXT NOT NULL DEFAULT 'active'`
  - `issued_at INTEGER NOT NULL`
  - `expires_at INTEGER NOT NULL`
  - `created_at INTEGER NOT NULL`
- `github_oauth_states`
  - `state TEXT PRIMARY KEY`
  - `user_id TEXT NOT NULL`
  - `redirect_uri TEXT NOT NULL`
  - `created_at INTEGER NOT NULL`
  - `expires_at INTEGER NOT NULL`
- `verification_logs`
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `credential_jti TEXT NOT NULL`
  - `portfolio_slug TEXT`
  - `verifier TEXT`
  - `result TEXT NOT NULL`
  - `reason TEXT NOT NULL`
  - `created_at INTEGER NOT NULL`

### 2) Shared credential schemas
**File:** `packages/shared/src/schemas/types.ts`

Keep current RBAC schema compatible, but extend it for portfolio credentials:
- `GitHubAccountOwnershipCredential`
- `GitHubContributionCredential`
- union / flexible `credentialSubject` support so shared JOSE verification can validate both old and new VC JWTs

Needed fields for P0:
- account ownership
  - `id`
  - `githubUsername`
  - `githubProfileUrl`
  - `verifiedAt`
- contribution
  - `id`
  - `repository`
  - `repositoryUrl`
  - `role`
  - `commitCount`
  - `mergedPrCount`
  - `period.start`
  - `period.end`
  - `evidenceSummary`

### 3) Portfolio API module
**New file:** `apps/api/src/modules/portfolio/service.ts`

Functions:
- `upsertUserProfile(db, input)`
- `getPublicPortfolioBySlug(db, slug)`
- `listPortfolioCredentials(db, userId)`
- `verifyPortfolioCredential(db, issuerDid, jti)`
- `seedPortfolioDemoData(db, issuer)`
- `createGitHubOAuthStart(db, config, userId)`
- `completeGitHubOAuthCallback(db, config, query)` (skeleton only in P0)

### 4) API routes
**File:** `apps/api/src/app.ts`

Add routes:
- `POST /api/portfolio/users`
  - create/update user + profile
- `GET /api/portfolio/:slug`
  - public portfolio payload
- `GET /api/portfolio/:slug/credentials`
  - issued portfolio credentials for display
- `GET /api/verify/:jti`
  - recruiter-facing VC verification result
- `POST /api/github/oauth/start`
  - create OAuth state + return GitHub authorize URL
- `GET /api/github/oauth/callback`
  - receive `code/state`, persist placeholder link result

Leave old RBAC routes intact for now so existing tests keep passing.

### 5) Configuration
**File:** `apps/api/src/config.ts`

Add env-backed GitHub config:
- `githubClientId`
- `githubClientSecret`
- `githubAuthorizeUrl` default `https://github.com/login/oauth/authorize`
- `githubCallbackUrl` default `${WEB_ORIGIN}/github/callback`

### 6) Web routes/pages
**Files:**
- `apps/web/src/main.tsx`
- `apps/web/src/components/Layout.tsx`
- `apps/web/src/pages/OverviewPage.tsx`
- `apps/web/src/pages/PortfolioPage.tsx` **(new)**
- `apps/web/src/pages/VerifyCredentialPage.tsx` **(new)**
- `apps/web/src/pages/GitHubCallbackPage.tsx` **(new)**
- `apps/web/src/lib/api.ts`

P0 UI routes:
- `/` landing + product framing
- `/portfolio/:slug` public portfolio page
- `/verify/:jti` recruiter verification page
- `/github/callback` OAuth callback status page

### 7) Seed/demo support
**File:** `apps/api/src/seed/demoSeed.ts`

Extend seeding so the repo boots with at least:
- one demo portfolio user
- one linked GitHub account placeholder
- one `GitHubAccountOwnershipCredential`
- one `GitHubContributionCredential`
- one featured project

## P0 implementation order
1. Extend shared VC schemas without breaking RBAC validation.
2. Extend DB schema with portfolio tables.
3. Add portfolio service module and public/verification API routes.
4. Add GitHub OAuth start/callback skeleton.
5. Replace web navigation and add portfolio/verification pages.
6. Seed one demo user and two demo credentials.
7. Update docs/README later once the new path is stable.

## What P0 intentionally does NOT finish
- real GitHub token exchange / REST ingestion
- issuer review dashboard
- credential request workflow
- PostgreSQL migration
- blockchain anchoring
- removal of RBAC demo paths

## Success criteria for this P0
- repo contains a concrete portfolio domain model
- repo exposes public portfolio and verification endpoints
- repo has GitHub OAuth entry points and callback skeleton
- shared credential validation supports portfolio VC types
- frontend can render a public portfolio page and a recruiter verification page using live API data
