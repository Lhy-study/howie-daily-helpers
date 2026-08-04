import { describe, expect, test, vi } from 'vitest';
import { EventEmitter } from '../src/eventEmitter';

type Events = 'open' | 'close' | 'error' | 'data';

describe('EventEmitter', () => {
  test('on 注册事件监听器，emit 触发时执行回调', () => {
    const emitter = new EventEmitter<Events>();
    const cb = vi.fn();

    emitter.on('open', cb);
    emitter.emit('open');

    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('emit 触发时携带参数传递给回调', () => {
    const emitter = new EventEmitter<Events>();
    const cb = vi.fn();

    emitter.on('open', cb);
    emitter.emit('open', 'arg1', 42);

    expect(cb).toHaveBeenCalledWith('arg1', 42);
  });

  test('onOnce 注册的事件只执行一次', () => {
    const emitter = new EventEmitter<Events>();
    const cb = vi.fn();

    emitter.onOnce('open', cb);
    emitter.emit('open');
    emitter.emit('open');

    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('off 移除事件监听器后不再触发', () => {
    const emitter = new EventEmitter<Events>();
    const cb = vi.fn();

    emitter.on('open', cb);
    emitter.off('open', cb);
    emitter.emit('open');

    expect(cb).not.toHaveBeenCalled();
  });

  test('clear 移除指定事件的所有监听器', () => {
    const emitter = new EventEmitter<Events>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    emitter.on('open', cb1);
    emitter.on('open', cb2);
    emitter.clear('open');
    emitter.emit('open');

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  test('clearAll 移除所有事件的所有监听器', () => {
    const emitter = new EventEmitter<Events>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    emitter.on('open', cb1);
    emitter.on('close', cb2);
    emitter.clearAll();
    emitter.emit('open');
    emitter.emit('close');

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  test('多次 on 注册同一个回调，emit 时只触发一次（Set 去重）', () => {
    const emitter = new EventEmitter<Events>();
    const cb = vi.fn();

    emitter.on('open', cb);
    emitter.on('open', cb);
    emitter.emit('open');

    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('未注册事件时 emit 不报错', () => {
    const emitter = new EventEmitter<Events>();

    expect(() => {
      emitter.emit('open');
    }).not.toThrow();
  });

  test('onOnce 注册后再次同事件 on 注册，emit 时 onOnce 只执行一次，on 正常执行', () => {
    const emitter = new EventEmitter<Events>();
    const onceCb = vi.fn();
    const normalCb = vi.fn();

    emitter.onOnce('open', onceCb);
    emitter.on('open', normalCb);

    emitter.emit('open');
    emitter.emit('open');

    expect(onceCb).toHaveBeenCalledTimes(1);
    expect(normalCb).toHaveBeenCalledTimes(2);
  });

  test('emit 回调中抛出错误不阻止其他回调执行', () => {
    const emitter = new EventEmitter<Events>();
    const errorCb = vi.fn(() => {
      throw new Error('cb error');
    });
    const normalCb = vi.fn();

    emitter.on('open', errorCb);
    emitter.on('open', normalCb);

    expect(() => {
      emitter.emit('open');
    }).not.toThrow();

    expect(normalCb).toHaveBeenCalledTimes(1);
  });

  test('emit 嵌套 emit 时行为正确（使用 Array.from 快照）', () => {
    const emitter = new EventEmitter<Events>();
    const order: string[] = [];

    emitter.on('open', () => {
      order.push('cb1');
      emitter.emit('data');
    });
    emitter.on('open', () => {
      order.push('cb2');
    });

    // 在 cb1 中触发 data 事件，data 回调会立即执行（内层 emt 同步执行）
    // 但 data 事件的回调不会被加入外层 open 的遍历快照中
    emitter.on('data', () => {
      order.push('data_cb');
    });

    emitter.emit('open');

    // cb1 执行 → 触发 data → data_cb 立即执行 → 回到外层 forEach → cb2 执行
    expect(order).toEqual(['cb1', 'data_cb', 'cb2']);
  });

  test('getAllListeners 返回所有已注册事件名称', () => {
    const emitter = new EventEmitter<Events>();

    emitter.on('open', vi.fn());
    emitter.on('close', vi.fn());

    const listeners = emitter.getAllListeners();
    expect(listeners).toContain('open');
    expect(listeners).toContain('close');
  });

  test('getAllListeners 在 clear 后不再包含已清除的事件', () => {
    const emitter = new EventEmitter<Events>();

    emitter.on('open', vi.fn());
    emitter.on('close', vi.fn());
    emitter.clear('open');

    const listeners = emitter.getAllListeners();
    expect(listeners).not.toContain('open');
    expect(listeners).toContain('close');
  });
});