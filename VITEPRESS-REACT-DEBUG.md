# 在 VitePress 中嵌入 React 组件（含踩坑排查全记录）

> 适用项目：`howie-daily-helpers`（monorepo + pnpm）
> 文档站：`apps/docs`（VitePress 1.6.4）
> 目标：在静态文档站中嵌入**可交互**的工具函数示例，且后续要支持 React 子包，让访客能直接在页面上体验 React 组件。

---

## 一、背景与目标

`packages/core` 是纯 TS 工具库，文档站用 VitePress 生成。为了让文档不只是「贴代码」，我们希望：

1. **Vue 版可交互示例**：在 `logger.md` 页面里调用真实的 `createLogger`，把输出显示到页面面板（而不是只打到浏览器控制台）。
2. **React 版可交互示例**：因为后续会写 React 子包，希望同样能在文档页直接嵌入 `.tsx` 组件做演示。

VitePress 底层基于 **Vue**，主题与 Markdown 内的交互组件只能用 **Vue 组件（`.vue` SFC）**，不能直接在 `.md` 里放 React 组件。要在 VitePress 内使用 React，标准做法是「**用一个 Vue 组件作为容器，在 `onMounted` 里通过 `react-dom/client` 把 React 组件挂载到 DOM 节点上**」。

---

## 二、最初的方案（导致了空白页）

### 2.1 基础设施

- `config.mts` 加 Vite 别名，让文档直接引用 core 源码：

```ts
vite: {
  resolve: {
    alias: {
      'howie-daily-helpers-core': resolve(import.meta.dirname, '../../../packages/core/src'),
    },
  },
}
```

- 创建通用桥接组件 `ReactMount.vue` + `utils/mountReact.ts`（用 `createRoot().render()`）。
- 安装 React 工具链（根 `devDependencies`）：

```bash
pnpm add -D -w react@^18 react-dom@^18 @types/react@^18 @types/react-dom@^18 @vitejs/plugin-react@^4
```

- `config.mts` 接入插件，并在 `theme/index.ts` 用 `import.meta.glob` **自动注册** `react-demos/*.tsx` 为同名 Vue 组件：

```ts
// config.mts
vite: { plugins: [react()] }

// theme/index.ts（初版，有问题）
const reactDemos = import.meta.glob('./react-demos/*.tsx', { eager: true })
for (const [path, mod] of Object.entries(reactDemos)) {
  const name = path.split('/').pop()!.replace(/\.tsx$/, '')
  app.component(name, defineComponent({ render: () => h(ReactMount, { component: mod.default }) }))
}
```

### 2.2 现象

构建能通过，但浏览器打开页面**空白**，控制台报错：

```
vitepress data not properly injected in app
```

---

## 三、排查过程（关键时间线）

### 3.1 误区一：以为是 favicon / logo

早期确实修过站点图标缺失（public 目录位置、`publicDir` 不是 VitePress 顶层字段等），但与本次空白页**无关**。

### 3.2 定位错误含义

`vitepress data not properly injected in app` 来自 VitePress 客户端 `useData()`：

```js
// vitepress/dist/client/app/data.js
export function useData() {
  const data = inject(dataSymbol)
  if (!data) throw new Error('vitepress data not properly injected in app')
  return data
}
```

`dataSymbol` 这个 provide 由 VitePress 内部 `Layout` 在**根 App 初始化**时注入。报错说明：**根 App 初始化中途崩溃，`provide` 没执行到**。

### 3.3 第一个错误假设：HTML 数据没注入

先去 `dist/index.html` 里 grep `__VITEPRESS__`，结果为 0，一度以为 SSR 没注入数据。

**事实纠正**：VitePress 1.6.4 的数据全局变量是 `window.__VP_SITE_DATA__`（不是 `__VITEPRESS__`）。重新核对发现构建产物**包含完整数据**，SSR 本身没坏。所以问题在**客户端运行时**，不是 HTML 数据脚本。

### 3.4 怀疑 `@vitejs/plugin-react` 与 VitePress 冲突

插件构建时打印了建议：

```
[vite:react-babel] We recommend switching to @vitejs/plugin-react-oxc ... vite.dev/rolldown
```

说明插件检测到了不兼容的 Vite 环境。做隔离实验：

- 关闭 `react()` 插件 → 构建产物里 `window.__VP_SITE_DATA__` 正常；
- 打开 `react()` 插件 → 数据脚本缺失。

**初步结论**：`@vitejs/plugin-react` 干扰了 VitePress 自身的 SSR / 客户端管线。

**尝试 1 — `include` 过滤**：

```ts
react({ include: /\.tsx$/ })
```

期望插件只处理 `.tsx`，不碰 VitePress 代码。结果：**仍然空白**。说明问题不止是插件全局副作用。

**尝试 2 — 弃用插件，改用 Vite 内置 esbuild 编译 `.tsx`**：

```ts
vite: {
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client'] },
}
```

不再用 React 插件。构建仍能过、SSR 内容完整（`logger-playground` 组件、`vp-doc` 容器、`createLogger` 示例都在 `dist` 里）。

但 **dev 模式打开仍是空白**。说明还有一处客户端崩溃源。

### 3.5 真正的根因：`eager` glob 在 App 初始化时同步引入了 `react-dom/client`

回看 `theme/index.ts`：

```ts
const reactDemos = import.meta.glob('./react-demos/*.tsx', { eager: true })
```

`eager: true` 会在**模块加载时（包括客户端 App 初始化、以及 SSR）同步 import 所有 `.tsx`**。每个 `.tsx` 都 `import { createRoot } from 'react-dom/client'`。

- 在 **SSR 阶段**：引入 `react-dom/client` 会触碰浏览器/DOM 相关逻辑，容易使整站 SSR 抛错（进而回退为空壳）。
- 在 **客户端 App 初始化阶段**：这些同步 import 发生在 `enhanceApp` 执行之前/之中，一旦 `.tsx` 模块求值出问题（如 JSX 运行时解析、或 react 相关副作用），`theme/index.ts` 整个模块导入失败 → `enhanceApp` 永不执行 → 根 App 初始化抛错 → `provide(dataSymbol)` 未执行 → `useData()` 抛 `data not properly injected` → **整页空白**。

**关键认知**：`import.meta.glob(..., { eager: true })` 把所有 React 演示的加载时机提前到了「站点启动那一刻」，这正是拖垮整站的元凶。

### 3.6 修复：React 演示改为「仅客户端 + 动态加载」

把 `eager: true` 改成 `eager: false`（懒加载），并用 `!import.meta.env.SSR` 确保 **SSR 阶段完全不碰 React**，组件注册放到客户端动态 import 完成后：

```ts
// theme/index.ts（终版）
import { h, defineComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import LoggerPlayground from './components/LoggerPlayground.vue'
import ReactMount from './components/ReactMount.vue'

// 仅客户端按需加载 React 演示组件，避免 SSR / 初始化阶段引入 react-dom/client
const reactDemos = import.meta.glob('./react-demos/*.tsx')

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LoggerPlayground', LoggerPlayground)
    app.component('ReactMount', ReactMount)

    if (!import.meta.env.SSR) {
      for (const [path, loader] of Object.entries(reactDemos)) {
        const name = path.split('/').pop()!.replace(/\.tsx$/, '')
        loader().then((mod) => {
          const Comp = (mod as any).default
          app.component(
            name,
            defineComponent({ render: () => h(ReactMount, { component: Comp }) }),
          )
        })
      }
    }
  },
} satisfies Theme
```

---

## 四、根因总结（一句话版）

> 空白页不是数据没注入，而是 **`@vitejs/plugin-react` 与 VitePress 1.6.4 不兼容**，叠加 **`import.meta.glob` 的 `eager` 模式在站点初始化时同步引入了 `react-dom/client`**，导致根 App 初始化崩溃，`useData()` 的 `provide` 没执行，从而整页空白。
>
> 最终方案：**不用 React 插件**（改用 Vite 内置 esbuild 的 `jsx: 'automatic'`）+ **React 演示仅客户端动态加载**。

---

## 五、最终可用的配置与代码结构

### 5.1 `apps/docs/.vitepress/config.mts`（节选）

```ts
import { defineConfig } from 'vitepress'
import { resolve } from 'path'

export default defineConfig({
  title: 'howie-daily-helpers',
  srcDir: './markdown',
  outDir: './dist',
  cacheDir: './cache',
  vite: {
    // 用 Vite 内置 esbuild 以「自动 JSX 运行时」编译 .tsx，避免 @vitejs/plugin-react 与 VitePress SSR 冲突
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client'] },
    // 静态资源目录，与 markdown 目录平级
    publicDir: resolve(import.meta.dirname, '../public'),
    resolve: {
      alias: {
        'howie-daily-helpers-core': resolve(import.meta.dirname, '../../../packages/core/src'),
      },
    },
  },
  head: [['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]],
  themeConfig: { /* nav / sidebar / socialLinks ... */ },
})
```

### 5.2 目录结构

```
apps/docs/.vitepress/
├── config.mts
├── public/
│   └── favicon.svg
└── theme/
    ├── index.ts                      # 扩展默认主题，注册组件 + 客户端动态注册 React 演示
    ├── components/
    │   ├── LoggerPlayground.vue      # Vue 版可交互示例（调用真实 createLogger）
    │   └── ReactMount.vue            # Vue 容器：onMounted 里用 react-dom 挂载 React 组件
    ├── utils/
    │   └── mountReact.ts             # createRoot().render() 封装
    └── react-demos/
        └── LoggerDemo.tsx            # React 版演示（默认导出即被自动注册为 <LoggerDemo />）
```

### 5.3 `logger.md` 中的使用

```md
## 在线体验

<LoggerPlayground />

## React 版在线体验

<LoggerDemo />
```

---

## 六、如何新增一个 React 子包 / 演示

1. 在 `apps/docs/.vitepress/theme/react-demos/` 下新建 `xxx.tsx`，**默认导出**一个 React 组件。
2. 在该子包对应的 `.md` 里直接写 `<Xxx />`（组件名 = 文件名，首字母自动大写由 Vue 解析，约定 kebab/ Pascal 均可，建议与文件名一致）。
3. 无需改 `config.mts`、无需改 `theme/index.ts` —— `import.meta.glob` 会自动扫描并注册。
4. 组件里 `import { createRoot } from 'react-dom/client'`、`import { ... } from '@howie-daily-helpers/xxx'` 均可（别名已配）。

> 注意：React 演示是**客户端渲染**，SSR 阶段不会执行其内容（页面 SSR 只会留一个空挂载点）。交互类示例这完全没问题。

---

## 七、验证情况与遗留项

### 已验证

- `vitepress build` 产物（`dist/`）经验证**完整渲染**：首页 hero/feature、`logger.md` 的 `vp-doc` 容器、`LoggerPlayground` 组件、`createLogger` 示例、侧边栏链接均在。
- 这证明**静态站点（build 产物）本身正确**，空白页是「客户端初始化崩溃」而非「构建失败」。

### dev 模式的说明

- `vitepress dev` 用 `curl` 抓取首页只会得到约 529 字节的空壳（`<div id="app"></div>` + 数据脚本）。这是 **VitePress dev 的正常行为**：首屏 HTML 是壳，内容由浏览器端 JS 渲染。`curl` 不执行 JS，所以看不到内容——**不代表空白**。
- 真正是否空白要在浏览器里确认。修复后请重新 `pnpm docs:dev` 打开页面验证（`@vitejs/plugin-react` 导致的初始化崩溃已消除）。

### 未能自动验证的部分

- 环境里**没有可用的无头浏览器**（puppeteer 实际未安装，Chrome 不便抓控制台），因此「浏览器端不再抛 `data not properly injected`」这一步建议你在本地浏览器最终确认一次。

### 可选清理

- `devDependencies` 中 `@vitejs/plugin-react` 现已不再使用，保留无害；若想彻底干净可执行 `pnpm remove @vitejs/plugin-react`。
- 后续若要体验官方推荐的 React 插件，可试 `@vitejs/plugin-react-oxc`（对 Vite 8 / rolldown 更友好），但本项目当前用 esbuild 方案已足够稳定。

---

## 八、经验沉淀（Checklist）

在 VitePress 里嵌入 React 演示，记住这几点可避免同类坑：

1. **别用 `@vitejs/plugin-react`** 直接挂到 VitePress —— 会与 1.6.x 的 SSR / 客户端管线冲突。用 `vite.esbuild.jsx: 'automatic'` 即可编译 `.tsx`。
2. **绝不在 `theme/index.ts` 顶层 `eager` 引入会牵扯 `react-dom/client` 的模块** —— 它会把 React 加载时机提前到站点初始化，拖垮整站。
3. React 演示要走「**Vue 容器 + 客户端动态 `import()` + `!import.meta.env.SSR` 守卫**」的模式。
4. 排查「空白页」时，先分清是 **SSR 没渲染**（看 `dist/*.html` 是否含内容）还是 **客户端崩溃**（控制台 `useData` / `provide` 相关报错）。
5. VitePress 1.6.x 的数据全局是 `__VP_SITE_DATA__`，不是 `__VITEPRESS__`（那是更老/其他版本或误记）。
