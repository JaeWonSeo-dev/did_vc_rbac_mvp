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
      throw new Error(`unexpected fetch ${url}`);
    }) as any;
  });

  it("exchanges github oauth code, syncs evidence, and issues portfolio credentials", async () => {
    const createdUser = await request(app)
      .post("/api/portfolio/users")
      .send({ did: "did:jwk:test-user", displayName: "Octo Dev", headline: "Developer", bio: "Bio", portfolioSlug: "octo-dev" })
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

    const issued = await request(app)
      .post(`/api/portfolio/${createdUser.body.id}/credentials/issue`)
      .send({ repositoryName: "portfolio-service", commitCount: 14, mergedPrCount: 4, evidenceSummary: "Manual override evidence summary" })
      .expect(200);

    expect(issued.body.credentials).toHaveLength(2);

    const portfolio = await request(app).get("/api/portfolio/octo-dev").expect(200);
    expect(portfolio.body.github.username).toBe("octo-dev");
    expect(portfolio.body.repositories).toHaveLength(2);
    expect(portfolio.body.credentials.map((item: any) => item.credential_type)).toEqual(expect.arrayContaining([
      "GitHubAccountOwnershipCredential",
      "GitHubContributionCredential"
    ]));
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});
