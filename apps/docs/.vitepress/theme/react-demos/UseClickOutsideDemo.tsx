import { useState, useRef, type CSSProperties } from 'react';
import { useClickOutSide } from 'howie-daily-helpers-react-hooks';

export default function UseClickOutsideDemo() {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutSide(containerRef, () => {
    setCount((c) => c + 1);
  });

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h3 style={styles.title}>useClickOutside 点击外部检测演示</h3>
        <p style={styles.desc}>点击下方卡片外部区域，数字会自动加一</p>
      </div>

      <div ref={containerRef} style={styles.card}>
        <div style={styles.count}>
          点击外部次数：<span style={styles.number}>{count}</span>
        </div>
        <p style={styles.tip}>点击卡片内部不会触发计数</p>
      </div>

      <div style={styles.info}>
        <p>提示：在卡片外部的任何位置点击，计数器都会增加</p>
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
  card: {
    padding: 24,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 8,
    textAlign: 'center',
    cursor: 'default',
  },
  count: {
    fontSize: 18,
    color: '#fff',
    margin: 0,
    marginBottom: 8,
  },
  number: {
    fontSize: 36,
    fontWeight: 700,
    display: 'block',
    marginTop: 8,
  },
  tip: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },
  info: {
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
    paddingTop: 12,
    borderTop: '1px solid var(--vp-c-divider)',
    marginTop: 16,
  },
};
