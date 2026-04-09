import { describe, expect, it } from "vitest";
import { validateCredentialStatus, validateNonceState, validatePathRole } from "./auth";
import type { VcClaims } from "../schemas/types";

const baseClaims: VcClaims = {
  jti: "test-jti",
  iss: "did:jwk:test",
  sub: "did:jwk:holder",
  iat: 1,
  exp: 9999999999,
  vc: {
    type: ["VerifiableCredential"],
    credentialSubject: {
      id: "did:jwk:holder",
      role: "Admin",
      permissions: ["users:read"]
    },
    credentialStatus: {
      id: "status:test-jti",
      type: "LocalCredentialStatus"
    }
  }
};

describe("shared auth validation", () => {
  it("validates nonce/state", () => {
    expect(validateNonceState("n1", "s1", "n1", "s1").ok).toBe(true);
    expect(validateNonceState("n1", "s1", "n2", "s1").reason).toBe("nonce mismatch");
    expect(validateNonceState("n1", "s1", "n1", "s2").reason).toBe("state mismatch");
  });

  it("validates credential status", () => {
    expect(validateCredentialStatus("active").ok).toBe(true);
    expect(validateCredentialStatus("suspended").reason).toBe("suspended credential");
    expect(validateCredentialStatus("revoked").reason).toBe("revoked credential");
  });

  it("validates role mapping", () => {
    expect(validatePathRole(baseClaims, "/admin").ok).toBe(true);
    const devClaims = {
      ...baseClaims,
      vc: {
        ...baseClaims.vc,
        credentialSubject: {
          ...baseClaims.vc.credentialSubject,
          role: "Developer" as const,
          permissions: ["devtools:read"]
        }
      }
    };
    expect(validatePathRole(devClaims, "/admin").reason).toBe("insufficient role");
  });
});
