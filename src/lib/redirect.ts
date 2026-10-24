/**
 * Return a same-origin path from a Referer value, or "/" when the value is
 * missing, malformed, or points at another origin. Used by the language
 * switch so a crafted Referer cannot turn the route into an open redirect.
 */
export function safeRedirectTarget(
  referer: string | undefined,
  baseUrl: string
): string {
  if (!referer) return "/";
  if (!referer.startsWith("/") && !/^https?:\/\//i.test(referer)) return "/";

  try {
    const base = new URL(baseUrl);
    const target = new URL(referer, base);
    if (target.origin !== base.origin) return "/";

    const path = `${target.pathname}${target.search}${target.hash}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
  } catch {
    return "/";
  }
}
