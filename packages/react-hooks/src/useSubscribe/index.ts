import { useCallback, useState } from "react";

/** 立即更新状态 */
export default function useSubscribe() {
  const [_, setState] = useState({});
  
  const subscribe = useCallback(() => {
    setState({});
  }, [])

  return subscribe;
}