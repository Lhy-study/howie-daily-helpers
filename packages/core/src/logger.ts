function transformString(...args: any[]): string {
    let result = '';
    for (const element of args) {
      if (typeof element === 'string') {
        result += element;
      } else if (typeof element === 'object') {
        result += JSON.stringify(element);
      } else {
        result += String(element);
      }
    }
    return result;
  }

/** 带 tag 模块名的日志记录器 */
export const createLogger = (moduleName: string) => {
  return {
    info: (...contents: any[]) => {
      console.log(`[${moduleName}]`, transformString(...contents));
    },
    error: (...contents: any[]) => {
      console.error(`[${moduleName}]`, transformString(...contents));
    },
    warn: (...contents: any[]) => {
      console.warn(`[${moduleName}]`, transformString(...contents));
    },
    debug: (...contents: any[]) => {
      console.debug(`[${moduleName}]`, transformString(...contents));
    },
  }
}