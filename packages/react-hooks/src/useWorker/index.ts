import { useCallback, useEffect, useRef } from 'react';

/** 默认返回一个 D 和 null 的联合类型 */
type TypeWidthNull<D, D2 = null> = D | D2;

type MsgCallback<D> = (data: D, e: MessageEvent<D>) => void;

// TODO: 后续可以扩展支持 promise 风格的 postMessage
/** 封装好的 worker 钩子 */
export default function useWorker<D extends any>(url: string) {
  const workerRef = useRef<TypeWidthNull<Worker>>(null);

  // 原生事件回调
  const msgRef = useRef<TypeWidthNull<MsgCallback<D>>>(null);
  const errRef = useRef<TypeWidthNull<(e: ErrorEvent) => void>>(null);

  useEffect(() => {
    // 拿到最新的 worker 实例
    workerRef.current = new Worker(url);

    const worker = workerRef.current;

    if (worker) {
      const handleMessage: (e: MessageEvent<D>) => void = (e) => {
        msgRef.current?.(e.data, e);
      };

      const handleError = (e: ErrorEvent) => {
        errRef.current?.(e);
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      return () => {
        worker.terminate();
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
      };
    }
  }, [url]);

  const postMessage = useCallback(
    async (data: D, transfer: Transferable[] = []) => {
      if (!workerRef.current) return;

      workerRef.current.postMessage(data, transfer);
    },
    [],
  );

  /** worker 完成回调 */
  const onMessage = useCallback((cb: MsgCallback<D>) => {
    msgRef.current = cb;
  }, []);

  const onErrMsg = useCallback((cb: (e: ErrorEvent) => void) => {
    errRef.current = cb;
  }, []);

  return {
    postMessage,
    onMessage,
    onErrMsg,
  };
}
