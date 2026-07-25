import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSubscribe from '../src/useSubscribe';

describe('useSubscribe', () => {
  test('返回的 subscribe 函数是稳定的引用', () => {
    const { result, rerender } = renderHook(() => useSubscribe());
    const subscribe1 = result.current;
    
    rerender();
    
    const subscribe2 = result.current;
    expect(subscribe1).toBe(subscribe2);
  });

  test('调用 subscribe 会触发组件重新渲染', () => {
    const renderCountRef = { current: 0 };
    
    const { result } = renderHook(() => {
      renderCountRef.current++;
      return useSubscribe();
    });
    
    expect(renderCountRef.current).toBe(1);
    
    act(() => {
      result.current();
    });
    
    expect(renderCountRef.current).toBe(2);
  });

  test('subscribe 函数可以被多次调用', () => {
    const renderCountRef = { current: 0 };
    
    const { result } = renderHook(() => {
      renderCountRef.current++;
      return useSubscribe();
    });
    
    expect(renderCountRef.current).toBe(1);
    
    act(() => {
      result.current();
    });
    expect(renderCountRef.current).toBe(2);
    
    act(() => {
      result.current();
    });
    expect(renderCountRef.current).toBe(3);
    
    act(() => {
      result.current();
    });
    expect(renderCountRef.current).toBe(4);
  });
});
