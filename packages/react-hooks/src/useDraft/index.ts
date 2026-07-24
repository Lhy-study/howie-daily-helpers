import { useCallback, useMemo, useRef, useState } from 'react';

interface UseDraftProps<T extends any = any> {
  initialValue: T;
  /** 草稿容量， 默认为 10 */
  capacity?: number;
}

// TODO: 增加自动存储、立即储存（更新当前草稿）等功能

export default function useDraft<T>(props: UseDraftProps<T>) {
  const { capacity = 10 } = props;

  const { initialValue } = props;
  const [curDraft, setCurDraft] = useState(initialValue);

  /** 防抖定时器 */
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /** 缓存的草稿 */
  const draftList = useRef<T[]>(new Array(capacity));
  // 游标
  const pointerRef = useRef(0);

  const undo = useCallback(() => {
    // 边界判断
    if (pointerRef.current <= 0) return;

    const curPointer = pointerRef.current;
    const lastPointer = curPointer - 1;
    const showDraft = draftList.current[lastPointer];

    // 更换当前草稿
    if (showDraft) {
      pointerRef.current = lastPointer;
      setCurDraft(showDraft);
    }
  }, []);

  const redo = useCallback(() => {
    // 边界判断
    if (pointerRef.current >= capacity) return;

    const curPointer = pointerRef.current;
    const lastPointer = curPointer + 1;
    const showDraft = draftList.current[lastPointer];

    // 更换当前草稿
    if (showDraft) {
      pointerRef.current = lastPointer;
      setCurDraft(showDraft);
    }
  }, [capacity]);

  const state = useMemo(() => {
    return {
      curDraft,
    };
  }, [curDraft]);

  const onChangeDraft = useCallback((newValue: T) => {
    const timer = timerRef.current;
    if (timer) {
      clearTimeout(timer);
    }
    timerRef.current = setTimeout(() => {
      setCurDraft(newValue);
    }, 300);
  }, []);

  const actions = useMemo(() => {
    return {
      undo,
      redo,
      /**
       * 改变草稿
       * 带防抖，默认 300ms
       */
      onChangeDraft,
    };
  }, [redo]);

  return [state, actions] as const;
}
