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
