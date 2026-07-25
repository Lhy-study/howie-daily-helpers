import { describe, expect, test, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWorker from '../src/useWorker';

interface MockWorkerInstance {
  url: string;
  addEventListener: MockInstance;
  removeEventListener: MockInstance;
  terminate: MockInstance;
  postMessage: MockInstance;
}

describe('useWorker', () => {
  let mockAddEventListener: MockInstance;
  let mockRemoveEventListener: MockInstance;
  let mockTerminate: MockInstance;
  let mockPostMessage: MockInstance;
  let OriginalWorker: typeof Worker;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    mockTerminate = vi.fn();
    mockPostMessage = vi.fn();

    OriginalWorker = global.Worker;
    
    class MockWorker {
      url: string;
      addEventListener: MockInstance;
      removeEventListener: MockInstance;
      terminate: MockInstance;
      postMessage: MockInstance;
      
      constructor(url: string) {
        this.url = url;
        this.addEventListener = mockAddEventListener;
        this.removeEventListener = mockRemoveEventListener;
        this.terminate = mockTerminate;
        this.postMessage = mockPostMessage;
      }
    }
    
    global.Worker = MockWorker as unknown as typeof Worker;
  });

  afterEach(() => {
    global.Worker = OriginalWorker;
    vi.restoreAllMocks();
  });

  test('创建 Worker 实例', () => {
    const url = 'worker.js';
    
    renderHook(() => useWorker<number>(url));
    
    expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('postMessage 发送消息', () => {
    const { result } = renderHook(() => useWorker<number>('worker.js'));
    
    act(() => {
      result.current.postMessage(42);
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith(42, []);
  });

  test('postMessage 发送消息并传递 Transferable', () => {
    const { result } = renderHook(() => useWorker<number>('worker.js'));
    const transfer = [] as Transferable[];
    
    act(() => {
      result.current.postMessage(42, transfer);
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith(42, transfer);
  });

  test('onMessage 注册消息回调', () => {
    const msgCallback = vi.fn();
    
    const { result } = renderHook(() => useWorker<number>('worker.js'));
    
    result.current.onMessage(msgCallback);
    
    const messageHandler = mockAddEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )?.[1] as (e: MessageEvent<number>) => void;
    
    expect(messageHandler).toBeDefined();
    
    act(() => {
      messageHandler({ data: 42 } as MessageEvent<number>);
    });
    
    expect(msgCallback).toHaveBeenCalledWith(42, expect.any(Object));
  });

  test('onErrMsg 注册错误回调', () => {
    const errCallback = vi.fn();
    
    const { result } = renderHook(() => useWorker<number>('worker.js'));
    
    result.current.onErrMsg(errCallback);
    
    const errorHandler = mockAddEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )?.[1] as (e: ErrorEvent) => void;
    
    expect(errorHandler).toBeDefined();
    
    act(() => {
      errorHandler({ message: 'error' } as ErrorEvent);
    });
    
    expect(errCallback).toHaveBeenCalledWith(expect.any(Object));
  });

  test('组件卸载时终止 Worker 并移除事件监听', () => {
    const { unmount } = renderHook(() => useWorker<number>('worker.js'));
    
    unmount();
    
    expect(mockTerminate).toHaveBeenCalledTimes(1);
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
  });

  test('url 改变时创建新的 Worker', () => {
    let workerCount = 0;
    
    class CountingWorker {
      url: string;
      addEventListener: MockInstance;
      removeEventListener: MockInstance;
      terminate: MockInstance;
      postMessage: MockInstance;
      
      constructor(url: string) {
        workerCount++;
        this.url = url;
        this.addEventListener = mockAddEventListener;
        this.removeEventListener = mockRemoveEventListener;
        this.terminate = mockTerminate;
        this.postMessage = mockPostMessage;
      }
    }
    
    global.Worker = CountingWorker as unknown as typeof Worker;
    
    const { rerender } = renderHook(({ url }) => useWorker<number>(url), {
      initialProps: { url: 'worker1.js' }
    });
    
    expect(workerCount).toBe(1);
    
    rerender({ url: 'worker2.js' });
    
    expect(workerCount).toBe(2);
    expect(mockTerminate).toHaveBeenCalledTimes(1);
  });
});
