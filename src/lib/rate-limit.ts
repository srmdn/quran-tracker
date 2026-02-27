type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function consumeRateLimit(
  key: string,
  options: { max: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1 };
  }

  if (existing.count >= options.max) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, remaining: options.max - existing.count };
}
