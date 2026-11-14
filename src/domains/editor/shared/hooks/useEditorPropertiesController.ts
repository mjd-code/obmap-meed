import { useEffect, useMemo, useState } from "react";
import {
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  ListOrdered,
  ChevronDown,
} from "lucide-react";
import { useNodeStore } from "@/global/stores";
import type {
  FrontmatterProperty,
  FrontmatterPropertyType,
} from "@/domains/editor/shared/utils/editor.types";
import {
  parseFrontmatter,
  writeFrontmatter,
  writeRawFrontmatter,
} from "@/domains/editor/shared/utils/frontmatterField";
import {
  detectListLayout,
  normalizeTag,
  propertiesToYaml,
  reservedType,
  toStringList,
  type ListLayout,
} from "@/domains/editor/shared/utils/frontmatterUtils";
import {
  useResolvedSchema,
  useSchemaStore,
} from "@/domains/settings/shared/api/schemaIndex";
import { useEditorSettingsStore } from "@/domains/editor/shared/stores/useEditorSettingsStore";

export interface PropertyNode {
  content: string;
  tags?: string[];
}

export interface PropertyActions {
  updateValue: (key: string, next: unknown) => void;
  renameKey: (key: string, nextKeyRaw: string) => void;
  changeType: (key: string, type: FrontmatterPropertyType) => void;
  removeProperty: (key: string) => void;
  moveRow: (from: number, to: number) => void;
}

export const isEmptyValue = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

export const TYPE_ICON: Record<FrontmatterPropertyType, typeof Type> = {
  text: Type,
  number: Hash,
  date: Calendar,
  checkbox: ToggleLeft,
  select: ChevronDown,
  tags: Hash,
  list: ListOrdered,
};

export const TYPE_LABEL: Record<FrontmatterPropertyType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
  select: "Select",
  tags: "Tags",
  list: "List",
};

export const TYPES = Object.keys(TYPE_LABEL) as FrontmatterPropertyType[];

export const coerceValue = (
  value: unknown,
  type: FrontmatterPropertyType,
): unknown => {
  switch (type) {
    case "tags":
    case "list":
      return toStringList(value);
    case "checkbox":
      return Boolean(value);
    case "number": {
      const n = Number(Array.isArray(value) ? value[0] : value);
      return Number.isFinite(n) ? n : 0;
    }
    default: {
      const v = Array.isArray(value) ? value[0] : value;
      return v === null || v === undefined ? "" : String(v);
    }
  }
};

export function optionsForKey(nodes: PropertyNode[], key: string): string[] {
  const set = new Set<string>();
  nodes.forEach((n) => {
    const match = n.content?.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    if (match) set.add(match[1].trim().replace(/^['"]|['"]$/g, ""));
  });
  return Array.from(set).filter(Boolean).sort();
}

export function useEditorPropertiesController(
  value: string,
  onChange: (next: string) => void,
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [listLayout, setListLayout] = useState<ListLayout>("block");
  const [rawMode, setRawMode] = useState(false);
  const [rawDraft, setRawDraft] = useState("");
  const [dragRow, setDragRow] = useState<number | null>(null);

  const info = useMemo(() => parseFrontmatter(value), [value]);
  const properties = info.properties;

  useEffect(() => {
    if (info.raw) setListLayout(detectListLayout(info.raw));
  }, [info.raw]);

  const frontmatterRecord = useMemo(
    () =>
      Object.fromEntries(properties.map((p) => [p.key, p.value])) as Record<
        string,
        unknown
      >,
    [properties],
  );
  const rules = useResolvedSchema(frontmatterRecord);
  const strictMode = useSchemaStore((s) => s.schema.strictMode);
  const propertySuggestionsEnabled = useEditorSettingsStore(
    (s) => s.suggestions.enabled && s.suggestions.properties,
  );
  const ruleFor = (key: string) => rules.find((r) => r.key === key);

  const missingRequired = rules.filter(
    (r) => r.required && !properties.some((p) => p.key === r.key),
  );
  const emptyRequired = rules.filter(
    (r) =>
      r.required &&
      properties.some((p) => p.key === r.key && isEmptyValue(p.value)),
  );

  const nodes = useNodeStore((state) => state.nodes);
  const knownTags = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => n.tags?.forEach((t) => set.add(normalizeTag(t))));
    rules.forEach((r) => {
      if (r.taxonomyPrefix) set.add(normalizeTag(r.taxonomyPrefix));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [nodes, rules]);

  const keySuggestions = useMemo(() => {
    const set = new Set<string>([
      "title",
      "tags",
      "aliases",
      "created",
      "updated",
      "status",
      "author",
      "cssclasses",
    ]);
    rules.forEach((r) => set.add(r.key));
    nodes.forEach((n) => {
      if (typeof n.content !== "string") return;
      parseFrontmatter(n.content).properties.forEach((p) => set.add(p.key));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [nodes, rules]);

  const commit = (
    next: FrontmatterProperty[],
    layout: ListLayout = listLayout,
  ) => {
    onChange(writeFrontmatter(value, next, layout));
  };

  const actions: PropertyActions = {
    updateValue: (key, next) => {
      commit(
        properties.map((p) => (p.key === key ? { ...p, value: next } : p)),
      );
    },
    renameKey: (key, nextKeyRaw) => {
      const nextKey = nextKeyRaw.trim();
      if (!nextKey || nextKey === key) return;
      if (properties.some((p) => p.key.toLowerCase() === nextKey.toLowerCase()))
        return;
      commit(
        properties.map((p) =>
          p.key === key
            ? {
                ...p,
                key: nextKey,
                type: reservedType(nextKey) ?? p.type,
                value: coerceValue(p.value, reservedType(nextKey) ?? p.type),
              }
            : p,
        ),
      );
    },
    changeType: (key, type) => {
      commit(
        properties.map((p) =>
          p.key === key ? { ...p, type, value: coerceValue(p.value, type) } : p,
        ),
      );
    },
    removeProperty: (key) => {
      commit(properties.filter((p) => p.key !== key));
    },
    moveRow: (from, to) => {
      if (from === to || to < 0 || to >= properties.length) return;
      const next = [...properties];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      commit(next);
    },
  };

  const addProperty = (raw?: string) => {
    const key = (raw ?? newKey).trim();
    setNewKey("");
    if (
      !key ||
      properties.some((p) => p.key.toLowerCase() === key.toLowerCase())
    )
      return;

    const rule = ruleFor(key);
    const type =
      reservedType(key) ?? (rule?.type as FrontmatterPropertyType) ?? "text";
    commit([
      ...properties,
      { key, type, value: coerceValue(rule?.defaultValue ?? "", type) },
    ]);
  };

  const addMissingRequired = () => {
    const seeded = missingRequired.map((rule) => {
      const type = (reservedType(rule.key) ??
        rule.type) as FrontmatterPropertyType;
      return {
        key: rule.key,
        type,
        value: coerceValue(rule.defaultValue ?? "", type),
      };
    });
    commit([...seeded, ...properties]);
  };

  const duplicateKey = Boolean(
    newKey.trim() &&
      properties.some(
        (p) => p.key.trim().toLowerCase() === newKey.trim().toLowerCase(),
      ),
  );

  const yamlPreview = propertiesToYaml(properties, listLayout);

  const toggleRawMode = () => {
    if (rawMode) {
      setRawMode(false);
    } else {
      setRawDraft(yamlPreview);
      setRawMode(true);
    }
  };

  const applyRawYaml = () => {
    onChange(writeRawFrontmatter(value, rawDraft));
    setRawMode(false);
  };

  const rank = (key: string): number => {
    const rule = ruleFor(key);
    if (!rule) return 2;
    if (rule.required) return 0;
    return rule.visibility === "always" ? 1 : 3;
  };

  const rows = properties
    .map((property, index) => ({ property, index, rank: rank(property.key) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);

  const primaryRows = rows.filter((r) => r.rank < 3);
  const secondaryRows = rows.filter((r) => r.rank === 3);

  return {
    isExpanded,
    setIsExpanded,
    newKey,
    setNewKey,
    rawMode,
    setRawMode,
    rawDraft,
    setRawDraft,
    dragRow,
    setDragRow,
    info,
    properties,
    strictMode,
    propertySuggestionsEnabled,
    ruleFor,
    missingRequired,
    emptyRequired,
    nodes,
    knownTags,
    keySuggestions,
    actions,
    addProperty,
    addMissingRequired,
    duplicateKey,
    toggleRawMode,
    applyRawYaml,
    primaryRows,
    secondaryRows,
  };
}
