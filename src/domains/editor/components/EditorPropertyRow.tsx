import { useEffect, useMemo, useState } from "react";
import { Input } from "@/global/ui/input";
import { Button } from "@/global/ui/button";
import { Checkbox } from "@/global/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";
import { X, Type, Lock } from "lucide-react";
import { cn } from "@/global/utils";
import type { FrontmatterProperty } from "@/domains/editor/shared/utils/editor.types";
import {
  isReservedKey,
  toStringList,
} from "@/domains/editor/shared/utils/frontmatterUtils";
import type { ResolvedProperty } from "@/domains/settings/shared/api/schemaIndex";
import { SuggestInput } from "@/domains/editor/components/EditorSuggestInput";
import { ListValueInput } from "@/domains/editor/components/EditorListValueInput";
import {
  isEmptyValue,
  optionsForKey,
  TYPE_ICON,
  TYPE_LABEL,
  TYPES,
  type PropertyActions,
  type PropertyNode,
} from "@/domains/editor/shared/hooks/useEditorPropertiesController";

export { ListValueInput };

interface PropertyRowProps {
  property: FrontmatterProperty;
  index: number;
  rule?: ResolvedProperty;
  strictMode?: boolean;
  dragRow: number | null;
  setDragRow: (i: number | null) => void;
  actions: PropertyActions;
  nodes: PropertyNode[];
  knownTags: string[];
  keySuggestions?: string[];
}

export const PropertyRow = ({
  property,
  rule,
  strictMode,
  actions,
  nodes,
  knownTags,
  keySuggestions = [],
}: PropertyRowProps) => {
  const Icon = TYPE_ICON[property.type] ?? Type;
  const mandatory = Boolean(rule?.required);
  const reserved = isReservedKey(property.key) || mandatory;
  const invalid = strictMode && mandatory && isEmptyValue(property.value);

  const [keyDraft, setKeyDraft] = useState(property.key);
  useEffect(() => setKeyDraft(property.key), [property.key]);

  const valueSuggestions = useMemo(
    () => optionsForKey(nodes, property.key),
    [nodes, property.key],
  );

  return (
    <div
      className={cn(
        "group flex items-center min-h-[32px] rounded-md transition-colors hover:bg-accent/40",
        invalid && "bg-destructive/10",
      )}
    >
      {/* Left Column: Key & Actions */}
      <div className="flex w-[140px] shrink-0 items-center gap-1 py-1 pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={reserved}>
            <button className="flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
              <Icon className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {TYPES.map((t) => {
              const TIcon = TYPE_ICON[t];
              return (
                <DropdownMenuItem
                  key={t}
                  onSelect={() => actions.changeType(property.key, t)}
                >
                  <TIcon className="mr-2 h-3.5 w-3.5" /> {TYPE_LABEL[t]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <SuggestInput
          value={keyDraft}
          onChange={setKeyDraft}
          onCommit={(next) => actions.renameKey(property.key, next)}
          suggestions={keySuggestions.filter(
            (key) => key.toLowerCase() !== property.key.toLowerCase(),
          )}
          readOnly={reserved}
          className="h-6 w-full truncate border-none bg-transparent px-1 text-xs text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:text-foreground"
        />

        {reserved && (
          <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        )}
      </div>

      {/* Right Column: Value Input */}
      <div className="flex-1 min-w-0 py-1 flex items-center pr-2">
        {property.type === "checkbox" ? (
          <Checkbox
            checked={Boolean(property.value)}
            onCheckedChange={(c) =>
              actions.updateValue(property.key, c === true)
            }
            className="ml-2 data-[state=checked]:bg-primary"
          />
        ) : property.type === "tags" || property.type === "list" ? (
          <ListValueInput
            isTags={property.type === "tags"}
            values={toStringList(property.value)}
            suggestions={
              property.type === "tags" ? knownTags : valueSuggestions
            }
            onChange={(next) => actions.updateValue(property.key, next)}
          />
        ) : property.type === "select" || property.type === "text" ? (
          <SuggestInput
            value={String(property.value ?? "")}
            suggestions={valueSuggestions}
            onChange={(next) => actions.updateValue(property.key, next)}
            placeholder="Empty"
          />
        ) : (
          <Input
            type={
              property.type === "number"
                ? "number"
                : property.type === "date"
                  ? "date"
                  : "text"
            }
            value={
              property.value === null || property.value === undefined
                ? ""
                : String(property.value)
            }
            onChange={(e) =>
              actions.updateValue(
                property.key,
                property.type === "number"
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
            placeholder="Empty"
            className="h-6 w-full border-none bg-transparent px-1.5 text-xs shadow-none placeholder:text-muted-foreground/40 hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded transition-colors"
          />
        )}
      </div>

      {!mandatory && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 h-6 w-6 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={() => actions.removeProperty(property.key)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
