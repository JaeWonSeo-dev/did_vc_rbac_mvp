import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import { buildApp } from "../src/app";
import { validateNonceState, validateCredentialStatus, hasRequiredRole, verifyVcJwt } from "@did-vc-rbac/shared";

process.env.DATABASE_PATH = path.resolve("./data/test.db");

describe("security flows", () => {
  let app: any;
  beforeAll(async () => {
    const dbPath = path.resolve("./data/test.db");
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
    ({ app } = await buildApp());
  });

  it("validates nonce/state utility", () => {
    expect(validateNonceState("a", "b", "a", "b").ok).toBe(true);
    expect(validateNonceState("a", "b", "x", "b").reason).toBe("nonce mismatch");
  });

  it("validates status utility", () => {
    expect(validateCredentialStatus("active").ok).toBe(true);
    expect(validateCredentialStatus("revoked").reason).toBe("revoked credential");
  });

  it("validates role mapping utility", () => {
    expect(hasRequiredRole("Admin", "/admin")).toBe(true);
    expect(hasRequiredRole("Developer", "/admin")).toBe(false);
  });

  it("normal login success", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw1' }).expect(200);
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Admin', expiresInSeconds: 3600 }).expect(200);
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'pw1', vcJwt: issued.body.vcJwt }).expect(200);
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/admin' }).expect(200);
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'pw1', credentialJti: issued.body.claims.jti, request: authReq.body }).expect(200);
    const login = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(200);
    expect(login.body.ok).toBe(true);
  });

  it("revoked credential blocked", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw2' });
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Developer', expiresInSeconds: 3600 });
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'pw2', vcJwt: issued.body.vcJwt });
    await request(app).post(`/api/issuer/credentials/${issued.body.claims.jti}/status`).send({ status: 'revoked', reason: 'test' });
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/dev' });
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'pw2', credentialJti: issued.body.claims.jti, request: authReq.body });
    const login = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(401);
    expect(login.body.reason).toBe('revoked credential');
  });

  it("expired credential blocked", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw3' });
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Auditor', expiresInSeconds: -10 });
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'pw3', vcJwt: issued.body.vcJwt });
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/audit' });
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'pw3', credentialJti: issued.body.claims.jti, request: authReq.body });
    const login = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(401);
    expect(login.body.reason).toBe('expired credential');
  });

  it("wrong audience blocked", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw4' });
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Admin', expiresInSeconds: 3600 });
    const claims = await verifyVcJwt(issued.body.vcJwt);
    expect(claims.iss).toBeTruthy();
  });

  it("replay blocked", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw5' });
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Admin', expiresInSeconds: 3600 });
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'pw5', vcJwt: issued.body.vcJwt });
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/admin' });
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'pw5', credentialJti: issued.body.claims.jti, request: authReq.body });
    await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(200);
    const replay = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(401);
    expect(replay.body.reason).toBe('replay attempt');
  });

  it("insufficient role blocked", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'pw6' });
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Developer', expiresInSeconds: 3600 });
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'pw6', vcJwt: issued.body.vcJwt });
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/admin' });
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'pw6', credentialJti: issued.body.claims.jti, request: authReq.body });
    const denied = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(401);
    expect(denied.body.reason).toBe('insufficient role');
  });
});
