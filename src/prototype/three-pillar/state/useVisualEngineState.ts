import { useCallback, useState } from "react";
import { toast } from "sonner";
import { INITIAL_VISUAL_ENGINE_STATE } from "../mockSettingsDefaults";
import type { PrototypeVisualEngineState } from "../settingsTypes";
import type { GraphSolverKind, VisualEngineConfigBlock } from "../vcsAndConfigTypes";

export function useVisualEngineState() {
  const [state, setState] = useState<PrototypeVisualEngineState>(() => ({
    ...INITIAL_VISUAL_ENGINE_STATE,
  }));

  const updateVisualEngine = useCallback((patch: Partial<PrototypeVisualEngineState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setDefaultSolver = useCallback((solver: GraphSolverKind) => {
    setState((prev) => ({ ...prev, defaultSolver: solver }));
  }, []);

  const resetVisualEngine = useCallback(() => {
    setState({ ...INITIAL_VISUAL_ENGINE_STATE });
    toast.info("Parameter Visual Engine direset ke default.");
  }, []);

  const hydrateFromConfig = useCallback((block: VisualEngineConfigBlock) => {
    setState({
      repulsionForce: block.graph_mode.repulsion_force,
      linkDistance: block.graph_mode.link_distance,
      centerGravity: block.graph_mode.center_gravity,
      nodeRenderLimit: block.graph_mode.node_render_limit,
      labelFadeThreshold: block.graph_mode.label_fade_threshold,
      clusterColorsEnabled: block.graph_mode.cluster_colors_enabled,
      hideOrphanNodes: block.graph_mode.hide_orphan_nodes,
      defaultSolver: block.deterministic_solvers.default_solver,
      connectorStyle: block.deterministic_solvers.connector_style,
      branchColorCoding: block.deterministic_solvers.branch_color_coding,
      branchSpacingPx: block.deterministic_solvers.branch_spacing_px,
      keyboardShortcutsEnabled: block.deterministic_solvers.keyboard_shortcuts_enabled,
    });
  }, []);

  return {
    state,
    updateVisualEngine,
    setDefaultSolver,
    resetVisualEngine,
    hydrateFromConfig,
  };
}
