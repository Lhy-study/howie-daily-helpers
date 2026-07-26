# howie-daily-helpers

个人长期迭代的 monorepo 项目，记录工作/学习中总结的工具函数、React Hooks、规范经验，部分可独立发布为 npm 子包。

## 目录结构

```
howie-daily-helpers/
├── packages/                  # 发布到 npm 的公共包
│   ├── core/                  # 纯 TS 工具函数
│   └── react-hooks/           # React Hooks 集合
│
├── apps/                      # 应用
│   ├── docs/                  # VitePress 文档站点
│   │   ├── markdown/          # 所有 .md 源文件
│   │   └── .vitepress/        # VitePress 配置 + 主题
│   └── react-play/            # React 本地调试 playground
│
├── ai/                        # AI RAG 功能（内部包，不发布）
│   ├── shared/                # 共享配置
│   ├── worker/                # Cloudflare Worker API
│   └── widget/                # React Chat 组件
│
├── functions/api/             # Cloudflare Functions
├── pnpm-workspace.yaml        # workspace 配置
├── tsconfig.base.json         # 共享 TS 配置
└── vitest.config.ts           # 全局测试配置
```

## 快速开始

```bash
pnpm install                  # 安装依赖
pnpm docs:dev                 # 启动 VitePress 文档站点
pnpm build:all                # 构建所有子包
pnpm test                     # 运行测试
```

## AI RAG 问答功能

基于 VitePress 文档的智能问答，支持流式对话和历史记忆。

### 技术栈

| 层 | 技术方案 |
|---|----------|
| 嵌入模型 | 智谱 embedding-3（768 维） |
| LLM | DeepSeek deepseek-v4-pro |
| 向量数据库 | Cloudflare Vectorize |
| API 服务 | Cloudflare Worker |
| 前端组件 | React + react-markdown + SSE 流式渲染 |

### 本地调试

```bash
# 1. 构建 RAG 索引
pnpm --filter howie-daily-helpers-rag run index

# 2. 启动 Worker
cd ai/worker && npx wrangler dev

# 3. 测试 API
pnpm --filter howie-ai-worker run test:api "isNumber 函数怎么用？"

# 4. 构建 Widget（watch 模式）
pnpm --filter howie-ai-widget run build:watch
```

### RAG 数据流

构建时:
  markdown -> chunker 分块 -> embedder 嵌入(智谱) -> Vectorize REST API -> Cloudflare

运行时:
  用户问题 -> Widget -> Worker POST /ask
  -> embedder 嵌入(智谱) -> Vectorize 检索
  -> 拼接 RAG prompt -> DeepSeek 流式返回 -> 打字机渲染

## Cloudflare 配置

### 1. 创建 Vectorize 索引

```bash
cd ai/worker
npx wrangler vectorize create howie-docs-index --dimensions=768 --metric=cosine
```

### 2. wrangler.toml 核心配置

```toml
name = "howie-ai-worker"
main = "src/index.ts"
compatibility_date = "2025-07-17"

[[vectorize]]
binding = "VECTORIZE"
index_name = "howie-docs-index"

[vars]
EMBEDDING_MODEL = "embedding-3"
EMBEDDING_DIMENSION = "768"
LLM_MODEL = "deepseek-v4-pro"
```

### 3. 配置密钥

```bash
# 生产环境（加密存储到 Cloudflare 后台）
npx wrangler secret put EMBEDDING_API_KEY
npx wrangler secret put LLM_API_KEY
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN
npx wrangler secret put VECTORIZE_INDEX_NAME
```

### 4. 部署 Worker

```bash
cd ai/worker && npx wrangler deploy
```

### 5. Cloudflare Pages 环境变量

在 Cloudflare Dashboard -> Settings -> Environment variables 中配置：

| 变量 | 用途 |
|------|------|
| EMBEDDING_API_KEY | 智谱嵌入 API key |
| LLM_API_KEY | DeepSeek API key |
| CF_ACCOUNT_ID | Cloudflare 账户 ID |
| CF_API_TOKEN | Cloudflare API Token（Vectorize 写权限） |
| VECTORIZE_INDEX_NAME | 索引名称 howie-docs-index |

构建命令: `pnpm build:all && pnpm docs:build`

### 6. 安全说明

| 文件 | gitignore | 说明 |
|------|-----------|------|
| .env | 是 | 本地环境变量（含 API key） |
| .dev.vars | 是 | wrangler dev 本地密钥 |
| wrangler.toml | 否 | 部署配置，需提交 git |
| ai-index-manifest.json | 否 | 增量索引快照 |

## 常用命令

```bash
# VitePress
pnpm docs:dev
pnpm docs:build

# RAG 索引
pnpm --filter howie-daily-helpers-rag run index

# Worker
cd ai/worker && npx wrangler dev
cd ai/worker && npx wrangler deploy

# Widget
pnpm --filter howie-ai-widget run build
pnpm --filter howie-ai-widget run build:watch

# 构建 & 测试
pnpm build:all
pnpm test
pnpm test:coverage
```

## 子包发布

```bash
cd packages/core
pnpm publish:patch    # 小版本
pnpm publish:minor    # 次版本
pnpm publish:major    # 大版本
```

## AI 智能体自动化能力

本仓库内置 `.agent-docs` 规则目录，存放 AI 自动化执行技能配置文件。可在 Cursor、Codex 等 AI 编辑器/智能体工具中配置读取，依据内置规则自动完成源码文档生成、VitePress 站点配置同步全流程自动化。
