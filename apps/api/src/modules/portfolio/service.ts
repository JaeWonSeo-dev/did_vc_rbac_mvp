import { randomUUID } from "node:crypto";
import { signVcJwt, verifyVcJwt, type GitHubAccountOwnershipVcClaims, type GitHubContributionVcClaims } from "@did-vc-rbac/shared";

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function nowMillis() {
  return Date.now();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `portfolio-${randomUUID().slice(0, 8)}`;
}

export function upsertUserProfile(db: any, input: {
  did: string;
  displayName: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  portfolioSlug?: string;
}) {
  const existing = db.prepare("SELECT * FROM users WHERE did = ?").get(input.did);
  const timestamp = nowMillis();
  const portfolioSlug = input.portfolioSlug ?? slugify(input.displayName || input.did);
  if (existing) {
    db.prepare(`UPDATE users SET display_name = ?, headline = ?, bio = ?, location = ?, avatar_url = ?, portfolio_slug = ?, updated_at = ? WHERE did = ?`)
      .run(input.displayName, input.headline ?? null, input.bio ?? null, input.location ?? null, input.avatarUrl ?? null, portfolioSlug, timestamp, input.did);
    return db.prepare("SELECT * FROM users WHERE did = ?").get(input.did);
  }

  const id = randomUUID();
  db.prepare(`INSERT INTO users(id, did, display_name, headline, bio, location, avatar_url, portfolio_slug, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, input.did, input.displayName, input.headline ?? null, input.bio ?? null, input.location ?? null, input.avatarUrl ?? null, portfolioSlug, timestamp, timestamp);
  return db.prepare("SELECT * FROM users WHERE did = ?").get(input.did);
}

export function saveProject(db: any, userId: string, project: {
  name: string;
  description?: string;
  repoUrl?: string;
  liveUrl?: string;
  highlights?: string[];
  featured?: boolean;
  sortOrder?: number;
}) {
  db.prepare(`INSERT INTO portfolio_projects(user_id, name, description, repo_url, live_url, highlights_json, featured, sort_order)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, project.name, project.description ?? null, project.repoUrl ?? null, project.liveUrl ?? null, JSON.stringify(project.highlights ?? []), project.featured ? 1 : 0, project.sortOrder ?? 0);
}

export async function issueGitHubAccountOwnershipCredential(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: {
  userId: string;
  subjectDid: string;
  githubUsername: string;
  githubProfileUrl: string;
  expiresInSeconds?: number;
}) {
  const jti = randomUUID();
  const iat = nowSeconds();
  const exp = iat + (input.expiresInSeconds ?? 60 * 60 * 24 * 180);
  const claims: GitHubAccountOwnershipVcClaims = {
    jti,
    iss: issuer.did,
    sub: input.subjectDid,
    iat,
    exp,
    vc: {
      type: ["VerifiableCredential", "GitHubAccountOwnershipCredential"],
      credentialSubject: {
        id: input.subjectDid,
        githubUsername: input.githubUsername,
        githubProfileUrl: input.githubProfileUrl,
        verifiedAt: iat
      },
      credentialStatus: {
        id: `status:${jti}`,
        type: "LocalCredentialStatus"
      }
    }
  };

  const vcJwt = await signVcJwt(claims, issuer.privateJwk);
  const timestamp = nowMillis();
  db.prepare(`INSERT INTO portfolio_credentials(credential_jti, user_id, credential_type, vc_jwt, summary_json, status, issued_at, expires_at, created_at)
    VALUES(?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
    .run(
      jti,
      input.userId,
      "GitHubAccountOwnershipCredential",
      vcJwt,
      JSON.stringify({
        title: "GitHub account ownership verified",
        githubUsername: input.githubUsername,
        githubProfileUrl: input.githubProfileUrl,
        verifiedAt: iat
      }),
      iat,
      exp,
      timestamp
    );
  return { claims, vcJwt };
}

export async function issueGitHubContributionCredential(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: {
  userId: string;
  subjectDid: string;
  repository: string;
  repositoryUrl: string;
  role: string;
  commitCount: number;
  mergedPrCount: number;
  periodStart: string;
  periodEnd: string;
  evidenceSummary: string;
  expiresInSeconds?: number;
}) {
  const jti = randomUUID();
  const iat = nowSeconds();
  const exp = iat + (input.expiresInSeconds ?? 60 * 60 * 24 * 180);
  const claims: GitHubContributionVcClaims = {
    jti,
    iss: issuer.did,
    sub: input.subjectDid,
    iat,
    exp,
    vc: {
      type: ["VerifiableCredential", "GitHubContributionCredential"],
      credentialSubject: {
        id: input.subjectDid,
        repository: input.repository,
        repositoryUrl: input.repositoryUrl,
        role: input.role,
        commitCount: input.commitCount,
        mergedPrCount: input.mergedPrCount,
        period: {
          start: input.periodStart,
          end: input.periodEnd
        },
        evidenceSummary: input.evidenceSummary
      },
      credentialStatus: {
        id: `status:${jti}`,
        type: "LocalCredentialStatus"
      }
    }
  };

  const vcJwt = await signVcJwt(claims, issuer.privateJwk);
  const timestamp = nowMillis();
  db.prepare(`INSERT INTO portfolio_credentials(credential_jti, user_id, credential_type, vc_jwt, summary_json, status, issued_at, expires_at, created_at)
    VALUES(?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
    .run(
      jti,
      input.userId,
      "GitHubContributionCredential",
      vcJwt,
      JSON.stringify({
        title: `${input.repository} contribution verified`,
        repository: input.repository,
        repositoryUrl: input.repositoryUrl,
        role: input.role,
        commitCount: input.commitCount,
        mergedPrCount: input.mergedPrCount,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        evidenceSummary: input.evidenceSummary
      }),
      iat,
      exp,
      timestamp
    );
  return { claims, vcJwt };
}

export function listPortfolioCredentials(db: any, userId: string) {
  return db.prepare("SELECT * FROM portfolio_credentials WHERE user_id = ? ORDER BY issued_at DESC").all(userId);
}

export function getPublicPortfolioBySlug(db: any, slug: string) {
  const user = db.prepare("SELECT * FROM users WHERE portfolio_slug = ?").get(slug);
  if (!user) return null;
  const github = db.prepare("SELECT * FROM github_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(user.id);
  const projects = db.prepare("SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(user.id)
    .map((project: any) => ({ ...project, highlights: JSON.parse(project.highlights_json ?? "[]") }));
  const credentials = listPortfolioCredentials(db, user.id).map((item: any) => ({ ...item, summary: JSON.parse(item.summary_json ?? "{}") }));
  return {
    profile: user,
    github,
    projects,
    credentials
  };
}

export async function verifyPortfolioCredential(db: any, jti: string, verifier = "public-recruiter") {
  const row = db.prepare("SELECT * FROM portfolio_credentials WHERE credential_jti = ?").get(jti);
  if (!row) {
    return { ok: false, error: "credential not found" };
  }
  try {
    const claims = await verifyVcJwt(row.vc_jwt);
    const profile = db.prepare("SELECT portfolio_slug FROM users WHERE id = ?").get(row.user_id);
    db.prepare(`INSERT INTO verification_logs(credential_jti, portfolio_slug, verifier, result, reason, created_at)
      VALUES(?, ?, ?, ?, ?, ?)`)
      .run(jti, profile?.portfolio_slug ?? null, verifier, "valid", "signature and schema verified", nowMillis());
    return {
      ok: true,
      status: row.status,
      credentialType: row.credential_type,
      issuerDid: claims.iss,
      subjectDid: claims.sub,
      expiresAt: row.expires_at,
      portfolioSlug: profile?.portfolio_slug ?? null,
      summary: JSON.parse(row.summary_json ?? "{}"),
      claims
    };
  } catch (error: any) {
    db.prepare(`INSERT INTO verification_logs(credential_jti, portfolio_slug, verifier, result, reason, created_at)
      VALUES(?, ?, ?, ?, ?, ?)`)
      .run(jti, null, verifier, "invalid", String(error?.message ?? "verification failed"), nowMillis());
    return { ok: false, error: String(error?.message ?? "verification failed") };
  }
}

export function createGitHubOAuthStart(db: any, config: any, userId: string) {
  const state = randomUUID();
  const timestamp = nowMillis();
  db.prepare(`INSERT INTO github_oauth_states(state, user_id, redirect_uri, created_at, expires_at)
    VALUES(?, ?, ?, ?, ?)`)
    .run(state, userId, config.githubCallbackUrl, timestamp, timestamp + 10 * 60 * 1000);
  const authorizeUrl = new URL(config.githubAuthorizeUrl);
  authorizeUrl.searchParams.set("client_id", config.githubClientId);
  authorizeUrl.searchParams.set("redirect_uri", config.githubCallbackUrl);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", "read:user repo");
  return { state, authorizeUrl: authorizeUrl.toString() };
}

export function completeGitHubOAuthCallback(db: any, _config: any, query: { code?: string; state?: string }) {
  if (!query.state) return { ok: false, error: "missing state" };
  const oauthState = db.prepare("SELECT * FROM github_oauth_states WHERE state = ?").get(query.state);
  if (!oauthState) return { ok: false, error: "invalid state" };
  if (oauthState.expires_at < nowMillis()) return { ok: false, error: "expired state" };

  db.prepare("DELETE FROM github_oauth_states WHERE state = ?").run(query.state);
  db.prepare("INSERT INTO github_accounts(user_id, status, scope, updated_at) VALUES(?, ?, ?, ?)")
    .run(oauthState.user_id, query.code ? "oauth-linked-skeleton" : "pending", "read:user repo", nowMillis());

  return {
    ok: true,
    mode: "skeleton",
    message: "OAuth callback received. Token exchange and GitHub API sync are intentionally deferred in P0.",
    userId: oauthState.user_id,
    receivedCode: Boolean(query.code)
  };
}

export async function seedPortfolioDemoData(db: any, issuer: { did: string; privateJwk: JsonWebKey }) {
  const existing = db.prepare("SELECT * FROM users WHERE portfolio_slug = ?").get("sjw-dev");
  if (existing) {
    return getPublicPortfolioBySlug(db, "sjw-dev");
  }

  const did = `did:jwk:portfolio-demo-${randomUUID().slice(0, 8)}`;
  const user = upsertUserProfile(db, {
    did,
    displayName: "Seongjun Won",
    headline: "Verifiable developer portfolio MVP builder",
    bio: "Building a DID/VC portfolio service that turns GitHub activity into recruiter-friendly, verifiable credentials.",
    location: "Seoul, KR",
    avatarUrl: "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
    portfolioSlug: "sjw-dev"
  });

  db.prepare(`INSERT INTO github_accounts(user_id, github_user_id, username, profile_url, access_token, scope, status, linked_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, "9919", "sjw-dev", "https://github.com/sjw-dev", "skeleton-token", "read:user repo", "linked-demo", nowMillis(), nowMillis());

  saveProject(db, user.id, {
    name: "did-vc-rbac-mvp",
    description: "Refactoring an RBAC demo into a verifiable developer portfolio service.",
    repoUrl: "https://github.com/sjw-dev/did-vc-rbac-mvp",
    highlights: [
      "DID-based identity bootstrap",
      "VC issuance and recruiter verification flow",
      "GitHub OAuth skeleton for portfolio evidence"
    ],
    featured: true,
    sortOrder: 1
  });

  const ownership = await issueGitHubAccountOwnershipCredential(db, issuer, {
    userId: user.id,
    subjectDid: did,
    githubUsername: "sjw-dev",
    githubProfileUrl: "https://github.com/sjw-dev"
  });

  const contribution = await issueGitHubContributionCredential(db, issuer, {
    userId: user.id,
    subjectDid: did,
    repository: "did-vc-rbac-mvp",
    repositoryUrl: "https://github.com/sjw-dev/did-vc-rbac-mvp",
    role: "core contributor",
    commitCount: 28,
    mergedPrCount: 6,
    periodStart: "2026-03-01",
    periodEnd: "2026-04-13",
    evidenceSummary: "Contributed the DID/VC verification pipeline and began refactoring the product toward a verifiable developer portfolio experience."
  });

  return {
    user,
    ownership,
    contribution
  };
}
