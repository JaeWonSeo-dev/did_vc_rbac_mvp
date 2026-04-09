import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import { buildApp } from "../../src/app";

process.env.DATABASE_PATH = path.resolve("./data/test-integration.db");

describe("integration auth flows", () => {
  let app: any;

  beforeAll(async () => {
    const dbPath = path.resolve("./data/test-integration.db");
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
    ({ app } = await buildApp());
  });

  it("allows Admin to access /admin", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'admin-pass' }).expect(200);
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Admin', expiresInSeconds: 3600 }).expect(200);
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'admin-pass', vcJwt: issued.body.vcJwt }).expect(200);
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/admin' }).expect(200);
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'admin-pass', credentialJti: issued.body.claims.jti, request: authReq.body }).expect(200);
    const login = await request(app).post('/api/verifier/direct-post').send({ vp_token: vp.body.vpJwt, state: authReq.body.state }).expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const protectedRes = await request(app).get('/api/admin/data').set('Cookie', cookie).expect(200);
    expect(protectedRes.body.message).toContain('Admin-only');
  });

  it("rejects tampered token", async () => {
    const wallet = await request(app).post('/api/wallets').send({ passphrase: 'tamper-pass' }).expect(200);
    const issued = await request(app).post('/api/issuer/credentials').send({ subjectDid: wallet.body.did, role: 'Admin', expiresInSeconds: 3600 }).expect(200);
    await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/import`).send({ passphrase: 'tamper-pass', vcJwt: issued.body.vcJwt }).expect(200);
    const authReq = await request(app).post('/api/verifier/request').send({ targetPath: '/admin' }).expect(200);
    const vp = await request(app).post(`/api/wallets/${encodeURIComponent(wallet.body.did)}/present`).send({ passphrase: 'tamper-pass', credentialJti: issued.body.claims.jti, request: authReq.body }).expect(200);
    const parts = vp.body.vpJwt.split('.');
    const tampered = `${parts[0]}.${parts[1]}x.${parts[2]}`;
    const denied = await request(app).post('/api/verifier/direct-post').send({ vp_token: tampered, state: authReq.body.state }).expect(401);
    expect(denied.body.reason).toBe('tampered token');
  });
});
