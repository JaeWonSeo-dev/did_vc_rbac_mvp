export const ROLE_PERMISSIONS = {
    Admin: ["users:read", "users:write", "audit:read", "devtools:read"],
    Auditor: ["audit:read"],
    Developer: ["devtools:read"]
};
export function requiredRoleForPath(path) {
    if (path.startsWith("/admin"))
        return "Admin";
    if (path.startsWith("/audit"))
        return "Auditor";
    if (path.startsWith("/dev"))
        return "Developer";
    return null;
}
export function hasRequiredRole(role, targetPath) {
    const required = requiredRoleForPath(targetPath);
    return required ? required === role : true;
}
