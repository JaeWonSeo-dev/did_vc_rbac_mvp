import { ROLE_PERMISSIONS, signVcJwt } from "@did-vc-rbac/shared";
import { randomUUID } from "node:crypto";
export async function issueCredential(db, issuer, input) {
    const now = Math.floor(Date.now() / 1000);
    const jti = randomUUID();
    const permissions = ROLE_PERMISSIONS[input.role];
    const claims = {
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
                permissions
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
        .run(jti, input.subjectDid, issuer.did, input.role, JSON.stringify(permissions), vcJwt, claims.iat, claims.exp, timestamp, timestamp);
    return { claims, vcJwt };
}
export function listCredentials(db) {
    return db.prepare("SELECT * FROM credentials ORDER BY created_at DESC").all();
}
export function updateCredentialStatus(db, jti, status, reason) {
    db.prepare("UPDATE credentials SET status = ?, status_reason = ?, updated_at = ? WHERE jti = ?").run(status, reason, Date.now(), jti);
    return db.prepare("SELECT * FROM credentials WHERE jti = ?").get(jti);
}
export function getCredentialByJti(db, jti) {
    return db.prepare("SELECT * FROM credentials WHERE jti = ?").get(jti);
}
