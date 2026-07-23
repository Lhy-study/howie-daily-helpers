---
title: 优先级队列 PriorityQueue
description: 一个带老化机制的优先级任务队列 PriorityQueue，任务串行执行按优先级调度，支持动态老化防止低优先级任务饥饿。
---

# 优先级任务队列 `PriorityQueue`

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="无依赖" />

`PriorityQueue` 是一个**串行执行 + 按优先级调度**的任务队列。任务按优先级高低排列，高优先级先执行；同优先级遵循入队顺序（FIFO）。内置**老化机制**，防止低优先级任务永远得不到执行（饥饿问题）。

::: tip 适用场景
适合**中小规模**任务调度场景（几十到几百个任务）。任务数量极大时建议使用堆（Heap）实现，排序开销更低。
:::

---

## 优先级等级

```ts
enum PriorityQueuePriority {
  Highest = 1,
  High = 2,
  Medium = 3,  // 默认
  Low = 4,
  Lowest = 5,
}
```

数值越小，优先级越高。默认优先级为 `Medium` (3)。

---

## `PriorityQueue`

### 构造函数

```ts
new PriorityQueue<T extends () => void | Promise<void>>()
```

泛型 `T` 约束任务函数的类型，支持同步或异步返回 `void` 的函数。

### 方法

| 方法 | 说明 |
|------|------|
| `queue(task, priority?)` | 推入任务，按优先级插入队列，默认 `Medium` |
| `append(task)` | 添加到队尾（最低优先级 `Lowest`） |

---

## 调度规则

### 优先级排序

- 入队时遍历队列，找到第一个优先级**低于**当前任务的位置，插入到它前面。
- 同优先级的任务，新任务排在后面（FIFO）。
- 队头始终是当前最高优先级的任务。

### 串行执行

- 内部使用 `isRunning` 锁，确保**同一时刻只有一个任务在执行**。
- 任务执行完毕后，自动从队头取下一个任务继续执行。
- 异步任务会 `await` 完成后再执行下一个。

### 老化机制（Aging）

每执行完一个任务，队列中所有**等待中**的任务优先级自动**提升一级**（数值减 1，最高到 `Highest`）。

**为什么需要老化？** 如果一直有高优先级任务入队，低优先级任务可能永远得不到执行。老化机制确保等待越久的任务优先级越高，最终一定会被执行。

::: info 举个例子
队列中有一个 `Low` (4) 的任务一直在等。每执行完一个其他任务，它的优先级就提升一级：
- 第 1 次执行后：`Low` → `Medium` (3)
- 第 2 次执行后：`Medium` → `High` (2)
- 第 3 次执行后：`High` → `Highest` (1)

最多等 3 次，它就变成最高优先级被执行。
:::

---

## 示例

### 基础用法

```ts
import {
  PriorityQueue,
  PriorityQueuePriority,
} from 'howie-daily-helpers-core';

const q = new PriorityQueue();

q.queue(async () => {
  console.log('高优先级任务');
}, PriorityQueuePriority.High);

q.queue(async () => {
  console.log('普通任务 A');
}); // 默认 Medium

q.queue(async () => {
  console.log('普通任务 B');
}, PriorityQueuePriority.Medium);

q.queue(async () => {
  console.log('低优先级任务');
}, PriorityQueuePriority.Low);

// 执行顺序：高优先级任务 → 普通任务 A → 普通任务 B → 低优先级任务
```

### append 快速添加

```ts
// append 等价于 queue(task, PriorityQueuePriority.Lowest)
q.append(async () => {
  console.log('最不重要的任务');
});
```

### 混合同步异步任务

```ts
const q = new PriorityQueue();

q.queue(() => {
  console.log('同步任务');
});

q.queue(async () => {
  await new Promise((r) => setTimeout(r, 1000));
  console.log('异步任务');
});

// 同步任务先执行，等异步任务完成后才算结束
```

### 任务异常不影响后续

```ts
q.queue(async () => {
  throw new Error('出错了');
});

q.queue(async () => {
  console.log('我还是会执行');
});

// 出错的任务会在控制台输出错误日志，但不会中断队列
```

::: warning 注意
任务内部的异常会被捕获并通过 `console.error` 输出，**不会中断队列**，后续任务继续执行。
:::

---

## 导出总览

```ts
export enum PriorityQueuePriority {
  Highest = 1,
  High = 2,
  Medium = 3,
  Low = 4,
  Lowest = 5,
}

export class PriorityQueue<T extends () => void | Promise<void>> {
  constructor();
  queue(task: T, priority?: PriorityQueuePriority): void;
  append(task: T): void;
}
```
