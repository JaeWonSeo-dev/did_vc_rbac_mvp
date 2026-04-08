import { z } from "zod";

export const RoleSchema = z.enum(["Admin", "Auditor", "Developer"]);
export type Role = z.infer<typeof RoleSchema>;

export const CredentialStatusSchema = z.enum(["active", "suspended", "revoked"]);
export type CredentialStatus = z.infer<typeof CredentialStatusSchema>;

export const PermissionSchema = z.string().min(1);
export type Permission = z.infer<typeof PermissionSchema>;

export const VcClaimsSchema = z.object({
  jti: z.string(),
  iss: z.string(),
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  nbf: z.number().optional(),
  vc: z.object({
    type: z.array(z.string()),
    credentialSubject: z.object({
      id: z.string(),
      role: RoleSchema,
      permissions: z.array(PermissionSchema)
    }),
    credentialStatus: z.object({
      id: z.string(),
      type: z.literal("LocalCredentialStatus")
    })
  })
});
export type VcClaims = z.infer<typeof VcClaimsSchema>;

export const VpClaimsSchema = z.object({
  jti: z.string(),
  iss: z.string(),
  sub: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
  nonce: z.string(),
  vp: z.object({
    type: z.array(z.string()),
    verifiableCredential: z.array(z.string())
  })
});
export type VpClaims = z.infer<typeof VpClaimsSchema>;

export const AuthRequestSchema = z.object({
  client_id: z.string(),
  response_mode: z.literal("direct_post"),
  response_uri: z.string(),
  nonce: z.string(),
  state: z.string(),
  scope: z.literal("openid4vp_did_vc"),
  role: RoleSchema,
  purpose: z.string()
});
export type AuthRequest = z.infer<typeof AuthRequestSchema>;
