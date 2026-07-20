/**
 * Cloudflare Worker —— AI 问答 API 服务
 *
 * 职责：
 *   1. 接收用户问题
 *   2. 将问题转向量
 *   3. 从 Vectorize 检索最相关的文档片段
 *   4. 拼接 RAG prompt，调用 OpenAI SDK 流式调用 LLM
 *   5. 流式返回回答 + 引用来源
 */

import { retrieveChunks, streamLLMResponse } from './utils';
import type { Env } from './types';
import { createSharedConfig } from 'howie-daily-helpers-shared';
import { createEmbedder } from '../src/rag/embedder';

// ============================================================
// 主入口
// ============================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/ping') {
      return jsonResponse({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/ask') {
      try {
        const body = (await request.json()) as { question: string };
        const question = body.question?.trim();
        if (!question) {
          return jsonResponse({ error: '请提供 question 参数' }, 400);
        }

        const config = createSharedConfig(
          env as Record<string, string | undefined>,
        );
        console.log(
          `[ask] "${question}" | model=${config.llmModel} | hasKey=${!!config.llmApiKey}`,
        );

        console.log('config', config);

        // // 检索相关文档片段
        const embedder = createEmbedder({ config });
      
        const queryVector = Array.from(await embedder(question));
       
        const chunks = await retrieveChunks(queryVector, env);
        console.log(`[ask] retrieved ${chunks.length} chunks`);

        // 调用 LLM 流式返回
        return await streamLLMResponse(question, chunks, config);
      } catch (err) {
        const message = err instanceof Error ? err.message : '服务器内部错误';
        console.error('[ask] error:', message);
        return jsonResponse({ error: message }, 500);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};

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
