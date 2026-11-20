export type PrototypeSnapshotStatus = "active" | "archived" | "planned";

export interface PrototypeSnapshotStage {
  id: string;
  label: string;
  badgeText: string;
  status: PrototypeSnapshotStatus;
  description: string;
  route: string;
  updatedAt: string;
}

export const ACTIVE_SNAPSHOT_ID = "stage-02-three-pillar-v2" as const;

export const SNAPSHOT_CATALOG: readonly PrototypeSnapshotStage[] = [
  {
    id: "stage-01-three-pillar-v1",
    label: "Stage 01 — Three-Pillar v1",
    badgeText: "Archived Baseline",
    status: "archived",
    description:
      "Baseline showcase awal dengan inline Settings rail dan integrasi workbench parsial.",
    route: "/prototype?stage=stage-01-three-pillar-v1",
    updatedAt: "2026-11-18",
  },
  {
    id: "stage-02-three-pillar-v2",
    label: "Stage 02 — Three-Pillar v2",
    badgeText: "Active Dynamic Mockup — Ready for 1:1 Main-App Migration & Snapshot Freeze",
    status: "active",
    description:
      "Showcase interaktif 100% zero-backend dengan Deep Explorer, Dual Navigator (Breadcrumb + Right Sidebar), dan Settings Hub 13 sub-pengaturan.",
    route: "/prototype",
    updatedAt: "2026-11-20",
  },
] as const;

export function getActiveSnapshotStage(): PrototypeSnapshotStage {
  return (
    SNAPSHOT_CATALOG.find((stage) => stage.id === ACTIVE_SNAPSHOT_ID) ??
    SNAPSHOT_CATALOG[SNAPSHOT_CATALOG.length - 1]
  );
}

export function getSnapshotStage(id: string): PrototypeSnapshotStage {
  return SNAPSHOT_CATALOG.find((stage) => stage.id === id) ?? getActiveSnapshotStage();
}

export function listSnapshotStages(
  status?: PrototypeSnapshotStatus
): readonly PrototypeSnapshotStage[] {
  if (!status) return SNAPSHOT_CATALOG;
  return SNAPSHOT_CATALOG.filter((stage) => stage.status === status);
}

export function isSnapshotActive(id: string): boolean {
  return getSnapshotStage(id).status === "active";
}
