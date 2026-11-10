/**
 * Global stores & cross-domain state facade
 */
export * from "@/global/stores/events";
export * from "@/global/stores/useStatusNoticeStore";

// Re-export domain stores untuk modul yang mengimpor dari @/global/stores
export { useUIStore } from "@/domains/workspace/shared/stores/useUIStore";
export { useNodeStore } from "@/domains/graph/shared/stores/useNodeStore";
export { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
export { useGraphStore } from "@/domains/graph/shared/stores/useGraphStore";
export { useOfflineStore } from "@/domains/sync/shared/stores/useOfflineStore";

// Re-export core graph types
export type { Node, Link, GraphData, Backlink, SaveStatus } from "@/global/types/graph.types";
