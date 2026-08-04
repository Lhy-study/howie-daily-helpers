import { describe, expect, test, vi } from 'vitest';
import { StateMachine } from '../src/machine';

type States = 'idle' | 'loading' | 'success' | 'error';
type Events = 'FETCH' | 'RESOLVE' | 'REJECT' | 'RESET';

describe('StateMachine', () => {
  test('初始状态为 config 中指定的值', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    expect(machine.getState()).toBe('idle');
  });

  test('send 合法事件后状态正确转移', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    machine.send('FETCH');
    expect(machine.getState()).toBe('loading');

    machine.send('RESOLVE');
    expect(machine.getState()).toBe('success');

    machine.send('RESET');
    expect(machine.getState()).toBe('idle');
  });

  test('send 非法事件时状态不变，返回 false', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    const result = machine.send('RESOLVE');

    expect(result).toBe(false);
    expect(machine.getState()).toBe('idle');
  });

  test('send 返回 true 表示转移成功', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    const result = machine.send('FETCH');
    expect(result).toBe(true);
  });

  test('send 携带 action 时执行 action 回调', () => {
    const action = vi.fn();

    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            FETCH: { target: 'loading', action },
          },
        },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    machine.send('FETCH', 'payload1', 'payload2');

    expect(action).toHaveBeenCalled();
    expect(machine.getState()).toBe('loading');
  });

  test('action 回调接收 send 传递的参数', () => {
    const action = vi.fn();

    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: {
          on: {
            FETCH: { target: 'loading', action },
          },
        },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    machine.send('FETCH', { id: 1 });

    expect(action).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('send 不携带 action 时状态正常转移', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    const result = machine.send('FETCH');

    expect(result).toBe(true);
    expect(machine.getState()).toBe('loading');
  });

  test('初始化时抛出错误：initial 状态未在 states 中定义', () => {
    expect(() => {
      new StateMachine({
        initial: 'unknown' as States,
        states: {
          idle: { on: { FETCH: 'loading' } },
          loading: { on: { RESOLVE: 'success' } },
        },
      });
    }).toThrow();
  });

  test('复杂状态机完整流程', () => {
    const machine = new StateMachine<States, Events>({
      initial: 'idle',
      states: {
        idle: { on: { FETCH: 'loading' } },
        loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
        success: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    });

    // idle → loading → error → idle → loading → success
    machine.send('FETCH');
    expect(machine.getState()).toBe('loading');

    machine.send('REJECT');
    expect(machine.getState()).toBe('error');

    machine.send('RESET');
    expect(machine.getState()).toBe('idle');

    machine.send('FETCH');
    expect(machine.getState()).toBe('loading');

    machine.send('RESOLVE');
    expect(machine.getState()).toBe('success');
  });
});