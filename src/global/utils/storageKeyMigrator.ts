/**
 * Brand-Agnostic Storage Key Migrator (ADR-0013).
 *
 * All persistence uses neutral `vk-*` / `VkConfigDB` identifiers while
 * transparently reading and migrating legacy `obmap-*` / `ObmapConfigDB`
 * records without losing existing user data.
 */

import type { StateStorage } from 'zustand/middleware';

export const VK_STORAGE_KEYS = {
  IDB_CONFIG_DB: 'VkConfigDB',
  LS_CONFIG_PREFIX: 'vk-config:',
  LS_DEVICE_ID: 'vk-device-id',
  LS_VAULT_SCHEMA: 'vk-vault-schema',
  LS_ACTIVE_VAULT_ID: 'vk.activeVaultId',
  LS_GRAPH_TEMPLATES: 'vk-graph-templates',
  LS_RELEASE_STAGE_OVERRIDE: 'vk_release_stage_override',
  CSS_THEMED_ROOT_CLASS: 'vk-themed-root',
  SCOPED_CSS_STYLE_ID: 'vk-custom-css-snippet',
} as const;

export const LEGACY_OBMAP_KEYS = {
  IDB_CONFIG_DB: 'ObmapConfigDB',
  LS_CONFIG_PREFIX: 'obmap-config:',
  LS_DEVICE_ID: 'obmap-device-id',
  LS_VAULT_SCHEMA: 'obmap-vault-schema',
  LS_ACTIVE_VAULT_ID: 'obmap.activeVaultId',
  LS_GRAPH_TEMPLATES: 'obmap-graph-templates',
  LS_RELEASE_STAGE_OVERRIDE: 'obmap_release_stage_override',
  CSS_THEMED_ROOT_CLASS: 'obmap-themed-root',
  SCOPED_CSS_STYLE_ID: 'obmap-custom-css-snippet',
} as const;

/**
 * Reads from `canonicalKey`; if absent, falls back to `legacyKey` and promotes
 * the value to `canonicalKey` without destroying the legacy key.
 */
export function readMigratedLocalStorageItem(
  canonicalKey: string,
  legacyKey: string,
): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const canonical = localStorage.getItem(canonicalKey);
    if (canonical !== null) return canonical;

    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      try {
        localStorage.setItem(canonicalKey, legacy);
      } catch {
        /* ignore quota errors during opportunistic promotion */
      }
      return legacy;
    }
  } catch {
    return null;
  }
  return null;
}

/** Writes safely to the canonical `vk-*` localStorage key. */
export function writeCanonicalLocalStorageItem(
  canonicalKey: string,
  value: string,
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(canonicalKey, value);
  } catch {
    /* ignore storage quota or private-mode errors */
  }
}

/** Removes both canonical and legacy localStorage keys cleanly. */
export function removeBothLocalStorageKeys(
  canonicalKey: string,
  legacyKey: string,
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(canonicalKey);
    localStorage.removeItem(legacyKey);
  } catch {
    /* ignore private-mode errors */
  }
}

/**
 * Zustand `persist` StateStorage adapter that transparently migrates from
 * `legacyKey` into `canonicalKey` on first read.
 */
export function createMigratingStateStorage(
  canonicalKey: string,
  legacyKey: string,
): StateStorage {
  return {
    getItem: (name: string) => {
      const targetCanonical = name || canonicalKey;
      return readMigratedLocalStorageItem(targetCanonical, legacyKey);
    },
    setItem: (name: string, value: string) => {
      writeCanonicalLocalStorageItem(name || canonicalKey, value);
    },
    removeItem: (name: string) => {
      removeBothLocalStorageKeys(name || canonicalKey, legacyKey);
    },
  };
}

/**
 * Best-effort reader for legacy `ObmapConfigDB` IndexedDB records so existing
 * local user settings migrate seamlessly into `VkConfigDB`.
 */
export async function readLegacyIdbConfigRecord(
  storeName: string,
  key: string,
): Promise<unknown> {
  if (typeof indexedDB === 'undefined') return null;

  if (typeof indexedDB.databases === 'function') {
    try {
      const dbs = await indexedDB.databases();
      const hasLegacyDb = dbs.some((d) => d.name === LEGACY_OBMAP_KEYS.IDB_CONFIG_DB);
      if (!hasLegacyDb) return null;
    } catch {
      /* continue to open fallback */
    }
  }

  return new Promise<unknown>((resolve) => {
    try {
      const request = indexedDB.open(LEGACY_OBMAP_KEYS.IDB_CONFIG_DB, 1);
      request.onupgradeneeded = () => {
        try {
          request.transaction?.abort();
        } catch {
          /* ignore */
        }
        resolve(null);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction([storeName], 'readonly');
          const req = tx.objectStore(storeName).get(key);
          req.onsuccess = () => {
            const result = req.result ?? null;
            db.close();
            resolve(result);
          };
          req.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
