---
title: 异步包装器 withRetry / createSharedAsync
description: 两个实用的异步工具函数：withRetry 支持重试与指数退避，createSharedAsync 实现 Promise 缓存去重与结果共享。
---

# 异步包装器 `withRetry` & `createSharedAsync`

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="无框架依赖" />

`asyncWrapper` 模块提供两个高频异步场景的工具函数：

- **`withRetry`**：给异步函数套上重试壳，支持延迟、指数退避、条件重试。
- **`createSharedAsync`**：基于 LRU + TTL 的 Promise 缓存去重，相同 key 的并发请求共享同一个 Promise，远程请求只发一次。

---

## `withRetry`

带重试机制的异步函数包裹器。适用于网络请求、IO 操作等偶尔失败、重试后可能成功的场景。

### 函数签名

```ts
function withRetry<
  WithRetryError extends Error = Error,
  Params extends any[] = [],
  Result = any,
>(
  fn: (...args: Params) => Promise<Result>,
  options?: WithRetryOptions<WithRetryError>,
): (...args: Params) => Promise<Result>
```

### 选项

```ts
interface WithRetryOptions<E> {
  /** 最大重试次数，默认 3 */
  max?: number;
  /** 延迟执行时间（ms），默认 1000ms */
  delay?: number;
  /** 是否开启指数退避（每次重试延迟翻倍），默认 false */
  backoff?: boolean;
  /** 按条件重试，返回 true 才重试 */
  shouldRetry?: (e: E) => boolean;
}
```

### 重试策略

- 默认最多重试 **3 次**，每次间隔 **1000ms**。
- 每次重试会加上**随机抖动**（0 ~ delay），避免多个调用同时重试造成"惊群效应"。
- 开启 `backoff: true` 后，延迟按 **2^n** 指数增长：1s → 2s → 4s → ...
- 通过 `shouldRetry` 可按错误类型决定是否需要重试，比如仅对网络错误重试、对业务错误直接抛出。

::: warning 总执行次数
`max` 指的是**重试次数**，不是总执行次数。设 `max: 3` 意味着首次失败后最多再试 3 次，总共最多执行 **4 次**。
:::

### 示例

#### 基础用法

```ts
import { withRetry } from 'howie-daily-helpers-core';

const fetchData = withRetry(async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('请求失败');
  return res.json();
});

const data = await fetchData('/api/data');
// 失败会自动重试 3 次，每次间隔 1 秒
```

#### 指数退避

```ts
const fetchData = withRetry(
  async (id: number) => {
    return await api.getUser(id);
  },
  {
    max: 3,
    delay: 500,
    backoff: true, // 500ms → 1000ms → 2000ms
  },
);
```

#### 按条件重试

```ts
const fetchData = withRetry(
  async () => {
    return await api.post('/order', payload);
  },
  {
    max: 2,
    delay: 1000,
    shouldRetry: (e) => {
      // 仅超时或 5xx 才重试，4xx 直接抛出
      return e.message.includes('timeout') || /^5\d{2}$/.test(e.status);
    },
  },
);
```

---

## `createSharedAsync`

创建一个「共享异步结果」的函数。当多个调用方**同时**请求同一个 key 时，它们会共享同一个 Promise，远程请求只真正发起一次。搭配 LRU 缓存 + TTL，还能缓存已成功的结果。

### 函数签名

```ts
function createSharedAsync<Params extends any[], Result>(
  fn: (...args: Params) => Promise<Result>,
  options: Options<Params>,
): (...args: Params) => Promise<Result>
```

### 选项

```ts
interface Options<Params extends any[]> {
  /** LRU 缓存最大容量，默认 100 */
  capacity?: number;
  /** 缓存存活时间（秒），默认 5 秒 */
  ttl?: number;
  /** 缓存 key，可传字符串或根据参数计算 */
  resolveKey: string | ((...args: Params) => string);
}
```

### 核心特性

1. **Promise 去重** — 同一时刻相同 key 的并发请求共享同一个 Promise，不会重复发起请求。
2. **TTL 过期** — 成功的结果缓存 `ttl` 秒，过期后自动失效重新请求。
3. **LRU 淘汰** — 缓存超过 `capacity` 时，淘汰最久未使用的条目。
4. **失败不缓存** — Promise reject 时立即从等待池中移除，后续调用可正常重试，不会被"已失败的 Promise"卡住。

::: tip TTL 建议
`ttl` 应设置得**大于**单次请求的平均耗时，否则 Promise 还没 resolve 缓存就过期了，等于没去重。
:::

### 典型场景

- 多组件同时挂载时请求同一接口（如用户信息、配置数据）
- 批量操作中相同参数的重复调用
- 任何需要"相同输入只发一次请求"的异步函数

### 示例

#### 基础用法

```ts
import { createSharedAsync } from 'howie-daily-helpers-core';

const fetchUser = createSharedAsync(
  async (id: number) => {
    console.log('发起请求:', id);
    const res = await fetch(`/api/user/${id}`);
    return res.json();
  },
  {
    capacity: 200,
    ttl: 60, // 缓存 60 秒
    resolveKey: (id) => `user:${id}`,
  },
);

// 同时调用两次，只会看到一次 "发起请求: 1"
const [user1, user2] = await Promise.all([
  fetchUser(1),
  fetchUser(1),
]);

console.log(user1 === user2); // true（同一个 Promise 的结果）
```

#### 多参数 key

```ts
const fetchList = createSharedAsync(
  async (page: number, pageSize: number, keyword: string) => {
    return await api.getList({ page, pageSize, keyword });
  },
  {
    ttl: 30,
    resolveKey: (page, pageSize, keyword) =>
      `list:${page}:${pageSize}:${keyword}`,
  },
);
```

#### 失败不影响后续调用

```ts
const fetchData = createSharedAsync(
  async () => {
    throw new Error('网络错误');
  },
  { resolveKey: 'data' },
);

try {
  await fetchData();
} catch (e) {
  console.log('第一次失败');
}

// 失败后再调用，会重新发起请求，而不是拿到缓存的失败结果
await fetchData();
```

---

## 导出总览

```ts
export function withRetry<
  WithRetryError extends Error = Error,
  Params extends any[] = [],
  Result = any,
>(
  fn: (...args: Params) => Promise<Result>,
  options?: {
    max?: number;
    delay?: number;
    backoff?: boolean;
    shouldRetry?: (e: WithRetryError) => boolean;
  },
): (...args: Params) => Promise<Result>;

export function createSharedAsync<Params extends any[], Result>(
  fn: (...args: Params) => Promise<Result>,
  options: {
    capacity?: number;
    ttl?: number;
    resolveKey: string | ((...args: Params) => string);
  },
): (...args: Params) => Promise<Result>;
```
