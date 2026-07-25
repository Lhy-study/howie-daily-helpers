---
title: useDraft 草稿管理
description: 带撤销/重做和持久化功能的草稿管理 Hook，支持历史记录、防抖保存、最大间隔兜底保存。
---

# useDraft

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="React" />

`useDraft` 是一个带**撤销/重做**和**持久化保存**功能的草稿管理 Hook。支持历史记录栈管理、防抖保存和最大间隔兜底保存，确保用户输入不会丢失。

## 交互演示

<UseDraftDemo />

## 特性

- ✅ **撤销/重做**：支持多级历史记录
- ✅ **持久化保存**：自动保存到 localStorage
- ✅ **防抖保存**：连续输入时避免频繁写入
- ✅ **兜底保存**：最大间隔强制保存，防止长时间输入丢失
- ✅ **容量限制**：可配置历史记录最大条数

## 接口

### 参数

```ts
interface UseDraftProps<T extends any = any> {
  initialValue: T;
  capacity?: number;           // 草稿容量，默认 10
  saveDebounceMs?: number;     // 持久化防抖时间（ms），默认 1500
  maxSaveInterval?: number;    // 连续输入最大保存间隔（ms），默认 30000
  storageKey: string;          // 存储的 key
}
```

### 返回值

```ts
type UseDraftResult<T> = [
  {
    curDraft: T;       // 当前草稿值
    isSaving: boolean; // 是否正在保存
  },
  {
    undo: () => void;              // 撤销
    redo: () => void;              // 重做
    onChangeDraft: (val: T) => void; // 更新草稿（带防抖）
    save: () => Promise<void>;     // 手动保存
    reset: () => void;             // 重置为初始值
  }
];
```

## 使用示例

### 基础用法

```tsx
import { useDraft } from 'howie-daily-helpers-react-hooks';

function Editor() {
  const [{ curDraft, isSaving }, { undo, redo, onChangeDraft, reset }] = useDraft({
    initialValue: '',
    storageKey: 'editor-draft',
  });

  return (
    <div>
      <textarea
        value={curDraft}
        onChange={(e) => onChangeDraft(e.target.value)}
        placeholder="开始输入..."
      />
      <div>
        <button onClick={undo} disabled={isSaving}>撤销</button>
        <button onClick={redo} disabled={isSaving}>重做</button>
        <button onClick={reset} disabled={isSaving}>重置</button>
        {isSaving && <span>保存中...</span>}
      </div>
    </div>
  );
}
```

### 自定义配置

```tsx
const [{ curDraft }, { onChangeDraft }] = useDraft({
  initialValue: { title: '', content: '' },
  storageKey: 'article-draft',
  capacity: 20,           // 最多保存 20 条历史记录
  saveDebounceMs: 2000,   // 输入停顿 2 秒后保存
  maxSaveInterval: 60000, // 最多 1 分钟必须保存一次
});
```

## 工作原理

### 历史记录栈

- 栈底永远保存初始值
- 每次保存时，新值入栈
- 撤销时，游标向前移动
- 重做时，游标向后移动
- 容量超出时，移除最早的非初始值记录

### 保存策略

1. **防抖保存**：用户停顿 `saveDebounceMs` 毫秒后触发保存
2. **兜底保存**：连续输入超过 `maxSaveInterval` 毫秒强制保存

### 持久化

- 使用 `localStorage` 存储草稿内容
- 保存时序列化为 JSON 字符串
- 组件挂载时自动从 localStorage 读取（当前版本暂未实现自动恢复）


## 注意事项

- 当前版本仅支持 `localStorage` 作为持久化存储
- 栈底始终保留初始值，不会被移除
- 撤销到初始状态后，`undo` 不再生效
- 重做需要先执行过撤销操作才能生效
