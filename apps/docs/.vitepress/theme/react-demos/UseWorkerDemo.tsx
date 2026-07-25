import { useState, useEffect, type CSSProperties } from 'react';
import { useWorker } from 'howie-daily-helpers-react-hooks';

const workerCode = `
self.addEventListener('message', (e) => {
  const { type, data } = e.data;
  
  if (type === 'reverse') {
    const result = data.split('').reverse().join('');
    self.postMessage({ type: 'result', data: result });
  } else if (type === 'uppercase') {
    const result = data.toUpperCase();
    self.postMessage({ type: 'result', data: result });
  } else if (type === 'length') {
    const result = \`文本长度: \${data.length} 字符\`;
    self.postMessage({ type: 'result', data: result });
  }
});
`;

export default function UseWorkerDemo() {
  const [inputValue, setInputValue] = useState('');
  const [operation, setOperation] = useState<'reverse' | 'uppercase' | 'length'>('reverse');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [workerUrl, setWorkerUrl] = useState<string>('');

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    setWorkerUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  const { postMessage, onMessage, onErrMsg } = useWorker<{ type: string; data: any }>(workerUrl);

  useEffect(() => {
    if (!workerUrl) return;
    
    onMessage((data) => {
      setResult(String(data.data));
      setStatus('完成');
    });

    onErrMsg((e) => {
      setResult(`错误: ${e.message}`);
      setStatus('错误');
    });
  }, [workerUrl, onMessage, onErrMsg]);

  const handleRun = () => {
    if (!workerUrl) {
      setResult('Worker 正在初始化...');
      return;
    }
    if (!inputValue.trim()) {
      setResult('请输入文本内容');
      return;
    }

    setStatus('处理中...');
    
    postMessage({ type: operation, data: inputValue });
  };

  const operationNames: Record<string, string> = {
    reverse: '反转文本',
    uppercase: '转为大写',
    length: '计算长度',
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h3 style={styles.title}>useWorker Web Worker 封装演示</h3>
        <p style={styles.desc}>在 Web Worker 中处理文本，避免阻塞主线程</p>
      </div>

      <div style={styles.form}>
        <div style={styles.row}>
          <label style={styles.label}>选择操作</label>
          <select
            style={styles.select}
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
          >
            <option value="reverse">反转文本</option>
            <option value="uppercase">转为大写</option>
            <option value="length">计算长度</option>
          </select>
        </div>

        <div style={styles.row}>
          <label style={styles.label}>输入文本</label>
          <input
            style={styles.input}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入文本..."
          />
          <button style={styles.btn} onClick={handleRun}>
            执行
          </button>
        </div>
      </div>

      <div style={styles.resultArea}>
        <div style={styles.resultBox}>
          <div style={styles.resultHeader}>
            <span>执行状态:</span>
            <span style={{ color: status === '处理中...' ? '#f59e0b' : status === '错误' ? '#ef4444' : '#10b981' }}>
              {status || '等待执行'}
            </span>
          </div>
          <div style={styles.resultContent}>
            <span>结果:</span>
            <span style={{ fontWeight: 600 }}>{result || '-'}</span>
          </div>
        </div>
      </div>

      <div style={styles.info}>
        <p>提示：Web Worker 在后台线程中执行，不会阻塞页面响应</p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 8,
    padding: 20,
    margin: '16px 0',
    background: 'var(--vp-c-bg-soft)',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--vp-c-text-1)',
    margin: 0,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
    margin: 0,
  },
  form: {
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    width: 90,
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
  },
  select: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 6,
    background: 'var(--vp-c-bg)',
    color: 'var(--vp-c-text-1)',
    fontSize: 14,
    minWidth: 150,
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 6,
    background: 'var(--vp-c-bg)',
    color: 'var(--vp-c-text-1)',
    fontSize: 14,
    minWidth: 150,
  },
  btn: {
    padding: '8px 16px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    background: '#3b82f6',
    whiteSpace: 'nowrap',
  },
  resultArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  resultBox: {
    padding: 12,
    background: 'var(--vp-c-bg)',
    borderRadius: 6,
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
    marginBottom: 8,
  },
  resultContent: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 16,
    color: 'var(--vp-c-text-1)',
  },
  info: {
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
    paddingTop: 12,
    borderTop: '1px solid var(--vp-c-divider)',
  },
};
