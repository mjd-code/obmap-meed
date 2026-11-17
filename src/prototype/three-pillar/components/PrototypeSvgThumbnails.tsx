import React from "react";
import { cn } from "@/global/utils";
import type { SvgPreviewKind } from "../types";

interface PrototypeSvgThumbnailProps {
  kind: SvgPreviewKind;
  className?: string;
  compact?: boolean;
}

export const PrototypeSvgThumbnail: React.FC<PrototypeSvgThumbnailProps> = ({
  kind,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border/70 bg-elevated/70 select-none",
        compact ? "h-32" : "h-44",
        className
      )}
    >
      <svg
        viewBox="0 0 320 160"
        className="w-full h-full"
        role="img"
        aria-label={`Diagram visual ${kind}`}
      >
        <defs>
          <pattern id={`grid-${kind}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="hsl(var(--muted-foreground) / 0.22)" />
          </pattern>
        </defs>
        <rect width="320" height="160" fill={`url(#grid-${kind})`} />

        {kind === "mindmap" && (
          <g strokeWidth="1.8" fill="none">
            <path d="M160 80 C 125 80, 115 40, 72 40" stroke="hsl(var(--primary) / 0.7)" />
            <path d="M160 80 C 125 80, 115 120, 72 120" stroke="hsl(var(--info) / 0.7)" />
            <path d="M160 80 C 195 80, 205 38, 248 38" stroke="hsl(var(--success) / 0.7)" />
            <path d="M160 80 C 195 80, 205 122, 248 122" stroke="hsl(var(--warning) / 0.7)" />
            <rect x="122" y="65" width="76" height="30" rx="15" fill="hsl(var(--primary))" />
            <text x="160" y="84" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="10" fontWeight="600">
              Inti Topik
            </text>
            <rect x="24" y="28" width="60" height="24" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary))" />
            <text x="54" y="43" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Atomic MD</text>
            <rect x="24" y="108" width="60" height="24" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--info))" />
            <text x="54" y="123" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Wikilinks</text>
            <rect x="236" y="26" width="62" height="24" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--success))" />
            <text x="267" y="41" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Evergreen</text>
            <rect x="236" y="110" width="62" height="24" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--warning))" />
            <text x="267" y="125" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">YAML Meta</text>
          </g>
        )}

        {kind === "argument-map" && (
          <g strokeWidth="1.6" fill="none">
            <path d="M160 44 L95 86 M160 44 L225 86 M95 110 L160 132 M225 110 L160 132" stroke="hsl(var(--muted-foreground) / 0.55)" />
            <rect x="108" y="18" width="104" height="26" rx="6" fill="hsl(var(--primary) / 0.18)" stroke="hsl(var(--primary))" />
            <text x="160" y="34" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontWeight="600">Claim Utama</text>
            <rect x="44" y="84" width="94" height="24" rx="6" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" />
            <text x="91" y="99" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Bukti Empiris (+)</text>
            <rect x="182" y="84" width="94" height="24" rx="6" fill="hsl(var(--danger) / 0.15)" stroke="hsl(var(--danger))" />
            <text x="229" y="99" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Sanggahan (-)</text>
            <rect x="106" y="126" width="108" height="22" rx="11" fill="hsl(var(--info) / 0.18)" stroke="hsl(var(--info))" />
            <text x="160" y="140" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8">Sintesis Akhir</text>
          </g>
        )}

        {kind === "skill-tree" && (
          <g strokeWidth="2" fill="none">
            <path d="M52 80 L118 46 L192 80 L264 48" stroke="hsl(var(--success) / 0.8)" />
            <path d="M118 46 L192 116 L264 116" stroke="hsl(var(--border))" strokeDasharray="4 3" />
            <circle cx="52" cy="80" r="16" fill="hsl(var(--success) / 0.22)" stroke="hsl(var(--success))" />
            <text x="52" y="83" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="600">M1 ✓</text>
            <circle cx="118" cy="46" r="16" fill="hsl(var(--success) / 0.22)" stroke="hsl(var(--success))" />
            <text x="118" y="49" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="600">M2 ✓</text>
            <circle cx="192" cy="80" r="17" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" />
            <text x="192" y="83" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="700">M3 ✨</text>
            <circle cx="264" cy="48" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
            <text x="264" y="51" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">M4 🔒</text>
            <circle cx="192" cy="120" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
            <text x="192" y="123" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">M5 🔒</text>
            <circle cx="264" cy="116" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
            <text x="264" y="119" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">Quiz</text>
          </g>
        )}

        {kind === "fishbone" && (
          <g strokeWidth="1.8" fill="none">
            <line x1="42" y1="80" x2="236" y2="80" stroke="hsl(var(--primary))" />
            <line x1="90" y1="80" x2="64" y2="34" stroke="hsl(var(--info))" />
            <line x1="156" y1="80" x2="130" y2="34" stroke="hsl(var(--warning))" />
            <line x1="112" y1="80" x2="86" y2="126" stroke="hsl(var(--success))" />
            <line x1="184" y1="80" x2="158" y2="126" stroke="hsl(var(--danger))" />
            <rect x="236" y="64" width="64" height="32" rx="6" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
            <text x="268" y="83" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontWeight="600">Akar Masalah</text>
            <text x="64" y="27" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">Arsitektur</text>
            <text x="130" y="27" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">Proses</text>
            <text x="86" y="140" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">Manusia</text>
            <text x="158" y="140" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">Tata Kelola</text>
          </g>
        )}

        {kind === "constellation" && (
          <g strokeWidth="1.2" fill="none">
            <path d="M68 48 L142 36 L174 88 L104 114 Z M174 88 L252 54 L236 120 L174 88" stroke="hsl(var(--primary) / 0.55)" />
            <circle cx="68" cy="48" r="7" fill="hsl(var(--info))" />
            <circle cx="142" cy="36" r="9" fill="hsl(var(--primary))" />
            <circle cx="174" cy="88" r="12" fill="hsl(var(--accent))" />
            <circle cx="104" cy="114" r="7" fill="hsl(var(--success))" />
            <circle cx="252" cy="54" r="8" fill="hsl(var(--warning))" />
            <circle cx="236" cy="120" r="6" fill="hsl(var(--primary) / 0.8)" />
            <text x="174" y="109" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="600">Hub Sitasi</text>
          </g>
        )}
      </svg>
    </div>
  );
};
