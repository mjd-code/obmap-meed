import React, { useState } from "react";
import {
  ArrowLeft,
  Bot,
  Cpu,
  GraduationCap,
  HardDrive,
  Keyboard,
  Palette,
  Puzzle,
  Settings2,
  Share2,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Switch } from "@/global/ui/switch";
import { PROTOTYPE_SCHOLAR_PROFILE } from "../mockData";
import type {
  GraphSolverKind,
  HelicopterViewKind,
  ReorganizeBy,
  RestructureMode,
  SettingsHubSectionId,
  WorkspaceModeId,
} from "../types";
import { EditorPublishStudioTab, type PublishTabBindings } from "./EditorPublishStudioTab";
import { PrototypeSettingsVaultLensesSection } from "./PrototypeSettingsVaultLensesSection";

export interface AdaptiveSettingsHubProps {
  mode: "full_page" | "workspace_tab";
  activeSection: SettingsHubSectionId;
  onChangeSection: (section: SettingsHubSectionId) => void;
  onBackOrClose?: () => void;
  scholarBio: string;
  onSaveBio: (bio: string) => void;
  publishProps: PublishTabBindings;
  activeLensMode: WorkspaceModeId;
  helicopterView: HelicopterViewKind;
  graphSolver: GraphSolverKind;
  reorganizeBy: ReorganizeBy;
  restructureMode: RestructureMode;
  onUpdateVaultMode: (mode: WorkspaceModeId, helicopter: HelicopterViewKind) => void;
  onChangeGraphSolver: (solver: GraphSolverKind) => void;
  onChangeReorganizeBy: (by: ReorganizeBy) => void;
  onChangeRestructureMode: (mode: RestructureMode) => void;
  onOpenHelicopterExplorerTab: () => void;
}

const SECTIONS: {
  id: SettingsHubSectionId;
  label: string;
  scope: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "vault_lenses", label: "Vault & Lenses", scope: ".app/config.json", icon: SlidersHorizontal },
  { id: "share_access_vcs", label: "Share · Access · VCS", scope: "Vault & Node", icon: Share2 },
  { id: "academy_sdk", label: "Academy & @app/sdk", scope: "Policy", icon: GraduationCap },
  { id: "account_app", label: "Account & App", scope: "Global", icon: User },
];

export const PrototypeSettingsHub: React.FC<AdaptiveSettingsHubProps> = ({
  mode,
  activeSection,
  onChangeSection,
  onBackOrClose,
  scholarBio,
  onSaveBio,
  publishProps,
  activeLensMode,
  helicopterView,
  graphSolver,
  reorganizeBy,
  restructureMode,
  onUpdateVaultMode,
  onChangeGraphSolver,
  onChangeReorganizeBy,
  onChangeRestructureMode,
  onOpenHelicopterExplorerTab,
}) => {
  const scholar = PROTOTYPE_SCHOLAR_PROFILE;
  const activeVault = publishProps.selectedVault;
  const cfg = activeVault.appConfig;
  const [aiProvider, setAiProvider] = useState<"ollama" | "webllm" | "byok">("ollama");
  const [themeLabel, setThemeLabel] = useState<"Obsidian Dark" | "Calm Daylight">("Obsidian Dark");
  const [draftBio, setDraftBio] = useState(scholarBio);

  const navRail = (
    <aside className="lg:w-64 shrink-0 space-y-1.5">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = activeSection === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChangeSection(s.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2",
              active ? "border-primary bg-primary/12 text-primary font-semibold" : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center gap-2 vk-text-xs min-w-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="vk-text-2xs opacity-70 shrink-0">{s.scope}</span>
          </button>
        );
      })}
    </aside>
  );

  const sectionBody = (
    <div className="flex-1 min-w-0 space-y-4">
      {activeSection === "vault_lenses" && (
        <PrototypeSettingsVaultLensesSection
          vaults={publishProps.vaults}
          activeVault={activeVault}
          onSelectVault={publishProps.onSelectVault}
          activeLensMode={activeLensMode}
          helicopterView={helicopterView}
          graphSolver={graphSolver}
          reorganizeBy={reorganizeBy}
          restructureMode={restructureMode}
          onUpdateVaultMode={onUpdateVaultMode}
          onChangeGraphSolver={onChangeGraphSolver}
          onChangeReorganizeBy={onChangeReorganizeBy}
          onChangeRestructureMode={onChangeRestructureMode}
          onOpenHelicopterExplorerTab={onOpenHelicopterExplorerTab}
        />
      )}

      {activeSection === "share_access_vcs" && <EditorPublishStudioTab {...publishProps} embedded />}

      {activeSection === "academy_sdk" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="vk-text-sm font-semibold">Layer 1–3 Academy Pedagogical Rules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 vk-text-xs">
              <div className="rounded-xl bg-surface border border-border p-3 space-y-1">
                <span className="vk-text-2xs text-muted-foreground">Hierarki Node Wajib</span>
                <p className="font-mono text-foreground">{cfg.academy.hierarchy.join(" → ")}</p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3 space-y-1">
                <span className="vk-text-2xs text-muted-foreground">Batas Submisi & Time-Window</span>
                <p className="text-foreground">Maks {cfg.academy.max_files_per_submission} file · {cfg.academy.time_window}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface border border-border px-3 py-2.5">
              <span className="vk-text-xs">Zen Focus Mode saat Tugas/Evaluasi</span>
              <Switch checked={cfg.academy.zen_focus_mode} onCheckedChange={() => toast.info("Aturan per node tersimpan di .app/config.json")} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="vk-text-sm font-semibold inline-flex items-center gap-1.5">
                <Puzzle className="h-4 w-4 text-primary" /> @app/sdk Extensions & Community Presets
              </h2>
              <Badge variant="outline" className="vk-text-2xs font-mono">{cfg.extensions.sdk_package}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cfg.extensions.enabled.map((ext) => (
                <Badge key={ext} variant="success" className="vk-text-2xs font-mono">Core: {ext}</Badge>
              ))}
              {cfg.extensions.community_presets.map((cp) => (
                <Badge key={cp} variant="info" className="vk-text-2xs font-mono">Community: {cp}</Badge>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeSection === "account_app" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="vk-text-sm font-semibold">Profil Publik Kanonik ({scholar.handle})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 vk-text-xs">
              <div>
                <span className="vk-text-2xs text-muted-foreground block mb-1">Canonical Handle & ORCID</span>
                <code className="block rounded-lg border border-border bg-surface px-3 py-2 font-mono text-primary truncate">/{scholar.handle} · {scholar.orcid}</code>
              </div>
              <div>
                <span className="vk-text-2xs text-muted-foreground block mb-1">Tema & Keybindings</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 vk-text-2xs gap-1" onClick={() => setThemeLabel((t) => (t === "Obsidian Dark" ? "Calm Daylight" : "Obsidian Dark"))}>
                    <Palette className="h-3.5 w-3.5" /> {themeLabel}
                  </Button>
                  <Badge variant="secondary" className="vk-text-2xs gap-1"><Keyboard className="h-3 w-3" /> Cmd+K</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="vk-text-2xs text-muted-foreground">Bio Publik</span>
              <div className="flex items-center gap-2">
                <Input value={draftBio} onChange={(e) => setDraftBio(e.target.value)} className="h-8 vk-text-xs bg-surface" />
                <Button size="sm" className="h-8 px-3 vk-text-2xs" onClick={() => { onSaveBio(draftBio); toast.success("Pengaturan akun global disimpan."); }}>
                  Simpan
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="vk-text-sm font-semibold inline-flex items-center gap-1.5"><Bot className="h-4 w-4 text-primary" /> Native BYO-AI & Local AI</span>
              <Badge variant="info" className="vk-text-2xs">Phase Preview · Local RAG</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: "ollama", label: "Ollama Local", sub: "localhost:11434" },
                  { id: "webllm", label: "WebLLM WebGPU", sub: "100% Browser" },
                  { id: "byok", label: "BYOK API Key", sub: "Zero Lock-in" },
                ] as const
              ).map((p) => (
                <button key={p.id} type="button" onClick={() => setAiProvider(p.id)} className={cn("rounded-xl border p-2.5 text-left transition-colors", aiProvider === p.id ? "border-primary bg-primary/10" : "border-border bg-surface")}>
                  <p className="vk-text-xs font-semibold inline-flex items-center gap-1"><Cpu className="h-3.5 w-3.5 text-primary" /> {p.label}</p>
                  <p className="vk-text-2xs text-muted-foreground">{p.sub}</p>
                </button>
              ))}
            </div>
            <p className="vk-text-2xs text-muted-foreground inline-flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-success shrink-0" />
              Penyimpanan Lokal: File System Access API & IndexedDB aktif (gratis selamanya).
            </p>
          </section>
        </div>
      )}
    </div>
  );

  if (mode === "full_page") {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            {onBackOrClose && (
              <Button variant="outline" size="sm" className="h-8 rounded-full gap-1.5 vk-text-xs" onClick={onBackOrClose}>
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </Button>
            )}
            <div>
              <h1 className="vk-text-lg font-bold tracking-tight">Settings Hub</h1>
              <p className="vk-text-2xs text-muted-foreground">Complete Full Page · App & Vault Governance</p>
            </div>
          </div>
          <Badge variant="info" className="vk-text-2xs">Full Page Mode</Badge>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-start">{navRail}{sectionBody}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate vk-text-sm font-semibold">Settings Hub (Workspace Tab)</h1>
            <p className="truncate vk-text-2xs text-muted-foreground">Single Adaptive Hub · `.app/config.json`</p>
          </div>
        </div>
        {onBackOrClose && <Button variant="outline" size="sm" className="h-7 vk-text-xs shrink-0" onClick={onBackOrClose}>Tutup Tab</Button>}
      </header>
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 pb-20 flex flex-col lg:flex-row gap-5 items-start">
          {navRail}
          {sectionBody}
        </div>
      </ScrollArea>
    </div>
  );
};
