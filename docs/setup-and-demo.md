# Setup and Demo Guide

## 1. Local environment

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

## 2. Required environment variables

Minimal local development values:

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

## 3. GitHub OAuth app setup

Create a GitHub OAuth app and configure:
- **Application name**: Verifiable Developer Portfolio MVP
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173/github/callback`

Then copy the client id and secret into `.env`.

If `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are empty, the portfolio still runs locally, but live GitHub OAuth exchange will fail.

## 4. Fast demo path

This repo seeds a local demo portfolio automatically.

### Demo persona
- portfolio slug: `sjw-dev`
- dashboard: <http://localhost:5173/>
- public portfolio: <http://localhost:5173/portfolio/sjw-dev>
- recruiter verification: open any credential card from the public portfolio or dashboard

### What the seeded demo shows
- DID-backed profile
- GitHub evidence snapshot
- featured projects
- manual achievements
- issued credentials
- recruiter verification links
- issuer/admin review queue

## 5. Recommended demo script

### A. Developer story
1. Open the dashboard.
2. Explain that the product is a **verifiable developer portfolio**, not just a GitHub stats page.
3. Use the onboarding checklist to show the end-to-end path: profile → GitHub sync → evidence → request review → issue credential → verify.
4. Show profile editing, featured projects, and manual achievements.
5. Trigger GitHub connect or describe the seeded GitHub evidence if live OAuth is not configured.
6. Submit a credential request using either the GitHub contribution template or the achievement template.

### B. Issuer/admin story
1. Scroll to the review queue.
2. Open a pending request.
3. Approve it and explain that the platform is issuing a VC after review, not just displaying raw activity.
4. Show issued credentials and registry controls.
5. Change a credential status to `suspended` or `revoked`.

### C. Recruiter story
1. Open the public portfolio page.
2. Show the credentials section.
3. Open a recruiter verification page from one credential.
4. Explain the meaning of:
   - signature validity
   - issuer DID
   - credential status
   - expiry
5. If you changed the credential status during the admin demo, show that the recruiter page now reflects the new registry state.

## 6. Suggested talking points

### Why not just show a GitHub link?
Because a GitHub link alone does not give a recruiter a signed, issuer-reviewed claim they can verify independently.

Use this one-line pitch in demos:
> "This product does not just show where I worked — it lets me submit verified evidence as recruiter-checkable credentials."

### Why DID / VC here?
Because the developer should be able to hold and present portable credentials, while the recruiter should be able to verify issuer signatures and credential status without trusting a hidden database record alone.

### Why keep most data off-chain?
Portfolio content, GitHub sync data, and evidence payloads change often and are better stored off-chain. The verifiable layer is the signed credential and its status model.

## 7. Verification checklist before sharing

Run:

```bash
npm test
npm run build
```

Check manually:
- dashboard loads
- public portfolio route works
- recruiter verification route works
- request approval works
- status change to active/suspended/revoked works
- GitHub OAuth callback matches your GitHub app settings

## 8. Known MVP limitations

- GitHub contribution counts are still partly heuristic.
- Admin review is local-first, not hardened multi-user auth.
- SQLite is fine for MVP/demo, but not the final production persistence choice.
- Legacy RBAC routes still exist in the repo for backward compatibility.
