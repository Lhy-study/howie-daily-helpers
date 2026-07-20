// ============================================================
// 检索
// ============================================================

import { Chunk, buildRagMessages } from '../src/rag/index';
import { createSharedConfig } from 'howie-daily-helpers-shared';
import OpenAI from 'openai';
import { Env, VectorizeQueryResponse } from './types';

/** 查询 Vectorize 或内存存储中的文档片段 */
export async function retrieveChunks(
  queryVector: number[],
  env: Env,
): Promise<Chunk[]> {
  // 生产环境使用 env.Vectorize 查询
  const isProduction = env?.DEPLOY === 'online';

  console.log('isProduction', isProduction);

  if (isProduction && env.VECTORIZE) {
    try {
      const results = await env.VECTORIZE.query(queryVector, {
        topK: 3,
        returnValues: false,
        returnMetadata: 'all',
      });

      return results.matches.map((m) => ({
        id: m.id || '',
        filePath: m.metadata?.filePath?.toString() || '',
        title: m.metadata?.title?.toString() || '',
        text: m.metadata?.text?.toString() || '',
        embedding: Array.from(m.values || []) || [],
      }));
    } catch (err) {
      console.error('[retrieve] Vectorize query error:\n\n', err);
      return [];
    }
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${env.VECTORIZE_INDEX_NAME}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: queryVector,
        topK: 3,
        returnMetadata: 'all', // 返回元数据
        // returnValues: true
      }),
    },
  );
  const data = (await response.json()) as VectorizeQueryResponse;

  return (
    data?.result?.matches.map((m) => ({
      id: m.id || '',
      filePath: m.metadata?.filePath?.toString() || '',
      title: m.metadata?.title?.toString() || '',
      text: m.metadata?.text?.toString() || '',
      embedding: Array.from(m.values || []) || [],
    })) || []
  );
}

// ============================================================
// LLM 流式调用（OpenAI SDK）
// ============================================================

/** 剥离 /chat/completions 得到 SDK 所需 baseURL */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
}

export async function streamLLMResponse(
  question: string,
  chunks: Chunk[],
  config: ReturnType<typeof createSharedConfig>,
): Promise<Response> {
  const messages = buildRagMessages(question, chunks);
  const baseURL = normalizeBaseUrl(config.llmApiUrl);

  console.log(`[llm] baseURL=${baseURL} model=${config.llmModel}`);

  // 创建 OpenAI SDK 客户端
  const client = new OpenAI({
    apiKey: config.llmApiKey,
    baseURL,
  });

  // 调用 LLM，开启流式输出
  const stream = await client.chat.completions.create({
    model: config.llmModel,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    stream: true,
  });

  // 创建 SSE 写入流
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 先发送引用来源
  const sourcesPayload = {
    type: 'sources',
    data: chunks.map((c) => ({ title: c.title, filePath: c.filePath })),
  };
  writer.write(encoder.encode(`data: ${JSON.stringify(sourcesPayload)}\n\n`));

  // 后台流式转发 LLM 内容
  forwardOpenAIStream(stream, writer, encoder).catch((err) => {
    console.error(
      '[llm] stream error:',
      err instanceof Error ? err.message : err,
    );
  });

  return sseResponse(readable);
}

/** 遍历 OpenAI SDK 的流式响应，提取 delta.content */
export async function forwardOpenAIStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
): Promise<void> {
  try {
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        const payload = JSON.stringify({ type: 'content', data: content });
        writer.write(encoder.encode(`data: ${payload}\n\n`));
      }
    }
  } finally {
    try {
      writer.write(encoder.encode('data: [DONE]\n\n'));
      writer.close();
    } catch {}
  }
}

// ============================================================
// 工具函数
// ============================================================

export function corsResponse(body: BodyInit | null, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function sseResponse(readable: ReadableStream<Uint8Array>): Response {
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
