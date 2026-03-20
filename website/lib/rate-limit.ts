/**
 * In-memory rate limiter (sliding window). Use for auth and public API protection.
 * For multi-instance deployments, replace with Redis or Vercel KV.
 */

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxAttempts = 10;

const store = new Map<string, { count: number; resetAt: number }>();

function getKey(identifier: string, prefix: string): string {
  return `${prefix}:${identifier}`;
}

function prune(): void {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key);
  }
}

/**
 * Returns true if the request is within limit, false if rate limited.
 * Call this at the start of auth or API handler; if it returns false, return 429.
 */
export function rateLimitAuth(identifier: string): { allowed: boolean; remaining: number } {
  prune();
  const key = getKey(identifier, "auth");
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count += 1;
  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxAttempts - entry.count };
}

/**
 * Rate limit for send-otp (per phone/email + IP).
 */
export function rateLimitOtp(identifier: string): { allowed: boolean; remaining: number } {
  prune();
  const key = getKey(identifier, "otp");
  const now = Date.now();
  const entry = store.get(key);
  const maxOtp = 5;

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxOtp - 1 };
  }

  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxOtp - 1 };
  }

  entry.count += 1;
  if (entry.count > maxOtp) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxOtp - entry.count };
}

const superWindowMs = 15 * 60 * 1000;

/**
 * Rate limit super-admin–only APIs per user (in-memory; use Redis for multi-instance).
 */
export function rateLimitSuperApi(
  userId: string,
  prefix: string,
  maxInWindow: number
): { allowed: boolean } {
  prune();
  const key = getKey(userId, `super-${prefix}`);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + superWindowMs });
    return { allowed: true };
  }
  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + superWindowMs });
    return { allowed: true };
  }
  entry.count += 1;
  if (entry.count > maxInWindow) {
    return { allowed: false };
  }
  return { allowed: true };
}

const publicGeoWindowMs = 15 * 60 * 1000;
const publicGeoMax = 200;

/**
 * Rate limit public geography lookups (register / marketing) per IP.
 * In-memory; use Redis for multi-instance.
 */
export function rateLimitPublicGeo(identifier: string): { allowed: boolean } {
  prune();
  const key = getKey(identifier, "public-geo");
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + publicGeoWindowMs });
    return { allowed: true };
  }
  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + publicGeoWindowMs });
    return { allowed: true };
  }
  entry.count += 1;
  if (entry.count > publicGeoMax) {
    return { allowed: false };
  }
  return { allowed: true };
}

const registerWindowMs = 60 * 60 * 1000;
const registerMax = 10;

/**
 * Rate limit clinic self-registration per client IP (abuse prevention).
 */
export function rateLimitRegister(identifier: string): { allowed: boolean } {
  prune();
  const key = getKey(identifier, "register-clinic");
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + registerWindowMs });
    return { allowed: true };
  }
  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + registerWindowMs });
    return { allowed: true };
  }
  entry.count += 1;
  if (entry.count > registerMax) {
    return { allowed: false };
  }
  return { allowed: true };
}
