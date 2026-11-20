import {
  SETTINGS_CATALOG,
  SETTINGS_CATEGORIES,
  type SettingsCategoryDefinition,
  type SettingsCategoryId,
  type SettingsSectionOutline,
  type SettingsSelection,
  type SettingsSubDefinition,
  type SettingsSubId,
} from "./settingsCatalogData";

export * from "./settingsCatalogData";

export function getCategoryDefinition(
  categoryId: SettingsCategoryId
): SettingsCategoryDefinition {
  return SETTINGS_CATEGORIES.find((c) => c.id === categoryId) ?? SETTINGS_CATEGORIES[0];
}

export function getSubSettingDefinition(subSettingId: SettingsSubId): SettingsSubDefinition {
  return SETTINGS_CATALOG.find((s) => s.id === subSettingId) ?? SETTINGS_CATALOG[0];
}

export function getSubSettingsByCategory(
  categoryId: SettingsCategoryId
): SettingsSubDefinition[] {
  return SETTINGS_CATALOG.filter((s) => s.categoryId === categoryId);
}

export function getCategoryCounts(): Record<SettingsCategoryId, number> {
  return {
    account: getSubSettingsByCategory("account").length,
    workspace: getSubSettingsByCategory("workspace").length,
    vault: getSubSettingsByCategory("vault").length,
  };
}

export function getDefaultSectionId(subSettingId: SettingsSubId): string {
  return getSubSettingDefinition(subSettingId).sections[0]?.id ?? "";
}

export function normalizeSettingsSelection(
  subSettingId: SettingsSubId,
  sectionId?: string
): SettingsSelection {
  const def = getSubSettingDefinition(subSettingId);
  const validSection = def.sections.some((sec) => sec.id === sectionId)
    ? sectionId
    : def.sections[0]?.id;
  return {
    categoryId: def.categoryId,
    subSettingId: def.id,
    sectionId: validSection,
  };
}

export function searchSettingsCatalog(
  query: string
): Array<{ sub: SettingsSubDefinition; matchedSection?: SettingsSectionOutline }> {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS_CATALOG.map((sub) => ({ sub }));
  const results: Array<{ sub: SettingsSubDefinition; matchedSection?: SettingsSectionOutline }> = [];
  for (const sub of SETTINGS_CATALOG) {
    const categoryLabel = getCategoryDefinition(sub.categoryId).label.toLowerCase();
    const matchedSection = sub.sections.find(
      (sec) =>
        sec.label.toLowerCase().includes(q) ||
        sec.symbol.toLowerCase().includes(q) ||
        sec.id.toLowerCase().includes(q)
    );
    const subMatch =
      sub.label.toLowerCase().includes(q) ||
      sub.shortDescription.toLowerCase().includes(q) ||
      categoryLabel.includes(q) ||
      sub.keywords.some((kw) => kw.toLowerCase().includes(q));
    if (subMatch || matchedSection) {
      results.push({ sub, matchedSection });
    }
  }
  return results;
}

// @deprecated M1->M2/M3 compat shim: maps legacy SettingsHubSectionId to canonical SettingsSelection
export function legacySectionToSettingsSelection(
  section?: "vault_lenses" | "share_access_vcs" | "academy_sdk" | "account_app"
): SettingsSelection {
  switch (section) {
    case "share_access_vcs":
      return normalizeSettingsSelection("vault_publish");
    case "academy_sdk":
      return normalizeSettingsSelection("workspace_deep_explorer", "yaml-schema-academy");
    case "account_app":
      return normalizeSettingsSelection("account_profile");
    case "vault_lenses":
    default:
      return normalizeSettingsSelection("workspace_preset");
  }
}

// @deprecated M1->M2/M3 compat shim: maps canonical SettingsSubId back to legacy SettingsHubSectionId
export function settingsSelectionToLegacySection(
  subId: SettingsSubId
): "vault_lenses" | "share_access_vcs" | "academy_sdk" | "account_app" {
  if (subId.startsWith("account_")) return "account_app";
  if (
    subId === "vault_collaborating" ||
    subId === "vault_vcs_history" ||
    subId === "vault_publish"
  ) {
    return "share_access_vcs";
  }
  if (subId === "workspace_deep_explorer") return "academy_sdk";
  return "vault_lenses";
}
