export type DisplayNameResult =
  | { ok: true; value: string }
  | { ok: false; error: "nameRequired" | "nameTooLong" | "nameInvalid" };

/**
 * Validate a display name entered by a member or administrator.
 *
 * Names may contain letters, combining marks, numbers, spaces, dots,
 * apostrophes, and hyphens. Control characters and punctuation that has no
 * place in a name are rejected. The same rule applies on every write path.
 */
export function normalizeDisplayName(input: string): DisplayNameResult {
  if (/[\u0000-\u001F\u007F]/.test(input)) {
    return { ok: false, error: "nameInvalid" };
  }

  const value = input.trim().replace(/\s+/g, " ");

  if (value.length === 0) {
    return { ok: false, error: "nameRequired" };
  }
  if (value.length > 100) {
    return { ok: false, error: "nameTooLong" };
  }
  if (!/^[\p{L}\p{M}\p{N} .'’-]+$/u.test(value)) {
    return { ok: false, error: "nameInvalid" };
  }

  return { ok: true, value };
}

/**
 * Sanitize a name supplied by an external identity provider. External names
 * are displayed as text, never interpolated into scripts, so this keeps the
 * value readable rather than rejecting legitimate punctuation.
 */
export function sanitizeExternalDisplayName(input: string): string {
  const value = input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return value || "Member";
}

export function passwordMinimum(role: string): number {
  return role === "admin" || role === "super_admin" ? 12 : 8;
}

export function validatePassword(password: string, role: string): string | null {
  const minimum = passwordMinimum(role);
  if (password.length < minimum) {
    return `Password must be at least ${minimum} characters.`;
  }
  if (password.length > 200) {
    return "Password cannot exceed 200 characters.";
  }
  return null;
}

export function parsePage(value: string | undefined, fallback = 1): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
