import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDraft from '../src/useDraft';

describe('useDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('初始化时使用初始值', () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'initial', storageKey: 'test-key' })
    );
    
    expect(result.current[0].curDraft).toBe('initial');
    expect(result.current[0].isSaving).toBe(false);
  });

  test('onChangeDraft 更新当前草稿', () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'initial', storageKey: 'test-key' })
    );
    
    act(() => {
      result.current[1].onChangeDraft('updated');
    });
    
    expect(result.current[0].curDraft).toBe('updated');
  });

  test('undo 在初始状态时不执行', () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'v1', storageKey: 'test-key' })
    );
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
  });

  test('redo 在最新状态时不执行', () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'v1', storageKey: 'test-key' })
    );
    
    act(() => {
      result.current[1].redo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
  });

  test('reset 重置为初始值', () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'v1', storageKey: 'test-key' })
    );
    
    act(() => {
      result.current[1].onChangeDraft('v2');
    });
    
    expect(result.current[0].curDraft).toBe('v2');
    
    act(() => {
      result.current[1].reset();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
  });

  test('手动 save 立即触发持久化', async () => {
    const { result } = renderHook(() => 
      useDraft({ 
        initialValue: 'v1', 
        storageKey: 'test-key',
        saveDebounceMs: 5000
      })
    );
    
    act(() => {
      result.current[1].onChangeDraft('v2');
    });
    
    expect(localStorage.getItem('test-key')).toBeNull();
    
    await act(async () => {
      await result.current[1].save();
    });
    
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('v2'));
  }, 10000);

  test('undo 可以撤销到上一个状态', async () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'v1', storageKey: 'test-key', saveDebounceMs: 100 })
    );
    
    act(() => {
      result.current[1].onChangeDraft('v2');
    });
    
    expect(result.current[0].curDraft).toBe('v2');
    
    await act(async () => {
      await result.current[1].save();
    });
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
  }, 10000);

  test('redo 可以重做', async () => {
    const { result } = renderHook(() => 
      useDraft({ initialValue: 'v1', storageKey: 'test-key', saveDebounceMs: 100 })
    );
    
    act(() => {
      result.current[1].onChangeDraft('v2');
    });
    
    await act(async () => {
      await result.current[1].save();
    });
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
    
    act(() => {
      result.current[1].redo();
    });
    
    expect(result.current[0].curDraft).toBe('v2');
  }, 10000);

  test('容量限制：超出时移除最早的历史记录', async () => {
    const { result } = renderHook(() => 
      useDraft({ 
        initialValue: 'v0', 
        storageKey: 'test-key',
        capacity: 3,
        saveDebounceMs: 100
      })
    );
    
    act(() => {
      result.current[1].onChangeDraft('v1');
    });
    await act(async () => {
      await result.current[1].save();
    });
    
    act(() => {
      result.current[1].onChangeDraft('v2');
    });
    await act(async () => {
      await result.current[1].save();
    });
    
    act(() => {
      result.current[1].onChangeDraft('v3');
    });
    await act(async () => {
      await result.current[1].save();
    });
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v2');
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
    
    act(() => {
      result.current[1].undo();
    });
    
    expect(result.current[0].curDraft).toBe('v1');
  }, 10000);
});
