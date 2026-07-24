import { createLogger } from './logger';
const logger = createLogger('StateMachine');

// 1. 定义状态机的配置类型
export interface StateMachineConfig<S extends string, E extends string> {
  initial: S; // 初始状态
  states: Record<
    S,
    {
      on?: Partial<
        Record<E, S | { target: S; action?: (payload?: any) => void }>
      >; // 事件映射
    }
  >;
}

/**
 * 一个轻量级状态机
 */
export class StateMachine<S extends string, E extends string> {
  private currentState: S;
  private config: StateMachineConfig<S, E>;

  constructor(config: StateMachineConfig<S, E>) {
    this.config = config;
    this.currentState = config.initial;

    if (!config.states[config.initial]) {
      throw new Error(
        `[StateMachine] Initial state "${config.initial}" is not defined in states.`,
      );
    }
  }

  /** 获取当前 state */
  public getState() {
    return this.currentState;
  }

  public send(eventName: E, ...res: any[]) {
    const curState = this.currentState;

    const executeConfig = this.config.states[curState];

    // 匹配的 action
    const match = executeConfig?.on?.[eventName];

    // 1. 如果没有定义该事件，或者当前状态不允许该事件，直接拦截
    if (!match) {
      logger.warn(`Invalid transition: "${eventName}" in state "${curState}"`);
      return false;
    }

    const isObject = typeof match === 'object';
    const newState = isObject ? match?.target : match;
    const action = isObject ? match?.action : undefined;

    this.currentState = newState as S;
    if (action) {
      action(res);
    }

    return true;
  }
}
