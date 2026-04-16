# Final Submission Checklist

Use this right before demo, submission, or repository handoff.

## 1. Product story sanity check

You should be able to say all of these without hesitation:
- This is a **verifiable developer portfolio**, not just a GitHub dashboard.
- GitHub evidence is combined with **curated projects** and **non-GitHub achievements**.
- Evidence becomes an **issuer-reviewed credential**, not just a displayed claim.
- Recruiters can verify **signature**, **issuer**, **status**, and **expiry**.

## 2. Demo path sanity check

Recommended order:
1. Dashboard
2. Public Portfolio
3. Request review
4. Approve and issue
5. Recruiter verification

If time is short, still make sure you show:
- one GitHub evidence section
- one manual achievement
- one issued credential
- one verification page

## 3. Required routes to test manually

Open and confirm these work:
- `/`
- `/portfolio/sjw-dev`
- `/verify/<some-issued-jti>`
- `/legacy`

Also verify that legacy RBAC routes still open if you intend to mention backward compatibility:
- `/issuer`
- `/wallet`
- `/verifier`
- `/admin`
- `/audit`
- `/dev`

## 4. Functional checklist

### Developer flow
- [ ] dashboard loads
- [ ] profile fields can be edited
- [ ] featured projects render correctly
- [ ] manual achievements render correctly
- [ ] GitHub evidence section renders correctly
- [ ] request form works in GitHub mode
- [ ] request form works in achievement mode

### Issuer/admin flow
- [ ] review queue is visible
- [ ] pending request can be approved
- [ ] pending request can be rejected
- [ ] issued credentials list renders correctly
- [ ] credential status can change to `active`
- [ ] credential status can change to `suspended`
- [ ] credential status can change to `revoked`

### Recruiter flow
- [ ] public portfolio loads cleanly
- [ ] credential cards are readable without opening raw JSON first
- [ ] verification page shows final trust decision clearly
- [ ] verification page shows signature / status / expiry clearly
- [ ] suspended/revoked state appears correctly after admin change

## 5. Build and test checklist

Run:

```bash
npm test
npm run build
```

Expected:
- all tests pass
- build succeeds for api/web/shared

## 6. Environment checklist

Before live demo with OAuth:
- [ ] `GITHUB_CLIENT_ID` set
- [ ] `GITHUB_CLIENT_SECRET` set
- [ ] `GITHUB_CALLBACK_URL` matches GitHub OAuth app config
- [ ] GitHub app homepage/callback URLs match actual demo URL

If OAuth is not configured:
- [ ] use seeded demo data
- [ ] explain that live OAuth is optional for local MVP demonstration

## 7. Submission checklist

Before sending repo/demo:
- [ ] README reflects current product direction
- [ ] setup/demo guide reflects actual demo flow
- [ ] demo talk track is rehearsed or ready to reference
- [ ] final pitch is short and clear
- [ ] no accidental secrets in committed files
- [ ] runtime SQLite noise is not mistaken for source changes

## 8. Known limitations to state honestly

Use these if asked what is still unfinished:
- GitHub evidence is stronger now, but still not a full historical event-ingestion pipeline.
- Admin review is local-first and not production-hardened multi-user auth.
- SQLite/local storage is appropriate for MVP/demo, not the final production architecture.
- UI quality is much better now, but still intentionally MVP-level rather than polished design-system quality.

## 9. One-line pitch

> Verifiable Developer Portfolio MVP turns GitHub work, curated projects, and non-GitHub achievements into issuer-reviewed credentials that recruiters can inspect and verify through signature, status, and expiry checks.

## 10. Final verdict guide

You can reasonably call this:
- **demo-ready**
- **submission-ready MVP**
- **portfolio-first DID/VC product prototype**

You should still avoid calling it:
- fully production-ready
- final polished SaaS
- complete GitHub forensic attribution system
