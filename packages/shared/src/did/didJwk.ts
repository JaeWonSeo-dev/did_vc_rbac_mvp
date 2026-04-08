import { exportJWK, importJWK, calculateJwkThumbprint, generateKeyPair } from "jose";

export type GeneratedDid = {
  did: string;
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
};

export async function createDidJwk(): Promise<GeneratedDid> {
  const { publicKey, privateKey } = await generateKeyPair("ES256", { extractable: true });
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
