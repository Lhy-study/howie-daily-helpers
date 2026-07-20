export interface Chunk {
  /** 唯一标识符 */
  id: string;
  /** 文件路径 */
  filePath: string;
  /** 标题 */
  title: string;
  /** 文本内容 */
  text: string;
  /** 嵌入向量 */
  embedding?: number[];
}

export interface Manifest {
  /** 文件映射 { filePath: md5Hash } */
  files: Record<string, string>;
}

export interface AskRequest {
  /** 问题 */
  question: string;
}

export interface AskResponse {
  /** 回答 */
  answer: string;
  /** 源文档 */
  sources: Chunk[];
}

export interface ChatMessage {
  /** 角色 */
  role: 'user' | 'assistant';
  /** 内容 */
  content: string;
}

/** 向量存储接口 */
export interface IVectorStore {
  query(embedding: number[], topK: number): Promise<Chunk[]>;
  upsert(chunks: Chunk[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
}