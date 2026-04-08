import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES ?? 30),
  databasePath: process.env.DATABASE_PATH ?? "./data/app.db",
  keyAlias: "issuer-main",
  verifierClientId: process.env.VERIFIER_CLIENT_ID ?? "did-vc-rbac-web",
  cookieName: process.env.COOKIE_NAME ?? "did_vc_session",
  csrfHeaderName: process.env.CSRF_HEADER_NAME ?? "x-csrf-token"
};
