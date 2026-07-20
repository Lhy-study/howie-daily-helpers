import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import dotenv from 'dotenv';
import { chunkMarkdown } from '../src/rag/chunker';
import { createEmbedder, batchEmbed } from '../src/rag/embedder';
import { createSharedConfig } from 'howie-daily-helpers-shared';
import type { Manifest, Chunk, IVectorStore } from '../src/rag/types';
import { createVectorizeRemoteStore } from '../src/rag/store';

// 只在 node 环境下运行，浏览器环境或 cloudflare worker 环境会报错
if (typeof process === 'undefined') {
  throw new Error('Only runs in node.js environment');
}

// 显式指定 .env 路径（pnpm filter 运行时 CWD 是子包目录，相对路径会找不到）
dotenv.config({ path: resolve(import.meta.dirname, '../.env') });

/** 文档目录 */
const DOCS_DIR = join(import.meta.dirname, '../../../apps/docs/markdown');

/** 文档索引清单文件路径 */
const MANIFEST_PATH = join(
  import.meta.dirname,
  '../../../apps/docs/ai-index-manifest.json',
);

/**
 * 创建向量存储
 * - 如果配置了 CF_ACCOUNT_ID，写入 Cloudflare Vectorize
 */
function createVectorStore(): IVectorStore {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const indexName = process.env.VECTORIZE_INDEX_NAME;

  if (accountId && apiToken && indexName) {
    console.log(`  Using Cloudflare Vectorize: ${indexName}`);
    return createVectorizeRemoteStore({ accountId, apiToken, indexName });
  }

  return {
    upsert: async () => {},
    delete: async () => {},
    query() {
      return Promise.resolve([]);
    },
  };
}

/** 读取索引清单文件 */
async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return { files: {} };
  }
}

/** 写入索引清单文件 */
async function writeManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

/** 计算内容的哈希值 */
function contentHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/** 递归收集目录下的所有 Markdown 文件 */
async function collectMdFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const children = await collectMdFiles(fullPath);
      results.push(...children);
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function indexDocs() {
  const manifest = await readManifest();
  const files = await collectMdFiles(DOCS_DIR);
  const config = createSharedConfig(process.env);
  const embedder = createEmbedder({ config });
  const store = createVectorStore();

  /** 新索引清单 */
  const newManifest: Manifest = { files: {} };
  const toEmbed: Chunk[] = [];
  const toDelete: string[] = [];

  for (const fullPath of files) {
    const relPath = relative(DOCS_DIR, fullPath).replace(/\\/g, '/');
    const content = await readFile(fullPath, 'utf-8');
    const hash = contentHash(content);

    newManifest.files[relPath] = hash;

    if (manifest.files[relPath] === hash) {
      console.log(`  SKIP  ${relPath}`);
      continue;
    }

    console.log(`  INDEX ${relPath}`);
    const chunks = chunkMarkdown(content, relPath);
    toEmbed.push(...chunks);
  }

  for (const relPath of Object.keys(manifest.files)) {
    if (!(relPath in newManifest.files)) {
      toDelete.push(relPath);
    }
  }

  if (toEmbed.length > 0) {
    const texts = toEmbed.map((c) => c.text);
    console.log(`\n  Generating embeddings for ${texts.length} chunks...`);
    const embeddings = await batchEmbed(texts, embedder);

    for (let i = 0; i < toEmbed.length; i++) {
      toEmbed[i].embedding = embeddings[i];
    }

    // 一次性导入所有向量， 可能会有问题
    await store.upsert(toEmbed);
  }

  if (toDelete.length > 0) {
    console.log(`  Deleting ${toDelete.length} removed files...`);
    await store.delete(toDelete);
  }

  await writeManifest(newManifest);

  console.log(
    `\n  Done. ${toEmbed.length} chunks indexed, ${toDelete.length} files removed.`,
  );
}

indexDocs().catch(console.error);
