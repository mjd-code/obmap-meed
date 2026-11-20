import React, { useMemo, useState } from "react";
import { CheckSquare, Globe, Lock, Search, Square, Unlock } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import type { PublishNoteRecord, PublishVaultRecord } from "../usePublishManagerState";

interface EditorPublishNoteMatrixProps {
  vault: PublishVaultRecord;
  notes: PublishNoteRecord[];
  onToggleNotePublish: (noteId: string) => void;
  onBulkNotePublish: (noteIds: string[], publish: boolean) => void;
  onToggleNotePrivate: (noteId: string) => void;
}

type NoteFilter = "all" | "published" | "unpublished" | "private";

export const EditorPublishNoteMatrix: React.FC<EditorPublishNoteMatrixProps> = ({
  vault,
  notes,
  onToggleNotePublish,
  onBulkNotePublish,
  onToggleNotePrivate,
}) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter === "published" && (!n.isPublished || n.isYamlPrivate)) return false;
      if (filter === "unpublished" && (n.isPublished || n.isYamlPrivate)) return false;
      if (filter === "private" && !n.isYamlPrivate) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.folder.toLowerCase().includes(q);
    });
  }, [filter, notes, query]);

  const visibleIds = filteredNotes.map((n) => n.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const counts = {
    all: notes.length,
    published: notes.filter((n) => n.isPublished && !n.isYamlPrivate).length,
    unpublished: notes.filter((n) => !n.isPublished && !n.isYamlPrivate).length,
    private: notes.filter((n) => n.isYamlPrivate).length,
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="vk-text-sm font-semibold">
            Kontrol Catatan: <span className="text-primary">{vault.title}</span>
          </h2>
          <p className="vk-text-2xs text-muted-foreground">
            Publish / Unpublish per catatan atau bulk. Catatan Private 🔒 tetap dikecualikan.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs" onClick={() => onBulkNotePublish(notes.map((n) => n.id), true)} disabled={notes.length === 0}>
            Publish Semua
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs" onClick={() => onBulkNotePublish(notes.map((n) => n.id), false)} disabled={notes.length === 0}>
            Unpublish Semua
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: `Semua (${counts.all})` },
              { id: "published", label: `Published (${counts.published})` },
              { id: "unpublished", label: `Draft (${counts.unpublished})` },
              { id: "private", label: `Private (${counts.private})` },
            ] as { id: NoteFilter; label: string }[]
          ).map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cn("px-2.5 py-1 rounded-full vk-text-2xs font-medium whitespace-nowrap border transition-colors", filter === f.id ? "bg-primary/15 text-primary border-primary/40" : "bg-surface text-muted-foreground border-border hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari catatan..." className="h-8 pl-8 vk-text-xs bg-surface" />
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2">
        <button type="button" onClick={toggleSelectAll} className="inline-flex items-center gap-2 vk-text-xs font-medium text-foreground hover:text-primary">
          {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
          <span>{allVisibleSelected ? "Batal Pilih Semua" : `Pilih Semua (${filteredNotes.length})`}</span>
        </button>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkNotePublish(selectedIds, true); setSelectedIds([]); }}>
              Bulk Publish ({selectedIds.length})
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkNotePublish(selectedIds, false); setSelectedIds([]); }}>
              Bulk Unpublish ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Note List Rows */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/50 overflow-hidden">
        {filteredNotes.length === 0 ? (
          <p className="p-6 text-center vk-text-xs text-muted-foreground">
            Tidak ada catatan pada filter ini.
          </p>
        ) : (
          filteredNotes.map((note) => {
            const checked = selectedIds.includes(note.id);
            return (
              <div
                key={note.id}
                className="px-3 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 hover:bg-surface/60 transition-colors min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(note.id)}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                    aria-label={`Pilih ${note.title}`}
                  >
                    {checked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0">
                    <p className="vk-text-xs font-medium truncate">{note.title}.md</p>
                    <p className="vk-text-2xs text-muted-foreground truncate">
                      {note.folder} · /{vault.slug}/{note.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {note.isYamlPrivate ? (
                    <Badge variant="warning" className="vk-text-2xs gap-1">
                      <Lock className="h-3 w-3" /> Private
                    </Badge>
                  ) : note.isPublished ? (
                    <Badge variant="success" className="vk-text-2xs gap-1">
                      <Globe className="h-3 w-3" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="vk-text-2xs">Draft</Badge>
                  )}

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    title={note.isYamlPrivate ? "Buka kunci private" : "Kunci visibility: private"}
                    onClick={() => onToggleNotePrivate(note.id)}
                    className={cn(note.isYamlPrivate && "text-warning")}
                  >
                    {note.isYamlPrivate ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant={note.isPublished ? "outline" : "default"}
                    className="h-7 px-2.5 vk-text-2xs"
                    onClick={() => onToggleNotePublish(note.id)}
                  >
                    {note.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
