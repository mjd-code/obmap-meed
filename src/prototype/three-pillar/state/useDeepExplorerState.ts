import { useCallback, useState } from "react";
import {
  normalizeRestructureMode,
  type DeepExplorerViewKind,
  type ReorganizeBy,
  type RestructureMode,
  type RestructureModeV2,
} from "../vcsAndConfigTypes";
import type { PrototypeDeepExplorerState } from "./prototypeStateTypes";

export function useDeepExplorerState(): PrototypeDeepExplorerState {
  const [defaultView, setDefaultView] = useState<DeepExplorerViewKind>("graph");
  const [branchFilter, setBranchFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState(3);
  const [reorganizeBy, setReorganizeBy] = useState<ReorganizeBy>("hierarchy");
  const [restructureMode, setRestructureModeState] =
    useState<RestructureModeV2>("virtual_grouping");
  const [requiredYamlProperties, setRequiredYamlProperties] = useState<string[]>([
    "epistemic_status",
    "structure_class",
    "license",
    "visibility",
  ]);
  const [strictFrontmatterValidation, setStrictFrontmatterValidation] = useState(true);

  const setRestructureMode = useCallback((mode: RestructureMode) => {
    setRestructureModeState(normalizeRestructureMode(mode));
  }, []);

  const addYamlProperty = useCallback((prop: string) => {
    const clean = prop.trim().toLowerCase().replace(/\s+/g, "_");
    if (!clean) return;
    setRequiredYamlProperties((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const removeYamlProperty = useCallback((prop: string) => {
    setRequiredYamlProperties((prev) => prev.filter((item) => item !== prop));
  }, []);

  return {
    defaultView,
    setDefaultView,
    branchFilter,
    setBranchFilter,
    folderFilter,
    setFolderFilter,
    depthFilter,
    setDepthFilter,
    reorganizeBy,
    setReorganizeBy,
    restructureMode,
    setRestructureMode,
    requiredYamlProperties,
    strictFrontmatterValidation,
    setStrictFrontmatterValidation,
    addYamlProperty,
    removeYamlProperty,
  };
}
