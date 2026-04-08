import { jwtVerify, SignJWT } from "jose";
import { importPrivateJwk, importPublicJwk, resolveDidJwk } from "../did/didJwk";
import { VcClaimsSchema, VpClaimsSchema } from "../schemas/types";
export async function signVcJwt(claims, privateJwk) {
    const key = await importPrivateJwk(privateJwk);
    return new SignJWT(claims)
        .setProtectedHeader({ alg: "ES256", typ: "vc+jwt" })
        .setIssuedAt(claims.iat)
        .setIssuer(claims.iss)
        .setSubject(claims.sub)
        .setJti(claims.jti)
        .setExpirationTime(claims.exp)
        .sign(key);
}
export async function verifyVcJwt(jwt, issuerDid, options) {
    const headerPayloadDid = issuerDid ?? JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")).iss;
    const publicKey = await importPublicJwk(resolveDidJwk(headerPayloadDid));
    const { payload } = await jwtVerify(jwt, publicKey, {
        issuer: headerPayloadDid,
        currentDate: options?.ignoreExpiration ? new Date(0) : undefined
    });
    return VcClaimsSchema.parse(payload);
}
export async function signVpJwt(claims, privateJwk) {
    const key = await importPrivateJwk(privateJwk);
    return new SignJWT(claims)
        .setProtectedHeader({ alg: "ES256", typ: "vp+jwt" })
        .setIssuedAt(claims.iat)
        .setIssuer(claims.iss)
        .setSubject(claims.sub)
        .setAudience(claims.aud)
        .setJti(claims.jti)
        .setExpirationTime(claims.exp)
        .sign(key);
}
export async function verifyVpJwt(jwt, holderDid, audience) {
    const publicKey = await importPublicJwk(resolveDidJwk(holderDid));
    const { payload } = await jwtVerify(jwt, publicKey, {
        issuer: holderDid,
        subject: holderDid,
        audience
    });
    return VpClaimsSchema.parse(payload);
}
