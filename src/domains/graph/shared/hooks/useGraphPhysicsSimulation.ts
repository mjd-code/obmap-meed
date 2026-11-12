import { useEffect, type MutableRefObject } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { RenderNode, RenderLink, LayoutMode } from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';

interface UseGraphPhysicsSimulationParams {
  graphRef: MutableRefObject<ForceGraphMethods<RenderNode, RenderLink> | undefined>;
  layoutMode: LayoutMode;
  config: GraphConfigState;
}

export function useGraphPhysicsSimulation({
  graphRef,
  layoutMode,
  config,
}: UseGraphPhysicsSimulationParams) {
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    if (layoutMode === 'free-force') {
      const chargeForce = fg.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(config.forces?.chargeStrength ?? -180);
      }

      const linkForce = fg.d3Force('link');
      if (linkForce) {
        linkForce.distance(config.forces?.linkDistance ?? 45);
      }

      fg.d3ReheatSimulation();
    } else {
      // Deterministic layout solvers: Pin and pause simulation
      const chargeForce = fg.d3Force('charge');
      if (chargeForce) chargeForce.strength(0);

      const linkForce = fg.d3Force('link');
      if (linkForce) linkForce.distance(0);
    }
  }, [layoutMode, config.forces?.chargeStrength, config.forces?.linkDistance, graphRef]);
}