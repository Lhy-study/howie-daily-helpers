import { useState, useMemo, useRef } from 'react';
import { createLogger } from '@howie-daily-helpers/core';

type Level = 'info' | 'error' | 'warn' | 'debug';

const consoleMap: Record<Level, 'log' | 'error' | 'warn' | 'debug'> = {
  info: 'log',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
};

export default function LoggerDemo() {
  const [moduleName, setModuleName] = useState('user-service');
  const [input, setInput] = useState('服务启动');
  const [logs, setLogs] = useState<
    { id: number; level: Level; text: string }[]
  >([]);
  const seq = useRef(0);

  const logger = useMemo(() => createLogger(moduleName), [moduleName]);

  const run = (level: Level) => {
    const method = consoleMap[level];
    const original = console[method];
    console[method] = (...args: any[]) => {
      const text = args
        .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
        .join(' ');
      setLogs((prev) => [...prev, { id: seq.current++, level, text }]);
      original.apply(console, args);
    };
    try {
      logger[level](input);
    } finally {
      console[method] = original;
    }
  };

  const clear = () => setLogs([]);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <label style={styles.label}>模块名</label>
        <input
          style={styles.input}
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
        />
      </div>
      <div style={styles.row}>
        <label style={styles.label}>日志内容</label>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run('info')}
        />
      </div>
      <div style={styles.actions}>
        <button
          style={{ ...styles.btn, background: '#3b82f6' }}
          onClick={() => run('info')}
        >
          info
        </button>
        <button
          style={{ ...styles.btn, background: '#ef4444' }}
          onClick={() => run('error')}
        >
          error
        </button>
        <button
          style={{ ...styles.btn, background: '#f59e0b' }}
          onClick={() => run('warn')}
        >
          warn
        </button>
        <button
          style={{ ...styles.btn, background: '#8b5cf6' }}
          onClick={() => run('debug')}
        >
          debug
        </button>
        <button
          style={{ ...styles.btn, background: '#6b7280' }}
          onClick={clear}
        >
          清空
        </button>
      </div>
      <div style={styles.console}>
        {logs.length === 0 ? (
          <div style={{ color: '#6e7681' }}>
            点击上方按钮，体验 React 版 createLogger 输出
          </div>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              style={{ padding: '2px 0', whiteSpace: 'pre-wrap' }}
            >
              <span style={{ ...tagColor(item.level), marginRight: 6 }}>
                [{moduleName}]
              </span>
              <span>{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function tagColor(level: Level): React.CSSProperties {
  if (level === 'error') return { color: '#ff7b72' };
  if (level === 'warn') return { color: '#d29922' };
  if (level === 'debug') return { color: '#bc8cff' };
  return { color: '#58a6ff' };
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 8,
    padding: 16,
    margin: '16px 0',
    background: 'var(--vp-c-bg-soft)',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { width: 56, color: 'var(--vp-c-text-2)', fontSize: 13 },
  input: {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 6,
    background: 'var(--vp-c-bg)',
    color: 'var(--vp-c-text-1)',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' },
  btn: {
    padding: '6px 14px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#fff',
  },
  console: {
    background: '#0d1117',
    color: '#c9d1d9',
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
  },
};
