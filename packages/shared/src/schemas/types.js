import { z } from "zod";
export const RoleSchema = z.enum(["Admin", "Auditor", "Developer"]);
export const CredentialStatusSchema = z.enum(["active", "suspended", "revoked"]);
export const PermissionSchema = z.string().min(1);
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
