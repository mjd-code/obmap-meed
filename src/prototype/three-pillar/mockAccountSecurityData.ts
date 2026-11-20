import type {
  PrototypeApiToken,
  PrototypeSessionItem,
  PrototypeSocialLink,
} from "./settingsTypes";

export const INITIAL_SOCIAL_LINKS: PrototypeSocialLink[] = [
  {
    id: "soc-1",
    platform: "github",
    label: "GitHub Lab",
    url: "https://github.com/aras-wicaksono",
  },
  {
    id: "soc-2",
    platform: "scholar",
    label: "Google Scholar",
    url: "https://scholar.google.com/citations?user=aras-itb",
  },
  {
    id: "soc-3",
    platform: "x",
    label: "X / Twitter",
    url: "https://x.com/araswicaksono",
  },
  {
    id: "soc-4",
    platform: "website",
    label: "Lab Epistemologi ITB",
    url: "https://epistemologi.itb.ac.id",
  },
];

export const INITIAL_PERSONAL_ACCESS_TOKENS: PrototypeApiToken[] = [
  {
    id: "pat-1",
    name: "CLI Sync & Local Ollama Bridge",
    prefix: "obm_live_9f4a...c81e",
    scopes: ["vault:read", "vault:write", "config:validate"],
    createdAt: "12 Okt 2026",
    lastUsed: "18 mnt lalu",
  },
  {
    id: "pat-2",
    name: "CI Citation Verifier (@app/sdk)",
    prefix: "obm_live_3b12...7a04",
    scopes: ["vault:read", "vcs:snapshot"],
    createdAt: "02 Nov 2026",
    lastUsed: "Kemarin",
  },
  {
    id: "pat-3",
    name: "Obsidian Mirror Exporter",
    prefix: "obm_live_7d91...e25c",
    scopes: ["vault:export"],
    createdAt: "15 Nov 2026",
    lastUsed: "3 hari lalu",
  },
];

export const INITIAL_ACTIVE_SESSIONS: PrototypeSessionItem[] = [
  {
    id: "sess-1",
    device: "ThinkPad X1 Carbon · Windows 11",
    browser: "Chrome 131.0",
    location: "Bandung, ID",
    ip: "103.24.56.18",
    lastActive: "Aktif sekarang",
    isCurrent: true,
  },
  {
    id: "sess-2",
    device: "MacBook Pro M3 · macOS 15",
    browser: "Firefox 132.0",
    location: "Bandung, ID",
    ip: "103.24.56.92",
    lastActive: "2 jam lalu",
    isCurrent: false,
  },
  {
    id: "sess-3",
    device: "iPad Pro · iPadOS 18",
    browser: "Safari Mobile",
    location: "Jakarta, ID",
    ip: "180.252.14.77",
    lastActive: "Kemarin · 21:14",
    isCurrent: false,
  },
  {
    id: "sess-4",
    device: "Lab Workstation · Ubuntu 24.04",
    browser: "Chromium 130.0",
    location: "ITB Ganesha, ID",
    ip: "167.205.22.41",
    lastActive: "3 hari lalu",
    isCurrent: false,
  },
];
