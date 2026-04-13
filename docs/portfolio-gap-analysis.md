# Portfolio Service Gap Analysis

## Summary

The current repository is **not** a developer portfolio credential service. It is a **DID-based admin console login + VC-based RBAC MVP**.

That means the codebase is technically healthy, but the product target is misaligned with the original requirement:

> Build a verifiable developer portfolio service that connects GitHub activity, project history, and award/completion records to DID/VC.

## Current Product vs Target Product

### Current product
- DID holder creation (`did:jwk`)
- VC issuance for roles (`Admin`, `Auditor`, `Developer`)
- Wallet import/storage of VC JWTs
- VP generation and verifier submission
- Verification for privileged route access (`/admin`, `/audit`, `/dev`)
- Replay defense, issuer allowlist, revocation/suspension, audit logging

### Target product
- DID-based user identity/profile
- GitHub OAuth account linking
- GitHub activity ingestion
- Credential issuance based on verified GitHub activity and portfolio evidence
- Public portfolio page
- Recruiter-facing verification page
- VC validity/status checks for portfolio claims

## Requirement-by-Requirement Assessment

| Requirement | Status in current repo | Notes |
| --- | --- | --- |
| DID creation / connection | Partial | Holder DID exists, but profile/account model is missing |
| Profile creation | Missing | No user profile or portfolio profile feature |
| GitHub OAuth integration | Missing | No OAuth flow or token storage |
| GitHub activity collection | Missing | No GitHub API ingestion pipeline |
| Human-readable evidence summaries | Missing | No transformation from GitHub data to portfolio claims |
| VC issuance | Partial | Exists, but only role VC issuance |
| Portfolio-specific VC types | Missing | Need account ownership and contribution credentials |
| Public portfolio page | Missing | UI is built around issuer/wallet/verifier, not public portfolio display |
| Verification page for recruiters | Partial | Verification exists, but only for login flow, not portfolio claim verification UX |
| Admin review / issuer dashboard | Partial | Issuer exists, but not request review for portfolio evidence |
| Credential status check | Present | Can be reused |
| Audit logging | Present | Can be reused |
| Replay protection / signature validation | Present | Strong reusable core |

## What Can Be Reused

### Reuse with minimal change
1. **did:jwk utilities**
   - holder DID creation and resolution logic is directly reusable
2. **JOSE VC/VP signing and verification helpers**
   - reusable for portfolio credentials
3. **Credential status model**
   - `active / suspended / revoked` is still useful
4. **Issuer trust validation**
   - reusable for recruiter verification
5. **Audit logging**
   - reusable for credential issuance and verification events
6. **SQLite-backed local MVP persistence approach**
   - still valid for MVP if PostgreSQL is deferred

### Reuse with moderate refactor
1. **Issuer module**
   - can become a portfolio credential issuer/reviewer module
2. **Wallet module**
   - can store portfolio credentials instead of admin role credentials
3. **Verifier module**
   - can be repurposed to validate public portfolio credentials rather than session login only
4. **Frontend shell**
   - routes/components can be reshaped into dashboard / portfolio / verification pages

## What Must Be Replaced or Added

### Replace
1. **RBAC-first product framing**
   - `/admin`, `/audit`, `/dev` protected-route demo should no longer be the primary UX
2. **Role credential schema**
   - current `Admin/Auditor/Developer` credential model does not represent portfolio proof
3. **Verifier success output**
   - current output is session issuance; target output is public proof validation

### Add
1. **User domain model**
   - user
   - profile
   - linked GitHub account
   - public portfolio slug
2. **GitHub OAuth flow**
   - link GitHub account to DID-owning user
3. **GitHub activity ingestion**
   - repositories, commits, PRs, merged PRs, contribution windows
4. **Evidence normalization layer**
   - convert raw GitHub data into human-readable claims
5. **Portfolio credential types**
   - `GitHubAccountOwnershipCredential`
   - `GitHubContributionCredential`
6. **Portfolio publication model**
   - public portfolio page with bio, projects, credentials, verification badges
7. **Recruiter verification page**
   - view credential summary, issuer, signature verification, status, expiry
8. **Issuer review workflow**
   - request evidence -> review -> issue credential

## Recommended MVP Redefinition

To keep scope realistic, redefine the MVP around only two credential types.

### Credential type 1: GitHub Account Ownership Credential
Claims:
- subject DID
- github username
- github profile URL
- verifiedAt
- issuer DID
- issuedAt
- expiration
- status

Purpose:
- prove that the DID owner linked and verified control of a GitHub account

### Credential type 2: GitHub Contribution Credential
Claims:
- subject DID
- repository
- contribution role/category
- commit count
- merged PR count
- period start/end
- evidence summary
- issuer DID
- issuedAt
- expiration
- status

Purpose:
- prove contribution activity in a way a recruiter can quickly inspect and verify

## Target UX Redesign

### Public pages
1. **Landing page**
   - explain verifiable developer portfolio
2. **Login / onboarding**
   - create DID or connect existing identity
   - link GitHub
3. **Dashboard**
   - GitHub sync summary
   - request credential issuance
   - view issued credentials
4. **Public portfolio page**
   - bio
   - featured projects
   - GitHub activity summary
   - issued credentials with verification badges
5. **Verification page**
   - credential details
   - issuer identity
   - signature status
   - expiration and revocation status
6. **Issuer/admin page**
   - pending requests
   - evidence review
   - issue/revoke credentials

## Suggested Backend Refactor Plan

### Phase 1 - domain reshape
Introduce domain entities:
- users
- profiles
- github_accounts
- github_activity_snapshots
- credential_requests
- credentials
- verification_logs

### Phase 2 - schema redesign
Replace role-based credential schema with portfolio-oriented schema.
Keep shared signing/verification and status checking infrastructure.

### Phase 3 - GitHub integration
Implement:
- OAuth start/callback
- token persistence
- profile fetch
- repo/contribution summary fetch

### Phase 4 - portfolio issuance workflow
Implement:
- request credential issuance from synced GitHub evidence
- issuer review flow
- issuance of account ownership credential
- issuance of contribution credential

### Phase 5 - public verification UX
Implement:
- public portfolio route
- credential detail modal/page
- verification route that validates VC and displays result clearly

### Phase 6 - cleanup
Deprecate or remove:
- RBAC demo routes
- session-cookie-centric verifier success path
- protected console flow as main narrative

## Fastest Path to a Useful MVP

If speed matters, do **not** rebuild everything.

### Keep
- Express backend
- React frontend
- SQLite for MVP
- shared DID/VC/JOSE validation logic

### Change immediately
- rename product narrative and routes
- add GitHub account linking
- add portfolio/user models
- redefine VC schemas
- build public portfolio + verification page

### Defer
- PostgreSQL
- blockchain anchoring
- complex scoring/ranking
- multiple DID methods
- mobile app
- awards/completion ingestion beyond manual entry

## Priority Backlog

### P0 - required to match the original requirement
1. Replace RBAC product framing with portfolio framing
2. Add user/profile/public portfolio data model
3. Add GitHub OAuth integration
4. Add GitHub activity ingestion
5. Implement `GitHubAccountOwnershipCredential`
6. Implement `GitHubContributionCredential`
7. Build public portfolio page
8. Build recruiter verification page

### P1 - strong MVP quality improvements
1. Add issuance request workflow
2. Add issuer evidence review UI
3. Show credential status and expiration badges clearly
4. Add manual award/completion evidence input
5. Add verification log history per portfolio

### P2 - post-MVP
1. PostgreSQL migration
2. on-chain hash anchoring or status anchoring
3. richer DID method abstraction (`did:ethr`, etc.)
4. advanced trust registries

## Final Judgment

### Is the repository complete?
- **As an RBAC admin-login MVP:** Yes, largely complete
- **As the originally requested verifiable developer portfolio service:** No

### Best interpretation
This repository should be treated as a **technical foundation** for the intended service, not the final service itself.
