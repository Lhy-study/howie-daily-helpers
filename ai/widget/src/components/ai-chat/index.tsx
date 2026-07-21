import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cssText } from './cssText';

interface AiChatProps {
  /** 宿主 ShadowRoot，用于注入样式 */
  shadowRoot: ShadowRoot;
  /** Worker API 地址 */
  apiUrl?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; filePath: string }[];
}

const SESSION_KEY = 'ai_chat_messages';

/** 从 sessionStorage 读取历史消息 */
function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** AI Chat 智能组件 */
export default function AiChat(props: AiChatProps) {
  const { shadowRoot, apiUrl = 'http://127.0.0.1:8787' } = props;

  // ---- 状态 ----
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---- 注入样式 ----
  useEffect(() => {
    if (!shadowRoot) return;
    const existingStyle = shadowRoot.querySelector('style');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.innerHTML = cssText;
      shadowRoot.appendChild(style);
    } else if (existingStyle.innerHTML !== cssText) {
      existingStyle.innerHTML = cssText;
    }
  }, [shadowRoot]);

  // ---- 自动滚到底部 ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- 消息持久化到 sessionStorage（关闭标签页自动清除） ----
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // 存储满时忽略
    }
  }, [messages]);

  // ---- 发送消息 ----
  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');

    // 添加空的 AI 消息占位
    const aiMsgId = `a_${Date.now()}`;
    const aiMsg: ChatMessage = { id: aiMsgId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // 取最近 3 轮对话作为历史（不包含当前问题）
      const history = [...messages].slice(-6).map(({ role, content }) => ({ role, content }));
      const res = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${err}`);
      }

      // 解析 SSE 流
      const reader = res.body?.getReader();
      if (!reader) throw new Error('响应体为空');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            handleSSEEvent(parsed, aiMsgId);
          } catch {
            // 非 JSON 跳过
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || '请求失败');
        // 移除未完成的 AI 消息
        setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, apiUrl]);

  /** 处理单条 SSE 事件 */
  function handleSSEEvent(parsed: any, aiMsgId: string) {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === aiMsgId);
      if (idx === -1) return prev;

      const updated = [...prev];

      // 引用来源
      if (parsed.type === 'sources') {
        updated[idx] = { ...updated[idx], sources: parsed.data };
      }

      // 流式内容追加
      if (parsed.type === 'content') {
        updated[idx] = {
          ...updated[idx],
          content: updated[idx].content + parsed.data,
        };
      }

      return updated;
    });
  }

  // ---- 停止生成 ----
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ---- 键盘提交 ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className='ai-chat'>
      {/* 消息列表 */}
      {messages.length === 0 ? (
        <div className='ai-chat__empty'>输入问题，基于文档回答</div>
      ) : (
        <div className='ai-chat__messages'>
          {messages.map((msg, i) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isStreaming={
                loading && i === messages.length - 1 && msg.role === 'assistant'
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className='ai-chat__error'>{error}</div>}

      {/* 输入区域 */}
      <div className='ai-chat__input'>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder='输入你的问题...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {loading ? (
          <button
            className='ai-chat__btn--stop'
            onClick={handleStop}
            title='停止生成'
          >
            ■
          </button>
        ) : (
          <button onClick={handleSend} disabled={!input.trim()} title='发送'>
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

/** 单条消息行（含头像 + 内容 + 来源） */
function ChatBubble({
  msg,
  isStreaming,
}: {
  msg: ChatMessage;
  isStreaming: boolean;
}) {
  const isAI = msg.role === 'assistant';
  const hasContent = msg.content.length > 0;

  return (
    <div className={`ai-chat__msg-row ai-chat__msg-row--${msg.role}`}>
      {/* 头像 */}
      <div className={`ai-chat__avatar ai-chat__avatar--${msg.role}`}>
        {isAI ? 'AI' : 'U'}
      </div>

      <div className='ai-chat__msg-content'>
        <div className='ai-chat__msg-text'>
          {isAI && hasContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          ) : (
            msg.content
          )}
          {isStreaming && <span className='ai-chat__cursor' />}
        </div>

        {!isStreaming && msg.sources && msg.sources.length > 0 && (
          <div className='ai-chat__sources'>
            <span className='ai-chat__sources-label'>参考</span>
            {msg.sources.map((s, i) => (
              <span key={i} className='ai-chat__sources-item'>
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
