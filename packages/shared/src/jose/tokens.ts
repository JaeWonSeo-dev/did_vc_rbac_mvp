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

export async function verifyVcJwt(jwt: string, issuerDid?: string, options?: { ignoreExpiration?: boolean }) {
  const headerPayloadDid = issuerDid ?? JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")).iss;
  const publicKey = await importPublicJwk(resolveDidJwk(headerPayloadDid));
  const { payload } = await jwtVerify(jwt, publicKey, {
    issuer: headerPayloadDid,
    currentDate: options?.ignoreExpiration ? new Date(0) : undefined
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
