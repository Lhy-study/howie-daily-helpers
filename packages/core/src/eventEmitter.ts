type CB = (...args: any[]) => void;
import { createLogger } from './logger';
const logger = createLogger('EventEmitter');

export class EventEmitter<EventName extends string> {
  private events: Map<EventName, Set<CB>> = new Map();
  /** 仅执行一次的事件监听器记录*/
  private onceEvents: Map<EventName, Set<CB>> = new Map();

  /** 添加任务 */
  private addTask(eventName: EventName, cb: CB) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(cb);
    return cb;
  }

  /** 注册事件监听器 */
  public on(eventName: EventName, cb: CB) {
    return this.addTask(eventName, cb);
  }

  /** 注册事件监听器，仅执行一次 */
  public onOnce(eventName: EventName, cb: CB) {
    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, new Set());
    }
    this.onceEvents.get(eventName)!.add(cb);

    return this.addTask(eventName, cb);
  }

  /** 触发事件 */
  public emit(eventName: EventName, ...args: any[]) {
    let set = this.events.get(eventName) || new Set();
    if (set.size === 0) {
      return;
    }
    const onceSet = this.onceEvents.get(eventName) || new Set();
    // 虽然 Set.prototype.forEach 在规范上允许在遍历时删除当前元素，但如果在回调函数 cb(...args) 内部，用户又触发了同一个事件（嵌套 emit），或者在回调中调用了 off 移除了后续的监听器，可能会导致遍历行为不符合预期（例如跳过某些回调或报错）。
    // 因此，这里使用 Array.from(set) 转换为数组，确保在遍历过程中不会修改集合的大小。
    Array.from(set).forEach((cb) => {
      try {
        cb(...args);
      } catch (error) {
        logger.error(`EventEmitter Error in "${eventName}":`, error);
      }
      if (onceSet.has(cb)) {
        onceSet.delete(cb);
        set.delete(cb);
      }

      // 清理空的 once Set
      if (onceSet.size === 0) {
        this.onceEvents.delete(eventName);
      }
    });
  }

  /** 移除事件监听器 */
  public off(eventName: EventName, cb: CB) {
    let set = this.events.get(eventName) || new Set();
    set.delete(cb);
    this.events.set(eventName, set);
  }

  /** 移除所有事件监听器 */
  public clear(eventName: EventName) {
    this.events.delete(eventName);
    this.onceEvents.delete(eventName);
  }

  /** 移除所有事件监听器 */
  public clearAll() {
    this.events.clear();
    this.onceEvents.clear();
  }

  /** 获取所有事件监听器名称 */
  public getAllListeners() {
    return Array.from(this.events.keys());
  }
}
