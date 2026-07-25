import { useCallback, useEffect, useMemo, useRef } from 'react';
import useSubscribe from '../useSubscribe';
import { createStorage } from '../adapters/storage';

/** 等待函数 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
interface UseDraftProps<T extends any = any> {
  initialValue: T;
  /** 草稿容量， 默认为 10 */
  capacity?: number;
  /** 持久化保存的防抖时间（ms），默认 1500 */
  saveDebounceMs?: number;
  /** 连续输入时的最大保存间隔（ms），默认 30000 */
  maxSaveInterval?: number;
  /** 存储的 key */
  storageKey: string;
}

// TODO: 增加不同适配器的支持，目前仅支持 localStorage

/** 草稿管理器 */
export default function useDraft<T>(props: UseDraftProps<T>) {
  const {
    initialValue,
    capacity = 10,
    saveDebounceMs = 1500,
    maxSaveInterval = 30000,
    storageKey,
  } = props;
  /** 订阅更新 */
  const subscribe = useSubscribe();

  const curDraftRef = useRef(initialValue);
  /** 是否在保存 */
  const isSavingRef = useRef(false);

  /** 缓存的草稿, 栈底永远为初始值 */
  const historyRef = useRef<T[]>([initialValue]);
  // 游标
  const pointerRef = useRef(0);

  /** 持久化防抖定时器 */
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  /** 30s 兜底定时器 */
  const maxSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const undo = useCallback(() => {
    // 边界判断
    if (pointerRef.current <= 0) return;

    pointerRef.current--;
    curDraftRef.current = historyRef.current[pointerRef.current];
    subscribe();
  }, []);

  const redo = useCallback(() => {
    // 边界判断
    if (pointerRef.current >= historyRef.current.length - 1) return;

    pointerRef.current++;
    curDraftRef.current = historyRef.current[pointerRef.current];
    subscribe();
  }, [capacity]);

  // 封装统一的保存动作
  const executeSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    subscribe();

    try {
      // 处理历史栈入栈逻辑
      if (pointerRef.current < historyRef.current.length - 1) {
        // 截断逻辑：保留索引 0（初始值）到当前游标，并追加新数据
        historyRef.current = [
          historyRef.current[0], // 永远保留初始值
          ...historyRef.current.slice(1, pointerRef.current + 1),
        ];
      }
      historyRef.current.push(curDraftRef.current);

      if (historyRef.current.length > capacity) {
        historyRef.current.shift();
      } else {
        pointerRef.current++;
      }

      await sleep(50);

      const storage = createStorage('localStorage');
      await storage.set(storageKey, JSON.stringify(curDraftRef.current));
    } finally {
      // 无论成功失败，都必须清理定时器和锁
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (maxSaveTimerRef.current) clearTimeout(maxSaveTimerRef.current);
      saveTimerRef.current = null;
      maxSaveTimerRef.current = null;

      isSavingRef.current = false;
      subscribe();
    }
  }, [capacity, storageKey]);

  const onChangeDraft = useCallback(
    (newValue: T) => {
      // 立即更新内存状态并刷新 UI
      curDraftRef.current = newValue;
      subscribe();

      // ========== 逻辑 A：常规防抖保存（用户停顿后触发） ==========
      // 每次输入都会重置这个定时器
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        executeSave();
      }, saveDebounceMs);

      // ========== 逻辑 B：最大间隔兜底保存（连续输入 30s 触发）==========
      if (!maxSaveTimerRef.current) {
        maxSaveTimerRef.current = setTimeout(() => {
          executeSave();
        }, maxSaveInterval);
      }
    },
    [subscribe, saveDebounceMs, capacity, maxSaveInterval],
  );

  const reset = useCallback(() => {
    pointerRef.current = 0;
    curDraftRef.current = historyRef.current[pointerRef.current];
    subscribe();
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
      /** 手动保存（立即触发持久化保存） */
      save: executeSave,
      /** 重置草稿为初始值 */
      reset,
    };
  }, [redo]);

  const state = {
    curDraft: curDraftRef.current,
    isSaving: isSavingRef.current,
  };

  return [state, actions] as const;
}
