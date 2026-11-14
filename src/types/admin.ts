import type { AccountLifecycleStatus, AppRole, VaultMemberRole } from "@/types/collaboration";

export type AccountStatus = "active" | "approved" | "pending_approval" | "suspended";

export interface PartnerInvitationRecord {
  id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  status: "pending" | "accepted" | "revoked" | "expired" | string;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
  status?: AccountStatus;
  account_status?: AccountLifecycleStatus;
  vault_count?: number;
}

export interface SystemMetrics {
  totalNotes: number;
  draftNotes: number;
  inReviewNotes: number;
  publishedNotes: number;
  totalVaults: number;
  totalUsers: number;
  dbPingMs: number;
  storagePingMs?: number;
  hasSuperadminConfigured: boolean;
}

export interface VaultMemberWithProfile {
  id: string;
  vault_id: string;
  user_id: string;
  role: VaultMemberRole;
  created_at: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

// SystemTelemetryContract: Sumber data tunggal untuk 3 Tampilan Visualizer
export type SubsystemStatus = "healthy" | "degraded" | "failing";

export interface SubsystemNode {
  id: string;
  name: string;
  category: "engine" | "security" | "storage" | "network";
  status: SubsystemStatus;
  latencyMs: number;
  uptimePercent: number;
  description: string;
  dependencies: string[];
  enabled: boolean;
}

export interface DiagnosticsEntry {
  id: string;
  timestamp: string;
  subsystem: string;
  severity: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface SystemTelemetryContract {
  nodes: SubsystemNode[];
  diagnostics: DiagnosticsEntry[];
  memoryUsageMb: number;
  activeListeners: number;
  syncQueueDepth: number;
}