---
title: 日志记录 logger
description: 一个带模块名 tag 的轻量日志记录工具，支持 info / error / warn / debug 级别。
---

# 日志记录 `logger`

<Badge type="tip" text="纯 TS" />
<Badge type="info" text="无依赖" />

提供带「模块名 tag」的结构化日志记录器。通过 `createLogger` 创建绑定模块名的日志实例，输出时自动在内容前拼接 `[moduleName]` 前缀，便于在控制台区分不同模块的日志。

## `createLogger`

根据传入的模块名创建一个日志实例，返回包含 `info` / `error` / `warn` / `debug` 四个级别方法的对象。

### 签名

```ts
export const createLogger: (moduleName: string) => {
  info: (...contents: any[]) => void;
  error: (...contents: any[]) => void;
  warn: (...contents: any[]) => void;
  debug: (...contents: any[]) => void;
};
```

### 示例

```ts
import { createLogger } from 'howie-daily-helpers-core';

const logger = createLogger('user-service');

logger.info('服务启动');                       // [user-service] 服务启动
logger.warn('配置缺失，使用默认值');            // [user-service] 配置缺失，使用默认值
logger.error('请求失败', { code: 500 });       // [user-service] 请求失败 {"code":500}
logger.debug('debug 信息');                     // [user-service] debug 信息
```

### 级别说明

| 方法 | 底层实现 | 适用场景 |
| --- | --- | --- |
| `info` | `console.log` | 常规信息输出 |
| `error` | `console.error` | 错误、异常信息 |
| `warn` | `console.warn` | 警告、潜在风险 |
| `debug` | `console.debug` | 调试信息（通常仅在开发环境可见） |

## 内容格式化

日志内容支持传入多个参数，按顺序拼接为单一字符串：

- 字符串：原样拼接
- 对象 / 数组：通过 `JSON.stringify` 序列化后拼接
- 其他类型（数字、布尔等）：通过 `String()` 转换为字符串后拼接

```ts
const logger = createLogger('demo');

logger.info('用户', { id: 1, name: 'howie' }, 42);
// 输出: [demo] 用户 {"id":1,"name":"howie"} 42
```

::: tip 多参数拼接
多个参数会被 `transformString` 内部统一处理为字符串并顺序拼接，无需手动调用 `JSON.stringify` 或字符串模板。
:::

## 在线体验

下方示例直接调用真实的 `createLogger`，可修改模块名与日志内容，点击不同级别按钮查看带 `[moduleName]` 前缀的输出：

<LoggerPlayground />

::: tip 试试看
- 修改「模块名」即可看到输出前缀实时变化
- 在「日志内容」中输入对象，如 `{"id":1}` ，可观察 `transformString` 的自动序列化
- 同时打开浏览器控制台，会发现日志也照常输出到 `console`
:::

## React 版在线体验

已支持在文档中直接嵌入 React 组件（`.tsx`）。下方为 React 实现的同款示例，同样调用真实 `createLogger`：

<LoggerDemo />

::: tip 扩展方式
后续新增 React 子包时，只需在 `apps/docs/.vitepress/theme/react-demos/` 下新建 `.tsx`（默认导出组件），它会**自动注册**为同名 Vue 组件（如 `Foo.tsx` → `<Foo />`），无需手动配置。
:::

## 导出总览

```ts
export const createLogger: (moduleName: string) => {
  info: (...contents: any[]) => void;
  error: (...contents: any[]) => void;
  warn: (...contents: any[]) => void;
  debug: (...contents: any[]) => void;
};
```
