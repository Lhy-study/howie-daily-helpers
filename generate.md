# 生成 markdown 文件说明

## 仓库架构

基于 monorepo + pnpm 管理多个子项目
其中 packages 目录下是子项目的代码目录
docs 目录下是文档目录

```text
howie-daily-helpers/
├── packages/
│   ├── core/                      # 核心工具函数（无框架依赖，纯 TS）
│   │   ├── src/
│   │   │   ├── index.ts           # 主入口
│   │   │   ├── logger.ts/         # 日志记录工具函数
│   │   │   ├── is.ts/             # 类型判断工具函数
│   │   │   └── string.ts/         # 字符串相关工具函数
│   │   ├── test/                  # Vitest 单元测试文件
│   │   │   ├── logger.spec.ts
│   │   │   └── is.spec.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── dom/                       # DOM 操作相关工具（可选）
│   └── shared/                    # 多包共享的内部工具（private 包）
├── apps/                          # 可独立运行的应用
│   └── docs/                      # VitePress 文档站点
│       ├── .vitepress/
│       │   └── config.mts
│       └── markdown/              # 自动生成的 markdown 目录
│           └── core/              # 对应 packages/core 子包的 markdown 目录
│                ├── logger.md     # 日志记录工具函数 md
│                └── is.md         # 类型判断工具函数 md
├── package.json                   # 根 package.json（定义 workspace）
├── pnpm-workspace.yaml            # pnpm workspace 配置
├── tsconfig.base.json             # 全局严格 TS 配置
├── vitest.config.ts               # 全局测试配置 
└── README.md
```

仓库架构如上图所示

我希望能够根据以上架构，生成对应的 markdown 文件，每个文件对应一个子项目

比如 core 目录下的文件，有 logger.ts, is.ts 文件，对应生成的 markdown 文件有 logger.md, is.md, 放置位置就在 docs/markdown/core 目录下，后续如果新增了子包或者新增了文件，对应生成的 markdown 文件也会新增，生成位置应该对应 packages 目录下的文件结构

## 生成 markdown 文件的规则

- 用于 vitepress 文档站点
- 每个 md 文件内容需要满足 对应 ts 文件的代码意义
- 每个分组（对应子包）需要有一个 index.md 文件，用于展示该分组的所有工具函数，提供链接去不同页面查看

## vitepress 文档站点的配置

- apps\docs\.vitepress\config.mts 中配置了 nav 和 sidebar，用于展示导航栏和侧边栏
- 后续新增了子包或者新增了文件，对应生成的 markdown 文件也会新增并且希望配置文件 config.mts 也可以自动更新
