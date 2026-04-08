import { AuthRequestSchema } from "../schemas/types";
import { hasRequiredRole } from "../rbac/roles";
export function parseAuthRequest(input) {
    return AuthRequestSchema.parse(input);
}
export function validateNonceState(expectedNonce, expectedState, receivedNonce, receivedState) {
    if (expectedState !== receivedState)
        return { ok: false, reason: "state mismatch" };
    if (expectedNonce !== receivedNonce)
        return { ok: false, reason: "nonce mismatch" };
    return { ok: true };
}
export function validateCredentialStatus(status) {
    if (status === "revoked")
        return { ok: false, reason: "revoked credential" };
    if (status === "suspended")
        return { ok: false, reason: "suspended credential" };
    return { ok: true };
}
export function validatePathRole(claims, targetPath) {
    const role = claims.vc.credentialSubject.role;
    if (!hasRequiredRole(role, targetPath)) {
        return { ok: false, reason: "insufficient role" };
    }
    return { ok: true };
}
