import { EventEmitter } from 'howie-daily-helpers-core';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
import { AiChat } from 'howie-ai-widget';

export default function Text({
  eventEmitter,
}: {
  eventEmitter: EventEmitter<'open' | 'close'>;
}) {
  const chatRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 锁定背景滚动
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.margin = originalMargin;
    };
  }, [isOpen]);

  // 监听 open / close 事件
  eventEmitter.on('open', () => setIsOpen(true));

  const handleClose = () => {
    setIsOpen(false);
    eventEmitter.emit('close');
  };

  // Shadow Root + React Root
  const reactRootRef = useRef<Root | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;
    if (!container.shadowRoot) {
      container.attachShadow({ mode: 'open' });
    }
    const shadowRoot = container.shadowRoot;
    shadowRootRef.current = shadowRoot;
    const root = createRoot(shadowRoot as any);
    reactRootRef.current = root;
    return () => {
      root.unmount();
    };
  }, []);

  useEffect(() => {
    const root = reactRootRef.current;
    if (!root || !shadowRootRef.current) return;
    if (isOpen) {
      root.render(<AiChat shadowRoot={shadowRootRef.current} apiUrl={import.meta.env.VITE_API_BASE || ''}/>);
    } else {
      root.render(null);
    }
  }, [isOpen]);

  return createPortal(
    <div style={{ visibility: isOpen ? 'visible' : 'hidden' }}>
      {/* 宿主元素样式 + 响应式 */}
      <style>{`
        :host {
          all: initial;
          display: block;
          position: fixed;
          inset: 0;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999;
          pointer-events: none;
        }
        .ai-assistant-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
          border-right: 1px solid #e5e5e5;
          flex: 1;
          background: #fff;
        }
        @media (max-width: 767px) {
          .ai-assistant-brand {
            display: none;
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* 左侧品牌区域 — 小于 768px 隐藏 */}
        <div className='ai-assistant-brand'>
          <svg
            viewBox='0 0 120 120'
            style={{ width: 120, height: 120 }}
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <defs>
              <linearGradient id='logoGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#667eea' />
                <stop offset='100%' stopColor='#764ba2' />
              </linearGradient>
            </defs>
            <circle cx='60' cy='60' r='55' stroke='url(#logoGrad)' strokeWidth='3' fill='none' />
            <circle cx='60' cy='60' r='45' fill='url(#logoGrad)' opacity='0.1' />
            <circle cx='42' cy='50' r='7' fill='url(#logoGrad)' />
            <circle cx='78' cy='50' r='7' fill='url(#logoGrad)' />
            <path d='M40 72c0 0 8 10 20 10s20-10 20-10' stroke='url(#logoGrad)' strokeWidth='3' strokeLinecap='round' />
            <path d='M60 15v10M60 95v10M15 60h10M95 60h10' stroke='url(#logoGrad)' strokeWidth='2' strokeLinecap='round' opacity='0.5' />
          </svg>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 2,
              lineHeight: '32px',
            }}
          >
            智能助手
          </div>
          <div style={{ fontSize: 14, color: '#999', letterSpacing: 4, textTransform: 'uppercase' }}>
            AI Assistant
          </div>
        </div>

        {/* 右侧对话区域 — 上下结构：header + chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '880px', minWidth: 0 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #eee',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>AI 助手</span>
            <button
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 8,
                background: 'transparent',
                color: '#999',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f3f3')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ✕
            </button>
          </div>

          {/* Chat */}
          <div
            ref={chatRef}
            style={{ flex: 1, minHeight: 0, backgroundColor: '#fff' }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
