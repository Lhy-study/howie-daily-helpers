---
title: Core 核心工具
description: howie-daily-helpers 核心工具函数集合，涵盖类型判断、日志记录等无框架依赖的纯 TS 工具。
---

# Core 核心工具

<Badge type="tip" text="纯 TS" />
<Badge type="info" text="无框架依赖" />

`core` 子包提供一组无框架依赖的基础工具函数，可直接在 Node、浏览器或任意前端框架中使用。

## 工具导航

| 模块 | 说明 | 文档 |
| --- | --- | --- |
| `is` | 类型判断与值校验工具（类型守卫） | [查看详情 →](./is) |
| `logger` | 日志记录工具函数 | [查看详情 →](./logger) |
| `AsyncTaskScheduler` | 异步并发任务调度器（限制最大并发数） | [查看详情 →](./asyncTaskscheduler) |

## 快速开始

```ts
import { isString, logger } from 'howie-daily-helpers-core';

if (isString('hello')) {
  logger.info('收到字符串:', 'hello');
}
```

::: tip 提示
点击上方表格中的「查看详情」可进入对应模块的使用文档。后续新增的工具模块会自动补充到本页面与侧边栏中。
:::
