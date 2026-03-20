import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  describePaymentSettingsForAdmin,
  invalidatePaymentGatewayConfigCache,
  maskPublishableKey,
} from "@/lib/payment-gateway-config";
import {
  PLATFORM_SETTING_PAYMENT_PROVIDER,
  PLATFORM_SETTING_STRIPE_PRICE_ID,
  PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY,
  PLATFORM_SETTING_STRIPE_SECRET_KEY,
  PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
} from "@/lib/payment-gateway-keys";
import {
  deletePaymentSetting,
  upsertStringSetting,
} from "@/lib/platform-payment-settings-db";
import { revalidatePath } from "next/cache";

function requireSuper(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.roleSlug !== "super_admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Super admin only" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}

/**
 * GET /api/app/super/payment-settings — masked credentials + provider (no full secrets).
 */
export async function GET() {
  const guard = requireSuper(await auth());
  if (!guard.ok) return guard.res;

  const { providerChoice, merged, sources } = await describePaymentSettingsForAdmin();

  return NextResponse.json({
    providerChoice,
    effectiveProvider: merged.provider,
    stripe: {
      publishableKeyPreview: maskPublishableKey(merged.stripe.publishableKey),
      publishableKeySource: sources.publishableKey,
      secretKeyConfigured: !!merged.stripe.secretKey,
      secretKeySource: sources.secretKey,
      webhookSecretConfigured: !!merged.stripe.webhookSecret,
      webhookSecretSource: sources.webhookSecret,
      priceId: merged.stripe.priceId,
      priceIdSource: sources.priceId,
    },
    futureGateways: [{ id: "paddle", label: "Paddle", implemented: false }],
  });
}

const patchSchema = z.object({
  provider: z.enum(["none", "stripe"]),
  stripePriceId: z.string().max(128).optional(),
  /** Omit = unchanged. null or "" = remove DB value (use env). */
  stripePublishableKey: z.union([z.string(), z.null()]).optional(),
  stripeSecretKey: z.union([z.string(), z.null()]).optional(),
  stripeWebhookSecret: z.union([z.string(), z.null()]).optional(),
});

/**
 * PATCH /api/app/super/payment-settings
 */
export async function PATCH(request: Request) {
  const guard = requireSuper(await auth());
  if (!guard.ok) return guard.res;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    await upsertStringSetting(PLATFORM_SETTING_PAYMENT_PROVIDER, d.provider);

    if (d.stripePriceId !== undefined) {
      const t = d.stripePriceId.trim();
      if (t === "") {
        await deletePaymentSetting(PLATFORM_SETTING_STRIPE_PRICE_ID);
      } else if (t.startsWith("price_")) {
        await upsertStringSetting(PLATFORM_SETTING_STRIPE_PRICE_ID, t);
      } else {
        return NextResponse.json(
          { error: "stripePriceId must be empty (revert to env) or a Stripe Price id (price_…)." },
          { status: 400 }
        );
      }
    }

    const applyOptionalSecret = async (
      key:
        | typeof PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY
        | typeof PLATFORM_SETTING_STRIPE_SECRET_KEY
        | typeof PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET,
      val: string | null | undefined
    ) => {
      if (val === undefined) return;
      const s = val === null ? "" : val.trim();
      if (s === "") {
        await deletePaymentSetting(key);
        return;
      }
      if (key === PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY && !s.startsWith("pk_")) {
        throw new Error("Publishable key must start with pk_");
      }
      if (key === PLATFORM_SETTING_STRIPE_SECRET_KEY && !s.startsWith("sk_")) {
        throw new Error("Secret key must start with sk_");
      }
      if (key === PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET && !s.startsWith("whsec_")) {
        throw new Error("Webhook signing secret must start with whsec_");
      }
      await upsertStringSetting(key, s);
    };

    await applyOptionalSecret(PLATFORM_SETTING_STRIPE_PUBLISHABLE_KEY, d.stripePublishableKey);
    await applyOptionalSecret(PLATFORM_SETTING_STRIPE_SECRET_KEY, d.stripeSecretKey);
    await applyOptionalSecret(PLATFORM_SETTING_STRIPE_WEBHOOK_SECRET, d.stripeWebhookSecret);

    invalidatePaymentGatewayConfigCache();
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
