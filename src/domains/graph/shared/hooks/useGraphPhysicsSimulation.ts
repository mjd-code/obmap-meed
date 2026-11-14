import { useEffect, type MutableRefObject } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { RenderNode, RenderLink, LayoutMode } from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import { usesPhysicsSimulation } from '@/domains/graph/shared/utils/layoutCategory';
import type { LayoutTransitionController } from '@/domains/graph/shared/utils/transitionController';

interface UseGraphPhysicsSimulationParams {
  graphRef: MutableRefObject<(ForceGraphMethods<RenderNode, RenderLink> & { refresh?: () => unknown }) | undefined>;
  layoutMode: LayoutMode;
  config: GraphConfigState;
  simulationCommand: { type: 'reheat' | 'stop'; nonce: number } | null;
  nodes: RenderNode[];
  transitionRef: MutableRefObject<LayoutTransitionController>;
}

export function useGraphPhysicsSimulation({
  graphRef,
  layoutMode,
  config,
  simulationCommand,
  nodes,
  transitionRef,
}: UseGraphPhysicsSimulationParams) {
  const isPhysical = usesPhysicsSimulation(layoutMode);

  // 1. Sinkronkan parameter gaya D3 (charge, link, center) dan reheat saat mode free-force aktif
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    if (isPhysical) {
      fg.d3Force?.('charge')?.strength?.(config.forces?.chargeStrength ?? -180);
      fg.d3Force?.('link')?.distance?.(config.forces?.linkDistance ?? 45);
      (fg.d3Force?.('center') as { strength?: (v: number) => void } | undefined)?.strength?.(
        config.forces?.centerStrength ?? 0.5,
      );
      fg.d3ReheatSimulation?.();
    } else {
      fg.d3Force?.('charge')?.strength?.(0);
      fg.d3Force?.('link')?.distance?.(0);
    }
  }, [
    isPhysical,
    config.forces?.chargeStrength,
    config.forces?.linkDistance,
    config.forces?.centerStrength,
    config.forces?.velocityDecay,
    graphRef,
  ]);

  // 2. Eksekusi simulation command eksplisit (`reheat` / `stop`)
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || !simulationCommand || !isPhysical) return;

    if (simulationCommand.type === 'reheat') {
      transitionRef.current.release(nodes);
      fg.d3ReheatSimulation?.();
    } else {
      for (const node of nodes) {
        node.fx = node.x;
        node.fy = node.y;
        node.vx = 0;
        node.vy = 0;
      }
      fg.refresh?.();
    }
  }, [simulationCommand, isPhysical, nodes, graphRef, transitionRef]);
}