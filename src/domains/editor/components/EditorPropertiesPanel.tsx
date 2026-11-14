import { Button } from "@/global/ui/button";
import { Textarea } from "@/global/ui/textarea";
import { Plus, ChevronRight, Code2 } from "lucide-react";
import { cn } from "@/global/utils";
import { SuggestInput } from "@/domains/editor/components/EditorSuggestInput";
import { PropertyRow } from "@/domains/editor/components/EditorPropertyRow";
import { useEditorPropertiesController } from "@/domains/editor/shared/hooks/useEditorPropertiesController";

interface PropertiesPanelProps {
  value: string;
  onChange: (next: string) => void;
}

export const PropertiesPanel = ({ value, onChange }: PropertiesPanelProps) => {
  const ctrl = useEditorPropertiesController(value, onChange);

  const renderRows = (list: typeof ctrl.primaryRows) =>
    list.map(({ property, index }) => (
      <PropertyRow
        key={property.key}
        property={property}
        index={index}
        rule={ctrl.ruleFor(property.key)}
        strictMode={ctrl.strictMode}
        dragRow={ctrl.dragRow}
        setDragRow={ctrl.setDragRow}
        actions={ctrl.actions}
        nodes={ctrl.nodes}
        knownTags={ctrl.propertySuggestionsEnabled ? ctrl.knownTags : []}
        keySuggestions={
          ctrl.propertySuggestionsEnabled ? ctrl.keySuggestions : []
        }
      />
    ));

  return (
    <section
      className={cn(
        "space-y-1.5 border-b border-border/30 transition-all mb-2 pb-2",
      )}
    >
      {/* Notion-like Collapsible Header */}
      <header className="group flex items-center justify-between py-0.5">
        <button
          type="button"
          onClick={() => ctrl.setIsExpanded(!ctrl.isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              ctrl.isExpanded && "rotate-90",
            )}
          />
          <span>Properties</span>
          {!ctrl.isExpanded && ctrl.properties.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-muted/50 text-[10px] font-normal text-muted-foreground/70">
              {ctrl.properties.length}
            </span>
          )}
        </button>

        {ctrl.isExpanded && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                ctrl.rawMode && "bg-accent text-accent-foreground",
              )}
              onClick={ctrl.toggleRawMode}
              title="Toggle Raw YAML"
            >
              <Code2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </header>

      {ctrl.info.error && (
        <p className="text-xs text-destructive px-5">{ctrl.info.error}</p>
      )}

      {ctrl.isExpanded && (
        <div className="px-2 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {ctrl.rawMode ? (
            <div className="space-y-2">
              <Textarea
                value={ctrl.rawDraft}
                onChange={(e) => ctrl.setRawDraft(e.target.value)}
                spellCheck={false}
                rows={Math.max(4, ctrl.rawDraft.split("\n").length + 1)}
                className="font-mono text-xs bg-muted/30 focus-visible:ring-1"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={ctrl.applyRawYaml}>
                  Apply YAML
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => ctrl.setRawMode(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {(ctrl.missingRequired.length > 0 ||
                (ctrl.strictMode && ctrl.emptyRequired.length > 0)) && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                  <p className="text-xs">
                    {ctrl.missingRequired.length > 0
                      ? `Missing: ${ctrl.missingRequired.map((r) => r.key).join(", ")}`
                      : `Empty: ${ctrl.emptyRequired.map((r) => r.key).join(", ")}`}
                  </p>
                  {ctrl.missingRequired.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={ctrl.addMissingRequired}
                    >
                      Add Required
                    </Button>
                  )}
                </div>
              )}

              {renderRows(ctrl.primaryRows)}

              {ctrl.secondaryRows.length > 0 && (
                <details className="group/details mt-2">
                  <summary className="cursor-pointer select-none py-1.5 text-xs text-muted-foreground/70 hover:text-foreground marker:content-[''] flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/details:rotate-90" />
                    System configuration ({ctrl.secondaryRows.length})
                  </summary>
                  <div className="ml-1 mt-1 flex flex-col gap-0.5 border-l border-border/40 pl-3">
                    {renderRows(ctrl.secondaryRows)}
                  </div>
                </details>
              )}

              {/* Add Property Input */}
              <div className="group mt-1 flex items-center gap-2 rounded-md py-1 transition-colors hover:bg-accent/30">
                <div className="flex w-[140px] shrink-0 items-center gap-1.5 pl-1 text-muted-foreground/60 group-hover:text-muted-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  <SuggestInput
                    value={ctrl.newKey}
                    onChange={ctrl.setNewKey}
                    onCommit={(next) => {
                      if (next.trim()) ctrl.addProperty(next);
                    }}
                    suggestions={
                      ctrl.propertySuggestionsEnabled ? ctrl.keySuggestions : []
                    }
                    placeholder="Add property"
                  />
                </div>
                {ctrl.duplicateKey && (
                  <span className="text-[10px] text-destructive">
                    Key exists
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
