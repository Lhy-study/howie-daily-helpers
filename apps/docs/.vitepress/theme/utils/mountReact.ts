import { createRoot, type Root } from 'react-dom/client';
import { type ReactElement } from 'react';

/** 在一个 DOM 容器中挂载 React 元素，返回可用于卸载的 root */
export function mountReact(
  container: HTMLElement,
  element: ReactElement,
): Root {
  const root = createRoot(container);
  root.render(element);
  return root;
}
