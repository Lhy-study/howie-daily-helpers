import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { chunkMarkdown } from '../src/chunker';
import { createEmbedder, batchEmbed } from '../src/embedder';
import { createJsonFileStore } from '../src/store';
import { createSharedConfig } from 'howie-daily-helpers-shared';
import type { Manifest, Chunk } from '../src/types';

const DOCS_DIR = join(import.meta.dirname, '../../../apps/docs/markdown');
const MANIFEST_PATH = join(import.meta.dirname, '../../../apps/docs/ai-index-manifest.json');
const INDEX_DATA_PATH = join(import.meta.dirname, '../../../apps/docs/ai-index-data.json');

async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return { files: {} };
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

function contentHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

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
  const config = createSharedConfig();
  const embedder = createEmbedder({ config });
  const store = createJsonFileStore(INDEX_DATA_PATH);

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

    await store.upsert(toEmbed);
  }

  if (toDelete.length > 0) {
    console.log(`  Deleting ${toDelete.length} removed files...`);
    await store.delete(toDelete);
  }

  await writeManifest(newManifest);

  console.log(`\n  Done. ${toEmbed.length} chunks indexed, ${toDelete.length} files removed.`);
}

indexDocs().catch(console.error);
