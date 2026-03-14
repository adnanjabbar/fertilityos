import type { ModuleSlug } from "@/db/schema";

/**
 * Parse tenant.enabled_modules (JSON array string). Null or empty = all modules enabled.
 */
export function parseEnabledModules(enabledModules: string | null): ModuleSlug[] | "all" {
  if (!enabledModules?.trim()) return "all";
  try {
    const arr = JSON.parse(enabledModules) as string[];
    if (!Array.isArray(arr) || arr.length === 0) return "all";
    return arr as ModuleSlug[];
  } catch {
    return "all";
  }
}

export function isModuleEnabled(enabledModules: string | null, slug: ModuleSlug): boolean {
  const parsed = parseEnabledModules(enabledModules);
  if (parsed === "all") return true;
  return parsed.includes(slug);
}
