import {
  useVaultGovernanceState,
  type PublishNoteRecord,
  type PublishVaultRecord,
} from "./state/useVaultGovernanceState";
import type { SimulatedRole } from "./types";

export type { PublishNoteRecord, PublishVaultRecord };

/**
 * Pure zero-backend publish & vault governance state wrapper.
 * Delegates to `useVaultGovernanceState` using deterministic local in-memory state.
 */
export function usePublishManagerState(role: SimulatedRole) {
  return useVaultGovernanceState(role);
}
