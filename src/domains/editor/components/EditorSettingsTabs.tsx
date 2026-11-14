import { Label } from "@/global/ui/label";
import { Switch } from "@/global/ui/switch";
import { Slider } from "@/global/ui/slider";
import { Input } from "@/global/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { ScrollArea } from "@/global/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import {
  EDITOR_SETTINGS_TABS,
  useEditorSettingsContentController,
  type SettingToggleDescriptor,
} from "@/domains/editor/shared/hooks/useEditorSettingsController";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <Label className="text-sm">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2 py-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function renderToggleList(items: SettingToggleDescriptor[]) {
  return items.map((item) => (
    <ToggleRow
      key={item.key}
      label={item.label}
      description={item.description}
      checked={item.checked}
      onChange={item.onChange}
    />
  ));
}

/** Tab body only — reused by the Sheet panel and the Unified Settings Hub. */
export function EditorSettingsContent() {
  const ctrl = useEditorSettingsContentController();

  return (
    <Tabs
      value={ctrl.activeTab}
      onValueChange={ctrl.setActiveTab}
      className="flex-1 flex flex-col min-h-0"
    >
      <div className="flex-shrink-0 border-b border-border bg-muted/30 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TabsList className="inline-flex h-11 sm:h-12 w-full min-w-max items-center justify-start gap-0.5 sm:gap-1 bg-transparent p-1 sm:p-1.5 px-2 sm:px-4">
          {EDITOR_SETTINGS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 sm:p-6">
          <TabsContent
            value="appearance"
            className="mt-0 space-y-1 focus-visible:outline-none"
          >
            <div className="space-y-2 py-1.5">
              <Label className="text-sm">Font</Label>
              <Select
                value={ctrl.appearance.fontFamily}
                onValueChange={ctrl.handleFontChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">Sans serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SliderRow
              label="Font size"
              value={ctrl.appearance.fontSize}
              min={11}
              max={28}
              unit="px"
              onChange={(v) => ctrl.updateAppearance({ fontSize: v })}
            />
            <SliderRow
              label="Line height"
              value={ctrl.appearance.lineHeight}
              min={1.2}
              max={2.4}
              step={0.1}
              onChange={(v) => ctrl.updateAppearance({ lineHeight: v })}
            />

            <ToggleRow
              label="Readable line length"
              description="Limit how wide a line of text can get."
              checked={ctrl.appearance.limitContentWidth}
              onChange={(v) => ctrl.updateAppearance({ limitContentWidth: v })}
            />
            {ctrl.appearance.limitContentWidth && (
              <div className="flex items-center justify-between gap-4 py-1.5">
                <Label className="text-sm">Max characters per line</Label>
                <Input
                  type="number"
                  min={40}
                  max={160}
                  value={ctrl.appearance.contentWidth}
                  onChange={(e) => ctrl.handleContentWidthChange(e.target.value)}
                  className="h-8 w-24"
                />
              </div>
            )}

            {renderToggleList(ctrl.appearanceToggles)}
          </TabsContent>

          <TabsContent
            value="behavior"
            className="mt-0 space-y-1 focus-visible:outline-none"
          >
            <ToggleRow
              label="Wrap long lines"
              checked={ctrl.behavior.lineWrapping}
              onChange={(v) => ctrl.updateBehavior({ lineWrapping: v })}
            />
            <SliderRow
              label="Indent size"
              value={ctrl.behavior.indentUnit}
              min={1}
              max={8}
              unit=" spaces"
              onChange={(v) => ctrl.updateBehavior({ indentUnit: v })}
            />
            {renderToggleList(ctrl.behaviorTogglesAfterIndent)}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <div>
                <Label className="text-sm">Auto-save delay</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Milliseconds after you stop typing.
                </p>
              </div>
              <Input
                type="number"
                min={200}
                max={10000}
                step={100}
                value={ctrl.behavior.autoSaveDelay}
                onChange={(e) => ctrl.handleAutoSaveDelayChange(e.target.value)}
                className="h-8 w-28"
              />
            </div>
          </TabsContent>

          <TabsContent
            value="suggestions"
            className="mt-0 space-y-1 focus-visible:outline-none"
          >
            <ToggleRow
              label="Suggestions"
              description="Master switch for all auto-complete popups."
              checked={ctrl.suggestions.enabled}
              onChange={(v) => ctrl.updateSuggestions({ enabled: v })}
            />
            <div
              className={
                ctrl.suggestions.enabled ? "" : "opacity-50 pointer-events-none"
              }
            >
              {renderToggleList(ctrl.nestedSuggestionToggles)}
            </div>
            <ToggleRow
              label="Slash commands"
              description="Type / in the editor to show inline command suggestions."
              checked={ctrl.suggestions.slashCommands}
              onChange={(v) => ctrl.updateSuggestions({ slashCommands: v })}
            />
          </TabsContent>

          <TabsContent
            value="toolbar"
            className="mt-0 space-y-1 focus-visible:outline-none"
          >
            <ToggleRow
              label="Formatting toolbar"
              checked={ctrl.toolbar.showToolbar}
              onChange={(v) => ctrl.updateToolbar({ showToolbar: v })}
            />
            <div
              className={
                ctrl.toolbar.showToolbar ? "" : "opacity-50 pointer-events-none"
              }
            >
              {renderToggleList(ctrl.toolbarGroupToggles)}
            </div>
            <ToggleRow
              label="Properties panel"
              description="Frontmatter editor above the note."
              checked={ctrl.toolbar.showProperties}
              onChange={(v) => ctrl.updateToolbar({ showProperties: v })}
            />
            <ToggleRow
              label="Word count"
              checked={ctrl.toolbar.showWordCount}
              onChange={(v) => ctrl.updateToolbar({ showWordCount: v })}
            />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
}
