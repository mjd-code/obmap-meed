import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_BRAND_MANIFEST,
  getBrandConfig,
  resolveEnvBrandManifest,
  setRuntimeBrandOverride,
} from '@/global/config/brand.config';
import {
  LEGACY_OBMAP_KEYS,
  VK_STORAGE_KEYS,
  createMigratingStateStorage,
  readMigratedLocalStorageItem,
} from '@/global/utils/storageKeyMigrator';
import { configExportFileName } from '@/domains/settings/shared/api/VaultConfigFile';
import {
  applyThemeToDOM,
  defaultTheme,
  sanitizeScopedCssSnippet,
} from '@/domains/settings/shared/stores/useThemeStore';
import { resolveSemanticCanvasTokens } from '@/domains/graph/shared/utils/theme';
import { resolveSkeletonPreset } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import {
  buildUpdatedBrandConfigSource,
  isProtectedRebrandPath,
} from '../../../../scripts/rebrand';

describe('BRAND-STEP-01 (ADR-0013): Dynamic Branding, Storage Migrator & Auto-Rebrand CLI', () => {
  beforeEach(() => {
    localStorage.clear();
    setRuntimeBrandOverride(null);
    document.documentElement.classList.remove(
      VK_STORAGE_KEYS.CSS_THEMED_ROOT_CLASS,
      LEGACY_OBMAP_KEYS.CSS_THEMED_ROOT_CLASS,
    );
  });

  afterEach(() => {
    setRuntimeBrandOverride(null);
    localStorage.clear();
  });

  it('defaults to Sidra brand manifest and updates dynamically at runtime and via env', () => {
    expect(DEFAULT_BRAND_MANIFEST.name).toBe('Sidra');
    expect(DEFAULT_BRAND_MANIFEST.slug).toBe('sidra');
    expect(DEFAULT_BRAND_MANIFEST.inviteCodePrefix).toBe('SIDRA');
    expect(getBrandConfig().name).toBe('Sidra');
    expect(configExportFileName()).toMatch(/^sidra-config-\d{4}-\d{2}-\d{2}\.json$/);

    const envManifest = resolveEnvBrandManifest({
      VITE_BRAND_NAME: 'Noema',
      VITE_BRAND_DOMAIN: 'noema.so',
    });
    expect(envManifest.name).toBe('Noema');
    expect(envManifest.slug).toBe('noema');
    expect(envManifest.sdkPackageName).toBe('@noema/sdk');
    expect(envManifest.canonicalOrigin).toBe('https://noema.so');

    setRuntimeBrandOverride({
      name: 'Karta',
      slug: 'karta',
      inviteCodePrefix: 'KARTA',
    });
    expect(getBrandConfig().name).toBe('Karta');
    expect(getBrandConfig().inviteCodePrefix).toBe('KARTA');
    expect(document.title).toContain('Karta');
    expect(configExportFileName()).toMatch(/^karta-config-\d{4}-\d{2}-\d{2}\.json$/);
    expect(resolveSkeletonPreset('vk-midnight').label).toBe('Karta Midnight');

    setRuntimeBrandOverride(null);
    expect(getBrandConfig().name).toBe('Sidra');
    expect(resolveSkeletonPreset('obmap-midnight').label).toBe('Sidra Midnight');
  });

  it('migrates legacy obmap-* localStorage keys cleanly into neutral vk-* keys without data loss', () => {
    localStorage.setItem(LEGACY_OBMAP_KEYS.LS_ACTIVE_VAULT_ID, 'vault-legacy-42');
    const restored = readMigratedLocalStorageItem(
      VK_STORAGE_KEYS.LS_ACTIVE_VAULT_ID,
      LEGACY_OBMAP_KEYS.LS_ACTIVE_VAULT_ID,
    );

    expect(restored).toBe('vault-legacy-42');
    expect(localStorage.getItem(VK_STORAGE_KEYS.LS_ACTIVE_VAULT_ID)).toBe('vault-legacy-42');

    localStorage.setItem(
      LEGACY_OBMAP_KEYS.LS_VAULT_SCHEMA,
      JSON.stringify({ state: { schema: { strict: true } }, version: 0 }),
    );
    const zustandStorage = createMigratingStateStorage(
      VK_STORAGE_KEYS.LS_VAULT_SCHEMA,
      LEGACY_OBMAP_KEYS.LS_VAULT_SCHEMA,
    );
    const persisted = zustandStorage.getItem(VK_STORAGE_KEYS.LS_VAULT_SCHEMA);
    expect(persisted).toContain('strict');
    expect(localStorage.getItem(VK_STORAGE_KEYS.LS_VAULT_SCHEMA)).toBe(persisted);
  });

  it('applies both neutral .vk-themed-root and legacy .obmap-themed-root CSS scopes and --vk-* tokens', () => {
    applyThemeToDOM(defaultTheme);
    const root = document.documentElement;
    expect(root.classList.contains(VK_STORAGE_KEYS.CSS_THEMED_ROOT_CLASS)).toBe(true);
    expect(root.classList.contains(LEGACY_OBMAP_KEYS.CSS_THEMED_ROOT_CLASS)).toBe(true);
    expect(root.style.getPropertyValue('--vk-bg-canvas')).toBe(
      `hsl(${defaultTheme.colors.canvasBackground})`,
    );
    expect(root.style.getPropertyValue('--vk-accent')).toBe(
      `hsl(${defaultTheme.colors.accent})`,
    );
    expect(root.style.getPropertyValue('--vk-node-folder')).toBe(
      `hsl(${defaultTheme.colors.folderNodeColor})`,
    );

    const tokens = resolveSemanticCanvasTokens();
    expect(tokens.bgCanvas).toBeTruthy();
    expect(tokens.accent).toBeTruthy();

    const scoped = sanitizeScopedCssSnippet('.badge { padding: 4px; }');
    expect(scoped.sanitizedCss).toContain('.vk-themed-root .badge');
    expect(scoped.sanitizedCss).toContain('.obmap-themed-root .badge');
  });

  it('protects immutable migration/archive paths and updates brand.config source safely in rebrand CLI', () => {
    expect(
      isProtectedRebrandPath('supabase/migrations/20261114000000_v4_1.sql'),
    ).toBe(true);
    expect(isProtectedRebrandPath('docs/00-meta/00-1-quovadis.md')).toBe(true);
    expect(isProtectedRebrandPath('docs/_machine/changelog.jsonl')).toBe(true);
    expect(isProtectedRebrandPath('src/global/utils/storageKeyMigrator.ts')).toBe(true);
    expect(isProtectedRebrandPath('src/global/config/brand.config.ts')).toBe(false);

    const sample = [
      "  id: 'sidra',",
      "  name: 'Sidra',",
      "  shortName: 'Sidra',",
      "  slug: 'sidra',",
      "  domain: 'sidra.app',",
      "  canonicalOrigin: 'https://sidra.app',",
      "  sdkPackageName: '@sidra/sdk',",
      "  inviteCodePrefix: 'SIDRA',",
    ].join('\n');

    const updated = buildUpdatedBrandConfigSource(sample, {
      name: 'Noema',
      shortName: 'Noema',
      slug: 'noema',
      domain: 'noema.so',
      invitePrefix: 'NOEMA',
      dryRun: true,
    });

    expect(updated).toContain("name: 'Noema'");
    expect(updated).toContain("slug: 'noema'");
    expect(updated).toContain("domain: 'noema.so'");
    expect(updated).toContain("canonicalOrigin: 'https://noema.so'");
    expect(updated).toContain("sdkPackageName: '@noema/sdk'");
    expect(updated).toContain("inviteCodePrefix: 'NOEMA'");
  });
});
