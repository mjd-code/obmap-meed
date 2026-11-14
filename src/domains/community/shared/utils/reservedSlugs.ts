/**
 * Canonical reserved route slugs for ObMap public namespace (`/:username`, `/@:username`).
 * Any top-level path segment matching this set MUST NEVER resolve as a user profile or vault.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "app",
  "vaults",
  "auth",
  "admin",
  "explore",
  "install",
  "settings",
  "api",
  "assets",
  "p",
  "pricing",
  "docs",
  "help",
  "legal",
  "about",
  "login",
  "signup",
  "profile",
  "public",
  "vault",
  "graph",
  "root",
  "register",
  "dashboard",
  "static",
  "system",
  "terms",
  "privacy",
  "status",
]);

/**
 * Normalizes a public scholar handle from `/:username` or `/@:username` URL segments.
 * Trims whitespace, lowercases, and strips an optional single leading `@`.
 */
export function normalizePublicHandle(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim().toLowerCase();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

/**
 * Returns true if the normalized handle is blank or collides with a reserved system route.
 */
export function isReservedSlug(raw?: string | null): boolean {
  const normalized = normalizePublicHandle(raw);
  if (!normalized) return true;
  return RESERVED_SLUGS.has(normalized);
}
