export interface Env {
  EMBEDDING_MODEL?: string;
  EMBEDDING_API_KEY?: string;
  EMBEDDING_API_URL?: string;
  EMBEDDING_DIMENSION?: string;
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
  LLM_API_URL?: string;
  VECTORIZE?: Vectorize;
  DEPLOY?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  VECTORIZE_INDEX_NAME?: string;
}

// 查询请求体
export interface VectorizeQueryRequest {
  vector: number[];           // 查询向量
  topK?: number;               // 返回数量，默认 5
  returnValues?: boolean;     // 是否返回向量值，默认 false
  returnMetadata?: "all" | "none";  // 是否返回元数据
  namespace?: string;          // 命名空间
}

// 查询响应
export interface VectorizeQueryResponse {
  success: boolean;
  errors: VectorizeError[];
  messages: VectorizeMessage[];
  result: {
    count: number;             // 返回的匹配数量
    matches: VectorizeMatch[];  // 匹配结果数组
  } | null;
}

// 单条匹配结果
export interface VectorizeMatch {
  id: string;                  // 向量 ID（最大长度 64）
  score: number;               // 相似度分数
  metadata: Record<string, unknown> | null;  // 元数据
  values: number[] | null;     // 向量值（需 returnValues: true 才返回）
  namespace: string | null;    // 命名空间（v2 才有）
}

// 错误信息
export interface VectorizeError {
  code: number;                // 错误码（最小 1000）
  message: string;
}

// 消息信息
export interface VectorizeMessage {
  code: number;
  message: string;
}
