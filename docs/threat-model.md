# Threat Model

## Assets
- Issuer private key
- Holder private keys
- VC JWTs
- VP JWTs
- Session cookies
- Audit logs

## Trust boundaries
1. Browser UI ??API server
2. Issuer module ??wallet storage
3. Wallet encrypted-at-rest storage ??holder consent flow
4. Verifier ??session subsystem
5. SQLite state store ??validation logic

## Key threats and mitigations
- Replay of VP ??one-time state, one-time nonce, replay cache keyed by VP jti
- Tampered VC/VP ??JOSE signature verification with did:jwk public key resolution
- Stolen session cookie ??HttpOnly cookie, explicit logout, TTL, session renewal by re-authentication
- Cross-site request forgery ??sameSite=lax + CSRF header check on logout and future state-changing endpoints
- Misissued or untrusted issuer ??issuer allowlist bound to local keystore DID
- Revoked/suspended credential reuse ??local status registry enforced during verification
- Wrong audience ??VP aud must match verifier client_id
- Holder substitution ??VC subject DID and VP signer DID must match
