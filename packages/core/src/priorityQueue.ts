/** 优先队列任务优先级 */
export enum PriorityQueuePriority {
  Highest = 1,
  High = 2,
  Medium = 3,
  Low = 4,
  Lowest = 5,
}

/** 优先级提升 */
function upgradePriority(level: PriorityQueuePriority) {
  return level > PriorityQueuePriority.Highest ? level - 1 : level;
}

/**
 * 数组实现优先级任务队列（非堆实现）
 * 任务串行执行，按优先级调度；同优先级遵循入队顺序；支持动态老化机制，防止低优先级任务饥饿。
 * 局限：任务数量较多时排序开销更大，适合中小规模任务调度场景。
 */
export class PriorityQueue<T extends () => void | Promise<void>> {
  /** 任务队列，始终保持最高优先级的任务在队头 */
  private items: { task: T; priority: PriorityQueuePriority }[] = [];
  /** 运行锁，防止并发执行 */
  private isRunning = false;
  /**
   * 推入任务，按优先级插入队列
   * @param task 任务函数
   * @param priority 优先级，默认 Medium
   */
  public queue(
    task: T,
    priority: PriorityQueuePriority = PriorityQueuePriority.Medium,
  ) {
    let index = -1;
    // 找到第一个优先级 > 当前priority 的位置，插入在它前面
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > priority) {
        index = i;
        break; // 立刻终止！
      }
    }

    if (index === -1) {
      this.items.push({ task, priority });
    } else {
      this.items.splice(index, 0, { task, priority });
    }

    this.run();
  }
  /** 优先级设置最低并且添加到末尾上 */
  public append(task: T) {
    this.items.push({ task, priority: PriorityQueuePriority.Lowest });
    this.run();
  }

  /** 执行任务 */
  private async run() {
    if (this.isRunning || this.items.length <= 0) return;
    this.isRunning = true;
    const task = this.items.shift()!.task;

    // 这里先把剩余任务进行排序，确保最高优先级的任务在队头
    if (this.items.length > 0) {
      this.aging();
    }

    try {
      await task();
    } catch (error) {
      console.error('[PriorityQueue] error:', error);
    } finally {
      this.isRunning = false;
    }

    // 递归调用，继续执行下一个任务
    this.run();
  }
  // 老化：所有等待任务优先级提升
  private aging() {
    this.items.forEach((item) => {
      item.priority = upgradePriority(item.priority);
    });
  }
}
