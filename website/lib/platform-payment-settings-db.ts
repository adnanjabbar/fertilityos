import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import {
  PLATFORM_SETTING_PAYMENT_PROVIDER,
  PLATFORM_SETTING_STRIPE_PRICE_ID,
  PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_SETTING_STRIPE_SECRET_KEY,
  PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
  PAYMENT_PLATFORM_SETTING_KEYS,
  type PaymentPlatformSettingKey,
} from "@/lib/payment-gateway-keys";

export async function loadPaymentSettingsMap(): Promise<Map<string, unknown>> {
  try {
    const rows = await db
      .select({ key: platformSettings.settingKey, value: platformSettings.value })
      .from(platformSettings)
      .where(inArray(platformSettings.settingKey, [...PAYMENT_PLATFORM_DB_KEYS]));
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map();
  }
}

/** Store a string in jsonb (scalar JSON string). */
export async function upsertStringSetting(key: PaymentPlatformSettingKey, value: string) {
  await db
    .insert(platformSettings)
    .values({
      settingKey: key,
      value: value as unknown,
    })
    .onConflictDoUpdate({
      target: [platformSettings.settingKey],
      set: {
        value: value as unknown,
        updatedAt: new Date(),
      },
    });
}

export async function deletePaymentSetting(key: PaymentPlatformSettingKey) {
  await db.delete(platformSettings).where(eq(platformSettings.settingKey, key));
}
