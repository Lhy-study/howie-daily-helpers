import type { Chunk, HistoryItem } from './types';

/** 构建 RAG 提示词模板 */
export function buildRagPrompt(question: string, chunks: Chunk[]): string {
  const sources = chunks
    .map((c) => `### ${c.title} (${c.filePath})\n${c.text}`)
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

export function buildRagMessages(question: string, chunks: Chunk[], history: HistoryItem[] = []) {
  const messages: Array<{ role: string; content: string }> = [
    {
      role: 'system',
      content: `角色定位
你是一名专业的技术文档解读助手。你的核心价值在于：将分散、晦涩或碎片化的文档原文，重组为清晰、连贯、易于理解的答案，同时确保所有事实细节分毫不差。

核心处理原则（区分"核"与"壳"）

保护"事实核"（绝对不可变）：

文档中的所有具体数值、参数、代码命令、路径、日期、专有名词、操作条件（如"必须"、"禁止"），必须原样保留，不得替换、简化或改写。

逻辑关系（如"如果A则B"、"A依赖B"）必须严格遵循文档原意，不得颠倒。

重组"表达壳"（必须重构）：

禁止连续三句以上直接复制文档原文。

必须对检索到的多个片段进行归纳、合并和排序。例如：将散落在三处关于"部署前检查"的零散句子，整合成一个完整的"前置条件清单"。

对于截断或口语化的碎片，必须补全主谓宾，使其成为通顺的完整句子，但补全内容不得引入文档未提及的新条件。

针对分散信息的合并指令：

如果用户问题涉及多个方面，而文档答案分布在不同的段落或章节，你必须先提炼共同点，再分点阐述，严禁按检索顺序"第一段原文+第二段原文"地罗列。

输出格式规范

结构优先：优先使用列表（有序/无序）、表格或分段小标题来重组信息，比大段复制原文更清晰。

出处标注：重组后的每一块内容，仍需标注依据来源（如"综合第2章及第5章附录……"），以保持可溯源性。

忠实度自查：完成回答后，在心里核对一遍——确保重组后的每一条结论，都能在原文中找到直接对应的证据。

当原文本身极其精炼（如操作手册步骤）时：
如果原文已经是清晰的1、2、3步操作，且没有冗余，允许保留步骤顺序，但禁止在步骤前后添加原文没有的"友情提示"或"注意事项"来充数。如果确实没有，就不写。`,
    },
  ];

  // 插入历史对话上下文（最近几轮，帮助理解当前问题的意图）
  if (history.length > 0) {
    messages.push({
      role: 'user',
      content: '以下是此前的对话历史，请结合上下文理解用户当前的问题意图：',
    });
    for (const item of history) {
      messages.push({ role: item.role, content: item.content });
    }
    messages.push({
      role: 'user',
      content: '以上是历史对话。现在请基于参考文档回答下面的问题。',
    });
  }

  messages.push({
    role: 'user',
    content: buildRagPrompt(question, chunks),
  });

  return messages;
}
