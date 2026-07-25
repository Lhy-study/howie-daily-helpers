import { IStorage } from "./IStorage";
import { LocalStorageAdapter } from "./localStorage";

export type StorageType = 'localStorage';

/** 同步存储工厂 */
export function createStorage(type: StorageType): IStorage {
  switch (type) {
    case 'localStorage':
      return new LocalStorageAdapter();
  }
}
