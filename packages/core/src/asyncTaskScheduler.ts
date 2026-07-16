interface TaskQueueItem {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  task: () => Promise<any>;
}

/** 异步并发任务调度器 */
export class AsyncTaskScheduler {
  /** 最大并发任务数 */
  private maxConcurrency: number;
  /** 所有任务完成时的回调函数 */
  private onAllFinish?: () => void | Promise<void>;
  /** 是否已添加任务 */
  private isMounted = false;
  /** 当前执行任务数 */
  private currentTaskCount = 0;
  /** 剩余任务数 */
  private remainingTaskCount = 0;
  /** 任务队列 */
  private taskQueue: TaskQueueItem[] = [];
  /** 执行任务 */
  private async runTask() {
    // 没有任务，或当前执行任务数已达最大并发，则不执行
    if (
      this.taskQueue.length === 0 ||
      this.currentTaskCount >= this.maxConcurrency
    ) {
      return;
    }

    const item = this.taskQueue.shift()!;
    this.currentTaskCount += 1;
    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.currentTaskCount -= 1;
      this.remainingTaskCount -= 1;
      if (this.remainingTaskCount === 0 && this.isMounted) {
        return await this.onAllFinish?.();
      }
      this.runTask();
    }
  }

  constructor(options?: {
    maxConcurrency?: number;
    onAllFinish?: () => void | Promise<void>;
  }) {
    const { maxConcurrency = 5, onAllFinish } = options || {};
    this.maxConcurrency = maxConcurrency;
    this.onAllFinish = onAllFinish;
    // 开启开关
    this.isMounted = true;
  }
  /** 添加任务 */
  public addTask<Result extends any>(task: () => Promise<Result>) {
    return new Promise<Result>((resolve, reject) => {
      this.remainingTaskCount += 1;
      this.taskQueue.push({ resolve, reject, task });
      this.runTask();
    });
  }
}
