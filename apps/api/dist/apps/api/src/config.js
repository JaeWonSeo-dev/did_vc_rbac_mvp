import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
export const config = {
    port: Number(process.env.PORT ?? 3001),
    webOrigin,
    sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES ?? 30),
    databasePath: process.env.DATABASE_PATH ?? "./data/app.db",
    keyAlias: "issuer-main",
    verifierClientId: process.env.VERIFIER_CLIENT_ID ?? "did-vc-rbac-web",
    cookieName: process.env.COOKIE_NAME ?? "did_vc_session",
    csrfHeaderName: process.env.CSRF_HEADER_NAME ?? "x-csrf-token",
    githubClientId: process.env.GITHUB_CLIENT_ID ?? "github-client-id-placeholder",
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "github-client-secret-placeholder",
    githubAuthorizeUrl: process.env.GITHUB_AUTHORIZE_URL ?? "https://github.com/login/oauth/authorize",
    githubCallbackUrl: process.env.GITHUB_CALLBACK_URL ?? `${webOrigin}/github/callback`
};
