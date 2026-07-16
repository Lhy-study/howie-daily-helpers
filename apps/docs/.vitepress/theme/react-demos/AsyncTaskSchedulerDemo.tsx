import { useState, useRef, type CSSProperties } from 'react';
import { AsyncTaskScheduler, createLogger } from 'howie-daily-helpers-core';

const logger = createLogger('AsyncTaskSchedulerDemo');

interface TaskRecord {
  id: number;
  name: string;
  start: number; // 相对开始时刻的毫秒
  end: number;
}

function makeTask(
  name: string,
  onStart: (name: string) => void,
  onEnd: (name: string) => void,
) {
  return () =>
    new Promise<void>((resolve) => {
      onStart(name);
      logger.info(`▶ 任务 ${name} 开始`);
      setTimeout(() => {
        onEnd(name);
        logger.info(`✔ 任务 ${name} 结束`);
        resolve();
      }, 400 + Math.random() * 600);
    });
}

export default function AsyncTaskSchedulerDemo() {
  const [taskCount, setTaskCount] = useState(8);
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [records, setRecords] = useState<TaskRecord[]>([]);
  const [peak, setPeak] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);

  const t0 = useRef(0);
  const open = useRef(0); // 当前在跑的任务数（用于实时统计峰值）

  const start = async () => {
    if (running) return;
    setRunning(true);
    setRecords([]);
    setPeak(0);
    setTotal(0);
    open.current = 0;
    t0.current = performance.now();

    const scheduler = new AsyncTaskScheduler({
      maxConcurrency,
      onAllFinish: () => {
        logger.info('🎉 全部任务完成');
        console.log('[AsyncTaskScheduler] 🎉 全部任务完成');
      },
    });

    let seq = 0;
    const tasks = Array.from({ length: taskCount }, () => {
      const id = seq++;
      const name = `#${id + 1}`;
      return scheduler.addTask(
        makeTask(
          name,
          () => {
            const now = performance.now() - t0.current;
            open.current += 1;
            setPeak((p) => Math.max(p, open.current));
            setRecords((prev) => [...prev, { id, name, start: now, end: -1 }]);
          },
          () => {
            const now = performance.now() - t0.current;
            open.current -= 1;
            setRecords((prev) =>
              prev.map((r) => (r.id === id ? { ...r, end: now } : r)),
            );
          },
        ),
      );
    });

    await Promise.all(tasks);
    setTotal(Math.round(performance.now() - t0.current));
    setRunning(false);
  };

  // 时间轴比例尺
  const maxEnd = records.length ? Math.max(...records.map((r) => r.end)) : 0;
  const width = 100; // 百分比
  const scale = (ms: number) => (maxEnd > 0 ? (ms / maxEnd) * width : 0);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <label style={styles.label}>任务数</label>
        <input
          style={styles.input}
          type="number"
          min={1}
          max={50}
          value={taskCount}
          disabled={running}
          onChange={(e) => setTaskCount(Number(e.target.value) || 1)}
        />
        <label style={styles.label}>最大并发</label>
        <input
          style={styles.input}
          type="number"
          min={1}
          max={20}
          value={maxConcurrency}
          disabled={running}
          onChange={(e) => setMaxConcurrency(Number(e.target.value) || 1)}
        />
      </div>

      <div style={styles.actions}>
        <button
          style={{ ...styles.btn, background: '#3b82f6' }}
          onClick={start}
          disabled={running}
        >
          {running ? '运行中…' : '开始调度'}
        </button>
        <span style={styles.stat}>
          峰值并发：<b style={{ color: '#f0883e' }}>{peak}</b> / 上限 {maxConcurrency}
          {total > 0 && `　·　总耗时 ${total}ms`}
        </span>
      </div>

      {/* 时间轴泳道 */}
      <div style={styles.timeline}>
        {records.length === 0 && (
          <div style={{ color: '#6e7681', padding: 8 }}>
            点击「开始调度」：每条横杠是一个任务的实际执行区间，横轴为时间。
            同一时刻重叠的杠数 = 并发数，且不会超过设定的「最大并发」。
          </div>
        )}
        {records.map((r) => (
          <div key={r.id} style={styles.lane}>
            <span style={styles.laneLabel}>{r.name}</span>
            <div style={styles.track}>
              <div
                style={{
                  ...styles.bar,
                  left: `${scale(r.start)}%`,
                  width: `${Math.max(scale(r.end - r.start), 1)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {maxEnd > 0 && (
        <div style={styles.note}>
          提示：把「最大并发」调到 1，所有横杠会严格首尾相接（完全串行）；调大后会出现重叠，但重叠数始终 ≤ 上限。
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 8,
    padding: 16,
    margin: '16px 0',
    background: 'var(--vp-c-bg-soft)',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  label: { color: 'var(--vp-c-text-2)', fontSize: 13 },
  input: {
    width: 90,
    padding: '6px 10px',
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 6,
    background: 'var(--vp-c-bg)',
    color: 'var(--vp-c-text-1)',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '12px 0' },
  stat: { fontSize: 13, color: 'var(--vp-c-text-1)' },
  btn: {
    padding: '6px 14px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#fff',
  },
  timeline: {
    background: '#0d1117',
    borderRadius: 6,
    padding: 10,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
  lane: { display: 'flex', alignItems: 'center', margin: '3px 0' },
  laneLabel: { width: 42, color: '#8b949e', flexShrink: 0 },
  track: {
    position: 'relative',
    flex: 1,
    height: 14,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
  },
  bar: {
    position: 'absolute',
    top: 0,
    height: 14,
    background: 'linear-gradient(90deg, #3b82f6, #58a6ff)',
    borderRadius: 3,
  },
  note: { marginTop: 10, fontSize: 12, color: 'var(--vp-c-text-2)' },
};
