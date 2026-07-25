---
title: React Hooks 工具集
description: React Hooks 工具集，包含 useDraft、useClickOutside、useWorker 等常用 hooks。
---

# React Hooks 工具集

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="React" />

`howie-daily-helpers-react-hooks` 提供了一组实用的 React Hooks，帮助你更高效地开发 React 应用。

## 安装

```bash
npm install howie-daily-helpers-react-hooks
# 或
pnpm add howie-daily-helpers-react-hooks
```

## 模块列表

| Hook | 说明 |
|------|------|
| [useDraft](useDraft) | 带撤销/重做和持久化功能的草稿管理 |
| [useClickOutside](useClickOutside) | 点击外部区域检测 |
| [useWorker](useWorker) | Web Worker 封装 |

## 使用示例

```tsx
import { useDraft, useClickOutside, useWorker } from 'howie-daily-helpers-react-hooks';
```

## 导出总览

```ts
export { default as useDraft } from './useDraft';
export { default as useClickOutSide } from './useClickOutside';
export { default as useWorker } from './useWorker';
```
