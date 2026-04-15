import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";

process.env.DATABASE_PATH = path.resolve("./data/test-portfolio.db");
process.env.GITHUB_CLIENT_ID = "test-client";
process.env.GITHUB_CLIENT_SECRET = "test-secret";
process.env.GITHUB_CALLBACK_URL = "http://localhost:5173/github/callback";

const originalFetch = global.fetch;

describe("portfolio github flow", () => {
  let app: any;

  beforeAll(async () => {
    const dbPath = path.resolve("./data/test-portfolio.db");
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
    const { buildApp } = await import("../../src/app");
    ({ app } = await buildApp());
  });

  beforeEach(() => {
    global.fetch = vi.fn(async (input: any) => {
      const url = String(input);
      if (url.includes("/login/oauth/access_token")) {
        return new Response(JSON.stringify({ access_token: "gho_test_token_1234", token_type: "bearer", scope: "read:user repo" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.endsWith("/user")) {
        return new Response(JSON.stringify({
          id: 123,
          login: "octo-dev",
          name: "Octo Dev",
          html_url: "https://github.com/octo-dev",
          avatar_url: "https://avatars.githubusercontent.com/u/123?v=4",
          bio: "Builds verifiable portfolios",
          location: "Seoul",
          company: "OpenClaw",
          blog: "https://octo.dev",
          public_repos: 2,
          followers: 7,
          following: 3
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/user/repos")) {
        return new Response(JSON.stringify([
          {
            id: 1,
            name: "portfolio-service",
            full_name: "octo-dev/portfolio-service",
            description: "Main portfolio repo",
            html_url: "https://github.com/octo-dev/portfolio-service",
            homepage: "https://portfolio.example.com",
            language: "TypeScript",
            stargazers_count: 5,
            forks_count: 2,
            watchers_count: 5,
            open_issues_count: 1,
            default_branch: "main",
            pushed_at: "2026-04-12T00:00:00Z",
            updated_at: "2026-04-12T00:00:00Z",
            fork: false,
            owner: { login: "octo-dev" },
            private: false
          },
          {
            id: 2,
            name: "oss-contrib",
            full_name: "octo-dev/oss-contrib",
            description: "Open source contribution evidence",
            html_url: "https://github.com/octo-dev/oss-contrib",
            homepage: null,
            language: "Rust",
            stargazers_count: 3,
            forks_count: 1,
            watchers_count: 3,
            open_issues_count: 0,
            default_branch: "main",
            pushed_at: "2026-04-11T00:00:00Z",
            updated_at: "2026-04-11T00:00:00Z",
            fork: false,
            owner: { login: "octo-dev" },
            private: false
          }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/portfolio-service/pulls")) {
        return new Response(JSON.stringify([
          { id: 11, merged_at: "2026-04-10T00:00:00Z", user: { login: "octo-dev" } },
          { id: 12, merged_at: "2026-04-08T00:00:00Z", user: { login: "octo-dev" } },
          { id: 13, merged_at: null, user: { login: "pair-dev" } }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/oss-contrib/pulls")) {
        return new Response(JSON.stringify([
          { id: 21, merged_at: "2026-04-09T00:00:00Z", user: { login: "octo-dev" } }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/portfolio-service/commits?author=octo-dev")) {
        return new Response(JSON.stringify([
          { sha: "c1" },
          { sha: "c2" },
          { sha: "c3" },
          { sha: "c4" },
          { sha: "c5" },
          { sha: "c6" },
          { sha: "c7" },
          { sha: "c8" },
          { sha: "c9" },
          { sha: "c10" },
          { sha: "c11" },
          { sha: "c12" },
          { sha: "c13" },
          { sha: "c14" }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/oss-contrib/commits?author=octo-dev")) {
        return new Response(JSON.stringify([
          { sha: "c21" },
          { sha: "c22" },
          { sha: "c23" },
          { sha: "c24" },
          { sha: "c25" }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/portfolio-service/contributors")) {
        return new Response(JSON.stringify([
          { login: "octo-dev", contributions: 14 },
          { login: "pair-dev", contributions: 4 }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/repos/octo-dev/oss-contrib/contributors")) {
        return new Response(JSON.stringify([
          { login: "octo-dev", contributions: 5 }
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      throw new Error(`unexpected fetch ${url}`);
    }) as any;
  });

  it("exchanges github oauth code, syncs evidence, supports request review, and issues portfolio credentials", async () => {
    const createdUser = await request(app)
      .post("/api/portfolio/users")
      .send({ did: "did:jwk:test-user", displayName: "Octo Dev", headline: "Developer", bio: "Bio", portfolioSlug: "octo-dev" })
      .expect(200);

    await request(app)
      .put(`/api/portfolio/users/${createdUser.body.id}/achievements`)
      .send({ achievements: [{ title: "Hackathon Winner", category: "award", issuerName: "Seoul Hack Week", issuedOn: "2026-04-01", description: "Won first place", evidence: ["Award letter"] }] })
      .expect(200);

    const start = await request(app)
      .post("/api/github/oauth/start")
      .send({ userId: createdUser.body.id })
      .expect(200);

    const callback = await request(app)
      .get(`/api/github/oauth/callback?state=${encodeURIComponent(start.body.state)}&code=test-code`)
      .expect(200);

    expect(callback.body.ok).toBe(true);
    expect(callback.body.githubUsername).toBe("octo-dev");
    expect(callback.body.repositoryCount).toBe(2);

    const githubRequestCreated = await request(app)
      .post(`/api/portfolio/users/${createdUser.body.id}/requests`)
      .send({
        requestType: "GitHubContributionCredential",
        targetName: "portfolio-service",
        targetUrl: "https://github.com/octo-dev/portfolio-service",
        evidenceOrigin: "github",
        payload: {
          repositoryName: "portfolio-service",
          role: "owner",
          commitCount: 14,
          mergedPrCount: 2,
          periodStart: "2026-01-13",
          periodEnd: "2026-04-13",
          evidenceSummary: "Requesting review for the main portfolio repository"
        }
      })
      .expect(200);

    const achievementRequestCreated = await request(app)
      .post(`/api/portfolio/users/${createdUser.body.id}/requests`)
      .send({
        requestType: "PortfolioAchievementCredential",
        targetName: "Hackathon Winner",
        targetUrl: "https://proof.example.com/hackathon-winner",
        evidenceOrigin: "manual",
        payload: {
          title: "Hackathon Winner",
          category: "award",
          issuerName: "Seoul Hack Week",
          issuedOn: "2026-04-01",
          credentialUrl: "https://proof.example.com/hackathon-winner",
          evidenceSummary: "Awarded first place after portfolio and live demo review.",
          evidence: ["Award letter", "Demo day review board note"]
        }
      })
      .expect(200);

    expect(githubRequestCreated.body.status).toBe("pending");
    expect(achievementRequestCreated.body.status).toBe("pending");

    const approved = await request(app)
      .post(`/api/admin/portfolio/requests/${githubRequestCreated.body.id}/approve`)
      .send({ reviewerNote: "Evidence checked by issuer admin." })
      .expect(200);

    const approvedAchievement = await request(app)
      .post(`/api/admin/portfolio/requests/${achievementRequestCreated.body.id}/approve`)
      .send({ reviewerNote: "Award proof checked by issuer admin." })
      .expect(200);

    expect(approved.body.status).toBe("approved");
    expect(approvedAchievement.body.status).toBe("approved");

    const portfolio = await request(app).get("/api/portfolio/octo-dev").expect(200);
    expect(portfolio.body.github.username).toBe("octo-dev");
    expect(portfolio.body.repositories).toHaveLength(2);
    expect(portfolio.body.achievements).toHaveLength(1);
    expect(portfolio.body.credentialRequests.some((item: any) => item.status === "approved")).toBe(true);
    expect(portfolio.body.credentials.map((item: any) => item.credential_type)).toEqual(expect.arrayContaining([
      "GitHubAccountOwnershipCredential",
      "GitHubContributionCredential",
      "PortfolioAchievementCredential"
    ]));
    expect(portfolio.body.github.contributionSummary.totalEstimatedCommits).toBeGreaterThanOrEqual(19);
    expect(portfolio.body.github.contributionSummary.totalInspectedClosedPrs).toBeGreaterThanOrEqual(3);
    expect(portfolio.body.repositories[0].summary.proofPoints.length).toBeGreaterThan(0);
    expect(String(portfolio.body.repositories[0].summary.proofSummary)).toMatch(/inspected closed PRs/i);

    const contributionCredential = portfolio.body.credentials.find((item: any) => item.credential_type === "GitHubContributionCredential");
    expect(contributionCredential).toBeTruthy();
    expect(contributionCredential.credential_jti).toBeTruthy();

    await request(app)
      .post(`/api/admin/portfolio/credentials/${contributionCredential.credential_jti}/status`)
      .send({ status: "suspended" })
      .expect(200);

    const updatedPortfolio = await request(app).get("/api/portfolio/octo-dev").expect(200);
    const suspendedCredential = updatedPortfolio.body.credentials.find((item: any) => item.credential_jti === contributionCredential.credential_jti);
    expect(suspendedCredential.status).toBe("suspended");
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});
