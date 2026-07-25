import { IStorage } from './IStorage';

export class LocalStorageAdapter implements IStorage {
  constructor() {
    if (typeof window.localStorage === undefined) {
      throw new Error(
        'LocalStorageAdapter must be used in a browser environment',
      );
    }
  }
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
