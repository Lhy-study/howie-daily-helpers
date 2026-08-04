---
title: StateMachine 轻量级状态机
description: 轻量级状态机，支持状态转移、事件驱动、action 回调及非法事件拦截。
---

# StateMachine 轻量级状态机

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="无框架依赖" />

`StateMachine` 是一个轻量级状态机，支持**状态定义**、**事件驱动转移**、**action 回调**和**非法事件拦截**。适用于有限状态流转的业务场景。

## 特性

- **类型安全** — 通过泛型约束状态和事件名称，编译时避免拼写错误
- **事件驱动** — 通过 `send(event)` 驱动状态转移，语义清晰
- **Action 回调** — 转移时可附带 `action` 回调，用于执行副作用
- **非法事件拦截** — 当前状态不允许的事件会被拦截并给出警告，状态不变
- **轻量无依赖** — 零外部依赖，核心实现仅 60 余行

## 接口

### 配置类型

```ts
interface StateMachineConfig<S extends string, E extends string> {
  /** 初始状态 */
  initial: S;
  /** 状态定义 */
  states: Record<
    S,
    {
      on?: Partial<
        Record<E, S | { target: S; action?: (payload?: any) => void }>
      >;
    }
  >;
}
```

### 实例方法

```ts
class StateMachine<S extends string, E extends string> {
  /** 获取当前状态 */
  getState(): S;

  /** 发送事件，触发状态转移。返回 true 表示转移成功，false 表示非法事件 */
  send(eventName: E, ...res: any[]): boolean;
}
```

## 使用示例

### 基础用法

```ts
import { StateMachine } from 'howie-daily-helpers-core';

// 定义状态和事件
type States = 'idle' | 'loading' | 'success' | 'error';
type Events = 'FETCH' | 'RESOLVE' | 'REJECT' | 'RESET';

// 创建状态机
const machine = new StateMachine<States, Events>({
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { RESET: 'idle' } },
    error: { on: { RESET: 'idle' } },
  },
});

console.log(machine.getState()); // 'idle'

machine.send('FETCH');
console.log(machine.getState()); // 'loading'

machine.send('RESOLVE');
console.log(machine.getState()); // 'success'
```

### 完整的请求流程

```ts
// idle → loading → success (成功) 或 error (失败) → idle (重置)
const machine = new StateMachine<States, Events>({
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { RESET: 'idle' } },
    error: { on: { RESET: 'idle' } },
  },
});

machine.send('FETCH');   // idle → loading
machine.send('REJECT');  // loading → error
machine.send('RESET');   // error → idle
```

### 使用 Action 回调

```ts
const machine = new StateMachine<States, Events>({
  initial: 'idle',
  states: {
    idle: {
      on: {
        FETCH: {
          target: 'loading',
          action: (payload) => {
            console.log('开始加载，参数:', payload);
          },
        },
      },
    },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { RESET: 'idle' } },
    error: { on: { RESET: 'idle' } },
  },
});

machine.send('FETCH', { url: '/api/data' });
// 输出: 开始加载，参数: [{ url: '/api/data' }]
```

### 非法事件拦截

```ts
const machine = new StateMachine<States, Events>({
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { RESET: 'idle' } },
    error: { on: { RESET: 'idle' } },
  },
});

// idle 状态下不允许 RESOLVE 事件
const result = machine.send('RESOLVE');
console.log(result);              // false（转移失败）
console.log(machine.getState()); // 'idle'（状态不变）
```

## 工作原理

1. 初始化时检查 `initial` 状态是否在 `states` 中定义，未定义则抛出错误
2. `send` 事件时，根据当前状态查找 `states[curState].on[eventName]`
3. 如果未找到对应事件（非法事件），记录警告日志并返回 `false`
4. 如果找到转移目标，更新 `currentState`
5. 如果转移配置包含 `action` 回调，执行该回调并传递 `send` 的参数

## 典型场景

- 异步请求的生命周期管理
- 表单的多步骤流程控制
- 游戏中的角色状态流转
- 网络连接状态管理（连接中、已连接、断开、重连）
- 任何需要有限状态流转的业务逻辑