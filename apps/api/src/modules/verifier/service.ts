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
  } catch (error: any) {
    if ((error?.code ?? "").toString().includes("ERR_JWT_EXPIRED") || /expired/i.test(error?.message ?? "")) {
      throw new Error("expired credential");
    }
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
