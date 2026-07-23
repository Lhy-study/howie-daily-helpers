import { describe, expect, test, vi } from 'vitest';
import { PriorityQueue, PriorityQueuePriority } from '../src/priorityQueue';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('PriorityQueue', () => {
  test('等待队列中的任务按优先级执行，高优先级先执行', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(async () => {
      await delay(30);
      order.push(0);
    }, PriorityQueuePriority.Low);

    q.queue(async () => {
      await delay(10);
      order.push(1);
    }, PriorityQueuePriority.Low);

    q.queue(async () => {
      await delay(10);
      order.push(2);
    }, PriorityQueuePriority.Highest);

    q.queue(async () => {
      await delay(10);
      order.push(3);
    }, PriorityQueuePriority.Medium);

    await delay(200);

    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
    expect(order[2]).toBe(3);
    expect(order[3]).toBe(1);
  });

  test('同优先级任务按入队顺序执行（FIFO）', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    for (let i = 0; i < 5; i++) {
      const idx = i;
      q.queue(async () => {
        await delay(5);
        order.push(idx);
      }, PriorityQueuePriority.Medium);
    }

    await delay(100);

    expect(order).toEqual([0, 1, 2, 3, 4]);
  });

  test('任务串行执行，同一时间只有一个任务在运行', async () => {
    const q = new PriorityQueue();
    let running = 0;
    let maxRunning = 0;

    const track = vi.fn(async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await delay(10);
      running -= 1;
    });

    for (let i = 0; i < 5; i++) {
      q.queue(track, PriorityQueuePriority.Medium);
    }

    await delay(100);

    expect(maxRunning).toBe(1);
    expect(track).toHaveBeenCalledTimes(5);
  });

  test('append 将任务添加到最低优先级末尾', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(async () => {
      await delay(30);
      order.push(0);
    }, PriorityQueuePriority.Medium);

    q.queue(async () => {
      await delay(10);
      order.push(1);
    }, PriorityQueuePriority.Medium);

    q.append(async () => {
      await delay(10);
      order.push(2);
    });

    q.queue(async () => {
      await delay(10);
      order.push(3);
    }, PriorityQueuePriority.High);

    await delay(200);

    expect(order[0]).toBe(0);
    expect(order[1]).toBe(3);
    expect(order[2]).toBe(1);
    expect(order[3]).toBe(2);
  });

  test('默认优先级为 Medium', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(async () => {
      await delay(30);
      order.push(0);
    }, PriorityQueuePriority.Low);

    q.queue(async () => {
      await delay(10);
      order.push(1);
    }, PriorityQueuePriority.High);

    q.queue(async () => {
      await delay(10);
      order.push(2);
    });

    q.queue(async () => {
      await delay(10);
      order.push(3);
    }, PriorityQueuePriority.Low);

    await delay(200);

    expect(order[0]).toBe(0);
    expect(order[1]).toBe(1);
    expect(order[2]).toBe(2);
    expect(order[3]).toBe(3);
  });

  test('单个任务失败不影响后续任务执行', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    q.queue(async () => {
      await delay(5);
      order.push(1);
      throw new Error('task 1 failed');
    }, PriorityQueuePriority.High);

    q.queue(async () => {
      await delay(5);
      order.push(2);
    }, PriorityQueuePriority.Medium);

    q.queue(async () => {
      await delay(5);
      order.push(3);
    }, PriorityQueuePriority.Low);

    await delay(100);

    expect(order).toEqual([1, 2, 3]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('老化机制：每执行一个任务后，等待队列中任务优先级提升', async () => {
    const q = new PriorityQueue();
    const order: string[] = [];

    q.queue(async () => {
      await delay(10);
      order.push('first');
    }, PriorityQueuePriority.Highest);

    q.queue(async () => {
      await delay(10);
      order.push('low-1');
    }, PriorityQueuePriority.Lowest);

    q.queue(async () => {
      await delay(10);
      order.push('low-2');
    }, PriorityQueuePriority.Lowest);

    q.queue(async () => {
      await delay(10);
      order.push('medium-1');
    }, PriorityQueuePriority.Medium);

    await delay(200);

    expect(order[0]).toBe('first');
    expect(order.length).toBe(4);

    const afterFirst = order.slice(1);
    expect(afterFirst).toContain('medium-1');
    expect(afterFirst).toContain('low-1');
    expect(afterFirst).toContain('low-2');
  });

  test('空队列时不执行任何操作', async () => {
    const q = new PriorityQueue();
    const fn = vi.fn();

    await delay(50);

    expect(fn).not.toHaveBeenCalled();
  });

  test('支持同步任务', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(() => {
      order.push(1);
    }, PriorityQueuePriority.Medium);

    q.queue(() => {
      order.push(2);
    }, PriorityQueuePriority.High);

    await delay(50);

    expect(order).toEqual([1, 2]);
  });

  test('Highest 优先级不再提升', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(async () => {
      await delay(5);
      order.push(1);
    }, PriorityQueuePriority.Highest);

    q.queue(async () => {
      await delay(5);
      order.push(2);
    }, PriorityQueuePriority.Highest);

    q.queue(async () => {
      await delay(5);
      order.push(3);
    }, PriorityQueuePriority.Highest);

    await delay(100);

    expect(order).toEqual([1, 2, 3]);
  });

  test('动态添加任务仍按优先级排序', async () => {
    const q = new PriorityQueue();
    const order: number[] = [];

    q.queue(async () => {
      await delay(30);
      order.push(0);
    }, PriorityQueuePriority.Low);

    q.queue(async () => {
      await delay(10);
      order.push(1);
    }, PriorityQueuePriority.Low);

    await delay(5);

    q.queue(async () => {
      await delay(10);
      order.push(2);
    }, PriorityQueuePriority.High);

    await delay(200);

    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
    expect(order[2]).toBe(1);
  });
});
