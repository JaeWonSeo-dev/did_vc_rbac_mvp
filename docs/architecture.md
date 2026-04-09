# Architecture

## Goal
Implement a local-first security portfolio project for **DID-based admin login + VC-based RBAC** with minimal deployment complexity.

## Design Principles
- single developer can run it locally
- avoid cloud dependencies
- keep trust boundaries explicit
- prioritize verification and observability over feature sprawl

## Monorepo Structure
- `apps/api` - Express backend
- `apps/web` - React frontend
- `packages/shared` - shared DID/VC/RBAC/validation logic

## Backend Modules
### Issuer
Responsibilities:
- issue VC JWTs
- persist issued credentials
- suspend / revoke credentials
- expose issued credential list

### Wallet Helper
Responsibilities:
- create holder DID (`did:jwk`)
- encrypt and store private JWK locally
- import VC JWTs into encrypted wallet storage
- create VP JWTs for verifier requests

### Verifier
Responsibilities:
- create OpenID4VP-style auth requests
- generate nonce/state with secure randomness
- validate VP/VC cryptographically and semantically
- enforce issuer trust, status, replay, and RBAC
- issue session cookie and CSRF token

### Audit
Responsibilities:
- record auth success/failure
- persist summarized deny reasons for UI-safe display
- retain detailed reasons for troubleshooting and demo evidence

## Shared Package
Contains:
- `did/` - did:jwk creation/import/resolve helpers
- `jose/` - VC/VP JWT sign/verify helpers
- `rbac/` - path-to-role mapping
- `schemas/` - zod schemas and types
- `validation/` - nonce/state, status, role validation

## Storage Model
SQLite tables:
- `credentials`
- `wallet_identities`
- `wallet_credentials`
- `auth_requests`
- `replay_cache`
- `sessions`
- `audit_logs`
- `keystore`

## Trust Boundary
### Trusted
- API verifier logic
- issuer signing key storage
- SQLite auth state persistence

### Untrusted / less trusted
- browser UI
- manually pasted tokens
- request body content until verified

## Session Security
- HttpOnly cookie stores session identifier
- CSRF token stored server-side and required for logout
- role is reloaded from persistent session storage
- session expiry enforced on read

## Auth Request Lifecycle
1. operator chooses target path
2. verifier creates `state` + `nonce`
3. record stored in `auth_requests`
4. wallet receives request and produces VP bound to `aud` and `nonce`
5. verifier validates submission and marks request `used`
6. VP `jti` inserted into replay cache
7. session issued if checks pass

## Validation Checklist
Verifier enforces:
- trusted issuer
- VC signature
- VP signature
- expiration
- credential status
- audience binding
- nonce binding
- state equality
- holder binding
- role/path mapping
- replay detection

## Future Extension Points
- DID method abstraction for `did:ethr`
- standard credential status list support
- secure cookies over HTTPS
- stronger wallet storage and key wrapping
- richer route-level policy expressions
