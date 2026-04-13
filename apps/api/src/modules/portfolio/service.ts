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

function maskToken(token: string | null | undefined) {
  if (!token) return null;
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

async function githubRequest<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "did-vc-rbac-mvp",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`github api ${response.status}: ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function exchangeGitHubCodeForToken(config: any, code: string) {
  if (!config.githubClientId || !config.githubClientSecret || /placeholder/.test(config.githubClientId) || /placeholder/.test(config.githubClientSecret)) {
    throw new Error("github oauth env is not configured");
  }

  const response = await fetch(config.githubTokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "did-vc-rbac-mvp"
    },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
      redirect_uri: config.githubCallbackUrl
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    throw new Error(body.error_description || body.error || `token exchange failed (${response.status})`);
  }

  return {
    accessToken: String(body.access_token),
    tokenType: String(body.token_type ?? "bearer"),
    scope: String(body.scope ?? "")
  };
}

async function fetchGitHubPortfolioData(config: any, accessToken: string) {
  const apiBase = config.githubApiBaseUrl.replace(/\/$/, "");
  const profile = await githubRequest<any>(`${apiBase}/user`, accessToken);
  const repos = await githubRequest<any[]>(`${apiBase}/user/repos?per_page=100&sort=updated`, accessToken);
  const ownedRepos = repos.filter((repo) => !repo.fork);
  const topRepos = ownedRepos
    .sort((a, b) => (b.stargazers_count + b.watchers_count) - (a.stargazers_count + a.watchers_count))
    .slice(0, 6);

  const contributionSummary = {
    repositoryCount: repos.length,
    ownedRepositoryCount: ownedRepos.length,
    totalStars: repos.reduce((sum, repo) => sum + Number(repo.stargazers_count ?? 0), 0),
    totalForks: repos.reduce((sum, repo) => sum + Number(repo.forks_count ?? 0), 0),
    languages: [...new Set(ownedRepos.map((repo) => repo.language).filter(Boolean))].slice(0, 12),
    publicRepoCount: Number(profile.public_repos ?? ownedRepos.filter((repo) => !repo.private).length),
    followers: Number(profile.followers ?? 0),
    following: Number(profile.following ?? 0)
  };

  return {
    profile: {
      githubUserId: String(profile.id),
      username: String(profile.login),
      displayName: profile.name ? String(profile.name) : String(profile.login),
      profileUrl: String(profile.html_url),
      avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
      bio: profile.bio ? String(profile.bio) : null,
      location: profile.location ? String(profile.location) : null,
      company: profile.company ? String(profile.company) : null,
      blog: profile.blog ? String(profile.blog) : null
    },
    topRepos: topRepos.map((repo) => ({
      githubRepoId: String(repo.id),
      name: String(repo.name),
      fullName: String(repo.full_name),
      description: repo.description ? String(repo.description) : null,
      repoUrl: String(repo.html_url),
      homepageUrl: repo.homepage ? String(repo.homepage) : null,
      language: repo.language ? String(repo.language) : null,
      stargazersCount: Number(repo.stargazers_count ?? 0),
      forksCount: Number(repo.forks_count ?? 0),
      watchersCount: Number(repo.watchers_count ?? 0),
      openIssuesCount: Number(repo.open_issues_count ?? 0),
      defaultBranch: repo.default_branch ? String(repo.default_branch) : null,
      pushedAt: repo.pushed_at ? String(repo.pushed_at) : null,
      updatedAt: repo.updated_at ? String(repo.updated_at) : null,
      contributionRole: repo.owner?.login === profile.login ? "owner" : "contributor",
      estimatedContributionCount: Math.max(1, Number(repo.stargazers_count ?? 0) + Number(repo.forks_count ?? 0) + 1),
      estimatedMergedPrCount: repo.owner?.login === profile.login ? 0 : 1
    })),
    contributionSummary
  };
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

export function replacePortfolioProjects(db: any, userId: string, projects: Array<{
  name: string;
  description?: string;
  repoUrl?: string;
  liveUrl?: string;
  highlights?: string[];
  featured?: boolean;
  sortOrder?: number;
}>) {
  db.prepare("DELETE FROM portfolio_projects WHERE user_id = ?").run(userId);
  for (const [index, project] of projects.entries()) {
    saveProject(db, userId, {
      ...project,
      sortOrder: project.sortOrder ?? index + 1
    });
  }
  return db.prepare("SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(userId)
    .map((project: any) => ({ ...project, highlights: JSON.parse(project.highlights_json ?? "[]") }));
}

export function updatePortfolioProfile(db: any, userId: string, input: {
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  portfolioSlug?: string;
}) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) throw new Error("user not found");
  const timestamp = nowMillis();
  const nextSlug = input.portfolioSlug ? slugify(input.portfolioSlug) : user.portfolio_slug;
  db.prepare(`UPDATE users
    SET display_name = ?, headline = ?, bio = ?, location = ?, avatar_url = ?, portfolio_slug = ?, updated_at = ?
    WHERE id = ?`)
    .run(
      input.displayName ?? user.display_name,
      input.headline ?? user.headline,
      input.bio ?? user.bio,
      input.location ?? user.location,
      input.avatarUrl ?? user.avatar_url,
      nextSlug,
      timestamp,
      userId
    );
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

export async function issueGitHubAccountOwnershipCredential(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: {
  userId: string;
  subjectDid: string;
  githubUsername: string;
  githubProfileUrl: string;
  expiresInSeconds?: number;
}) {
  const existing = db.prepare("SELECT credential_jti FROM portfolio_credentials WHERE user_id = ? AND credential_type = ? ORDER BY created_at DESC LIMIT 1").get(input.userId, "GitHubAccountOwnershipCredential");
  if (existing) return existing;

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
    .run(jti, input.userId, "GitHubAccountOwnershipCredential", vcJwt, JSON.stringify({ title: "GitHub account ownership verified", githubUsername: input.githubUsername, githubProfileUrl: input.githubProfileUrl, verifiedAt: iat }), iat, exp, timestamp);
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
  const existing = db.prepare("SELECT credential_jti FROM portfolio_credentials WHERE user_id = ? AND credential_type = ? AND json_extract(summary_json, '$.repository') = ? ORDER BY created_at DESC LIMIT 1").get(input.userId, "GitHubContributionCredential", input.repository);
  if (existing) return existing;

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
    .run(jti, input.userId, "GitHubContributionCredential", vcJwt, JSON.stringify({ title: `${input.repository} contribution verified`, repository: input.repository, repositoryUrl: input.repositoryUrl, role: input.role, commitCount: input.commitCount, mergedPrCount: input.mergedPrCount, periodStart: input.periodStart, periodEnd: input.periodEnd, evidenceSummary: input.evidenceSummary }), iat, exp, timestamp);
  return { claims, vcJwt };
}

export function listPortfolioCredentials(db: any, userId: string) {
  return db.prepare("SELECT * FROM portfolio_credentials WHERE user_id = ? ORDER BY issued_at DESC").all(userId);
}

function upsertGitHubSync(db: any, userId: string, sync: Awaited<ReturnType<typeof fetchGitHubPortfolioData>>, accessToken: string, scope: string) {
  const timestamp = nowMillis();
  db.prepare(`INSERT INTO github_accounts(user_id, github_user_id, username, profile_url, access_token, scope, status, linked_at, updated_at, profile_json, contribution_summary_json)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      github_user_id = excluded.github_user_id,
      username = excluded.username,
      profile_url = excluded.profile_url,
      access_token = excluded.access_token,
      scope = excluded.scope,
      status = excluded.status,
      linked_at = COALESCE(github_accounts.linked_at, excluded.linked_at),
      updated_at = excluded.updated_at,
      profile_json = excluded.profile_json,
      contribution_summary_json = excluded.contribution_summary_json`)
    .run(userId, sync.profile.githubUserId, sync.profile.username, sync.profile.profileUrl, accessToken, scope, "linked", timestamp, timestamp, JSON.stringify(sync.profile), JSON.stringify(sync.contributionSummary));

  db.prepare("DELETE FROM github_repositories WHERE user_id = ?").run(userId);
  const insertRepo = db.prepare(`INSERT INTO github_repositories(user_id, github_repo_id, name, full_name, description, repo_url, homepage_url, language, stargazers_count, forks_count, watchers_count, open_issues_count, default_branch, pushed_at, updated_at, contribution_role, estimated_contribution_count, estimated_merged_pr_count, summary_json)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const repo of sync.topRepos) {
    insertRepo.run(userId, repo.githubRepoId, repo.name, repo.fullName, repo.description, repo.repoUrl, repo.homepageUrl, repo.language, repo.stargazersCount, repo.forksCount, repo.watchersCount, repo.openIssuesCount, repo.defaultBranch, repo.pushedAt, repo.updatedAt, repo.contributionRole, repo.estimatedContributionCount, repo.estimatedMergedPrCount, JSON.stringify(repo));
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  db.prepare(`UPDATE users SET display_name = COALESCE(display_name, ?), bio = COALESCE(bio, ?), location = COALESCE(location, ?), avatar_url = COALESCE(avatar_url, ?), updated_at = ? WHERE id = ?`)
    .run(sync.profile.displayName, sync.profile.bio, sync.profile.location, sync.profile.avatarUrl, timestamp, userId);

  const existingProjects = db.prepare("SELECT COUNT(*) as count FROM portfolio_projects WHERE user_id = ?").get(userId);
  if (!existingProjects?.count) {
    for (const [index, repo] of sync.topRepos.slice(0, 3).entries()) {
      saveProject(db, userId, {
        name: repo.fullName,
        description: repo.description ?? `Top synced GitHub repository for @${sync.profile.username}`,
        repoUrl: repo.repoUrl,
        liveUrl: repo.homepageUrl ?? undefined,
        highlights: [
          `Language: ${repo.language ?? 'n/a'}`,
          `Stars: ${repo.stargazersCount}`,
          `Estimated contribution score: ${repo.estimatedContributionCount}`
        ],
        featured: index === 0,
        sortOrder: index + 1
      });
    }
  }

  return {
    user,
    github: db.prepare("SELECT * FROM github_accounts WHERE user_id = ?").get(userId),
    repositories: db.prepare("SELECT * FROM github_repositories WHERE user_id = ? ORDER BY stargazers_count DESC, updated_at DESC").all(userId)
      .map((repo: any) => ({ ...repo, summary: JSON.parse(repo.summary_json ?? "{}") }))
  };
}

export async function syncGitHubAccount(db: any, config: any, userId: string, accessToken?: string, scope = "read:user repo") {
  const account = db.prepare("SELECT * FROM github_accounts WHERE user_id = ?").get(userId);
  const token = accessToken ?? account?.access_token;
  if (!token) throw new Error("github account is not linked");
  const sync = await fetchGitHubPortfolioData(config, token);
  return upsertGitHubSync(db, userId, sync, token, scope);
}

export function getPublicPortfolioBySlug(db: any, slug: string) {
  const user = db.prepare("SELECT * FROM users WHERE portfolio_slug = ?").get(slug);
  if (!user) return null;
  const github = db.prepare("SELECT * FROM github_accounts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").get(user.id);
  const projects = db.prepare("SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(user.id)
    .map((project: any) => ({ ...project, highlights: JSON.parse(project.highlights_json ?? "[]") }));
  const credentials = listPortfolioCredentials(db, user.id).map((item: any) => ({ ...item, summary: JSON.parse(item.summary_json ?? "{}") }));
  const repositories = db.prepare("SELECT * FROM github_repositories WHERE user_id = ? ORDER BY stargazers_count DESC, updated_at DESC LIMIT 6").all(user.id)
    .map((repo: any) => ({ ...repo, summary: JSON.parse(repo.summary_json ?? "{}") }));
  const verificationLogs = db.prepare("SELECT * FROM verification_logs WHERE portfolio_slug = ? ORDER BY created_at DESC LIMIT 10").all(slug);
  return {
    profile: user,
    github: github ? {
      ...github,
      access_token: undefined,
      accessTokenMasked: maskToken(github.access_token),
      profile: JSON.parse(github.profile_json ?? "{}"),
      contributionSummary: JSON.parse(github.contribution_summary_json ?? "{}")
    } : null,
    projects,
    repositories,
    credentials,
    verificationLogs
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

export async function completeGitHubOAuthCallback(db: any, config: any, query: { code?: string; state?: string }) {
  if (!query.state) return { ok: false, error: "missing state" };
  const oauthState = db.prepare("SELECT * FROM github_oauth_states WHERE state = ?").get(query.state);
  if (!oauthState) return { ok: false, error: "invalid state" };
  if (oauthState.expires_at < nowMillis()) return { ok: false, error: "expired state" };
  if (!query.code) return { ok: false, error: "missing code" };

  db.prepare("DELETE FROM github_oauth_states WHERE state = ?").run(query.state);
  const exchanged = await exchangeGitHubCodeForToken(config, query.code);
  const sync = await syncGitHubAccount(db, config, oauthState.user_id, exchanged.accessToken, exchanged.scope);

  return {
    ok: true,
    mode: "live",
    message: "GitHub OAuth exchange completed and portfolio evidence synced.",
    userId: oauthState.user_id,
    githubUsername: sync.github.username,
    repositoryCount: sync.repositories.length,
    scope: exchanged.scope,
    portfolioSlug: db.prepare("SELECT portfolio_slug FROM users WHERE id = ?").get(oauthState.user_id)?.portfolio_slug ?? null
  };
}

export async function issuePortfolioCredentialsFromEvidence(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: {
  userId: string;
  repositoryName?: string;
  role?: string;
  commitCount?: number;
  mergedPrCount?: number;
  periodStart?: string;
  periodEnd?: string;
  evidenceSummary?: string;
}) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(input.userId);
  if (!user) throw new Error("user not found");
  const github = db.prepare("SELECT * FROM github_accounts WHERE user_id = ?").get(input.userId);
  if (!github?.username || !github?.profile_url) throw new Error("github account is not linked");
  const repo = input.repositoryName
    ? db.prepare("SELECT * FROM github_repositories WHERE user_id = ? AND name = ?").get(input.userId, input.repositoryName)
    : db.prepare("SELECT * FROM github_repositories WHERE user_id = ? ORDER BY stargazers_count DESC, updated_at DESC LIMIT 1").get(input.userId);
  if (!repo) throw new Error("no synced github repository available");

  const ownership = await issueGitHubAccountOwnershipCredential(db, issuer, {
    userId: input.userId,
    subjectDid: user.did,
    githubUsername: github.username,
    githubProfileUrl: github.profile_url
  });

  const contribution = await issueGitHubContributionCredential(db, issuer, {
    userId: input.userId,
    subjectDid: user.did,
    repository: repo.name,
    repositoryUrl: repo.repo_url,
    role: input.role ?? repo.contribution_role ?? "contributor",
    commitCount: input.commitCount ?? repo.estimated_contribution_count ?? 1,
    mergedPrCount: input.mergedPrCount ?? repo.estimated_merged_pr_count ?? 0,
    periodStart: input.periodStart ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
    periodEnd: input.periodEnd ?? new Date().toISOString().slice(0, 10),
    evidenceSummary: input.evidenceSummary ?? `Synced GitHub evidence for ${github.username} on ${repo.full_name}.`
  });

  return {
    ownership,
    contribution,
    credentials: listPortfolioCredentials(db, input.userId).map((item: any) => ({ ...item, summary: JSON.parse(item.summary_json ?? "{}") }))
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

  db.prepare(`INSERT INTO github_accounts(user_id, github_user_id, username, profile_url, access_token, scope, status, linked_at, updated_at, profile_json, contribution_summary_json)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, "9919", "sjw-dev", "https://github.com/sjw-dev", "skeleton-token", "read:user repo", "linked-demo", nowMillis(), nowMillis(), JSON.stringify({ username: "sjw-dev", displayName: "Seongjun Won", profileUrl: "https://github.com/sjw-dev" }), JSON.stringify({ repositoryCount: 1, ownedRepositoryCount: 1, totalStars: 3, totalForks: 0, languages: ["TypeScript"] }));

  db.prepare(`INSERT INTO github_repositories(user_id, github_repo_id, name, full_name, description, repo_url, homepage_url, language, stargazers_count, forks_count, watchers_count, open_issues_count, default_branch, pushed_at, updated_at, contribution_role, estimated_contribution_count, estimated_merged_pr_count, summary_json)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, "demo-repo-1", "did-vc-rbac-mvp", "sjw-dev/did-vc-rbac-mvp", "Refactoring an RBAC demo into a verifiable developer portfolio service.", "https://github.com/sjw-dev/did-vc-rbac-mvp", null, "TypeScript", 3, 0, 3, 0, "main", new Date().toISOString(), new Date().toISOString(), "owner", 28, 6, JSON.stringify({ language: "TypeScript", stars: 3, contributionRole: "owner" }));

  saveProject(db, user.id, {
    name: "did-vc-rbac-mvp",
    description: "Refactoring an RBAC demo into a verifiable developer portfolio service.",
    repoUrl: "https://github.com/sjw-dev/did-vc-rbac-mvp",
    highlights: [
      "DID-based identity bootstrap",
      "VC issuance and recruiter verification flow",
      "GitHub OAuth and portfolio evidence sync"
    ],
    featured: true,
    sortOrder: 1
  });

  await issuePortfolioCredentialsFromEvidence(db, issuer, {
    userId: user.id,
    repositoryName: "did-vc-rbac-mvp",
    role: "core contributor",
    commitCount: 28,
    mergedPrCount: 6,
    periodStart: "2026-03-01",
    periodEnd: "2026-04-13",
    evidenceSummary: "Contributed the DID/VC verification pipeline and refactored the product toward a verifiable developer portfolio experience."
  });

  return getPublicPortfolioBySlug(db, "sjw-dev");
}
