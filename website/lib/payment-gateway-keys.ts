/** `platform_settings.setting_key` values for payments (Stripe + provider). */

export const PLATFORM_SETTING_PAYMENT_PROVIDER = "payment_provider" as const;
export const PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY = "stripe_publishable_key" as const;
export const PLATFORM_SETTING_STRIPE_SECRET_KEY = "stripe_secret_key" as const;
export const PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET = "stripe_webhook_secret" as const;
export const PLATFORM_SETTING_STRIPE_PRICE_ID = "stripe_price_id" as const;

export const PAYMENT_PLATFORM_SETTING_KEYS = [
  PLATFORM_SETTING_PAYMENT_PROVIDER,
  PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_SETTING_STRIPE_SECRET_KEY,
  PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
  PLATFORM_SETTING_STRIPE_PRICE_ID,
] as const;

export type PaymentPlatformSettingKey = (typeof PAYMENT_PLATFORM_SETTING_KEYS)[number];
