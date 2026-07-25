---
title: useWorker Web Worker 封装
description: 封装 Web Worker 的 Hook，提供消息发送、消息监听和错误处理功能。
---

# useWorker

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="React" />

`useWorker` 封装了 Web Worker 的创建、消息发送、消息监听和错误处理，让你更方便地在 React 组件中使用 Web Worker。

## 交互演示

<UseWorkerDemo />

## 接口

### 参数

```ts
useWorker<D extends any>(url: string): WorkerResult<D>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | Worker 脚本文件路径 |

### 返回值

```ts
interface WorkerResult<D> {
  postMessage: (data: D, transfer?: Transferable[]) => void;
  onMessage: (cb: (data: D, e: MessageEvent<D>) => void) => void;
  onErrMsg: (cb: (e: ErrorEvent) => void) => void;
}
```

| 方法 | 说明 |
|------|------|
| `postMessage` | 向 Worker 发送消息，支持 Transferable 对象传递 |
| `onMessage` | 注册消息回调，接收 Worker 发送的数据 |
| `onErrMsg` | 注册错误回调，处理 Worker 中的错误 |

## 使用示例

### 基础用法

```tsx
import { useWorker } from 'howie-daily-helpers-react-hooks';

function App() {
  const { postMessage, onMessage, onErrMsg } = useWorker<number>('/worker.js');

  useEffect(() => {
    onMessage((data, e) => {
      console.log('收到消息:', data);
    });

    onErrMsg((e) => {
      console.error('Worker 错误:', e);
    });
  }, [onMessage, onErrMsg]);

  const handleClick = () => {
    postMessage(42);
  };

  return (
    <button onClick={handleClick}>发送消息到 Worker</button>
  );
}
```

### Worker 脚本示例

```js
// worker.js
self.addEventListener('message', (e) => {
  const result = e.data * 2;
  self.postMessage(result);
});
```

### 传递 Transferable 对象

```tsx
const handleTransfer = () => {
  const buffer = new ArrayBuffer(1024);
  postMessage(buffer, [buffer]);
};
```

## 注意事项

- URL 改变时会自动创建新的 Worker 并终止旧的
- 组件卸载时会自动终止 Worker 并移除事件监听
- 当前版本仅支持事件回调风格，后续会扩展 Promise 风格支持
