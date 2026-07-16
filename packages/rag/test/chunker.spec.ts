import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from '../src/chunker';

describe('chunkMarkdown', () => {
  it('should split by ## headings', () => {
    const md = [
      '## Section 1',
      'content of section 1',
      '',
      '## Section 2',
      'content of section 2',
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md');

    expect(chunks).toHaveLength(2);
    expect(chunks[0].title).toBe('Section 1');
    expect(chunks[0].text).toContain('## Section 1');
    expect(chunks[1].title).toBe('Section 2');
  });

  it('should split by ### sub-headings under ##', () => {
    const md = [
      '## Main',
      'intro text',
      '',
      '### Sub A',
      'content A',
      '',
      '### Sub B',
      'content B',
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md');

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].title).toBe('Main');
    expect(chunks[1].title).toBe('Sub A');
  });

  it('should include heading context in chunk text', () => {
    const md = [
      '## Parent',
      'intro text',
      '',
      '### Child',
      'child content',
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md');

    const childChunk = chunks.find((c) => c.title === 'Child');
    expect(childChunk).toBeDefined();
    expect(childChunk!.text).toContain('## Parent');
    expect(childChunk!.text).toContain('### Child');
  });

  it('should generate unique ids', () => {
    const md = [
      '## A',
      'text A',
      '',
      '## B',
      'text B',
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md');
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include filePath in id', () => {
    const md = '## Test\ncontent';
    const chunks = chunkMarkdown(md, 'dir/sub.md');

    expect(chunks[0].id).toContain('dir/sub.md');
  });

  it('should handle empty content', () => {
    const chunks = chunkMarkdown('', 'empty.md');
    expect(chunks).toHaveLength(0);
  });

  it('should handle content without headings', () => {
    const md = 'just some text without headings';
    const chunks = chunkMarkdown(md, 'nohead.md');

    expect(chunks).toHaveLength(1);
    expect(chunks[0].title).toBe('nohead.md');
  });

  it('should split oversized sections by paragraphs', () => {
    const longPara = 'A'.repeat(600);
    const md = ['## Big Section', longPara, '', longPara].join('\n');

    const chunks = chunkMarkdown(md, 'test.md');

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.title).toBe('Big Section');
    }
  });
});
