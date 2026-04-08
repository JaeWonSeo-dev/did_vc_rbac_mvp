import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { createDb } from "./db/client";
import { ensureIssuerKey } from "./security/keystore";
import { sessionMiddleware, requireCsrf, requireSession } from "./middleware/auth";
import { issueCredential, listCredentials, updateCredentialStatus } from "./modules/issuer/service";
import { createWallet, importWalletCredential, listWalletCredentials, listWallets, createPresentation } from "./modules/wallet/service";
import { createAuthRequest, deleteSession, issueSession, recordFailure, verifyDirectPost } from "./modules/verifier/service";
import { listAudit } from "./modules/audit/service";
import { requiredRoleForPath } from "@did-vc-rbac/shared";

export async function buildApp() {
  const db = createDb(config.databasePath);
  const issuer = await ensureIssuerKey(db, config.keyAlias);
  const app = express();
  app.use(cors({ origin: config.webOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(sessionMiddleware(db, config));

  app.get("/api/health", (_req, res) => res.json({ ok: true, issuerDid: issuer.did }));

  app.get("/api/system/summary", (_req, res) => {
    res.json({
      issuerDid: issuer.did,
      wallets: listWallets(db),
      credentials: listCredentials(db),
      audit: listAudit(db, 10),
      session: ( _req as any).session ? { role: (_req as any).session.role, holderDid: (_req as any).session.holder_did, csrfToken: (_req as any).session.csrf_token } : null
    });
  });

  app.post("/api/issuer/credentials", async (req, res) => {
    const { subjectDid, role, expiresInSeconds } = req.body;
    const issued = await issueCredential(db, issuer, { subjectDid, role, expiresInSeconds: Number(expiresInSeconds) });
    res.json(issued);
  });

  app.get("/api/issuer/credentials", (_req, res) => res.json(listCredentials(db)));
  app.post("/api/issuer/credentials/:jti/status", (req, res) => res.json(updateCredentialStatus(db, req.params.jti, req.body.status, req.body.reason ?? req.body.status)));

  app.post("/api/wallets", async (req, res) => res.json(await createWallet(db, req.body.passphrase)));
  app.get("/api/wallets", (_req, res) => res.json(listWallets(db)));
  app.get("/api/wallets/:did/credentials", (req, res) => res.json(listWalletCredentials(db, req.params.did)));
  app.post("/api/wallets/:did/import", async (req, res) => res.json(await importWalletCredential(db, req.params.did, req.body.passphrase, req.body.vcJwt)));
  app.post("/api/wallets/:did/present", async (req, res) => res.json(await createPresentation(db, { holderDid: req.params.did, passphrase: req.body.passphrase, credentialJti: req.body.credentialJti, request: req.body.request })));

  app.post("/api/verifier/request", (req, res) => {
    const targetPath = req.body.targetPath;
    const role = requiredRoleForPath(targetPath);
    if (!role) return res.status(400).json({ error: "Unsupported target path" });
    res.json(createAuthRequest(db, config, targetPath, role));
  });

  app.post("/api/verifier/direct-post", async (req, res) => {
    try {
      const verified = await verifyDirectPost(db, config, req.body, {
        ip: req.ip,
        userAgent: req.get("user-agent")
      });
      const session = issueSession(db, config, verified.holderDid, verified.role, verified.permissions);
      res.cookie(config.cookieName, session.sessionId, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
      res.json({ ok: true, targetPath: verified.targetPath, csrfToken: session.csrfToken, role: verified.role, holderDid: verified.holderDid });
    } catch (error: any) {
      recordFailure(db, error.message, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        targetPath: req.body?.targetPath,
        detailReason: error.stack ?? error.message
      });
      const safeReasons = new Set(["expired credential", "revoked credential", "suspended credential", "wrong audience", "nonce mismatch", "state mismatch", "replay attempt", "insufficient role", "tampered token"]);
      const safeReason = safeReasons.has(error.message) ? error.message : "verification failed";
      res.status(401).json({ error: "Authentication failed", reason: safeReason });
    }
  });

  app.get("/api/session", (req, res) => {
    const session = (req as any).session;
    if (!session) return res.json({ authenticated: false });
    res.json({ authenticated: true, role: session.role, holderDid: session.holder_did, csrfToken: session.csrf_token });
  });

  app.post("/api/logout", requireSession(), requireCsrf(config), (req, res) => {
    deleteSession(db, req.cookies[config.cookieName]);
    res.clearCookie(config.cookieName);
    res.json({ ok: true });
  });

  app.get("/api/admin/data", requireSession("Admin"), (_req, res) => res.json({ users: [{ did: issuer.did, status: "trusted-issuer" }], message: "Admin-only user management data" }));
  app.get("/api/audit/data", requireSession("Auditor"), (_req, res) => res.json({ events: listAudit(db, 50) }));
  app.get("/api/dev/data", requireSession("Developer"), (_req, res) => res.json({ tools: ["build-runner", "sandbox-console"], message: "Developer-only tooling" }));
  app.get("/api/audit/recent-auth", (_req, res) => res.json(listAudit(db, 20)));

  return { app, db, issuer };
}
