export type SettingsCategoryId = "account" | "workspace" | "vault";

export type SettingsSubId =
  | "account_profile"
  | "account_credentials"
  | "account_sessions"
  | "workspace_preset"
  | "workspace_config_json"
  | "workspace_deep_explorer"
  | "workspace_appearance"
  | "workspace_visual_engine"
  | "vault_dashboard"
  | "vault_collaborating"
  | "vault_vcs_history"
  | "vault_publish"
  | "vault_import_export";

export interface SettingsSectionOutline {
  id: string;
  symbol: string;
  label: string;
}

export interface SettingsCategoryDefinition {
  id: SettingsCategoryId;
  order: 1 | 2 | 3;
  label: string;
  shortDescription: string;
  count: number;
}

export interface SettingsSubDefinition {
  id: SettingsSubId;
  order: number;
  categoryId: SettingsCategoryId;
  label: string;
  shortDescription: string;
  keywords: readonly string[];
  sections: readonly SettingsSectionOutline[];
}

export interface SettingsSelection {
  categoryId: SettingsCategoryId;
  subSettingId: SettingsSubId;
  sectionId?: string;
}

export const SETTINGS_CATEGORIES: readonly SettingsCategoryDefinition[] = [
  {
    id: "account",
    order: 1,
    label: "Account",
    shortDescription: "Profil kanonik @username, kredensial keamanan, PAT, dan sesi aktif.",
    count: 3,
  },
  {
    id: "workspace",
    order: 2,
    label: "Workspace",
    shortDescription: "Preset mode, .app/config.json Schema v2, Deep Explorer, Appearance & Visual Engine.",
    count: 5,
  },
  {
    id: "vault",
    order: 3,
    label: "Vault",
    shortDescription: "Dashboard lintas-vault, kolaborasi AS & WITH, VCS/KMR, publikasi, dan impor/ekspor.",
    count: 5,
  },
] as const;

export const SETTINGS_CATALOG: readonly SettingsSubDefinition[] = [
  {
    id: "account_profile",
    order: 1,
    categoryId: "account",
    label: "Profile Customization",
    shortDescription: "Nama lengkap, handle kanonik @username, bio, afiliasi/ORCID, dan tautan akademik.",
    keywords: ["profile", "username", "orcid", "bio", "affiliation", "social", "github", "scholar"],
    sections: [
      { id: "identity-profile", symbol: "#identity-profile", label: "Identity & Canonical Handle" },
      { id: "academic-affiliation", symbol: "#academic-affiliation", label: "Affiliation & ORCID" },
      { id: "social-links", symbol: "#social-links", label: "Social & Academic Links" },
    ],
  },
  {
    id: "account_credentials",
    order: 2,
    categoryId: "account",
    label: "Credentials & Security",
    shortDescription: "Reset email, ubah sandi dengan indikator kekuatan, dan Personal Access Tokens.",
    keywords: ["email", "password", "security", "api", "token", "pat", "credentials"],
    sections: [
      { id: "email-security", symbol: "#email-security", label: "Reset Email" },
      { id: "password-reset", symbol: "#password-reset", label: "Password & Strength" },
      { id: "personal-access-tokens", symbol: "#personal-access-tokens", label: "API Keys & PATs" },
    ],
  },
  {
    id: "account_sessions",
    order: 3,
    categoryId: "account",
    label: "Session Activity",
    shortDescription: "Daftar sesi perangkat & browser aktif, lokasi IP, dan pencabutan sesi.",
    keywords: ["session", "device", "browser", "revoke", "ip", "activity"],
    sections: [
      { id: "active-sessions", symbol: "#active-sessions", label: "Active Sessions" },
      { id: "session-policies", symbol: "#session-policies", label: "Session Policies" },
    ],
  },
  {
    id: "workspace_preset",
    order: 4,
    categoryId: "workspace",
    label: "Workspace Preset",
    shortDescription: "Dashboard overview, katalog preset Built-in/Custom/Community, dan Impact Diff Preview.",
    keywords: ["preset", "freeform", "atlas", "studio", "academy", "scholar", "diff", "impact"],
    sections: [
      { id: "dashboard-overview", symbol: "#dashboard-overview", label: "Dashboard Overview" },
      { id: "preset-catalog", symbol: "#preset-catalog", label: "Preset Catalogs" },
      { id: "custom-preset-builder", symbol: "#custom-preset-builder", label: "Custom Preset Builder" },
      { id: "impact-preview", symbol: "#impact-preview", label: "Impact Diff Preview" },
    ],
  },
  {
    id: "workspace_config_json",
    order: 5,
    categoryId: "workspace",
    label: "Central .app/config.json",
    shortDescription: "Inspektor & editor JSON langsung dengan validator Schema v2 dan dokumentasi 10 blok.",
    keywords: ["config", "json", "schema", "validator", "sdk", "raw", "format"],
    sections: [
      { id: "config-status-actions", symbol: "#config-status-actions", label: "Validation & Actions" },
      { id: "raw-json-editor", symbol: "#raw-json-editor", label: "Dynamic Raw JSON Editor" },
      { id: "schema-v2-help", symbol: "#schema-v2-help", label: "Schema v2 Documentation" },
    ],
  },
  {
    id: "workspace_deep_explorer",
    order: 6,
    categoryId: "workspace",
    label: "Deep Explorer",
    shortDescription: "4 lensa visual, filter cabang/kedalaman, reorganize, YAML schema, Academy rules, dan tab mandiri.",
    keywords: ["deep explorer", "lenses", "graph", "diagram", "table", "cards", "reorganize", "restructure", "academy"],
    sections: [
      { id: "explorer-lenses", symbol: "#explorer-lenses", label: "Visual Lenses & Filters" },
      { id: "reorganize-restructure", symbol: "#reorganize-restructure", label: "Reorganize & Restructure" },
      { id: "yaml-schema-academy", symbol: "#yaml-schema-academy", label: "YAML Schema & Academy Rules" },
      { id: "explorer-inline-canvas", symbol: "#explorer-inline-canvas", label: "Inline Canvas & Standalone Tab" },
    ],
  },
  {
    id: "workspace_appearance",
    order: 7,
    categoryId: "workspace",
    label: "Appearance & Accessibility",
    shortDescription: "Tema global, densitas Explore, header profil, aksesibilitas, tipografi editor, AI lokal, & cache.",
    keywords: ["theme", "obsidian", "daylight", "contrast", "a11y", "font", "vim", "ollama", "toolbar", "offline"],
    sections: [
      { id: "global-theme-app", symbol: "#global-theme-app", label: "Global Theme & App Density" },
      { id: "accessibility-options", symbol: "#accessibility-options", label: "Accessibility Options" },
      { id: "editor-typography-typing", symbol: "#editor-typography-typing", label: "Editor Typography & Typing" },
      { id: "writing-assistant-sync", symbol: "#writing-assistant-sync", label: "BYO-AI, Toolbar & Offline Sync" },
    ],
  },
  {
    id: "workspace_visual_engine",
    order: 8,
    categoryId: "workspace",
    label: "Visual Engine",
    shortDescription: "Fisika D3 Graph Mode serta deterministic solver Mindmap/Fishbone/Timeline/Skill Tree.",
    keywords: ["visual", "d3", "physics", "repulsion", "mindmap", "fishbone", "solver", "bezier", "shortcuts"],
    sections: [
      { id: "graph-mode-d3", symbol: "#graph-mode-d3", label: "Graph Mode D3 Physics" },
      { id: "deterministic-solvers", symbol: "#deterministic-solvers", label: "Deterministic Solvers" },
      { id: "keyboard-navigation", symbol: "#keyboard-navigation", label: "Keyboard Shortcuts" },
    ],
  },
  {
    id: "vault_dashboard",
    order: 9,
    categoryId: "vault",
    label: "Vaults Dashboard",
    shortDescription: "Statistik lintas-vault, kesehatan YAML/sync, dan switch/buat/hapus vault.",
    keywords: ["vault", "dashboard", "stats", "storage", "health", "create", "delete", "switch"],
    sections: [
      { id: "cross-vault-stats", symbol: "#cross-vault-stats", label: "Cross-Vault Stats & Insights" },
      { id: "sync-yaml-health", symbol: "#sync-yaml-health", label: "System Sync & YAML Health" },
      { id: "vault-switcher-crud", symbol: "#vault-switcher-crud", label: "Vault Switcher & CRUD" },
    ],
  },
  {
    id: "vault_collaborating",
    order: 10,
    categoryId: "vault",
    label: "Vaults Collaborating",
    shortDescription: "Give Access AS & WITH level vault/node, 7 peran kolaborator, CRUD, dan time-window.",
    keywords: ["collaborate", "access", "role", "viewer", "editor", "student", "teacher", "mr", "time window"],
    sections: [
      { id: "give-access-form", symbol: "#give-access-form", label: "Give Access AS & WITH" },
      { id: "active-collaborators", symbol: "#active-collaborators", label: "Active Collaborators" },
    ],
  },
  {
    id: "vault_vcs_history",
    order: 11,
    categoryId: "vault",
    label: "VCS, Diff, Backup & History",
    shortDescription: "Timeline snapshot & rollback, Visual Diff, antrean KMR, dan jadwal backup otomatis.",
    keywords: ["vcs", "snapshot", "rollback", "diff", "kmr", "merge", "backup", "history"],
    sections: [
      { id: "snapshots-rollback", symbol: "#snapshots-rollback", label: "Snapshots & Rollback" },
      { id: "visual-diff-viewer", symbol: "#visual-diff-viewer", label: "Visual Diff Viewer" },
      { id: "kmr-queue", symbol: "#kmr-queue", label: "Knowledge Merge Requests" },
      { id: "backup-schedule", symbol: "#backup-schedule", label: "Automated Backup & History" },
    ],
  },
  {
    id: "vault_publish",
    order: 12,
    categoryId: "vault",
    label: "Vaults Publish",
    shortDescription: "Publish AS & WITH level vault/node, lisensi, sitasi/fork, dan matriks catatan publik.",
    keywords: ["publish", "lens", "visibility", "license", "citation", "fork", "matrix", "private"],
    sections: [
      { id: "publish-as-with", symbol: "#publish-as-with", label: "Publish AS & WITH" },
      { id: "vault-publish-cards", symbol: "#vault-publish-cards", label: "Vault Publish Controls" },
      { id: "published-notes-matrix", symbol: "#published-notes-matrix", label: "Published Notes Matrix" },
    ],
  },
  {
    id: "vault_import_export",
    order: 13,
    categoryId: "vault",
    label: "Import & Export Vault",
    shortDescription: "Impor folder .md/Obsidian/.zip/.app/config.json serta ekspor bundle Markdown, JSON, atau Preset.",
    keywords: ["import", "export", "obsidian", "markdown", "zip", "bundle", "community preset"],
    sections: [
      { id: "import-vault", symbol: "#import-vault", label: "Import Vault & Presets" },
      { id: "export-vault", symbol: "#export-vault", label: "Export Bundle & Presets" },
    ],
  },
] as const;
