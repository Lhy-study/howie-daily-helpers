---
title: EventEmitter 事件发射器
description: 轻量级事件发射器，支持 on/onOnce/off/emit/clear/clearAll 等完整的事件管理 API。
---

# EventEmitter 事件发射器

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="无框架依赖" />

`EventEmitter` 是一个轻量级的事件发射器，提供完整的**事件发布-订阅**机制。支持一次性事件监听、精准移除、批量清除等功能。

## 特性

- **类型安全** — 通过泛型约束事件名，支持事件的类型安全触发
- **一次性监听** — `onOnce` 注册的事件执行一次后自动移除
- **精准移除** — `off` 可精确移除指定事件的指定回调
- **批量清除** — `clear` 清除指定事件、`clearAll` 清除所有事件
- **错误隔离** — 单个回调抛出异常不影响其他回调的执行
- **快照安全** — `emit` 内部使用 `Array.from` 快照遍历，避免嵌套 emit 或回调中移除监听导致遍历异常

## 接口

```ts
class EventEmitter<EventName extends string> {
  /** 注册事件监听器 */
  on(eventName: EventName, cb: (...args: any[]) => void): (...args: any[]) => void;

  /** 注册事件监听器，仅执行一次后自动移除 */
  onOnce(eventName: EventName, cb: (...args: any[]) => void): (...args: any[]) => void;

  /** 触发事件，传递参数给所有已注册的回调 */
  emit(eventName: EventName, ...args: any[]): void;

  /** 移除指定事件的指定监听器 */
  off(eventName: EventName, cb: (...args: any[]) => void): void;

  /** 移除指定事件的所有监听器 */
  clear(eventName: EventName): void;

  /** 移除所有事件的所有监听器 */
  clearAll(): void;

  /** 获取所有已注册事件名称 */
  getAllListeners(): EventName[];
}
```

## 使用示例

### 基础用法

```ts
import { EventEmitter } from 'howie-daily-helpers-core';

const emitter = new EventEmitter<'open' | 'close' | 'data'>();

// 注册事件
emitter.on('open', () => {
  console.log('连接已打开');
});

// 触发事件
emitter.emit('open');
// 输出: 连接已打开
```

### 传递参数

```ts
emitter.on('data', (payload: { id: number; name: string }) => {
  console.log('收到数据:', payload.id, payload.name);
});

emitter.emit('data', { id: 1, name: 'Alice' });
// 输出: 收到数据: 1 Alice
```

### 一次性监听

```ts
emitter.onOnce('open', () => {
  console.log('首次打开（仅执行一次）');
});

emitter.emit('open'); // 输出: 首次打开（仅执行一次）
emitter.emit('open'); // 不再输出
```

### 移除监听器

```ts
const handler = () => console.log('处理中');

emitter.on('data', handler);
emitter.off('data', handler); // 移除后不再触发
emitter.emit('data'); // 无输出
```

### 批量清除

```ts
emitter.on('open', handler1);
emitter.on('close', handler2);

// 清除指定事件
emitter.clear('open');
emitter.emit('open'); // 无输出

// 清除所有事件
emitter.clearAll();
emitter.emit('close'); // 无输出
```

### 获取已注册事件

```ts
emitter.on('open', handler1);
emitter.on('close', handler2);

console.log(emitter.getAllListeners()); // ['open', 'close']
```

## 工作原理

1. 内部使用 `Map<EventName, Set<CB>>` 存储事件名到回调集合的映射，利用 `Set` 保证回调不重复注册
2. `onOnce` 除注册到 `events` 外，还会在独立的 `onceEvents` 中记录，`emit` 遍历时自动判断是否需要移除
3. `emit` 中使用 `Array.from(set)` 创建快照再遍历，避免在回调中嵌套 `emit` 或调用 `off` 导致遍历行为异常
4. 单个回调的异常被 `try-catch` 捕获并通过 `logger.error` 输出，不影响其他回调执行

## 典型场景

- 跨组件/跨模块的事件通信
- 插件系统的生命周期管理
- 异步操作的状态通知（如 WebSocket 连接状态）
- 作为基础构件用于更复杂的发布-订阅模式实现