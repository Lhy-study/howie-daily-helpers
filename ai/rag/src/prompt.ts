import type { Chunk } from './types';

/** 构建 RAG 提示词模板 */
export function buildRagPrompt(question: string, chunks: Chunk[]): string {
  const sources = chunks
    .map(
      (c) => `### ${c.title} (${c.filePath})\n${c.text}`
    )
    .join('\n\n');

  return [
    '你是一个技术文档助手。请仅基于以下参考文档回答用户问题。如果文档中没有相关信息，请如实说明。',
    '',
    '## 参考文档',
    sources,
    '',
    '## 用户问题',
    question,
  ].join('\n');
}

export function buildRagMessages(question: string, chunks: Chunk[]) {
  return [
    {
      role: 'system' as const,
      content: '你是一个技术文档助手。你的回答必须基于用户提供的参考文档，不要编造信息。如果文档中没有相关信息，请如实说明。',
    },
    {
      role: 'user' as const,
      content: buildRagPrompt(question, chunks),
    },
  ];
}
