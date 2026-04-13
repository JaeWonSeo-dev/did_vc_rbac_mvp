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
  const subject = claims.vc.credentialSubject as { role?: Role };
  if (!subject.role) {
    return { ok: false as const, reason: "insufficient role" };
  }
  if (!hasRequiredRole(subject.role, targetPath)) {
    return { ok: false as const, reason: "insufficient role" };
  }
  return { ok: true as const };
}
