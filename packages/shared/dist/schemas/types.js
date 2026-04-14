import { z } from "zod";
export const RoleSchema = z.enum(["Admin", "Auditor", "Developer"]);
export const CredentialStatusSchema = z.enum(["active", "suspended", "revoked"]);
export const PermissionSchema = z.string().min(1);
export const LocalCredentialStatusSchema = z.object({
    id: z.string(),
    type: z.literal("LocalCredentialStatus")
});
export const RbacCredentialSubjectSchema = z.object({
    id: z.string(),
    role: RoleSchema,
    permissions: z.array(PermissionSchema)
});
export const GitHubAccountOwnershipCredentialSubjectSchema = z.object({
    id: z.string(),
    githubUsername: z.string(),
    githubProfileUrl: z.string().url(),
    verifiedAt: z.number()
});
export const GitHubContributionCredentialSubjectSchema = z.object({
    id: z.string(),
    repository: z.string(),
    repositoryUrl: z.string().url(),
    role: z.string(),
    commitCount: z.number().int().nonnegative(),
    mergedPrCount: z.number().int().nonnegative(),
    period: z.object({
        start: z.string(),
        end: z.string()
    }),
    evidenceSummary: z.string()
});
export const PortfolioAchievementCredentialSubjectSchema = z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    issuerName: z.string().optional(),
    issuedOn: z.string().optional(),
    credentialUrl: z.string().url().optional(),
    evidenceSummary: z.string(),
    evidence: z.array(z.string()).default([])
});
export const PortfolioCredentialSubjectSchema = z.union([
    GitHubAccountOwnershipCredentialSubjectSchema,
    GitHubContributionCredentialSubjectSchema,
    PortfolioAchievementCredentialSubjectSchema
]);
export const CredentialSubjectSchema = z.union([
    RbacCredentialSubjectSchema,
    GitHubAccountOwnershipCredentialSubjectSchema,
    GitHubContributionCredentialSubjectSchema,
    PortfolioAchievementCredentialSubjectSchema
]);
export const VcClaimsSchema = z.object({
    jti: z.string(),
    iss: z.string(),
    sub: z.string(),
    iat: z.number(),
    exp: z.number(),
    nbf: z.number().optional(),
    vc: z.object({
        type: z.array(z.string()),
        credentialSubject: CredentialSubjectSchema,
        credentialStatus: LocalCredentialStatusSchema
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
