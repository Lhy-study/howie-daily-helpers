import { describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useClickOutSide from '../src/useClickOutside';

describe('useClickOutSide', () => {
  test('点击外部元素时触发回调', () => {
    const cb = vi.fn();
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    
    const domRef = { current: dom };
    
    renderHook(() => useClickOutSide(domRef, cb));
    
    act(() => {
      document.body.click();
    });
    
    expect(cb).toHaveBeenCalledTimes(1);
    
    document.body.removeChild(dom);
  });

  test('点击内部元素时不触发回调', () => {
    const cb = vi.fn();
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    
    const child = document.createElement('span');
    dom.appendChild(child);
    
    const domRef = { current: dom };
    
    renderHook(() => useClickOutSide(domRef, cb));
    
    act(() => {
      child.click();
    });
    
    expect(cb).not.toHaveBeenCalled();
    
    act(() => {
      dom.click();
    });
    
    expect(cb).not.toHaveBeenCalled();
    
    document.body.removeChild(dom);
  });

  test('回调引用改变时使用最新的回调', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    
    const domRef = { current: dom };
    
    const { rerender } = renderHook(({ callback }) => 
      useClickOutSide(domRef, callback),
      { initialProps: { callback: cb1 } }
    );
    
    act(() => {
      document.body.click();
    });
    
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();
    
    rerender({ callback: cb2 });
    
    act(() => {
      document.body.click();
    });
    
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    
    document.body.removeChild(dom);
  });

  test('组件卸载时移除事件监听', () => {
    const cb = vi.fn();
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    
    const domRef = { current: dom };
    
    const { unmount } = renderHook(() => useClickOutSide(domRef, cb));
    
    act(() => {
      document.body.click();
    });
    
    expect(cb).toHaveBeenCalledTimes(1);
    
    unmount();
    
    act(() => {
      document.body.click();
    });
    
    expect(cb).toHaveBeenCalledTimes(1);
    
    document.body.removeChild(dom);
  });
});
