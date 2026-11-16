/**
 * Offline configuration storage — IndexedDB with a localStorage fallback.
 * Documents are keyed by scope key ("user" or "vault:<id>").
 */

import { isConfigDocument, type ConfigDocument } from '@/domains/settings/shared/utils/config.types';
import {
  LEGACY_OBMAP_KEYS,
  VK_STORAGE_KEYS,
  readLegacyIdbConfigRecord,
  readMigratedLocalStorageItem,
  removeBothLocalStorageKeys,
  writeCanonicalLocalStorageItem,
} from '@/global/utils/storageKeyMigrator';

const DB_NAME = VK_STORAGE_KEYS.IDB_CONFIG_DB;
const DB_VERSION = 1;
const STORE = 'config';
const LS_PREFIX = VK_STORAGE_KEYS.LS_CONFIG_PREFIX;

function lsKey(key: string) {
  return `${LS_PREFIX}${key}`;
}

function legacyLsKey(key: string) {
  return `${LEGACY_OBMAP_KEYS.LS_CONFIG_PREFIX}${key}`;
}

export class LocalConfigStore {
  private db: IDBDatabase | null = null;
  private opening: Promise<IDBDatabase | null> | null = null;

  private open(): Promise<IDBDatabase | null> {
    if (this.db) return Promise.resolve(this.db);
    if (this.opening) return this.opening;
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);

    this.opening = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        };
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.opening;
  }

  async get(key: string): Promise<ConfigDocument | null> {
    const db = await this.open();
    if (db) {
      const fromIdb = await new Promise<unknown>((resolve) => {
        try {
          const tx = db.transaction([STORE], 'readonly');
          const req = tx.objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
      if (isConfigDocument(fromIdb)) return fromIdb;

      const legacyIdb = await readLegacyIdbConfigRecord(STORE, key);
      if (isConfigDocument(legacyIdb)) {
        await this.set(key, legacyIdb);
        return legacyIdb;
      }
    }

    try {
      const raw = readMigratedLocalStorageItem(lsKey(key), legacyLsKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isConfigDocument(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async set(key: string, doc: ConfigDocument): Promise<void> {
    const db = await this.open();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction([STORE], 'readwrite');
          const req = tx.objectStore(STORE).put(doc, key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }

    writeCanonicalLocalStorageItem(lsKey(key), JSON.stringify(doc));
  }

  async remove(key: string): Promise<void> {
    const db = await this.open();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction([STORE], 'readwrite');
          const req = tx.objectStore(STORE).delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
    removeBothLocalStorageKeys(lsKey(key), legacyLsKey(key));
  }
}

export const localConfigStore = new LocalConfigStore();
