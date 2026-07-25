---
title: useClickOutside 点击外部检测
description: 监听点击元素外部区域的 Hook，常用于弹窗关闭、下拉菜单收起等场景。
---

# useClickOutside

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="React" />

`useClickOutside` 用于监听点击元素外部区域的事件，常用于弹窗关闭、下拉菜单收起等场景。

## 交互演示

<UseClickOutsideDemo />

## 接口

### 参数

```ts
useClickOutside<Ref extends MutableRefObject<HTMLElement>>(
  domRef: Ref,    // DOM 元素引用
  cb: (e: MouseEvent) => void  // 点击外部时的回调函数
): void
```

## 使用示例

### 弹窗关闭

```tsx
import { useRef, useState } from 'react';
import { useClickOutside } from 'howie-daily-helpers-react-hooks';

function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    setIsOpen(false);
  });

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>打开弹窗</button>
      {isOpen && (
        <div ref={modalRef} className="modal">
          <p>点击外部关闭</p>
        </div>
      )}
    </div>
  );
}
```

### 下拉菜单

```tsx
import { useRef, useState } from 'react';
import { useClickOutside } from 'howie-daily-helpers-react-hooks';

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>菜单</button>
      {isOpen && (
        <div ref={dropdownRef} className="dropdown-menu">
          <a href="#">选项 1</a>
          <a href="#">选项 2</a>
          <a href="#">选项 3</a>
        </div>
      )}
    </div>
  );
}
```

## 注意事项

- 点击元素内部（包括子元素）不会触发回调
- 组件卸载时会自动移除事件监听
- 回调函数支持动态更新，始终使用最新的回调引用
