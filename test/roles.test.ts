import { describe, expect, test } from "bun:test";
import {
  isActiveMemberRole,
  isAdminRole,
  isAssignableRole,
  isPendingRole,
  isSuperAdminRole,
} from "../src/lib/roles.ts";

describe("role helpers", () => {
  test("separates pending, active, admin, and super admin", () => {
    expect(isPendingRole("pending")).toBe(true);
    expect(isPendingRole("santri")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("santri")).toBe(false);
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("admin")).toBe(false);
    expect(isActiveMemberRole("santri")).toBe(true);
    expect(isActiveMemberRole("pending")).toBe(false);
  });

  test("only exposes assignable roles", () => {
    expect(isAssignableRole("santri")).toBe(true);
    expect(isAssignableRole("super_admin")).toBe(true);
    expect(isAssignableRole("pending")).toBe(false);
    expect(isAssignableRole("unknown")).toBe(false);
  });
});
