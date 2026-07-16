---
title: 异步任务调度器 AsyncTaskScheduler
description: 一个支持并发控制的异步任务调度器 AsyncTaskScheduler，可限制最大并发数并在全部任务完成后触发回调。
---

# 异步任务调度器 `AsyncTaskScheduler`

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="无依赖" />

`AsyncTaskScheduler` 是一个轻量的**异步并发任务调度器**：通过内部任务队列，限制同时执行的任务数量（最大并发），并在所有任务完成后触发可选的 `onAllFinish` 回调。适用于需要批量发起异步请求 / 任务又不想打满并发的场景。

## `AsyncTaskScheduler`

### 构造函数

```ts
new AsyncTaskScheduler(options?: {
  /** 最大并发任务数，默认 5 */
  maxConcurrency?: number;
  /** 所有任务完成时的回调 */
  onAllFinish?: () => void | Promise<void>;
})
```

### `addTask`

向调度器添加一个异步任务，返回一个在该任务完成（或失败）时 resolve / reject 的 `Promise`：

```ts
addTask<Result>(task: () => Promise<Result>): Promise<Result>
```

### 调度规则

- 内部维护一个任务队列 `taskQueue` 与并发计数 `currentTaskCount`。
- 仅当「队列非空」且「当前执行数 < 最大并发数」时才真正执行任务。
- 某个任务结束后，无论成功或失败，都会递减计数并自动尝试从队列中取下一个任务执行（递归 `runTask`）。
- 当「剩余任务数 `remainingTaskCount` 归零」且调度器已挂载（`isMounted`）时，触发 `onAllFinish` 回调。

::: warning 关于 `onAllFinish` 的触发
`onAllFinish` 仅在「剩余任务数归零」的瞬间触发一次。如果构造后**从未添加过任何任务**，`remainingTaskCount` 始终为 `0`，回调不会自动执行（因为没有任何任务触发归零判定）。
:::

## 示例

### 限制并发数批量请求

```ts
import { AsyncTaskScheduler } from './AsyncTaskScheduler';

const scheduler = new AsyncTaskScheduler({
  maxConcurrency: 2,
  onAllFinish: () => console.log('全部任务完成'),
});

const ids = [1, 2, 3, 4, 5];

ids.forEach((id) => {
  scheduler.addTask(async () => {
    const res = await fetch(`/api/item/${id}`);
    return res.json();
  }).then((data) => {
    console.log(`任务 ${id} 完成`, data);
  });
});
// 最多同时执行 2 个请求，全部完成后输出：全部任务完成
```

### 获取单个任务的结果

```ts
import { AsyncTaskScheduler } from './AsyncTaskScheduler';

const scheduler = new AsyncTaskScheduler({ maxConcurrency: 3 });

const result = await scheduler.addTask(async () => {
  return await someAsyncWork();
});
// result 为该任务 resolve 的值；任务失败时会 reject 对应的错误
```

### 失败的任务是独立的

```ts
import { AsyncTaskScheduler } from './AsyncTaskScheduler';

const scheduler = new AsyncTaskScheduler({ maxConcurrency: 1 });

scheduler.addTask(async () => {
  throw new Error('boom');
}).catch((err) => {
  console.error('单个任务失败，不影响其他任务', err.message);
});
```

::: tip 提示
某个任务 `reject` 只会让对应 `addTask` 返回的 Promise 进入 `catch`，**不会**中断调度器继续消费队列中的其余任务。
:::

## 导出总览

```ts
export class AsyncTaskScheduler {
  constructor(options?: {
    maxConcurrency?: number;
    onAllFinish?: () => void | Promise<void>;
  });
  addTask<Result>(task: () => Promise<Result>): Promise<Result>;
}
```

## React 版在线体验

下方为 React 实现的可交互演示，使用真实的 `AsyncTaskScheduler`。点击「开始调度」后，可在**浏览器控制台**直接看到每个任务的开始 / 结束输出，且任意时刻并发数不会超过设定的「最大并发」：

<AsyncTaskSchedulerDemo />

::: tip 观察并发限制
把「最大并发」设为较小值（如 2），「任务数」设大一些（如 8），运行后对比控制台输出：你会看到同一时刻最多只有 2 个 `▶ 任务 开始`，其余任务必须等前面的 `✔ 结束` 后才会被调度执行。
:::
