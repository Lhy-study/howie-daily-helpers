export const cssText = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
  .ai-chat {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    color: #1f1f1f;
    background: #fff;
  }

  /* ---- 消息列表 ---- */
  .ai-chat__messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scroll-behavior: smooth;
  }

  .ai-chat__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b0b0b0;
    font-size: 15px;
  }

  /* ---- 消息行 ---- */
  .ai-chat__msg-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 18px 16px;
    animation: ai-chat-fadein 0.25s ease;
  }

  .ai-chat__msg-row + .ai-chat__msg-row {
    border-top: 1px solid #f3f3f3;
  }

  .ai-chat__msg-row--user {
    background: #fafafa;
  }

  .ai-chat__msg-row--ai {
    background: #fff;
  }

  /* ---- 头像 ---- */
  .ai-chat__avatar {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }

  .ai-chat__avatar--ai {
    background: #1a1a1a;
    color: #fff;
  }

  .ai-chat__avatar--user {
    background: #e5e5e5;
    color: #666;
  }

  /* ---- 消息内容 ---- */
  .ai-chat__msg-content {
    flex: 1;
    min-width: 0;
    max-width: 90%;
    overflow: hidden;
  }

  /* ---- 消息文本 ---- */
  .ai-chat__msg-text {
    line-height: 1.75;
    font-size: 15px;
    color: #2d2d2d;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .ai-chat__msg-row--user .ai-chat__msg-text {
    color: #1a1a1a;
  }

  /* ---- 来源标签 ---- */
  .ai-chat__sources {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }

  .ai-chat__sources-label {
    font-size: 11px;
    color: #b0b0b0;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .ai-chat__sources-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 10px;
    background: #f5f5f5;
    border: 1px solid #eee;
    border-radius: 6px;
    font-size: 12px;
    color: #888;
  }

  /* ---- 输入区域 ---- */
  .ai-chat__input {
    display: flex;
    gap: 10px;
    padding: 16px;
    border-top: 1px solid #eee;
  }

  .ai-chat__input textarea {
    flex: 1;
    resize: none;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 15px;
    font-family: inherit;
    line-height: 1.5;
    outline: none;
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .ai-chat__input textarea:focus {
    border-color: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.05);
  }

  .ai-chat__input textarea::placeholder {
    color: #b0b0b0;
  }

  .ai-chat__input button {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    align-self: flex-end;
    border: none;
    border-radius: 8px;
    background: #1a1a1a;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
  }

  .ai-chat__input button:hover:not(:disabled) {
    opacity: 0.85;
  }

  .ai-chat__input button:active:not(:disabled) {
    transform: scale(0.96);
  }

  .ai-chat__input button:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .ai-chat__btn--stop {
    background: #fff !important;
    color: #c0c0c0 !important;
    border: 1px solid #e0e0e0 !important;
  }

  .ai-chat__btn--stop:hover {
    background: #fafafa !important;
    color: #666 !important;
  }

  /* ---- 错误 ---- */
  .ai-chat__error {
    padding: 0 16px 12px;
    font-size: 13px;
    color: #d9444a;
  }

  /* ======== Markdown ======== */
  .ai-chat__msg-text p {
    margin: 0 0 8px;
  }
  .ai-chat__msg-text p:last-child {
    margin-bottom: 0;
  }

  .ai-chat__msg-text strong {
    font-weight: 600;
  }

  .ai-chat__msg-text em {
    font-style: italic;
  }

  .ai-chat__msg-text a {
    color: #1a1a1a;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: #d0d0d0;
  }

  .ai-chat__msg-text ul,
  .ai-chat__msg-text ol {
    padding-left: 20px;
    margin: 6px 0;
  }

  .ai-chat__msg-text li {
    margin: 3px 0;
  }

  .ai-chat__msg-text li::marker {
    color: #b0b0b0;
  }

  .ai-chat__msg-text code {
    background: #f3f3f3;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.88em;
    font-family: 'Menlo', 'Consolas', monospace;
  }

  .ai-chat__msg-text pre {
    background: #f7f7f7;
    color: #2d2d2d;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
    margin: 8px 0;
    border: 1px solid #eee;
    white-space: pre;
    word-break: normal;
    max-width: 100%;
  }

  .ai-chat__msg-text pre code {
    background: none;
    padding: 0;
    font-size: inherit;
  }

  .ai-chat__msg-text table {
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 13px;
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }

  .ai-chat__msg-text th,
  .ai-chat__msg-text td {
    border: 1px solid #e0e0e0;
    padding: 6px 12px;
    text-align: left;
  }

  .ai-chat__msg-text th {
    background: #fafafa;
    font-weight: 600;
  }

  .ai-chat__msg-text blockquote {
    border-left: 2px solid #d0d0d0;
    padding: 4px 0 4px 12px;
    margin: 8px 0;
    color: #777;
  }

  .ai-chat__msg-text h1,
  .ai-chat__msg-text h2,
  .ai-chat__msg-text h3 {
    margin: 16px 0 6px;
    font-weight: 600;
  }
  .ai-chat__msg-text h1 { font-size: 1.2em; }
  .ai-chat__msg-text h2 { font-size: 1.1em; }
  .ai-chat__msg-text h3 { font-size: 1.05em; }

  .ai-chat__msg-text hr {
    border: none;
    border-top: 1px solid #e8e8e8;
    margin: 16px 0;
  }

  /* ---- 动画 ---- */
  @keyframes ai-chat-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ai-chat__cursor {
    display: inline-block;
    width: 2px;
    height: 1.1em;
    background: #1a1a1a;
    margin-left: 1px;
    vertical-align: text-bottom;
    border-radius: 1px;
    animation: ai-chat-blink 0.9s infinite;
  }

  @keyframes ai-chat-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;
