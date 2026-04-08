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
];
for (const item of wallets) {
    const wallet = await createWallet(db, passphrase);
    const issued = await issueCredential(db, issuer, { subjectDid: wallet.did, role: item.role, expiresInSeconds: item.expiresInSeconds });
    await importWalletCredential(db, wallet.did, passphrase, issued.vcJwt);
    if (item.role === "Developer") {
        updateCredentialStatus(db, issued.claims.jti, "revoked", "seeded revoked credential");
    }
}
console.log("Demo seed completed. Passphrase: demo-passphrase");
