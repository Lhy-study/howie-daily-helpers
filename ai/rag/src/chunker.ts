import type { Chunk } from './types';

const MAX_CHUNK_SIZE = 1000;

interface RawSection {
  headings: string[];
  content: string;
}

/** 分块 Markdown 内容 */
export function chunkMarkdown(content: string, filePath: string): Chunk[] {
  const lines = content.split('\n');
  const sections: RawSection[] = [];
  let currentHeadings: string[] = [];
  let currentContent: string[] = [];

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      flushSection();
      currentHeadings = currentHeadings.filter((h) => !h.startsWith('### '));
      currentHeadings.push(line);
    } else if (/^###\s/.test(line)) {
      flushSection();
      currentHeadings = currentHeadings.filter((h) => !h.startsWith('### '));
      currentHeadings.push(line);
    } else {
      currentContent.push(line);
    }
  }
  flushSection();

  const chunks: Chunk[] = [];
  let chunkIdx = 0;

  for (const section of sections) {
    const text = section.content.trim();
    if (!text) continue;

    const title =
      section.headings[section.headings.length - 1]?.replace(/^#+\s*/, '') || filePath;

    if (text.length <= MAX_CHUNK_SIZE) {
      chunks.push({
        id: `${filePath}#${chunkIdx}`,
        filePath,
        title,
        text: [...section.headings, text].join('\n'),
      });
      chunkIdx++;
    } else {
      const paragraphs = text.split(/\n\n+/);
      let buf = '';

      for (const para of paragraphs) {
        if (buf && (buf + '\n\n' + para).length > MAX_CHUNK_SIZE) {
          chunks.push({
            id: `${filePath}#${chunkIdx}`,
            filePath,
            title,
            text: [...section.headings, buf.trim()].join('\n'),
          });
          chunkIdx++;
          buf = para;
        } else {
          buf = buf ? buf + '\n\n' + para : para;
        }
      }

      if (buf.trim()) {
        chunks.push({
          id: `${filePath}#${chunkIdx}`,
          filePath,
          title,
          text: [...section.headings, buf.trim()].join('\n'),
        });
        chunkIdx++;
      }
    }
  }

  return chunks;

  function flushSection() {
    if (currentContent.length > 0) {
      sections.push({ headings: [...currentHeadings], content: currentContent.join('\n') });
      currentContent = [];
    }
  }
}
