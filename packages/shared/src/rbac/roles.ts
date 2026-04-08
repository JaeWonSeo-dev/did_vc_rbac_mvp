import type { Role } from "../schemas/types";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Admin: ["users:read", "users:write", "audit:read", "devtools:read"],
  Auditor: ["audit:read"],
  Developer: ["devtools:read"]
};

export function requiredRoleForPath(path: string): Role | null {
  if (path.startsWith("/admin")) return "Admin";
  if (path.startsWith("/audit")) return "Auditor";
  if (path.startsWith("/dev")) return "Developer";
  return null;
}

export function hasRequiredRole(role: Role, targetPath: string): boolean {
  const required = requiredRoleForPath(targetPath);
  return required ? required === role : true;
}
