import { readFile, writeFile } from 'node:fs/promises';
import type { Chunk } from './types';

export interface IVectorStore {
  query(embedding: number[], topK: number): Promise<Chunk[]>;
  upsert(chunks: Chunk[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function createMemoryStore(): IVectorStore {
  const store = new Map<string, Chunk>();

  return {
    async query(embedding: number[], topK: number): Promise<Chunk[]> {
      const scored: { chunk: Chunk; score: number }[] = [];
      for (const chunk of store.values()) {
        if (!chunk.embedding) continue;
        scored.push({ chunk, score: cosineSimilarity(embedding, chunk.embedding) });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map((s) => s.chunk);
    },

    async upsert(chunks: Chunk[]): Promise<void> {
      for (const chunk of chunks) {
        store.set(chunk.id, chunk);
      }
    },

    async delete(ids: string[]): Promise<void> {
      for (const id of ids) {
        store.delete(id);
      }
    },
  };
}

export function createJsonFileStore(filePath: string): IVectorStore {
  let store = new Map<string, Chunk>();

  async function load(): Promise<void> {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as Chunk[];
      store = new Map(data.map((c) => [c.id, c]));
    } catch {
      store = new Map();
    }
  }

  async function save(): Promise<void> {
    const data = Array.from(store.values());
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  return {
    async query(embedding: number[], topK: number): Promise<Chunk[]> {
      await load();
      const scored: { chunk: Chunk; score: number }[] = [];
      for (const chunk of store.values()) {
        if (!chunk.embedding) continue;
        scored.push({ chunk, score: cosineSimilarity(embedding, chunk.embedding) });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map((s) => s.chunk);
    },

    async upsert(chunks: Chunk[]): Promise<void> {
      await load();
      for (const chunk of chunks) {
        store.set(chunk.id, chunk);
      }
      await save();
    },

    async delete(ids: string[]): Promise<void> {
      await load();
      for (const id of ids) {
        store.delete(id);
      }
      await save();
    },
  };
}
