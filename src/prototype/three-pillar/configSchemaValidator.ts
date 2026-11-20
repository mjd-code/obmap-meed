import type { AppCentralConfigJsonV2 } from "./vcsAndConfigTypes";

export const REQUIRED_CONFIG_SECTIONS = [
  "meta",
  "mode",
  "deep_explorer",
  "appearance",
  "visual_engine",
  "schema",
  "publishing",
  "access",
  "academy",
  "extensions",
] as const;

export const VALID_PRIMARY_MODES = ["freeform", "atlas", "studio", "academy"] as const;
export const VALID_DEEP_EXPLORER_VIEWS = ["graph", "diagram", "table", "cards"] as const;
export const VALID_REORGANIZE_BY = ["hierarchy", "properties", "tags", "backlinks", "keywords"] as const;
export const VALID_RESTRUCTURE_MODES = ["virtual_grouping", "physical_file_sync"] as const;
export const VALID_THEMES = ["obsidian_dark", "calm_daylight", "high_contrast_scholar"] as const;
export const VALID_SOLVERS = ["mindmap", "fishbone", "timeline", "argument-map", "skill-tree"] as const;
export const VALID_CONNECTORS = ["bezier", "orthogonal", "straight"] as const;
export const VALID_LENSES = ["atlas", "publication", "course", "template"] as const;
export const VALID_VISIBILITY = ["public_listed", "public_unlisted", "shared", "private"] as const;

export interface ConfigValidationError {
  line?: number;
  property?: string;
  message: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  statusLabel: string;
  errors: ConfigValidationError[];
  parsed?: AppCentralConfigJsonV2;
}

export interface SchemaHelpTopic {
  block: (typeof REQUIRED_CONFIG_SECTIONS)[number];
  title: string;
  description: string;
  exampleKeys: string[];
}

export const SCHEMA_V2_HELP_DOCS: readonly SchemaHelpTopic[] = [
  {
    block: "meta",
    title: "1. meta — Identitas Vault & Konstitusi @app/sdk",
    description: "Menetapkan schema_version (2), vault_id, path kanonik .app/config.json, kontrak @app/sdk, dan default_license (CC BY-SA 4.0).",
    exampleKeys: ["schema_version", "vault_id", "config_path", "sdk", "default_license"],
  },
  {
    block: "mode",
    title: "2. mode — Primary Workspace Mode & Preset Origin",
    description: "Menentukan primary_mode (freeform | atlas | studio | academy), active_preset_id, preset_origin, dan catatan roadmap scholar_mode_v2_2_preview.",
    exampleKeys: ["primary_mode", "active_preset_id", "preset_origin", "roadmap_note"],
  },
  {
    block: "deep_explorer",
    title: "3. deep_explorer — Deep Explorer Lenses & Restructure",
    description: "Mengatur default_view (graph | diagram | table | cards), reorganize_by, restructure_mode (virtual_grouping | physical_file_sync), default_depth, dan branch_filter.",
    exampleKeys: ["default_view", "reorganize_by", "restructure_mode", "default_depth", "branch_filter"],
  },
  {
    block: "appearance",
    title: "4. appearance — Tema, Aksesibilitas, Editor & BYO-AI",
    description: "Tema global (obsidian_dark | calm_daylight | high_contrast_scholar), densitas Explore, header profil, aksesibilitas, tipografi editor, writing_assistant, toolbar, dan system_sync.",
    exampleKeys: ["theme", "explore_card_density", "accessibility", "editor", "writing_assistant", "system_sync"],
  },
  {
    block: "visual_engine",
    title: "5. visual_engine — D3 Physics & Deterministic Solvers",
    description: "Parameter fisika D3 (repulsion_force, link_distance, center_gravity) untuk Freeform dan solver deterministik (default_solver, connector_style, branch_spacing_px).",
    exampleKeys: ["graph_mode", "deterministic_solvers"],
  },
  {
    block: "schema",
    title: "6. schema — Standar YAML Frontmatter & Siklus Epistemik",
    description: "Template catatan default, daftar required_yaml yang divalidasi per vault, tahapan epistemic_stages, dan strict_frontmatter_validation.",
    exampleKeys: ["default_template", "required_yaml", "epistemic_stages", "strict_frontmatter_validation"],
  },
  {
    block: "publishing",
    title: "7. publishing — Lensa Publikasi, Visibilitas & Override Node",
    description: "Mengatur default_lens (atlas | publication | course | template), visibility, lisensi CC BY-SA 4.0, allow_citation, allow_fork, serta node_overrides.",
    exampleKeys: ["default_lens", "visibility", "license", "allow_citation", "allow_fork", "node_overrides"],
  },
  {
    block: "access",
    title: "8. access — Matriks Kolaborasi & Jadwal Backup",
    description: "Menentukan default_scope (vault | node), owner_handle, role_matrix (7+ peran), dan auto_backup_schedule.",
    exampleKeys: ["default_scope", "owner_handle", "role_matrix", "auto_backup_schedule"],
  },
  {
    block: "academy",
    title: "9. academy — Kurikulum Living Skill Tree",
    description: "Hierarki Falsafah -> Kurikulum -> Silabus -> RPS -> Instruksi, batas file submisi, time_window, zen_focus_mode, dan kuis prasyarat.",
    exampleKeys: ["enabled", "hierarchy", "max_files_per_submission", "time_window", "zen_focus_mode"],
  },
  {
    block: "extensions",
    title: "10. extensions — Ekstensi @app/sdk & Community Presets",
    description: "Mendaftarkan sdk_package (@app/sdk), ekstensi aktif, dan community_presets yang dipakai vault.",
    exampleKeys: ["sdk_package", "enabled", "community_presets"],
  },
];

function extractJsonErrorLine(raw: string, error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const lineMatch = error.message.match(/line\s+(\d+)/i);
  if (lineMatch) return Number(lineMatch[1]);
  const posMatch = error.message.match(/position\s+(\d+)/i);
  if (!posMatch) return undefined;
  const pos = Number(posMatch[1]);
  if (Number.isNaN(pos)) return undefined;
  return raw.slice(0, pos).split("\n").length;
}

function findPropertyLine(raw: string, key: string): number | undefined {
  const lines = raw.split("\n");
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`"${escaped}"\\s*:`);
  const index = lines.findIndex((line) => regex.test(line));
  return index >= 0 ? index + 1 : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkEnum(
  errors: ConfigValidationError[],
  raw: string,
  property: string,
  keyName: string,
  value: unknown,
  allowed: readonly string[]
) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    errors.push({
      line: findPropertyLine(raw, keyName),
      property,
      message: `${property} tidak valid ("${String(value)}"). Nilai yang diizinkan: ${allowed.join(", ")}.`,
    });
  }
}

export function validateAppConfigJson(raw: string): ConfigValidationResult {
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(raw);
  } catch (err) {
    const line = extractJsonErrorLine(raw, err);
    const msg = err instanceof Error ? err.message : "Sintaks JSON tidak valid.";
    return {
      valid: false,
      statusLabel: "Invalid JSON Syntax",
      errors: [{ line, message: `JSON syntax error: ${msg}` }],
    };
  }

  if (!isRecord(parsedUnknown)) {
    return {
      valid: false,
      statusLabel: "Schema v2 Validation Failed",
      errors: [{ line: 1, property: "$root", message: "Root .app/config.json harus berupa objek JSON." }],
    };
  }

  const errors: ConfigValidationError[] = [];
  for (const section of REQUIRED_CONFIG_SECTIONS) {
    if (!isRecord(parsedUnknown[section])) {
      errors.push({
        line: findPropertyLine(raw, section) ?? 1,
        property: section,
        message: `Blok wajib "${section}" tidak ditemukan atau bukan objek.`,
      });
    }
  }

  const meta = isRecord(parsedUnknown.meta) ? parsedUnknown.meta : null;
  if (meta) {
    if (meta.sdk !== "@app/sdk") {
      errors.push({
        line: findPropertyLine(raw, "sdk"),
        property: "meta.sdk",
        message: 'meta.sdk wajib bernilai "@app/sdk".',
      });
    }
    if (meta.config_path !== ".app/config.json") {
      errors.push({
        line: findPropertyLine(raw, "config_path"),
        property: "meta.config_path",
        message: 'meta.config_path wajib bernilai ".app/config.json".',
      });
    }
  }

  const mode = isRecord(parsedUnknown.mode) ? parsedUnknown.mode : null;
  if (mode) {
    checkEnum(errors, raw, "mode.primary_mode", "primary_mode", mode.primary_mode, VALID_PRIMARY_MODES);
  }

  const deepExplorer = isRecord(parsedUnknown.deep_explorer) ? parsedUnknown.deep_explorer : null;
  if (deepExplorer) {
    checkEnum(errors, raw, "deep_explorer.default_view", "default_view", deepExplorer.default_view, VALID_DEEP_EXPLORER_VIEWS);
    checkEnum(errors, raw, "deep_explorer.reorganize_by", "reorganize_by", deepExplorer.reorganize_by, VALID_REORGANIZE_BY);
    checkEnum(errors, raw, "deep_explorer.restructure_mode", "restructure_mode", deepExplorer.restructure_mode, VALID_RESTRUCTURE_MODES);
  }

  const appearance = isRecord(parsedUnknown.appearance) ? parsedUnknown.appearance : null;
  if (appearance) {
    checkEnum(errors, raw, "appearance.theme", "theme", appearance.theme, VALID_THEMES);
  }

  const visualEngine = isRecord(parsedUnknown.visual_engine) ? parsedUnknown.visual_engine : null;
  const solvers = visualEngine && isRecord(visualEngine.deterministic_solvers) ? visualEngine.deterministic_solvers : null;
  if (solvers) {
    checkEnum(errors, raw, "visual_engine.deterministic_solvers.default_solver", "default_solver", solvers.default_solver, VALID_SOLVERS);
    checkEnum(errors, raw, "visual_engine.deterministic_solvers.connector_style", "connector_style", solvers.connector_style, VALID_CONNECTORS);
  } else if (visualEngine) {
    errors.push({
      line: findPropertyLine(raw, "visual_engine"),
      property: "visual_engine.deterministic_solvers",
      message: "Blok visual_engine.deterministic_solvers wajib berupa objek.",
    });
  }

  const schemaBlock = isRecord(parsedUnknown.schema) ? parsedUnknown.schema : null;
  if (schemaBlock && !Array.isArray(schemaBlock.required_yaml)) {
    errors.push({
      line: findPropertyLine(raw, "required_yaml"),
      property: "schema.required_yaml",
      message: "schema.required_yaml wajib berupa array string.",
    });
  }

  const publishing = isRecord(parsedUnknown.publishing) ? parsedUnknown.publishing : null;
  if (publishing) {
    checkEnum(errors, raw, "publishing.default_lens", "default_lens", publishing.default_lens, VALID_LENSES);
    checkEnum(errors, raw, "publishing.visibility", "visibility", publishing.visibility, VALID_VISIBILITY);
  }

  const extensions = isRecord(parsedUnknown.extensions) ? parsedUnknown.extensions : null;
  if (extensions && extensions.sdk_package !== "@app/sdk") {
    errors.push({
      line: findPropertyLine(raw, "sdk_package"),
      property: "extensions.sdk_package",
      message: 'extensions.sdk_package wajib bernilai "@app/sdk".',
    });
  }

  if (errors.length > 0) {
    return { valid: false, statusLabel: "Schema v2 Validation Failed", errors };
  }

  return {
    valid: true,
    statusLabel: "Valid (.app/config.json Schema v2)",
    errors: [],
    parsed: parsedUnknown as unknown as AppCentralConfigJsonV2,
  };
}

export function formatAppConfigJson(
  raw: string
): { ok: true; formatted: string } | { ok: false; result: ConfigValidationResult } {
  const result = validateAppConfigJson(raw);
  if (!result.valid || !result.parsed) {
    return { ok: false, result };
  }
  return { ok: true, formatted: JSON.stringify(result.parsed, null, 2) };
}
