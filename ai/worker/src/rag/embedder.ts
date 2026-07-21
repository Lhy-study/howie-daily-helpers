import { SharedConfig } from "howie-daily-helpers-shared";

export type Embedder = (text: string) => Promise<number[]>;

export interface EmbeddingOptions {
  model?: string;
  apiUrl?: string;
  apiKey?: string;
  dimension?: number;
  config?: SharedConfig;
}


/** 创建嵌入器 */
export function createEmbedder(options: EmbeddingOptions = {}): Embedder {
  const config = options.config;

  const model = options.model ?? config?.embeddingModel ?? 'embedding-3';
  const apiUrl = options.apiUrl ?? config?.embeddingApiUrl ?? 'https://open.bigmodel.cn/api/paas/v4/embeddings';
  const apiKey = options.apiKey ?? config?.embeddingApiKey ?? '';
  const dimension = options.dimension ?? config?.embeddingDimension ?? 1024;

  return async (text: string): Promise<number[]> => {
    if (!apiKey) {
      return new Array(dimension).fill(0);
    }

    const body: Record<string, unknown> = { model, input: text };
    if (dimension > 0) {
      body.dimensions = dimension;
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Embedding API error: ${res.status} ${res.statusText} body: ${body}`);
    }

    const json = (await res.json()) as { data: { embedding: number[] }[] };
    console.log('维度', json.data[0].embedding.length);
    return json.data[0].embedding;
  };
}


/** 批量嵌入文本 */
export async function batchEmbed(
  texts: string[],
  embedder: Embedder
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedder(text));
  }
  return results;
}
