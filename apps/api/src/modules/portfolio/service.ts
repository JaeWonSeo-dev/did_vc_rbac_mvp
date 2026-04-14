import { randomUUID } from "node:crypto";
import { signVcJwt, verifyVcJwt, type GitHubAccountOwnershipVcClaims, type GitHubContributionVcClaims, type PortfolioAchievementVcClaims } from "@did-vc-rbac/shared";

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

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function isoDateDaysAgo(days: number) {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * days).toISOString().slice(0, 10);
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

async function fetchRepoContributionSignals(apiBase: string, accessToken: string, repo: any) {
  const owner = repo.owner?.login;
  const repoName = repo.name;
  if (!owner || !repoName) {
    return {
      commitCount: Math.max(1, Number(repo.stargazers_count ?? 0) + Number(repo.forks_count ?? 0) + 1),
      mergedPrCount: repo.owner?.login ? 0 : 1,
      pullRequestCount: 0,
      contributorCount: 1,
      confidence: "low",
      proofPoints: ["Repository metadata only"]
    };
  }

  let commitCount = Math.max(1, Number(repo.stargazers_count ?? 0) + Number(repo.forks_count ?? 0) + 1);
  let mergedPrCount = repo.owner?.login === owner ? 0 : 1;
  let pullRequestCount = mergedPrCount;
  let contributorCount = 1;
  const proofPoints: string[] = [];
  let confidence = "heuristic";

  try {
    const pulls = await githubRequest<any[]>(`${apiBase}/repos/${owner}/${repoName}/pulls?state=closed&per_page=50`, accessToken);
    pullRequestCount = pulls.length;
    mergedPrCount = pulls.filter((pull) => Boolean(pull.merged_at)).length;
    if (pullRequestCount) proofPoints.push(`${pullRequestCount} closed PRs inspected`);
    if (mergedPrCount) proofPoints.push(`${mergedPrCount} merged PRs found`);
    confidence = "medium";
  } catch {
    proofPoints.push("PR detail unavailable, fell back to repo metadata");
  }

  try {
    const contributors = await githubRequest<any[]>(`${apiBase}/repos/${owner}/${repoName}/contributors?per_page=20`, accessToken);
    contributorCount = contributors.length || 1;
    const matchedContributor = contributors.find((contributor) => contributor.login === owner);
    if (matchedContributor?.contributions) {
      commitCount = Math.max(commitCount, Number(matchedContributor.contributions));
    }
    if (contributorCount) proofPoints.push(`${contributorCount} contributors observed`);
    confidence = confidence === "medium" ? "high" : "medium";
  } catch {
    proofPoints.push("Contributor stats unavailable, used public metadata estimate");
  }

  if (!proofPoints.length) proofPoints.push("Repository metadata synced");

  return {
    commitCount,
    mergedPrCount,
    pullRequestCount,
    contributorCount,
    confidence,
    proofPoints
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

  const enrichedTopRepos = [];
  for (const repo of topRepos) {
    const signals = await fetchRepoContributionSignals(apiBase, accessToken, repo);
    const contributionRole = repo.owner?.login === profile.login ? "owner" : "contributor";
    const proofSummary = contributionRole === "owner"
      ? `Owns ${repo.full_name}; ${signals.commitCount} observed contributions and ${signals.mergedPrCount} merged PRs across the latest sync window.`
      : `Contributes to ${repo.full_name}; ${signals.commitCount} observed contributions and ${signals.mergedPrCount} merged PRs across the latest sync window.`;

    enrichedTopRepos.push({
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
      contributionRole,
      estimatedContributionCount: signals.commitCount,
      estimatedMergedPrCount: signals.mergedPrCount,
      proofSummary,
      proofPoints: signals.proofPoints,
      confidence: signals.confidence,
      pullRequestCount: signals.pullRequestCount,
      contributorCount: signals.contributorCount,
      activityWindow: {
        start: isoDateDaysAgo(90),
        end: new Date().toISOString().slice(0, 10)
      }
    });
  }

  const contributionSummary = {
    repositoryCount: repos.length,
    ownedRepositoryCount: ownedRepos.length,
    totalStars: repos.reduce((sum, repo) => sum + Number(repo.stargazers_count ?? 0), 0),
    totalForks: repos.reduce((sum, repo) => sum + Number(repo.forks_count ?? 0), 0),
    languages: [...new Set(ownedRepos.map((repo) => repo.language).filter(Boolean))].slice(0, 12),
    publicRepoCount: Number(profile.public_repos ?? ownedRepos.filter((repo) => !repo.private).length),
    followers: Number(profile.followers ?? 0),
    following: Number(profile.following ?? 0),
    totalEstimatedCommits: enrichedTopRepos.reduce((sum, repo) => sum + repo.estimatedContributionCount, 0),
    totalEstimatedMergedPrs: enrichedTopRepos.reduce((sum, repo) => sum + repo.estimatedMergedPrCount, 0),
    evidenceNarrative: enrichedTopRepos.length
      ? `Observed ${enrichedTopRepos.length} high-signal repositories, ${enrichedTopRepos.reduce((sum, repo) => sum + repo.estimatedContributionCount, 0)} contribution events, and ${enrichedTopRepos.reduce((sum, repo) => sum + repo.estimatedMergedPrCount, 0)} merged PRs in the latest 90-day sync window.`
      : "No repository evidence synced yet."
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
    topRepos: enrichedTopRepos,
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
    saveProject(db, userId, { ...project, sortOrder: project.sortOrder ?? index + 1 });
  }
  return db.prepare("SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(userId)
    .map((project: any) => ({ ...project, highlights: parseJson(project.highlights_json, []) }));
}

export function replacePortfolioAchievements(db: any, userId: string, achievements: Array<{
  title: string;
  category: string;
  issuerName?: string;
  issuedOn?: string;
  credentialUrl?: string;
  description?: string;
  evidence?: string[];
  featured?: boolean;
  sortOrder?: number;
}>) {
  const timestamp = nowMillis();
  db.prepare("DELETE FROM portfolio_achievements WHERE user_id = ?").run(userId);
  const insert = db.prepare(`INSERT INTO portfolio_achievements(user_id, title, category, issuer_name, issued_on, credential_url, description, evidence_json, featured, sort_order, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [index, achievement] of achievements.entries()) {
    if (!achievement.title?.trim()) continue;
    insert.run(
      userId,
      achievement.title.trim(),
      achievement.category?.trim() || "manual-achievement",
      achievement.issuerName?.trim() || null,
      achievement.issuedOn?.trim() || null,
      achievement.credentialUrl?.trim() || null,
      achievement.description?.trim() || null,
      JSON.stringify((achievement.evidence ?? []).map((item) => item.trim()).filter(Boolean)),
      achievement.featured ? 1 : 0,
      achievement.sortOrder ?? index + 1,
      timestamp,
      timestamp
    );
  }
  return listPortfolioAchievements(db, userId);
}

export function listPortfolioAchievements(db: any, userId: string) {
  return db.prepare("SELECT * FROM portfolio_achievements WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(userId)
    .map((achievement: any) => ({ ...achievement, evidence: parseJson(achievement.evidence_json, []) }));
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
  return { claims, vcJwt, credentialJti: jti };
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
  return { claims, vcJwt, credentialJti: jti };
}

export async function issuePortfolioAchievementCredential(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: {
  userId: string;
  subjectDid: string;
  achievementId?: number;
  title?: string;
  category?: string;
  issuerName?: string;
  issuedOn?: string;
  credentialUrl?: string;
  description?: string;
  evidence?: string[];
  expiresInSeconds?: number;
}) {
  const achievement = input.achievementId
    ? db.prepare("SELECT * FROM portfolio_achievements WHERE id = ? AND user_id = ?").get(input.achievementId, input.userId)
    : db.prepare("SELECT * FROM portfolio_achievements WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC LIMIT 1").get(input.userId);

  if (!achievement && !input.title?.trim()) {
    throw new Error("no portfolio achievement available");
  }

  const title = input.title?.trim() || achievement.title;
  const category = input.category?.trim() || achievement.category || "manual-achievement";
  const issuerName = input.issuerName?.trim() || achievement?.issuer_name || undefined;
  const issuedOn = input.issuedOn?.trim() || achievement?.issued_on || undefined;
  const credentialUrl = input.credentialUrl?.trim() || achievement?.credential_url || undefined;
  const evidence = (input.evidence ?? parseJson(achievement?.evidence_json, [])).map((item: string) => item.trim()).filter(Boolean);
  const evidenceSummary = input.description?.trim() || achievement?.description || `${title} was added as verified ${category} evidence in the portfolio.`;

  const existing = db.prepare("SELECT credential_jti FROM portfolio_credentials WHERE user_id = ? AND credential_type = ? AND json_extract(summary_json, '$.title') = ? ORDER BY created_at DESC LIMIT 1").get(input.userId, "PortfolioAchievementCredential", title);
  if (existing) return existing;

  const jti = randomUUID();
  const iat = nowSeconds();
  const exp = iat + (input.expiresInSeconds ?? 60 * 60 * 24 * 180);
  const claims: PortfolioAchievementVcClaims = {
    jti,
    iss: issuer.did,
    sub: input.subjectDid,
    iat,
    exp,
    vc: {
      type: ["VerifiableCredential", "PortfolioAchievementCredential"],
      credentialSubject: {
        id: input.subjectDid,
        title,
        category,
        issuerName,
        issuedOn,
        credentialUrl,
        evidenceSummary,
        evidence
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
    .run(jti, input.userId, "PortfolioAchievementCredential", vcJwt, JSON.stringify({ title, category, issuerName, issuedOn, credentialUrl, evidenceSummary, evidence }), iat, exp, timestamp);
  return { claims, vcJwt, credentialJti: jti };
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
          `Language: ${repo.language ?? "n/a"}`,
          `Observed contributions: ${repo.estimatedContributionCount}`,
          `Merged PRs: ${repo.estimatedMergedPrCount}`
        ],
        featured: index === 0,
        sortOrder: index + 1
      });
    }
  }

  return {
    user: db.prepare("SELECT * FROM users WHERE id = ?").get(userId),
    github: db.prepare("SELECT * FROM github_accounts WHERE user_id = ?").get(userId),
    repositories: db.prepare("SELECT * FROM github_repositories WHERE user_id = ? ORDER BY stargazers_count DESC, updated_at DESC").all(userId)
      .map((repo: any) => ({ ...repo, summary: parseJson(repo.summary_json, {}) }))
  };
}

export async function syncGitHubAccount(db: any, config: any, userId: string, accessToken?: string, scope = "read:user repo") {
  const account = db.prepare("SELECT * FROM github_accounts WHERE user_id = ?").get(userId);
  const token = accessToken ?? account?.access_token;
  if (!token) throw new Error("github account is not linked");
  const sync = await fetchGitHubPortfolioData(config, token);
  return upsertGitHubSync(db, userId, sync, token, scope);
}

export function createCredentialRequest(db: any, input: {
  userId: string;
  requestType: string;
  targetName?: string;
  targetUrl?: string;
  evidenceOrigin?: string;
  payload?: Record<string, any>;
}) {
  const timestamp = nowMillis();
  const id = randomUUID();
  db.prepare(`INSERT INTO credential_requests(id, user_id, request_type, status, target_name, target_url, evidence_origin, payload_json, created_at, updated_at)
    VALUES(?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`)
    .run(id, input.userId, input.requestType, input.targetName ?? null, input.targetUrl ?? null, input.evidenceOrigin ?? "github", JSON.stringify(input.payload ?? {}), timestamp, timestamp);
  return getCredentialRequest(db, id);
}

export function getCredentialRequest(db: any, requestId: string) {
  const request = db.prepare("SELECT * FROM credential_requests WHERE id = ?").get(requestId);
  if (!request) return null;
  const user = db.prepare("SELECT id, did, display_name, portfolio_slug FROM users WHERE id = ?").get(request.user_id);
  return { ...request, payload: parseJson(request.payload_json, {}), user };
}

export function listCredentialRequests(db: any, filter?: { userId?: string; status?: string }) {
  const clauses: string[] = [];
  const params: any[] = [];
  if (filter?.userId) {
    clauses.push("user_id = ?");
    params.push(filter.userId);
  }
  if (filter?.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM credential_requests ${where} ORDER BY created_at DESC`).all(...params).map((request: any) => ({
    ...request,
    payload: parseJson(request.payload_json, {}),
    user: db.prepare("SELECT id, did, display_name, portfolio_slug FROM users WHERE id = ?").get(request.user_id)
  }));
}

export function reviewCredentialRequest(db: any, requestId: string, input: { status: "approved" | "rejected"; reviewerNote?: string; issuedCredentialJti?: string | null }) {
  const request = db.prepare("SELECT * FROM credential_requests WHERE id = ?").get(requestId);
  if (!request) throw new Error("request not found");
  const timestamp = nowMillis();
  db.prepare(`UPDATE credential_requests
    SET status = ?, reviewer_note = ?, issued_credential_jti = ?, updated_at = ?, reviewed_at = ?
    WHERE id = ?`)
    .run(input.status, input.reviewerNote ?? null, input.issuedCredentialJti ?? null, timestamp, timestamp, requestId);
  return getCredentialRequest(db, requestId);
}

export async function approveCredentialRequest(db: any, issuer: { did: string; privateJwk: JsonWebKey }, requestId: string, reviewerNote?: string) {
  const request = getCredentialRequest(db, requestId);
  if (!request) throw new Error("request not found");
  if (request.status !== "pending") throw new Error(`request already ${request.status}`);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(request.user_id);
  if (!user) throw new Error("user not found");

  let issuedCredentialJti: string | null = null;
  if (request.request_type === "GitHubContributionCredential") {
    const payload = request.payload ?? {};
    const issued = await issuePortfolioCredentialsFromEvidence(db, issuer, {
      userId: request.user_id,
      repositoryName: payload.repositoryName ?? request.target_name ?? undefined,
      role: payload.role,
      commitCount: payload.commitCount,
      mergedPrCount: payload.mergedPrCount,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      evidenceSummary: payload.evidenceSummary
    });
    const contribution = issued.credentials.find((item: any) => item.credential_type === "GitHubContributionCredential" && item.summary?.repository === (payload.repositoryName ?? request.target_name));
    issuedCredentialJti = contribution?.credential_jti ?? null;
  } else if (request.request_type === "PortfolioAchievementCredential") {
    const payload = request.payload ?? {};
    const issued = await issuePortfolioAchievementCredential(db, issuer, {
      userId: request.user_id,
      subjectDid: user.did,
      achievementId: payload.achievementId,
      title: payload.title ?? request.target_name,
      category: payload.category,
      issuerName: payload.issuerName,
      issuedOn: payload.issuedOn,
      credentialUrl: payload.credentialUrl ?? request.target_url,
      description: payload.evidenceSummary ?? payload.description,
      evidence: Array.isArray(payload.evidence) ? payload.evidence : undefined
    });
    issuedCredentialJti = (issued as any).credentialJti ?? (issued as any).credential_jti ?? null;
  }

  return reviewCredentialRequest(db, requestId, { status: "approved", reviewerNote, issuedCredentialJti });
}

export async function rejectCredentialRequest(db: any, requestId: string, reviewerNote?: string) {
  return reviewCredentialRequest(db, requestId, { status: "rejected", reviewerNote });
}

export function getPublicPortfolioBySlug(db: any, slug: string) {
  const user = db.prepare("SELECT * FROM users WHERE portfolio_slug = ?").get(slug);
  if (!user) return null;
  const github = db.prepare("SELECT * FROM github_accounts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").get(user.id);
  const projects = db.prepare("SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY featured DESC, sort_order ASC, id ASC").all(user.id)
    .map((project: any) => ({ ...project, highlights: parseJson(project.highlights_json, []) }));
  const achievements = listPortfolioAchievements(db, user.id);
  const credentials = listPortfolioCredentials(db, user.id).map((item: any) => ({ ...item, summary: parseJson(item.summary_json, {}) }));
  const repositories = db.prepare("SELECT * FROM github_repositories WHERE user_id = ? ORDER BY stargazers_count DESC, updated_at DESC LIMIT 6").all(user.id)
    .map((repo: any) => ({ ...repo, summary: parseJson(repo.summary_json, {}) }));
  const verificationLogs = db.prepare("SELECT * FROM verification_logs WHERE portfolio_slug = ? ORDER BY created_at DESC LIMIT 10").all(slug);
  const credentialRequests = listCredentialRequests(db, { userId: user.id });
  return {
    profile: user,
    github: github ? {
      ...github,
      access_token: undefined,
      accessTokenMasked: maskToken(github.access_token),
      profile: parseJson(github.profile_json, {}),
      contributionSummary: parseJson(github.contribution_summary_json, {})
    } : null,
    projects,
    achievements,
    repositories,
    credentials,
    credentialRequests,
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
    const statusExplainer = row.status === "active"
      ? "Credential is active in the issuer registry."
      : row.status === "revoked"
        ? "Credential was revoked by the issuer and should no longer be trusted."
        : row.status === "suspended"
          ? "Credential is temporarily suspended pending issuer review."
          : `Credential status is ${row.status}.`;
    db.prepare(`INSERT INTO verification_logs(credential_jti, portfolio_slug, verifier, result, reason, created_at)
      VALUES(?, ?, ?, ?, ?, ?)`)
      .run(jti, profile?.portfolio_slug ?? null, verifier, "valid", "signature and schema verified", nowMillis());
    return {
      ok: true,
      status: row.status,
      statusExplainer,
      credentialType: row.credential_type,
      issuerDid: claims.iss,
      subjectDid: claims.sub,
      expiresAt: row.expires_at,
      portfolioSlug: profile?.portfolio_slug ?? null,
      summary: parseJson(row.summary_json, {}),
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
  const repoSummary = parseJson(repo.summary_json, {} as any);

  await issueGitHubAccountOwnershipCredential(db, issuer, {
    userId: input.userId,
    subjectDid: user.did,
    githubUsername: github.username,
    githubProfileUrl: github.profile_url
  });

  await issueGitHubContributionCredential(db, issuer, {
    userId: input.userId,
    subjectDid: user.did,
    repository: repo.name,
    repositoryUrl: repo.repo_url,
    role: input.role ?? repo.contribution_role ?? "contributor",
    commitCount: input.commitCount ?? repo.estimated_contribution_count ?? 1,
    mergedPrCount: input.mergedPrCount ?? repo.estimated_merged_pr_count ?? 0,
    periodStart: input.periodStart ?? repoSummary.activityWindow?.start ?? isoDateDaysAgo(90),
    periodEnd: input.periodEnd ?? repoSummary.activityWindow?.end ?? new Date().toISOString().slice(0, 10),
    evidenceSummary: input.evidenceSummary ?? repoSummary.proofSummary ?? `Synced GitHub evidence for ${github.username} on ${repo.full_name}.`
  });

  return {
    credentials: listPortfolioCredentials(db, input.userId).map((item: any) => ({ ...item, summary: parseJson(item.summary_json, {}) }))
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
    .run(
      user.id,
      "9919",
      "sjw-dev",
      "https://github.com/sjw-dev",
      "skeleton-token",
      "read:user repo",
      "linked-demo",
      nowMillis(),
      nowMillis(),
      JSON.stringify({ username: "sjw-dev", displayName: "Seongjun Won", profileUrl: "https://github.com/sjw-dev" }),
      JSON.stringify({ repositoryCount: 1, ownedRepositoryCount: 1, totalStars: 3, totalForks: 0, languages: ["TypeScript"], totalEstimatedCommits: 28, totalEstimatedMergedPrs: 6, evidenceNarrative: "Observed one core portfolio repository with 28 contribution events and 6 merged PRs in the current demo window." })
    );

  db.prepare(`INSERT INTO github_repositories(user_id, github_repo_id, name, full_name, description, repo_url, homepage_url, language, stargazers_count, forks_count, watchers_count, open_issues_count, default_branch, pushed_at, updated_at, contribution_role, estimated_contribution_count, estimated_merged_pr_count, summary_json)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, "demo-repo-1", "did-vc-rbac-mvp", "sjw-dev/did-vc-rbac-mvp", "Refactoring an RBAC demo into a verifiable developer portfolio service.", "https://github.com/sjw-dev/did-vc-rbac-mvp", null, "TypeScript", 3, 0, 3, 0, "main", new Date().toISOString(), new Date().toISOString(), "owner", 28, 6, JSON.stringify({ language: "TypeScript", stars: 3, contributionRole: "owner", confidence: "high", pullRequestCount: 8, contributorCount: 2, activityWindow: { start: "2026-03-01", end: "2026-04-13" }, proofPoints: ["28 observed contribution events", "6 merged PRs found", "Identity linked through GitHub OAuth"], proofSummary: "Owns sjw-dev/did-vc-rbac-mvp; 28 observed contributions and 6 merged PRs across the latest sync window." }));

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

  replacePortfolioAchievements(db, user.id, [
    {
      title: "OpenClaw Portfolio MVP Completion",
      category: "completion",
      issuerName: "OpenClaw Lab",
      issuedOn: "2026-04-13",
      description: "Completed an MVP that turns GitHub and manual career evidence into DID/VC credentials.",
      evidence: ["Reviewed build and test artifacts", "Demo portfolio and verifier flow recorded"],
      featured: true,
      sortOrder: 1
    },
    {
      title: "Verifiable Portfolio Concept Award",
      category: "award",
      issuerName: "Internal Demo Day",
      issuedOn: "2026-04-10",
      description: "Recognized for the strongest recruiter-facing verification narrative.",
      evidence: ["Pitch deck approval", "Reviewer notes from demo day"],
      featured: false,
      sortOrder: 2
    }
  ]);

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

  await issuePortfolioAchievementCredential(db, issuer, {
    userId: user.id,
    subjectDid: user.did,
    title: "OpenClaw Portfolio MVP Completion",
    category: "completion",
    issuerName: "OpenClaw Lab",
    issuedOn: "2026-04-13",
    description: "Completed an MVP that turns GitHub and manual career evidence into DID/VC credentials.",
    evidence: ["Reviewed build and test artifacts", "Demo portfolio and verifier flow recorded"]
  });

  createCredentialRequest(db, {
    userId: user.id,
    requestType: "GitHubContributionCredential",
    targetName: "did-vc-rbac-mvp",
    targetUrl: "https://github.com/sjw-dev/did-vc-rbac-mvp",
    evidenceOrigin: "github",
    payload: {
      repositoryName: "did-vc-rbac-mvp",
      role: "core contributor",
      commitCount: 28,
      mergedPrCount: 6,
      periodStart: "2026-03-01",
      periodEnd: "2026-04-13",
      evidenceSummary: "Requesting issuer review for the main portfolio repository contribution proof."
    }
  });

  return getPublicPortfolioBySlug(db, "sjw-dev");
}
