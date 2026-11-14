import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import {
  type GraphConfigState,
  type NodeConfig,
  type LinkConfig,
  type ForceConfig,
  type TopologyConfig,
  type HierarchyColorConfig,
  mergeGraphConfig,
  useGraphStore,
} from '@/domains/graph/shared/stores/useGraphStore';
import { useGraphTemplatesStore } from '@/domains/graph/shared/stores/useGraphTemplatesStore';
import { mergeAtmosphereConfig, type AtmosphereConfig } from '@/domains/graph/shared/utils/atmosphereConfig';

export interface LeafGraphConfigState {
  config: GraphConfigState;
  activeTemplateId: string | null;
  setAtmosphereConfig: (updates: Partial<AtmosphereConfig>) => void;
  setNodeConfig: (updater: Partial<NodeConfig> | ((prev: NodeConfig) => Partial<NodeConfig>)) => void;
  setLinkConfig: (updater: Partial<LinkConfig> | ((prev: LinkConfig) => Partial<LinkConfig>)) => void;
  setForceConfig: (updater: Partial<ForceConfig> | ((prev: ForceConfig) => Partial<ForceConfig>)) => void;
  setTopologyConfig: (updater: Partial<TopologyConfig> | ((prev: TopologyConfig) => Partial<TopologyConfig>)) => void;
  setHierarchyConfig: (config: HierarchyColorConfig) => void;
  setFullConfig: (config: GraphConfigState, templateId?: string | null) => void;
  resetToDefault: () => void;
}

let isBridgingConfig = false;

function writeThroughToGlobalConfig(nextConfig: GraphConfigState): void {
  if (isBridgingConfig) return;
  isBridgingConfig = true;
  try {
    useGraphStore.getState().setConfig(nextConfig);
  } finally {
    isBridgingConfig = false;
  }
}

export function createLeafGraphConfigStore(
  initialConfig?: GraphConfigState,
  options?: { bridgeToGlobal?: boolean },
): StoreApi<LeafGraphConfigState> {
  // Ambil template default jika tersedia; selalu deep-merge ke defaultGraphConfig
  // agar config legacy/parsial tidak pernah menghasilkan section `undefined`.
  const templatesState = useGraphTemplatesStore.getState();
  const baseConfig: GraphConfigState = mergeGraphConfig(
    initialConfig ?? templatesState.getDefaultConfig?.() ?? useGraphStore.getState().config,
  );
  const shouldBridge = options?.bridgeToGlobal ?? true;

  return createStore<LeafGraphConfigState>((set, get) => ({
    config: baseConfig,
    activeTemplateId: templatesState.defaultTemplateId ?? null,

    setAtmosphereConfig: (updates) => {
      set((state) => ({
        config: {
          ...state.config,
          atmosphere: mergeAtmosphereConfig({ ...state.config.atmosphere, ...updates }),
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setNodeConfig: (updater) => {
      set((state) => ({
        config: {
          ...state.config,
          nodes: {
            ...state.config.nodes,
            ...(typeof updater === 'function' ? updater(state.config.nodes) : updater),
          },
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setLinkConfig: (updater) => {
      set((state) => ({
        config: {
          ...state.config,
          links: {
            ...state.config.links,
            ...(typeof updater === 'function' ? updater(state.config.links) : updater),
          },
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setForceConfig: (updater) => {
      set((state) => ({
        config: {
          ...state.config,
          forces: {
            ...state.config.forces,
            ...(typeof updater === 'function' ? updater(state.config.forces) : updater),
          },
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setTopologyConfig: (updater) => {
      set((state) => ({
        config: {
          ...state.config,
          topology: {
            ...state.config.topology,
            ...(typeof updater === 'function' ? updater(state.config.topology) : updater),
          },
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setHierarchyConfig: (hierarchy) => {
      set((state) => ({
        config: {
          ...state.config,
          hierarchy,
        },
      }));
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    setFullConfig: (newConfig, templateId = null) => {
      set({
        config: mergeGraphConfig(newConfig),
        activeTemplateId: templateId,
      });
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },

    resetToDefault: () => {
      const freshTemplatesState = useGraphTemplatesStore.getState();
      const freshDefault =
        freshTemplatesState.getDefaultConfig?.() ?? useGraphStore.getState().config;
      set({
        config: mergeGraphConfig(freshDefault),
        activeTemplateId: freshTemplatesState.defaultTemplateId ?? null,
      });
      if (shouldBridge) writeThroughToGlobalConfig(get().config);
    },
  }));
}

/** Registry: satu store config per graph leaf (tab), hidup sampai tab ditutup. */
const leafConfigStores = new Map<string, StoreApi<LeafGraphConfigState>>();
const fallbackLeafConfigStore = createLeafGraphConfigStore(undefined, { bridgeToGlobal: true });

// Broadcast perubahan global config (mis. dari Settings / ConfigService) ke seluruh tab leaf & fallback
useGraphStore.subscribe((state, prevState) => {
  if (state.config === prevState.config) return;
  const merged = mergeGraphConfig(state.config);
  fallbackLeafConfigStore.setState({ config: merged });
  if (isBridgingConfig) return;
  isBridgingConfig = true;
  try {
    for (const leafStore of leafConfigStores.values()) {
      leafStore.setState({ config: merged });
    }
  } finally {
    isBridgingConfig = false;
  }
});

export function getOrCreateLeafConfigStore(leafId: string): StoreApi<LeafGraphConfigState> {
  let store = leafConfigStores.get(leafId);
  if (!store) {
    store = createLeafGraphConfigStore();
    leafConfigStores.set(leafId, store);
  }
  return store;
}

export function disposeLeafConfigStore(leafId: string): void {
  leafConfigStores.delete(leafId);
}

/** Hook: memoized store per leaf id. */
export function useLeafGraphConfigStore(leafId: string): StoreApi<LeafGraphConfigState> {
  return useMemo(() => getOrCreateLeafConfigStore(leafId), [leafId]);
}

const LeafGraphConfigContext = createContext<StoreApi<LeafGraphConfigState> | null>(null);

export function LeafGraphConfigProvider({
  store,
  children,
}: {
  store: StoreApi<LeafGraphConfigState>;
  children: ReactNode;
}) {
  return createElement(LeafGraphConfigContext.Provider, { value: store }, children);
}

export function useLeafGraphConfigApi(): StoreApi<LeafGraphConfigState> | null {
  return useContext(LeafGraphConfigContext);
}

export function useLeafGraphConfig(): GraphConfigState;
export function useLeafGraphConfig<T>(selector: (state: LeafGraphConfigState) => T): T;
export function useLeafGraphConfig<T>(selector?: (state: LeafGraphConfigState) => T) {
  const store = useContext(LeafGraphConfigContext);
  const targetStore = store ?? fallbackLeafConfigStore;
  return useStore(targetStore, (selector ?? ((s) => s.config)) as (s: LeafGraphConfigState) => T);
}