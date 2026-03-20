import { loadPaymentSettingsMap } from "@/lib/platform-payment-settings-db";
import {
  PLATFORM_SETTING_PAYMENT_PROVIDER,
  PLATFORM_SETTING_STRIPE_PRICE_ID,
  PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_SETTING_STRIPE_SECRET_KEY,
  PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
} from "@/lib/payment-gateway-keys";

export {
  PLATFORM_SETTING_PAYMENT_PROVIDER,
  PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_SETTING_STRIPE_SECRET_KEY,
  PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
  PLATFORM_SETTING_STRIPE_PRICE_ID,
  PAYMENT_PLATFORM_SETTING_KEYS,
} from "@/lib/payment-gateway-keys";

/** Active subscription / checkout provider. Extend with e.g. `paddle` when implemented. */
export type PaymentProviderId = "none" | "stripe";

export type ResolvedStripeCredentials = {
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  priceId: string | null;
};

export type ResolvedPaymentGatewayConfig = {
  provider: PaymentProviderId;
  stripe: ResolvedStripeCredentials;
};

const CACHE_TTL_MS = 30_000;
let cache: { at: number; value: ResolvedPaymentGatewayConfig } | null = null;

function readStringSetting(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function mergeConfig(map: Map<string, unknown>): ResolvedPaymentGatewayConfig {
  const providerRaw = readStringSetting(map.get(PLATFORM_SETTING_PAYMENT_PROVIDER));
  const explicitNone = providerRaw === "none";
  const explicitStripe = providerRaw === "stripe";

  const secretKey =
    readStringSetting(map.get(PLATFORM_SETTING_STRIPE_SECRET_KEY)) ??
    process.env.STRIPE_SECRET_KEY ??
    null;
  const publishableKey =
    readStringSetting(map.get(PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY)) ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    null;
  const webhookSecret =
    readStringSetting(map.get(PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET)) ??
    process.env.STRIPE_WEBHOOK_SECRET ??
    null;
  const priceId =
    readStringSetting(map.get(PLATFORM_SETTING_STRIPE_PRICE_ID)) ??
    process.env.STRIPE_PRICE_ID ??
    null;

  let provider: PaymentProviderId;
  if (explicitNone) {
    provider = "none";
  } else if (explicitStripe) {
    provider = "stripe";
  } else if (secretKey?.startsWith("sk_")) {
    provider = "stripe";
  } else {
    provider = "none";
  }

  return {
    provider,
    stripe: {
      secretKey,
      publishableKey,
      webhookSecret,
      priceId: priceId?.startsWith("price_") ? priceId : null,
    },
  };
}

/**
 * Cached merged view: database overrides environment for Stripe fields.
 * If `payment_provider` is `none` in DB, Stripe checkout is disabled even when env keys exist.
 */
export async function resolvePaymentGatewayConfig(): Promise<ResolvedPaymentGatewayConfig> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  const map = await loadPaymentSettingsMap();
  const value = mergeConfig(map);
  cache = { at: now, value };
  return value;
}

export function invalidatePaymentGatewayConfigCache(): void {
  cache = null;
}

/** Mask api keys for super-admin UI (never send full secrets to the browser). */
export function maskPublishableKey(pk: string | null | undefined): string {
  if (!pk || pk.length < 16) return "";
  if (pk.length <= 20) return `${pk.slice(0, 8)}…`;
  return `${pk.slice(0, 12)}…${pk.slice(-6)}`;
}

export function maskSecretKey(sk: string | null | undefined): string {
  if (!sk || sk.length < 12) return "";
  return `${sk.slice(0, 8)}…${sk.slice(-4)}`;
}

export type CredentialSource = "database" | "environment" | "none";

function credentialSource(
  hasDbValue: boolean,
  effective: string | null,
  envValue: string | null
): CredentialSource {
  if (hasDbValue) return "database";
  if (effective && envValue && effective === envValue.trim()) return "environment";
  if (effective) return "environment";
  return "none";
}

/** Super-admin GET: merged config + where each field is coming from. */
export async function describePaymentSettingsForAdmin(): Promise<{
  providerChoice: PaymentProviderId | null;
  merged: ResolvedPaymentGatewayConfig;
  sources: {
    publishableKey: CredentialSource;
    secretKey: CredentialSource;
    webhookSecret: CredentialSource;
    priceId: CredentialSource;
  };
}> {
  const map = await loadPaymentSettingsMap();
  const merged = mergeConfig(map);

  const pkDb = !!readStringSetting(map.get(PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY));
  const skDb = !!readStringSetting(map.get(PLATFORM_SETTING_STRIPE_SECRET_KEY));
  const whDb = !!readStringSetting(map.get(PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET));
  const priceDb = !!readStringSetting(map.get(PLATFORM_SETTING_STRIPE_PRICE_ID));

  const pRaw = readStringSetting(map.get(PLATFORM_SETTING_PAYMENT_PROVIDER));
  const providerChoice: PaymentProviderId | null =
    pRaw === "none" || pRaw === "stripe" ? pRaw : null;

  return {
    providerChoice,
    merged,
    sources: {
      publishableKey: credentialSource(
        pkDb,
        merged.stripe.publishableKey,
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null
      ),
      secretKey: credentialSource(
        skDb,
        merged.stripe.secretKey,
        process.env.STRIPE_SECRET_KEY ?? null
      ),
      webhookSecret: credentialSource(
        whDb,
        merged.stripe.webhookSecret,
        process.env.STRIPE_WEBHOOK_SECRET ?? null
      ),
      priceId: credentialSource(
        priceDb,
        merged.stripe.priceId,
        process.env.STRIPE_PRICE_ID ?? null
      ),
    },
  };
}
