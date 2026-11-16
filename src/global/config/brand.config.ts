/**
 * Single Source of Truth for product brand identity & dynamic/white-label overrides (ADR-0013).
 * Decouples UI/SEO/PWA branding from brand-agnostic technical storage (`vk-*`).
 */

import { create } from 'zustand';

export interface BrandAssets {
  logoSvg: string;
  faviconIco: string;
  appleTouchIcon: string;
  ogImage: string;
}

export interface BrandManifest {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  tagline: string;
  description: string;
  domain: string;
  canonicalOrigin: string;
  sdkPackageName: string;
  inviteCodePrefix: string;
  vaultConfigDir: string;
  legacyVaultConfigDir: string;
  storagePrefix: string;
  themeColor: string;
  assets: BrandAssets;
}

export const DEFAULT_BRAND_MANIFEST: BrandManifest = {
  id: 'sidra',
  name: 'Sidra',
  shortName: 'Sidra',
  slug: 'sidra',
  tagline: 'Knowledge Graph & Living Workspace',
  description:
    'Local-first visual knowledge management system, collaborative research workspace, and high-signal social knowledge graph.',
  domain: 'sidra.app',
  canonicalOrigin: 'https://sidra.app',
  sdkPackageName: '@sidra/sdk',
  inviteCodePrefix: 'SIDRA',
  vaultConfigDir: '.vk',
  legacyVaultConfigDir: '.obmap',
  storagePrefix: 'vk',
  themeColor: '#7c3aed',
  assets: {
    logoSvg: '/safari-pinned-tab.svg',
    faviconIco: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
    ogImage: '/og-image.png',
  },
};

function sanitizeSlug(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || DEFAULT_BRAND_MANIFEST.slug;
}

function readRuntimeEnv(): Record<string, string | undefined> {
  const metaEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const procEnv =
    typeof process !== 'undefined' && process?.env
      ? (process.env as Record<string, string | undefined>)
      : undefined;
  return { ...(procEnv ?? {}), ...(metaEnv ?? {}) };
}

/**
 * Resolves the static + environment-overridden brand manifest (`VITE_BRAND_*`).
 */
export function resolveEnvBrandManifest(
  env: Record<string, string | undefined> = readRuntimeEnv(),
): BrandManifest {
  const name = env.VITE_BRAND_NAME?.trim() || DEFAULT_BRAND_MANIFEST.name;
  const shortName = env.VITE_BRAND_SHORT_NAME?.trim() || name;
  const slug = env.VITE_BRAND_SLUG?.trim()
    ? sanitizeSlug(env.VITE_BRAND_SLUG)
    : sanitizeSlug(name);
  const domain = env.VITE_BRAND_DOMAIN?.trim() || `${slug}.app`;
  const canonicalOrigin =
    env.VITE_BRAND_CANONICAL_ORIGIN?.trim() ||
    (domain.startsWith('http') ? domain : `https://${domain}`);
  const tagline = env.VITE_BRAND_TAGLINE?.trim() || DEFAULT_BRAND_MANIFEST.tagline;
  const description =
    env.VITE_BRAND_DESCRIPTION?.trim() || DEFAULT_BRAND_MANIFEST.description;
  const inviteCodePrefix =
    env.VITE_BRAND_INVITE_PREFIX?.trim().toUpperCase() ||
    slug.replace(/[^a-z0-9]/gi, '').toUpperCase() ||
    DEFAULT_BRAND_MANIFEST.inviteCodePrefix;
  const themeColor =
    env.VITE_BRAND_THEME_COLOR?.trim() || DEFAULT_BRAND_MANIFEST.themeColor;

  return {
    ...DEFAULT_BRAND_MANIFEST,
    id: slug,
    name,
    shortName,
    slug,
    tagline,
    description,
    domain,
    canonicalOrigin: canonicalOrigin.endsWith('/')
      ? canonicalOrigin.slice(0, -1)
      : canonicalOrigin,
    sdkPackageName: env.VITE_BRAND_SDK_PACKAGE?.trim() || `@${slug}/sdk`,
    inviteCodePrefix,
    themeColor,
  };
}

function mergeBrandManifest(
  base: BrandManifest,
  override?: Partial<BrandManifest> | null,
): BrandManifest {
  if (!override) return base;
  const nextName = override.name?.trim() || base.name;
  const nextSlug = override.slug?.trim()
    ? sanitizeSlug(override.slug)
    : override.name?.trim()
      ? sanitizeSlug(nextName)
      : base.slug;
  const nextDomain = override.domain?.trim() || base.domain;
  const nextOrigin =
    override.canonicalOrigin?.trim() ||
    (override.domain?.trim() ? `https://${nextDomain}` : base.canonicalOrigin);

  return {
    ...base,
    ...override,
    id: override.id?.trim() || nextSlug,
    name: nextName,
    shortName: override.shortName?.trim() || nextName,
    slug: nextSlug,
    domain: nextDomain,
    canonicalOrigin: nextOrigin.endsWith('/') ? nextOrigin.slice(0, -1) : nextOrigin,
    sdkPackageName: override.sdkPackageName?.trim() || `@${nextSlug}/sdk`,
    inviteCodePrefix:
      override.inviteCodePrefix?.trim().toUpperCase() ||
      (override.slug?.trim() || override.name?.trim()
        ? nextSlug.replace(/[^a-z0-9]/gi, '').toUpperCase()
        : base.inviteCodePrefix),
    assets: {
      ...base.assets,
      ...(override.assets ?? {}),
    },
  };
}

interface BrandStoreState {
  baseManifest: BrandManifest;
  runtimeOverride: Partial<BrandManifest> | null;
  manifest: BrandManifest;
  setRuntimeOverride: (override: Partial<BrandManifest> | null) => void;
}

const initialBaseManifest = resolveEnvBrandManifest();

export const useBrandStore = create<BrandStoreState>((set) => ({
  baseManifest: initialBaseManifest,
  runtimeOverride: null,
  manifest: initialBaseManifest,
  setRuntimeOverride: (override) =>
    set((state) => {
      const nextManifest = mergeBrandManifest(state.baseManifest, override);
      syncBrandToDocumentMeta(nextManifest);
      return {
        runtimeOverride: override,
        manifest: nextManifest,
      };
    }),
}));

/** React hook returning the active resolved brand manifest (static + env + runtime white-label). */
export function useBrandConfig(): BrandManifest {
  return useBrandStore((state) => state.manifest);
}

/** Non-React synchronous accessor for services, stores, and utility modules. */
export function getBrandConfig(): BrandManifest {
  return useBrandStore.getState().manifest;
}

/** Updates or clears (`null`) the runtime/white-label brand override and syncs document meta. */
export function setRuntimeBrandOverride(
  override: Partial<BrandManifest> | null,
): void {
  useBrandStore.getState().setRuntimeOverride(override);
}

/** Projects the active brand manifest onto document title and standard SEO/PWA meta tags. */
export function syncBrandToDocumentMeta(
  brand: BrandManifest = getBrandConfig(),
): void {
  const doc = (globalThis as typeof globalThis & {
    document?: {
      title: string;
      querySelector: (selector: string) => { setAttribute: (name: string, value: string) => void } | null;
    };
  }).document;
  if (!doc) return;
  const fullTitle = `${brand.name} - ${brand.tagline}`;
  doc.title = fullTitle;

  const setMetaContent = (selector: string, content: string) => {
    const el = doc.querySelector(selector);
    if (el) el.setAttribute('content', content);
  };

  setMetaContent('meta[name="title"]', fullTitle);
  setMetaContent('meta[name="description"]', brand.description);
  setMetaContent('meta[name="apple-mobile-web-app-title"]', brand.shortName);
  setMetaContent('meta[name="application-name"]', brand.shortName);
  setMetaContent('meta[property="og:title"]', fullTitle);
  setMetaContent('meta[property="og:site_name"]', brand.name);
  setMetaContent('meta[property="og:description"]', brand.description);
  setMetaContent('meta[name="twitter:title"]', fullTitle);
  setMetaContent('meta[name="twitter:description"]', brand.description);
}
