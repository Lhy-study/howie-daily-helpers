import { useState, type CSSProperties } from 'react';
import { useDraft } from 'howie-daily-helpers-react-hooks';

export default function UseDraftDemo() {
  const [{ curDraft, isSaving }, { undo, redo, onChangeDraft, reset, save }] = useDraft({
    initialValue: '',
    storageKey: 'demo-use-draft',
    capacity: 5,
    saveDebounceMs: 1000,
  });

  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = async () => {
    setSaveStatus('保存中...');
    await save();
    setSaveStatus('保存成功！');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h3 style={styles.title}>useDraft 草稿管理演示</h3>
        <p style={styles.desc}>输入内容后会自动保存到 localStorage，支持撤销/重做操作</p>
      </div>

      <div style={styles.textareaWrap}>
        <textarea
          style={styles.textarea}
          value={curDraft}
          onChange={(e) => onChangeDraft(e.target.value)}
          placeholder="在这里输入内容，体验草稿管理功能..."
          rows={6}
        />
        <div style={styles.status}>
          {isSaving && <span style={{ color: '#3b82f6' }}>自动保存中...</span>}
          {saveStatus && <span style={{ color: '#10b981' }}>{saveStatus}</span>}
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.btn} onClick={undo} disabled={!curDraft}>
          ↩ 撤销
        </button>
        <button style={styles.btn} onClick={redo}>
          ↪ 重做
        </button>
        <button style={styles.btn} onClick={reset}>
          🔄 重置
        </button>
        <button style={{ ...styles.btn, background: '#10b981' }} onClick={handleSave}>
          💾 手动保存
        </button>
      </div>

      <div style={styles.info}>
        <p>当前内容长度：<b>{curDraft.length}</b> 字符</p>
        <p>提示：输入后等待 1 秒会自动保存，也可以点击「手动保存」立即保存</p>
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
  textareaWrap: {
    marginBottom: 12,
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--vp-c-divider)',
    borderRadius: 6,
    background: 'var(--vp-c-bg)',
    color: 'var(--vp-c-text-1)',
    fontSize: 14,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  status: {
    fontSize: 12,
    color: 'var(--vp-c-text-2)',
    marginTop: 6,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  btn: {
    padding: '8px 16px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    background: '#3b82f6',
    transition: 'opacity 0.2s',
  },
  info: {
    fontSize: 13,
    color: 'var(--vp-c-text-2)',
    paddingTop: 12,
    borderTop: '1px solid var(--vp-c-divider)',
  },
};
