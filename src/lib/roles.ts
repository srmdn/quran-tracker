export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export const ACTIVE_MEMBER_ROLES = [
  "member",
  "admin",
  "santri",
  "alumni",
  "asatidz",
  "super_admin",
] as const;

export const ASSIGNABLE_ROLES = [
  "member",
  "admin",
  "santri",
  "alumni",
  "asatidz",
  "super_admin",
] as const;

export function isPendingRole(role: string): boolean {
  return role === "pending";
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isSuperAdminRole(role: string): boolean {
  return role === "super_admin";
}

export function isActiveMemberRole(role: string): boolean {
  return ACTIVE_MEMBER_ROLES.includes(role as (typeof ACTIVE_MEMBER_ROLES)[number]);
}

export function isAssignableRole(role: string): boolean {
  return ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number]);
}
