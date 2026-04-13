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
  const claims = await verifyVcJwt(vcJwt, undefined, { ignoreExpiration: true });
  const subject = claims.vc.credentialSubject as { role?: string; permissions?: string[] };
  const encryptedCredential = encryptJson({ vcJwt }, passphrase);
  db.prepare(`INSERT INTO wallet_credentials(holder_did, credential_jti, vc_jwt_encrypted, role, permissions_json, issuer_did, added_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)`)
    .run(holderDid, claims.jti, JSON.stringify(encryptedCredential), subject.role ?? "PortfolioCredential", JSON.stringify(subject.permissions ?? []), claims.iss, Date.now());
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
