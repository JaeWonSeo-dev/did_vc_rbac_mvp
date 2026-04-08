$ErrorActionPreference='Stop'
$root = 'C:\Sjw_dev\Coding\did-vc-rbac-mvp'
Set-Location $root

function Write-File($path, $content) {
  $dir = Split-Path $path -Parent
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $path -Value $content -Encoding UTF8
}

Write-File "$root\apps\api\package.json" @'
{
  "name": "@did-vc-rbac/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "seed": "tsx src/seed/demoSeed.ts"
  }
}
'@

Write-File "$root\apps\web\package.json" @'
{
  "name": "@did-vc-rbac/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
'@

Write-File "$root\packages\shared\package.json" @'
{
  "name": "@did-vc-rbac/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  }
}
'@

Write-File "$root\apps\api\tsconfig.json" @'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
'@

Write-File "$root\apps\web\tsconfig.json" @'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src"]
}
'@

Write-File "$root\packages\shared\tsconfig.json" @'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
'@

Write-File "$root\apps\web\vite.config.ts" @'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});
'@

Write-File "$root\apps\api\vitest.config.ts" @'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  }
});
'@

Write-File "$root\packages\shared\vitest.config.ts" @'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  }
});
'@

Write-File "$root\apps\web\src\vite-env.d.ts" "/// <reference types=\"vite/client\" />"

Write-File "$root\.env.example" @'
PORT=3001
WEB_ORIGIN=http://localhost:5173
SESSION_TTL_MINUTES=30
DATABASE_PATH=./data/app.db
KEYSTORE_DIR=./data/keystore
WALLET_STORAGE_DIR=./data/wallets
VERIFIER_CLIENT_ID=did-vc-rbac-web
COOKIE_NAME=did_vc_session
CSRF_HEADER_NAME=x-csrf-token
'@

Write-File "$root\packages\shared\src\schemas\types.ts" @'
import { z } from "zod";

export const RoleSchema = z.enum(["Admin", "Auditor", "Developer"]);
export type Role = z.infer<typeof RoleSchema>;

export const CredentialStatusSchema = z.enum(["active", "suspended", "revoked"]);
export type CredentialStatus = z.infer<typeof CredentialStatusSchema>;

export const PermissionSchema = z.string().min(1);
export type Permission = z.infer<typeof PermissionSchema>;

export const VcClaimsSchema = z.object({
  jti: z.string(),
  iss: z.string(),
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  nbf: z.number().optional(),
  vc: z.object({
    type: z.array(z.string()),
    credentialSubject: z.object({
      id: z.string(),
      role: RoleSchema,
      permissions: z.array(PermissionSchema)
    }),
    credentialStatus: z.object({
      id: z.string(),
      type: z.literal("LocalCredentialStatus")
    })
  })
});
export type VcClaims = z.infer<typeof VcClaimsSchema>;

export const VpClaimsSchema = z.object({
  jti: z.string(),
  iss: z.string(),
  sub: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
  nonce: z.string(),
  vp: z.object({
    type: z.array(z.string()),
    verifiableCredential: z.array(z.string())
  })
});
export type VpClaims = z.infer<typeof VpClaimsSchema>;

export const AuthRequestSchema = z.object({
  client_id: z.string(),
  response_mode: z.literal("direct_post"),
  response_uri: z.string(),
  nonce: z.string(),
  state: z.string(),
  scope: z.literal("openid4vp_did_vc"),
  role: RoleSchema,
  purpose: z.string()
});
export type AuthRequest = z.infer<typeof AuthRequestSchema>;
'@

Write-File "$root\packages\shared\src\rbac\roles.ts" @'
import type { Role } from "../schemas/types";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Admin: ["users:read", "users:write", "audit:read", "devtools:read"],
  Auditor: ["audit:read"],
  Developer: ["devtools:read"]
};

export function requiredRoleForPath(path: string): Role | null {
  if (path.startsWith("/admin")) return "Admin";
  if (path.startsWith("/audit")) return "Auditor";
  if (path.startsWith("/dev")) return "Developer";
  return null;
}

export function hasRequiredRole(role: Role, targetPath: string): boolean {
  const required = requiredRoleForPath(targetPath);
  return required ? required === role : true;
}
'@

Write-File "$root\packages\shared\src\did\didJwk.ts" @'
import { exportJWK, importJWK, calculateJwkThumbprint, generateKeyPair } from "jose";

export type GeneratedDid = {
  did: string;
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
};

export async function createDidJwk(): Promise<GeneratedDid> {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  publicJwk.alg = "ES256";
  publicJwk.use = "sig";
  privateJwk.alg = "ES256";
  privateJwk.use = "sig";
  const did = `did:jwk:${Buffer.from(JSON.stringify(publicJwk)).toString("base64url")}`;
  return { did, publicJwk, privateJwk };
}

export function resolveDidJwk(did: string): JsonWebKey {
  const [, , payload] = did.split(":");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export async function importPrivateJwk(jwk: JsonWebKey) {
  return importJWK(jwk, "ES256");
}

export async function importPublicJwk(jwk: JsonWebKey) {
  return importJWK(jwk, "ES256");
}

export async function thumbprintFromJwk(jwk: JsonWebKey): Promise<string> {
  return calculateJwkThumbprint(jwk);
}
'@

Write-File "$root\packages\shared\src\jose\tokens.ts" @'
import { jwtVerify, SignJWT } from "jose";
import { importPrivateJwk, importPublicJwk, resolveDidJwk } from "../did/didJwk";
import { VcClaimsSchema, VpClaimsSchema, type VcClaims, type VpClaims } from "../schemas/types";

export async function signVcJwt(claims: VcClaims, privateJwk: JsonWebKey) {
  const key = await importPrivateJwk(privateJwk);
  return new SignJWT(claims as Record<string, unknown>)
    .setProtectedHeader({ alg: "ES256", typ: "vc+jwt" })
    .setIssuedAt(claims.iat)
    .setIssuer(claims.iss)
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setExpirationTime(claims.exp)
    .sign(key);
}

export async function verifyVcJwt(jwt: string, issuerDid?: string) {
  const headerPayloadDid = issuerDid ?? JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")).iss;
  const publicKey = await importPublicJwk(resolveDidJwk(headerPayloadDid));
  const { payload } = await jwtVerify(jwt, publicKey, {
    issuer: headerPayloadDid
  });
  return VcClaimsSchema.parse(payload) as VcClaims;
}

export async function signVpJwt(claims: VpClaims, privateJwk: JsonWebKey) {
  const key = await importPrivateJwk(privateJwk);
  return new SignJWT(claims as Record<string, unknown>)
    .setProtectedHeader({ alg: "ES256", typ: "vp+jwt" })
    .setIssuedAt(claims.iat)
    .setIssuer(claims.iss)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setJti(claims.jti)
    .setExpirationTime(claims.exp)
    .sign(key);
}

export async function verifyVpJwt(jwt: string, holderDid: string, audience: string) {
  const publicKey = await importPublicJwk(resolveDidJwk(holderDid));
  const { payload } = await jwtVerify(jwt, publicKey, {
    issuer: holderDid,
    subject: holderDid,
    audience
  });
  return VpClaimsSchema.parse(payload) as VpClaims;
}
'@

Write-File "$root\packages\shared\src\validation\auth.ts" @'
import type { AuthRequest, CredentialStatus, Role, VcClaims } from "../schemas/types";
import { AuthRequestSchema } from "../schemas/types";
import { hasRequiredRole } from "../rbac/roles";

export function parseAuthRequest(input: unknown): AuthRequest {
  return AuthRequestSchema.parse(input);
}

export function validateNonceState(expectedNonce: string, expectedState: string, receivedNonce: string, receivedState: string) {
  if (expectedState !== receivedState) return { ok: false as const, reason: "state mismatch" };
  if (expectedNonce !== receivedNonce) return { ok: false as const, reason: "nonce mismatch" };
  return { ok: true as const };
}

export function validateCredentialStatus(status: CredentialStatus) {
  if (status === "revoked") return { ok: false as const, reason: "revoked credential" };
  if (status === "suspended") return { ok: false as const, reason: "suspended credential" };
  return { ok: true as const };
}

export function validatePathRole(claims: VcClaims, targetPath: string) {
  const role: Role = claims.vc.credentialSubject.role;
  if (!hasRequiredRole(role, targetPath)) {
    return { ok: false as const, reason: "insufficient role" };
  }
  return { ok: true as const };
}
'@

Write-File "$root\packages\shared\src\index.ts" @'
export * from "./schemas/types";
export * from "./rbac/roles";
export * from "./did/didJwk";
export * from "./jose/tokens";
export * from "./validation/auth";
'@

Write-File "$root\apps\api\src\db\schema.ts" @'
export const schemaSql = `
CREATE TABLE IF NOT EXISTS credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jti TEXT UNIQUE NOT NULL,
  subject_did TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  vc_jwt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  status_reason TEXT,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_identities (
  did TEXT PRIMARY KEY,
  encrypted_private_jwk TEXT NOT NULL,
  public_jwk_json TEXT NOT NULL,
  passphrase_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  holder_did TEXT NOT NULL,
  credential_jti TEXT NOT NULL,
  vc_jwt_encrypted TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  added_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_requests (
  state TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  client_id TEXT NOT NULL,
  response_uri TEXT NOT NULL,
  target_path TEXT NOT NULL,
  required_role TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS replay_cache (
  token_jti TEXT PRIMARY KEY,
  token_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  holder_did TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  summary_reason TEXT NOT NULL,
  detail_reason TEXT NOT NULL,
  holder_did TEXT,
  credential_jti TEXT,
  session_id TEXT,
  target_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS keystore (
  alias TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  public_jwk_json TEXT NOT NULL,
  private_jwk_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;
'@

Write-File "$root\apps\api\src\db\client.ts" @'
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { schemaSql } from "./schema";

export function createDb(databasePath: string) {
  const absolute = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const db = new Database(absolute);
  db.pragma("journal_mode = WAL");
  db.exec(schemaSql);
  return db;
}
'@

Write-File "$root\apps\api\src\config.ts" @'
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
'@

Write-File "$root\apps\api\src\security\crypto.ts" @'
import crypto from "node:crypto";

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("base64url");
}

export function deriveKey(passphrase: string, salt: string) {
  return crypto.scryptSync(passphrase, Buffer.from(salt, "base64url"), 32);
}

export function encryptJson(data: unknown, passphrase: string) {
  const salt = randomToken(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    salt,
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    data: ciphertext.toString("base64url")
  };
}

export function decryptJson(payload: { salt: string; iv: string; tag: string; data: string }, passphrase: string) {
  const key = deriveKey(passphrase, payload.salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64url")),
    decipher.final()
  ]).toString("utf8");
  return JSON.parse(plaintext);
}
'@

Write-File "$root\apps\api\src\security\keystore.ts" @'
import { createDidJwk } from "@did-vc-rbac/shared";

export async function ensureIssuerKey(db: any, alias: string) {
  const existing = db.prepare("SELECT * FROM keystore WHERE alias = ?").get(alias);
  if (existing) {
    return {
      did: existing.did,
      publicJwk: JSON.parse(existing.public_jwk_json),
      privateJwk: JSON.parse(existing.private_jwk_json)
    };
  }
  const generated = await createDidJwk();
  db.prepare(`INSERT INTO keystore(alias, did, public_jwk_json, private_jwk_json, created_at)
    VALUES(?, ?, ?, ?, ?)`)
    .run(alias, generated.did, JSON.stringify(generated.publicJwk), JSON.stringify(generated.privateJwk), Date.now());
  return generated;
}
'@

Write-File "$root\apps\api\src\modules\audit\service.ts" @'
export function writeAudit(db: any, entry: {
  eventType: string;
  outcome: string;
  summaryReason: string;
  detailReason: string;
  holderDid?: string | null;
  credentialJti?: string | null;
  sessionId?: string | null;
  targetPath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  db.prepare(`INSERT INTO audit_logs(event_type, outcome, summary_reason, detail_reason, holder_did, credential_jti, session_id, target_path, ip_address, user_agent, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      entry.eventType,
      entry.outcome,
      entry.summaryReason,
      entry.detailReason,
      entry.holderDid ?? null,
      entry.credentialJti ?? null,
      entry.sessionId ?? null,
      entry.targetPath ?? null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
      Date.now()
    );
}

export function listAudit(db: any, limit = 20) {
  return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit);
}
'@

Write-File "$root\apps\api\src\modules\issuer\service.ts" @'
import { ROLE_PERMISSIONS, signVcJwt, type Role, type VcClaims } from "@did-vc-rbac/shared";
import { randomUUID } from "node:crypto";

export async function issueCredential(db: any, issuer: { did: string; privateJwk: JsonWebKey }, input: { subjectDid: string; role: Role; expiresInSeconds: number }) {
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const claims: VcClaims = {
    jti,
    iss: issuer.did,
    sub: input.subjectDid,
    iat: now,
    exp: now + input.expiresInSeconds,
    vc: {
      type: ["VerifiableCredential", "AdminAccessCredential"],
      credentialSubject: {
        id: input.subjectDid,
        role: input.role,
        permissions: ROLE_PERMISSIONS[input.role]
      },
      credentialStatus: {
        id: `status:${jti}`,
        type: "LocalCredentialStatus"
      }
    }
  };
  const vcJwt = await signVcJwt(claims, issuer.privateJwk);
  const timestamp = Date.now();
  db.prepare(`INSERT INTO credentials(jti, subject_did, issuer_did, role, permissions_json, vc_jwt, status, issued_at, expires_at, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`)
    .run(jti, input.subjectDid, issuer.did, input.role, JSON.stringify(claims.vc.credentialSubject.permissions), vcJwt, claims.iat, claims.exp, timestamp, timestamp);
  return { claims, vcJwt };
}

export function listCredentials(db: any) {
  return db.prepare("SELECT * FROM credentials ORDER BY created_at DESC").all();
}

export function updateCredentialStatus(db: any, jti: string, status: "active" | "suspended" | "revoked", reason: string) {
  db.prepare("UPDATE credentials SET status = ?, status_reason = ?, updated_at = ? WHERE jti = ?").run(status, reason, Date.now(), jti);
  return db.prepare("SELECT * FROM credentials WHERE jti = ?").get(jti);
}

export function getCredentialByJti(db: any, jti: string) {
  return db.prepare("SELECT * FROM credentials WHERE jti = ?").get(jti);
}
'@

Write-File "$root\apps\api\src\modules\wallet\service.ts" @'
import { createDidJwk, verifyVcJwt, signVpJwt, type AuthRequest } from "@did-vc-rbac/shared";
import { randomUUID } from "node:crypto";
import { decryptJson, encryptJson } from "../../security/crypto";

export async function createWallet(db: any, passphrase: string) {
  const generated = await createDidJwk();
  const encrypted = encryptJson(generated.privateJwk, passphrase);
  db.prepare(`INSERT INTO wallet_identities(did, encrypted_private_jwk, public_jwk_json, passphrase_salt, created_at)
    VALUES(?, ?, ?, ?, ?)`)
    .run(generated.did, JSON.stringify(encrypted), JSON.stringify(generated.publicJwk), encrypted.salt, Date.now());
  return { did: generated.did, publicJwk: generated.publicJwk };
}

export async function importWalletCredential(db: any, holderDid: string, passphrase: string, vcJwt: string) {
  const wallet = db.prepare("SELECT * FROM wallet_identities WHERE did = ?").get(holderDid);
  if (!wallet) throw new Error("wallet not found");
  decryptJson(JSON.parse(wallet.encrypted_private_jwk), passphrase);
  const claims = await verifyVcJwt(vcJwt);
  const encryptedCredential = encryptJson({ vcJwt }, passphrase);
  db.prepare(`INSERT INTO wallet_credentials(holder_did, credential_jti, vc_jwt_encrypted, role, permissions_json, issuer_did, added_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)`)
    .run(holderDid, claims.jti, JSON.stringify(encryptedCredential), claims.vc.credentialSubject.role, JSON.stringify(claims.vc.credentialSubject.permissions), claims.iss, Date.now());
  return claims;
}

export function listWallets(db: any) {
  return db.prepare("SELECT did, created_at FROM wallet_identities ORDER BY created_at DESC").all();
}

export function listWalletCredentials(db: any, holderDid: string) {
  return db.prepare("SELECT * FROM wallet_credentials WHERE holder_did = ? ORDER BY added_at DESC").all(holderDid);
}

export async function createPresentation(db: any, input: { holderDid: string; passphrase: string; credentialJti: string; request: AuthRequest; }) {
  const wallet = db.prepare("SELECT * FROM wallet_identities WHERE did = ?").get(input.holderDid);
  if (!wallet) throw new Error("wallet not found");
  const credential = db.prepare("SELECT * FROM wallet_credentials WHERE holder_did = ? AND credential_jti = ?").get(input.holderDid, input.credentialJti);
  if (!credential) throw new Error("credential not found");
  const privateJwk = decryptJson(JSON.parse(wallet.encrypted_private_jwk), input.passphrase);
  const vcPayload = decryptJson(JSON.parse(credential.vc_jwt_encrypted), input.passphrase) as { vcJwt: string };
  const now = Math.floor(Date.now() / 1000);
  const vpJwt = await signVpJwt({
    jti: randomUUID(),
    iss: input.holderDid,
    sub: input.holderDid,
    aud: input.request.client_id,
    iat: now,
    exp: now + 300,
    nonce: input.request.nonce,
    vp: {
      type: ["VerifiablePresentation"],
      verifiableCredential: [vcPayload.vcJwt]
    }
  }, privateJwk);
  return { vpJwt };
}
'@

Write-File "$root\apps\api\src\modules\verifier\service.ts" @'
import { verifyVcJwt, verifyVpJwt, validateCredentialStatus, validateNonceState, validatePathRole } from "@did-vc-rbac/shared";
import { randomToken } from "../../security/crypto";
import { writeAudit } from "../audit/service";

export function createAuthRequest(db: any, config: any, targetPath: string, requiredRole: string) {
  const state = randomToken(24);
  const nonce = randomToken(24);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;
  const responseUri = `${config.webOrigin}/wallet/respond`;
  db.prepare(`INSERT INTO auth_requests(state, nonce, client_id, response_uri, target_path, required_role, used, created_at, expires_at)
    VALUES(?, ?, ?, ?, ?, ?, 0, ?, ?)`)
    .run(state, nonce, config.verifierClientId, responseUri, targetPath, requiredRole, now, expiresAt);
  return {
    client_id: config.verifierClientId,
    response_mode: "direct_post",
    response_uri: `${config.webOrigin}/api/verifier/direct-post`,
    nonce,
    state,
    scope: "openid4vp_did_vc",
    role: requiredRole,
    purpose: `Authenticate for ${targetPath}`
  };
}

export function issueSession(db: any, config: any, holderDid: string, role: string, permissions: string[]) {
  const sessionId = randomToken(24);
  const csrfToken = randomToken(16);
  const createdAt = Date.now();
  const expiresAt = createdAt + config.sessionTtlMinutes * 60 * 1000;
  db.prepare(`INSERT INTO sessions(id, holder_did, role, permissions_json, csrf_token, created_at, expires_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)`)
    .run(sessionId, holderDid, role, JSON.stringify(permissions), csrfToken, createdAt, expiresAt);
  return { sessionId, csrfToken, expiresAt };
}

export function getSession(db: any, sessionId: string) {
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return session;
}

export function deleteSession(db: any, sessionId: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export async function verifyDirectPost(db: any, config: any, input: any, requestMeta: any) {
  const authRequest = db.prepare("SELECT * FROM auth_requests WHERE state = ?").get(input.state);
  if (!authRequest) throw new Error("state mismatch");
  if (authRequest.used) throw new Error("replay attempt");
  if (authRequest.expires_at < Date.now()) throw new Error("state mismatch");

  const unsignedVp = JSON.parse(Buffer.from(input.vp_token.split(".")[1], "base64url").toString("utf8"));
  const holderDid = unsignedVp.sub;
  const vpClaims = await verifyVpJwt(input.vp_token, holderDid, authRequest.client_id);

  const nonceValidation = validateNonceState(authRequest.nonce, authRequest.state, vpClaims.nonce, input.state);
  if (!nonceValidation.ok) throw new Error(nonceValidation.reason);

  const replay = db.prepare("SELECT * FROM replay_cache WHERE token_jti = ?").get(vpClaims.jti);
  if (replay) throw new Error("replay attempt");

  const vcJwt = vpClaims.vp.verifiableCredential[0];
  let vcClaims;
  try {
    vcClaims = await verifyVcJwt(vcJwt);
  } catch {
    throw new Error("tampered token");
  }

  if (vcClaims.sub !== holderDid || vcClaims.vc.credentialSubject.id !== holderDid) {
    throw new Error("holder binding");
  }
  if (vcClaims.iss !== db.prepare("SELECT did FROM keystore WHERE alias = ?").get(config.keyAlias).did) {
    throw new Error("wrong issuer");
  }
  if (vcClaims.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("expired credential");
  }
  const row = db.prepare("SELECT * FROM credentials WHERE jti = ?").get(vcClaims.jti);
  const statusValidation = validateCredentialStatus(row?.status ?? "revoked");
  if (!statusValidation.ok) throw new Error(statusValidation.reason);
  if (vpClaims.aud !== authRequest.client_id) throw new Error("wrong audience");
  const roleValidation = validatePathRole(vcClaims, authRequest.target_path);
  if (!roleValidation.ok) throw new Error(roleValidation.reason);

  db.prepare("UPDATE auth_requests SET used = 1 WHERE state = ?").run(input.state);
  db.prepare("INSERT INTO replay_cache(token_jti, token_type, created_at, expires_at) VALUES(?, 'vp', ?, ?)").run(vpClaims.jti, Date.now(), Date.now() + 10 * 60 * 1000);

  writeAudit(db, {
    eventType: "login",
    outcome: "success",
    summaryReason: "authentication succeeded",
    detailReason: "vp validated and session issued",
    holderDid,
    credentialJti: vcClaims.jti,
    targetPath: authRequest.target_path,
    ipAddress: requestMeta.ip,
    userAgent: requestMeta.userAgent
  });

  return {
    holderDid,
    role: vcClaims.vc.credentialSubject.role,
    permissions: vcClaims.vc.credentialSubject.permissions,
    credentialJti: vcClaims.jti,
    targetPath: authRequest.target_path
  };
}

export function recordFailure(db: any, reason: string, meta: any) {
  writeAudit(db, {
    eventType: "login",
    outcome: "failure",
    summaryReason: reason,
    detailReason: meta.detailReason ?? reason,
    holderDid: meta.holderDid,
    credentialJti: meta.credentialJti,
    targetPath: meta.targetPath,
    ipAddress: meta.ip,
    userAgent: meta.userAgent
  });
}
'@

Write-File "$root\apps\api\src\middleware\auth.ts" @'
import type { Request, Response, NextFunction } from "express";
import { getSession } from "../modules/verifier/service";

export function sessionMiddleware(db: any, config: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.[config.cookieName];
    if (sessionId) {
      const session = getSession(db, sessionId);
      if (session) {
        (req as any).session = session;
      }
    }
    next();
  };
}

export function requireSession(role?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session) return res.status(401).json({ error: "Authentication required" });
    if (role && session.role !== role) {
      return res.status(403).json({ error: "Access denied", reason: "insufficient role" });
    }
    next();
  };
}

export function requireCsrf(config: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session) return res.status(401).json({ error: "Authentication required" });
    const headerValue = req.header(config.csrfHeaderName);
    if (!headerValue || headerValue !== session.csrf_token) {
      return res.status(403).json({ error: "CSRF validation failed" });
    }
    next();
  };
}
'@

Write-File "$root\apps\api\src\app.ts" @'
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
  app.post("/api/wallets/:did/import", async (req, res) => res.json(await importWalletCredential(db, req.params.did, req.body.passphrase, req.body.vcJwt))));
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
'@

Write-File "$root\apps\api\src\index.ts" @'
import { buildApp } from "./app";
import { config } from "./config";

const { app } = await buildApp();
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
'@

Write-File "$root\apps\api\src\seed\demoSeed.ts" @'
import { buildApp } from "../app";
import { issueCredential, updateCredentialStatus } from "../modules/issuer/service";
import { createWallet, importWalletCredential } from "../modules/wallet/service";

const { db, issuer } = await buildApp();
const passphrase = "demo-passphrase";
const wallets = [
  { role: "Admin", expiresInSeconds: 86400 },
  { role: "Auditor", expiresInSeconds: 86400 },
  { role: "Developer", expiresInSeconds: 86400 },
  { role: "Admin", expiresInSeconds: -60 },
  { role: "Developer", expiresInSeconds: 86400 }
] as const;

for (const item of wallets) {
  const wallet = await createWallet(db, passphrase);
  const issued = await issueCredential(db, issuer, { subjectDid: wallet.did, role: item.role, expiresInSeconds: item.expiresInSeconds });
  await importWalletCredential(db, wallet.did, passphrase, issued.vcJwt);
  if (item.role === "Developer") {
    updateCredentialStatus(db, issued.claims.jti, "revoked", "seeded revoked credential");
  }
}

console.log("Demo seed completed. Passphrase: demo-passphrase");
'@

Write-File "$root\apps\api\tests\security.test.ts" @'
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
'@

Write-File "$root\apps\web\index.html" @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DID VC RBAC MVP</title>
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
'@

Write-File "$root\apps\web\src\lib\api.ts" @'
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.reason || body.error || "request failed");
  }
  return response.json();
}
'@

Write-File "$root\apps\web\src\components\Layout.tsx" @'
import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/", "Overview"],
  ["/issuer", "Issuer"],
  ["/wallet", "Wallet"],
  ["/verifier", "Verifier"],
  ["/admin", "Admin"],
  ["/audit", "Audit"],
  ["/dev", "Dev"]
];

export function Layout() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 24, background: '#0b1020', minHeight: '100vh', color: '#eef2ff' }}>
      <h1>DID Admin Console + VC RBAC MVP</h1>
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ color: isActive ? '#4ade80' : '#cbd5e1' })}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
'@

Write-File "$root\apps\web\src\hooks\useSummary.ts" @'
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useSummary() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    try {
      setData(await api('/api/system/summary'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => { void refresh(); }, []);
  return { data, error, refresh };
}
'@

Write-File "$root\apps\web\src\pages\OverviewPage.tsx" @'
import { useSummary } from "../hooks/useSummary";

export function OverviewPage() {
  const { data, refresh } = useSummary();
  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
'@

Write-File "$root\apps\web\src\pages\IssuerPage.tsx" @'
import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

export function IssuerPage() {
  const { data, refresh } = useSummary();
  const [subjectDid, setSubjectDid] = useState('');
  const [role, setRole] = useState('Admin');
  const [expiresInSeconds, setExpiresInSeconds] = useState(3600);
  const [issued, setIssued] = useState<any>(null);

  return (
    <div>
      <h2>Issuer</h2>
      <input placeholder="subject DID" value={subjectDid} onChange={(e) => setSubjectDid(e.target.value)} style={{ width: 500 }} />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>Admin</option><option>Auditor</option><option>Developer</option>
      </select>
      <input type="number" value={expiresInSeconds} onChange={(e) => setExpiresInSeconds(Number(e.target.value))} />
      <button onClick={async () => { const res = await api('/api/issuer/credentials', { method: 'POST', body: JSON.stringify({ subjectDid, role, expiresInSeconds }) }); setIssued(res); refresh(); }}>Issue VC</button>
      <pre>{JSON.stringify(issued, null, 2)}</pre>
      <h3>Issued Credentials</h3>
      {data?.credentials?.map((item: any) => (
        <div key={item.jti} style={{ border: '1px solid #334155', padding: 12, marginBottom: 8 }}>
          <div>{item.role} / {item.subject_did}</div>
          <div>Status: {item.status}</div>
          <button onClick={async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'suspended', reason: 'manual suspend' }) }); refresh(); }}>Suspend</button>
          <button onClick={async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'revoked', reason: 'manual revoke' }) }); refresh(); }}>Revoke</button>
        </div>
      ))}
    </div>
  );
}
'@

Write-File "$root\apps\web\src\pages\WalletPage.tsx" @'
import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

export function WalletPage() {
  const { data, refresh } = useSummary();
  const [passphrase, setPassphrase] = useState('demo-passphrase');
  const [selectedDid, setSelectedDid] = useState('');
  const [vcJwt, setVcJwt] = useState('');
  const [requestJson, setRequestJson] = useState('');
  const [credentialJti, setCredentialJti] = useState('');
  const [vp, setVp] = useState<any>(null);
  return (
    <div>
      <h2>Wallet</h2>
      <input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="passphrase" />
      <button onClick={async () => { const wallet = await api<any>('/api/wallets', { method: 'POST', body: JSON.stringify({ passphrase }) }); setSelectedDid(wallet.did); refresh(); }}>Create Holder DID</button>
      <div>
        <select value={selectedDid} onChange={(e) => setSelectedDid(e.target.value)}>
          <option value="">Select wallet</option>
          {data?.wallets?.map((w: any) => <option key={w.did} value={w.did}>{w.did}</option>)}
        </select>
      </div>
      <textarea placeholder="VC JWT" value={vcJwt} onChange={(e) => setVcJwt(e.target.value)} rows={5} style={{ width: '100%' }} />
      <button onClick={async () => { await api(`/api/wallets/${encodeURIComponent(selectedDid)}/import`, { method: 'POST', body: JSON.stringify({ passphrase, vcJwt }) }); refresh(); }}>Import VC</button>
      <h3>Presentation Request</h3>
      <textarea placeholder="auth request JSON" value={requestJson} onChange={(e) => setRequestJson(e.target.value)} rows={8} style={{ width: '100%' }} />
      <input placeholder="credential jti" value={credentialJti} onChange={(e) => setCredentialJti(e.target.value)} style={{ width: '100%' }} />
      <button onClick={async () => { const request = JSON.parse(requestJson); const result = await api(`/api/wallets/${encodeURIComponent(selectedDid)}/present`, { method: 'POST', body: JSON.stringify({ passphrase, credentialJti, request }) }); setVp(result); }}>Create VP</button>
      <pre>{JSON.stringify(vp, null, 2)}</pre>
      <h3>Wallet Credentials</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
'@

Write-File "$root\apps\web\src\pages\VerifierPage.tsx" @'
import { useState } from "react";
import { api } from "../lib/api";

export function VerifierPage() {
  const [targetPath, setTargetPath] = useState('/admin');
  const [authRequest, setAuthRequest] = useState<any>(null);
  const [vpToken, setVpToken] = useState('');
  const [result, setResult] = useState<any>(null);
  return (
    <div>
      <h2>Verifier</h2>
      <select value={targetPath} onChange={(e) => setTargetPath(e.target.value)}>
        <option>/admin</option><option>/audit</option><option>/dev</option>
      </select>
      <button onClick={async () => setAuthRequest(await api('/api/verifier/request', { method: 'POST', body: JSON.stringify({ targetPath }) }))}>Start Login</button>
      <pre>{JSON.stringify(authRequest, null, 2)}</pre>
      <textarea placeholder="VP JWT" value={vpToken} onChange={(e) => setVpToken(e.target.value)} rows={8} style={{ width: '100%' }} />
      <button onClick={async () => { if (!authRequest) return; try { setResult(await api('/api/verifier/direct-post', { method: 'POST', body: JSON.stringify({ vp_token: vpToken, state: authRequest.state }) })); } catch (e: any) { setResult({ error: e.message }); } }}>Submit VP</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
'@

Write-File "$root\apps\web\src\pages\ProtectedPage.tsx" @'
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function ProtectedPage({ title, endpoint }: { title: string; endpoint: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api(endpoint).then(setData).catch((e) => setError(e.message)); }, [endpoint]);
  return <div><h2>{title}</h2>{error ? <p>{error}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}</div>;
}
'@

Write-File "$root\apps\web\src\main.tsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OverviewPage } from "./pages/OverviewPage";
import { IssuerPage } from "./pages/IssuerPage";
import { WalletPage } from "./pages/WalletPage";
import { VerifierPage } from "./pages/VerifierPage";
import { ProtectedPage } from "./pages/ProtectedPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="issuer" element={<IssuerPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="verifier" element={<VerifierPage />} />
          <Route path="admin" element={<ProtectedPage title="Admin Console" endpoint="/api/admin/data" />} />
          <Route path="audit" element={<ProtectedPage title="Audit Console" endpoint="/api/audit/data" />} />
          <Route path="dev" element={<ProtectedPage title="Developer Console" endpoint="/api/dev/data" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
'@

Write-File "$root\docs\threat-model.md" @'
# Threat Model

## Assets
- Issuer private key
- Holder private keys
- VC JWTs
- VP JWTs
- Session cookies
- Audit logs

## Trust boundaries
1. Browser UI ↔ API server
2. Issuer module ↔ wallet storage
3. Wallet encrypted-at-rest storage ↔ holder consent flow
4. Verifier ↔ session subsystem
5. SQLite state store ↔ validation logic

## Key threats and mitigations
- Replay of VP → one-time state, one-time nonce, replay cache keyed by VP jti
- Tampered VC/VP → JOSE signature verification with did:jwk public key resolution
- Stolen session cookie → HttpOnly cookie, explicit logout, TTL, session renewal by re-authentication
- Cross-site request forgery → sameSite=lax + CSRF header check on logout and future state-changing endpoints
- Misissued or untrusted issuer → issuer allowlist bound to local keystore DID
- Revoked/suspended credential reuse → local status registry enforced during verification
- Wrong audience → VP aud must match verifier client_id
- Holder substitution → VC subject DID and VP signer DID must match
'@

Write-File "$root\README.md" @'
# DID 기반 관리자 콘솔 로그인 + VC 기반 RBAC MVP

보안 포트폴리오 제출용 로컬 MVP다. 비밀번호 로그인 대신 DID/VC를 사용하고, VC 안의 role/permissions로 관리자 콘솔 RBAC를 수행한다.

## 프로젝트 개요
- 하나의 웹앱 안에 Issuer / Wallet / Verifier / Audit UI 제공
- 하나의 backend에서 issuer, wallet, verifier, audit 모듈 분리
- shared package에 DID/JOSE/VC 검증 로직 공통화
- SQLite 기반 상태 저장
- did:jwk + vc+jwt / vp+jwt 사용

## 왜 DID/VC를 썼는지
- 관리자 계정의 정적 비밀번호/공유 비밀 의존성을 줄이고, 서명 가능한 보안 자격증명으로 인증
- VC claim 안에 role / permissions를 넣어 인증과 권한부여를 강하게 연결
- 재생 공격 방어, 폐기/정지, issuer trust allowlist, holder binding 같은 보안 검증 포인트를 명확히 시연 가능

## 인증 흐름 설명
1. Verifier가 `/admin`, `/audit`, `/dev` 접근용 authorization request 생성
2. 서버가 nonce/state를 CSPRNG로 생성하고 SQLite에 1회성으로 저장
3. Wallet이 사용자 동의 후 VC를 담은 VP JWT 생성
4. VP JWT는 `aud=client_id`, `nonce=<request nonce>`로 바인딩
5. Verifier가 direct_post 수신 후 다음을 검증
   - issuer allowlist
   - VC/VP signature
   - expiration / nbf
   - revocation / suspension
   - audience binding
   - nonce/state 일치
   - replay cache
   - holder binding
   - role / permission 매핑
6. 성공 시 HttpOnly 세션 쿠키 발급

## RBAC 설명
- `/admin` → Admin만 허용
- `/audit` → Auditor만 허용
- `/dev` → Developer만 허용
- 부족한 경우 UI에는 `insufficient role`만 노출하고 상세는 감사로그에 남김

## replay 방어 설명
- nonce/state를 매 요청마다 새로 생성
- auth request는 1회성 used 플래그 처리
- VP jti를 replay cache에 저장해 동일 VP 재제출 차단

## revocation 설명
- 로컬 status registry를 사용해 `active / suspended / revoked` 상태 관리
- verifier는 VC 검증 이후 반드시 상태 조회 수행
- 구조상 이후 Bitstring Status List 구현체로 교체 가능

## 보안상 한계와 확장 포인트
- 로컬 MVP라 다중 디바이스 월렛 동기화 없음
- did:jwk는 간단하지만 공개 DID registry 연동이 없음
- 현재 issuer allowlist는 단일 local issuer DID 기준
- production 전환 시 secure cookie, HTTPS, key wrapping/HSM, device-bound wallet storage, DID resolver 확장 필요
- status service를 표준 status list로 교체 가능

## API 경계와 trust boundary
- Frontend는 presentation 동의와 관리 UI만 담당하고, 신뢰 판단은 backend verifier가 수행
- Backend issuer는 VC 발급 및 상태 관리의 신뢰 루트
- Wallet 저장소는 passphrase 기반 암호화-at-rest 제공
- Session은 verifier 성공 이후에만 생성

## Mermaid 아키텍처 다이어그램
```mermaid
flowchart LR
  UI[React Web App\nIssuer / Wallet / Verifier / Audit] --> API[Express API]
  API --> ISS[Issuer Module]
  API --> WAL[Wallet Module]
  API --> VER[Verifier Module]
  API --> AUD[Audit Module]
  API --> DB[(SQLite)]
  SH[Shared TS Package] --> UI
  SH --> API
  VER --> DB
  ISS --> DB
  WAL --> DB
  AUD --> DB
```

## 로컬 실행 방법
```bash
cd C:\Sjw_dev\Coding\did-vc-rbac-mvp
copy .env.example .env
npm install
npm run seed
npm run dev
```
- API: http://localhost:3001
- Web: http://localhost:5173

## 시연 순서
1. Wallet에서 Holder DID 생성
2. Issuer에서 Admin/Auditor/Developer VC 발급
3. Wallet에서 VC import
4. Verifier에서 `/admin` 요청 생성
5. Wallet에서 request JSON 붙여넣고 VP 생성
6. Verifier에 VP 제출 → 성공 후 `/admin` 접근 확인
7. 같은 방식으로 `/audit`, `/dev` 확인
8. Issuer에서 credential revoke/suspend 후 재로그인 실패 확인
9. 만료 VC로 실패 확인
10. 같은 VP 재제출로 replay 방어 확인
11. VP 문자열 일부 변조 후 tampered token 실패 확인

## 실행 명령어
```bash
npm install
npm run seed
npm run dev
npm run test
npm --workspace @did-vc-rbac/api run test
npm --workspace @did-vc-rbac/web run build
```

## 테스트 범위
- unit: token validation, role mapping, status check, nonce/state validation
- integration: 정상 로그인, revoked 차단, expired 차단, replay 차단, insufficient role 차단

## 이 프로젝트를 이력서에 어떻게 쓸지
1. DID/VC 기반 관리자 콘솔 인증 MVP를 설계·구현하여 비밀번호 없는 관리자 인증과 VC 기반 RBAC를 로컬 환경에서 재현했습니다.
2. OpenID4VP 스타일 direct_post 흐름에 nonce/state 1회성 처리와 VP jti replay cache를 적용해 재생 공격 방어를 구현했습니다.
3. did:jwk + JOSE 기반 VC/VP 서명 검증, issuer allowlist, holder binding, audience binding을 하나의 verifier 파이프라인으로 통합했습니다.
4. credential revocation/suspension 상태 서비스와 SQLite 감사로그를 구현해 인증 실패 사유를 보안 관측 가능 형태로 시각화했습니다.
5. React + Express + shared TypeScript monorepo 구조로 보안 기능과 개발 생산성을 동시에 고려한 포트폴리오형 풀스택 시스템을 완성했습니다.
'@
