import type { Chunk, IVectorStore } from './types';

/**
 * Cloudflare Vectorize 远程存储（构建时通过 REST API 写入）
 * 运行时查询由 Worker 的 env.VECTORIZE binding 处理
 */
export function createVectorizeRemoteStore(options: {
  accountId: string;
  apiToken: string;
  indexName: string;
}): IVectorStore {
  const { accountId, apiToken, indexName } = options;
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}`;

  return {
    /** 构建时不需查询，Worker 运行时处理 */
    async query(_embedding: number[], _topK: number): Promise<Chunk[]> {
      return [];
    },

    /** 向量 upsert：通过 REST API 分批写入 Vectorize */
    async upsert(chunks: Chunk[]): Promise<void> {
      const vectors = chunks
        .filter((c) => c.embedding)
        .map((c) => ({
          id: c.id,
          values: c.embedding!,
          metadata: { id: c.id, filePath: c.filePath, title: c.title, text: c.text },
        }));

      if (vectors.length === 0) return;

      // 分批上传，避免单次请求体过大
      const BATCH_SIZE = 5;
      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        const batch = vectors.slice(i, i + BATCH_SIZE);
        console.log(`    upsert batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(vectors.length / BATCH_SIZE)} (${batch.length} vectors)`);

        const res = await fetch(`${baseUrl}/upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ vectors: batch }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Vectorize upsert failed (${res.status}): ${body}`);
        }
      }
    },

    /** 按 ID 删除向量 */
    async delete(ids: string[]): Promise<void> {
      if (ids.length === 0) return;

      const res = await fetch(`${baseUrl}/delete-by-ids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Vectorize delete failed (${res.status}): ${body}`);
      }
    },
  };
}
