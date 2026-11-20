import {
  DEFAULT_APPEARANCE_CONFIG,
  DEFAULT_VISUAL_ENGINE_CONFIG,
} from "./mockSettingsDefaults";
import type {
  AppCentralConfigJsonV2,
  DeepExplorerViewKind,
  PresentationLens,
  PresetOrigin,
  PrototypeAcademyTreeNode,
  PrototypeAccessGrant,
  PrototypeMergeRequest,
  PrototypeSnapshot,
  PrototypeVisualDiff,
  PublishVisibility,
  WorkspaceModeId,
} from "./types";

export function buildAppConfigJson(params: {
  vaultId: string;
  name: string;
  primaryMode: WorkspaceModeId;
  defaultDeepExplorerView: DeepExplorerViewKind;
  presetOrigin?: PresetOrigin;
  activePresetId?: string;
  lens: PresentationLens;
  visibility?: PublishVisibility;
  defaultTemplate?: string;
}): AppCentralConfigJsonV2 {
  const isAcademy = params.primaryMode === "academy";
  return {
    meta: {
      schema_version: 2,
      vault_id: params.vaultId,
      name: params.name,
      version: "2.1.0",
      config_path: ".app/config.json",
      sdk: "@app/sdk",
      default_license: "CC BY-SA 4.0",
    },
    mode: {
      primary_mode: params.primaryMode,
      active_preset_id: params.activePresetId ?? `core-${params.primaryMode}`,
      preset_origin: params.presetOrigin ?? "core_preset",
      roadmap_note: "scholar_mode_v2_2_preview",
    },
    deep_explorer: {
      default_view: params.defaultDeepExplorerView,
      reorganize_by: isAcademy ? "hierarchy" : "backlinks",
      restructure_mode: "virtual_grouping",
      default_depth: 3,
      branch_filter: "all",
      show_orphans: params.primaryMode === "freeform",
    },
    appearance: structuredClone(DEFAULT_APPEARANCE_CONFIG),
    visual_engine: {
      ...structuredClone(DEFAULT_VISUAL_ENGINE_CONFIG),
      deterministic_solvers: {
        ...DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers,
        default_solver: isAcademy ? "skill-tree" : params.primaryMode === "studio" ? "timeline" : "mindmap",
      },
    },
    schema: {
      default_template: params.defaultTemplate ?? (isAcademy ? "modul-silabus" : "atomic-note"),
      required_yaml: isAcademy
        ? ["lms_role", "prerequisites", "estimated_minutes", "visibility"]
        : ["epistemic_status", "structure_class", "license", "visibility"],
      epistemic_stages: ["seedling", "budding", "evergreen", "published", "mastered"],
      strict_frontmatter_validation: true,
    },
    publishing: {
      default_lens: params.lens,
      visibility: params.visibility ?? "public_listed",
      license: "CC BY-SA 4.0",
      allow_citation: true,
      allow_fork: true,
      node_overrides: {},
    },
    access: {
      default_scope: "vault",
      owner_handle: "@dr.aras.wicaksono",
      role_matrix: ["viewer", "commenter", "contributor", "editor", "admin", "student", "teacher"],
      auto_backup_schedule: "daily",
    },
    academy: {
      enabled: isAcademy,
      hierarchy: ["falsafah", "kurikulum", "silabus", "rps", "instruksi"],
      max_files_per_submission: 3,
      time_window: "08:00–22:00 WIB · Minggu 1–14",
      zen_focus_mode: isAcademy,
      require_prerequisite_quiz: true,
    },
    extensions: {
      sdk_package: "@app/sdk",
      enabled: ["citation-verifier", "deterministic-dag-solver", "local-rag-ollama"],
      community_presets: ["fishbone-postmortem", "argument-dialectic"],
    },
  };
}

export const PROTOTYPE_SNAPSHOTS: PrototypeSnapshot[] = [
  {
    id: "snap-104",
    label: "v2.1.0-release-audit",
    timestamp: "Hari ini · 09:40",
    author: "@dr.aras.wicaksono",
    summary: "Konsolidasi YAML metadata dan skema .app/config.json v2 terpusat",
    changedNodesCount: 6,
  },
  {
    id: "snap-103",
    label: "pre-kmr-lemma-dag",
    timestamp: "Kemarin · 18:15",
    author: "@hendra.wijaya",
    summary: "Penambahan bukti lemma Two-Pass AABB & prasyarat Modul 3",
    changedNodesCount: 3,
  },
  {
    id: "snap-102",
    label: "baseline-kurikulum-sem1",
    timestamp: "18 Nov · 11:05",
    author: "@dr.aras.wicaksono",
    summary: "Struktur awal Falsafah → Kurikulum → Silabus → RPS",
    changedNodesCount: 11,
  },
];

export const PROTOTYPE_VISUAL_DIFFS: PrototypeVisualDiff[] = [
  {
    id: "diff-1",
    nodeTitle: "sintesis-graf-pengetahuan.md",
    markdownBefore: "- Graf Force-Directed cocok untuk eksplorasi bebas.\n- Layout silabus disusun manual.",
    markdownAfter: "- Hanya Freeform eksplorasi yang memakai simulasi fisika.\n- Atlas & Academy memakai **deterministic solver** (*Mindmap, Fishbone, Timeline, Skill Tree*).",
    yamlChanges: [
      { key: "epistemic_status", before: "budding", after: "evergreen" },
      { key: "primary_mode", before: "freeform", after: "atlas" },
      { key: "allow_fork", before: "false", after: "true" },
    ],
    structureDelta: "+2 backlinks · 1 sub-node cabang baru (Deterministic Layout)",
  },
];

export const PROTOTYPE_MERGE_REQUESTS: PrototypeMergeRequest[] = [
  {
    id: "kmr-14",
    title: "KMR #14: Pembuktian Cycle Rejection pada Prerequisites DAG",
    authorHandle: "@hendra.wijaya",
    sourceBranch: "fork/lemma-dag-v2",
    targetVault: "kuliah-graf-dag",
    status: "open",
    diffSummary: "+28 baris Markdown · +1 prasyarat node · YAML verified",
    updatedAt: "1 jam lalu",
  },
  {
    id: "kmr-12",
    title: "KMR #12: Rujukan Silang Zettelkasten & Argumen Neuro-Simbolik",
    authorHandle: "@nadia.putri",
    sourceBranch: "patch/neuro-symbolic-refs",
    targetVault: "atlas-kognisi",
    status: "open",
    diffSummary: "+14 baris Markdown · +3 sitasi terfederasi",
    updatedAt: "5 jam lalu",
  },
];

export const PROTOTYPE_ACCESS_GRANTS: PrototypeAccessGrant[] = [
  {
    id: "grant-1",
    subjectName: "Nadia Putri",
    subjectHandle: "@nadia.putri",
    role: "editor",
    scope: "vault",
    targetName: "Atlas Kognisi & Memori",
    crudPermissions: ["Read", "Create", "Update"],
    timeWindow: "Tanpa batas waktu",
  },
  {
    id: "grant-2",
    subjectName: "Hendra Wijaya",
    subjectHandle: "@hendra.wijaya",
    role: "teacher",
    scope: "node",
    targetName: "RPS-03 / Two-Pass Composite Layout",
    crudPermissions: ["Read", "Create", "Update", "Grade"],
    timeWindow: "Sem. Ganjil 2026",
  },
  {
    id: "grant-3",
    subjectName: "Raka Pratama",
    subjectHandle: "@raka.pratama",
    role: "student",
    scope: "node",
    targetName: "Instruksi-03 / Implementasi AABB",
    crudPermissions: ["Read", "Create Sub-Node (Max 3 Files)"],
    timeWindow: "08:00–22:00 WIB",
  },
];

export const PROTOTYPE_ACADEMY_TREE: PrototypeAcademyTreeNode[] = [
  {
    id: "aca-1",
    level: "falsafah",
    code: "L1 · Falsafah",
    title: "Falsafah: Kedaulatan Pengetahuan & Graf Terverifikasi",
    parentId: null,
    duration: "5 mnt",
    prerequisites: [],
    initialStatus: "mastered",
    summary: "Landasan filosofis mengapa pelajar membangun kepemilikan jangka panjang lewat plaintext Markdown dan struktur graf deterministik.",
    rules: { template: "falsafah-manifesto", requiredYaml: ["epistemic_status", "license"], maxFiles: 1, crud: "Read-Only (Student)", timeWindow: "Terbuka sepanjang semester", zenMode: false },
    studentSubNodes: [],
    quizQuestion: "Apa prinsip utama penyimpanan data di Sidra Academy?",
    quizOptions: ["Format biner tertutup", "Unopinionated Markdown + YAML terstandar", "Tanpa metadata"],
    correctOptionIndex: 1,
  },
  {
    id: "aca-2",
    level: "kurikulum",
    code: "L2 · Kurikulum",
    title: "Kurikulum: Rekayasa Graf Pengetahuan & Sistem Kognitif",
    parentId: "aca-1",
    duration: "8 mnt",
    prerequisites: ["aca-1"],
    initialStatus: "mastered",
    summary: "Peta capaian pembelajaran lulusan yang memecah kompetensi teori graf, DAG prasyarat, dan tata letak deterministik.",
    rules: { template: "kurikulum-cpl", requiredYaml: ["cpl_code", "lms_role"], maxFiles: 2, crud: "Read / Annotate", timeWindow: "Minggu 1–14", zenMode: false },
    studentSubNodes: [],
    quizQuestion: "Bagaimana hubungan antar kompetensi dalam Kurikulum Sidra direpresentasikan?",
    quizOptions: ["Acak tanpa prasyarat", "Directed Acyclic Graph (DAG) deterministik", "Folder terpisah tanpa tautan"],
    correctOptionIndex: 1,
  },
  {
    id: "aca-3",
    level: "silabus",
    code: "L3 · Silabus",
    title: "Silabus: Topologi Graf, Cycle Rejection & Spatial Layout",
    parentId: "aca-2",
    duration: "10 mnt",
    prerequisites: ["aca-2"],
    initialStatus: "mastered",
    summary: "Rangkaian topik per pekan beserta bobot asesmen dan syarat kelulusan antar simpul Skill Tree.",
    rules: { template: "silabus-unit", requiredYaml: ["prerequisites", "estimated_minutes"], maxFiles: 2, crud: "Read + Fork Catatan", timeWindow: "Minggu 1–7", zenMode: false },
    studentSubNodes: [
      { id: "sub-1", studentName: "Nadia Putri", studentHandle: "@nadia.putri", title: "rangkuman-topologi-nadia.md", status: "mastered", updatedAt: "Kemarin" },
    ],
    quizQuestion: "Mengapa Cycle Rejection wajib dijalankan sebelum rendering Skill Tree?",
    quizOptions: ["Menghindari prasyarat saling mengunci melingkar", "Memperbesar ukuran berkas", "Menghapus label YAML"],
    correctOptionIndex: 0,
  },
  {
    id: "aca-4",
    level: "rps",
    code: "L4 · RPS",
    title: "RPS Pekan 3: Two-Pass Composite Bounding-Box Solver",
    parentId: "aca-3",
    duration: "12 mnt",
    prerequisites: ["aca-3"],
    initialStatus: "available",
    summary: "Rencana pembelajaran rinci metode Pass-1 AABB dan Pass-2 positioning untuk menggabungkan Mindmap, Timeline, dan Fishbone.",
    rules: { template: "rps-pekanan", requiredYaml: ["lms_role", "prerequisites", "rubric_id"], maxFiles: 3, crud: "Create Sub-Node in Window", timeWindow: "19–25 Nov 2026", zenMode: true },
    studentSubNodes: [
      { id: "sub-2", studentName: "Raka Pratama", studentHandle: "@raka.pratama", title: "eksperimen-sweep-prune-raka.md", status: "submitted", updatedAt: "2 jam lalu" },
      { id: "sub-3", studentName: "Siti Aisyah", studentHandle: "@siti.aisyah", title: "catatan-aabb-pass1-siti.md", status: "mastered", updatedAt: "Kemarin" },
    ],
    quizQuestion: "Apa fungsi utama Pass 1 & Pass 2 pada Composite Layout Engine?",
    quizOptions: ["Mengukur bounding-box subtree lalu menyusun tanpa tumpang tindih", "Menjalankan simulasi acak tak terbatas", "Mengubah .md menjadi DOCX"],
    correctOptionIndex: 0,
  },
  {
    id: "aca-5",
    level: "instruksi",
    code: "L5 · Instruksi/Tugas",
    title: "Instruksi & Tugas: Implementasi Evaluator Prasyarat & Zen Mode",
    parentId: "aca-4",
    duration: "15 mnt",
    prerequisites: ["aca-4"],
    initialStatus: "locked",
    summary: "Tugas praktikum terpandu dalam Zen Focus Mode: pelajar menumbuhkan sub-node solusi langsung di bawah simpul Instruksi ini.",
    rules: { template: "submission-lab", requiredYaml: ["student_id", "rps_ref", "submission_hash"], maxFiles: 3, crud: "Append Student Sub-Node Only", timeWindow: "Deadline: 27 Nov · 22:00", zenMode: true },
    studentSubNodes: [
      { id: "sub-4", studentName: "Siti Aisyah", studentHandle: "@siti.aisyah", title: "solusi-evaluator-dag-siti.md", status: "draft", updatedAt: "3 jam lalu" },
    ],
    quizQuestion: "Kapan simpul berstatus Locked berubah menjadi Available?",
    quizOptions: ["Saat semua prasyarat berstatus Mastered", "Setelah 24 jam otomatis", "Ketika di-bookmark"],
    correctOptionIndex: 0,
  },
];
