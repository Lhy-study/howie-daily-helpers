import { MutableRefObject, useEffect, useRef } from 'react';

export default function useClickOutSide<
  Ref extends MutableRefObject<HTMLElement>,
>(domRef: Ref, cb: (e: MouseEvent) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dom = domRef.current
      // target 等不等于 dom 或者 dom 的子节点中是否有 target
      if (target !== dom && !dom.contains(target)) {
        cbRef.current?.(e);
      }
    };

    window.addEventListener('click', handler);

    return () => {
      window.removeEventListener('click', handler);
    };
  }, []);
}
