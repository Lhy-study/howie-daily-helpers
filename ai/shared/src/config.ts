export enum ENV_KEY_ENUM {
  /** 向量模型名称 */
  EMBEDDING_MODEL = 'EMBEDDING_MODEL',
  /** 向量模型 API 密钥 */
  EMBEDDING_API_KEY = 'EMBEDDING_API_KEY',
  /** 向量模型 API 地址 */
  EMBEDDING_API_URL = 'EMBEDDING_API_URL',
  /** 语言模型名称 */
  LLM_MODEL = 'LLM_MODEL',
  /** 语言模型 API 密钥 */
  LLM_API_KEY = 'LLM_API_KEY',
  /** 语言模型 API 地址 */
  LLM_API_URL = 'LLM_API_URL',
  /** 向量维度 */
  EMBEDDING_DIMENSION = 'EMBEDDING_DIMENSION',
}

export interface SharedConfig {
  /** 向量模型名称 */
  embeddingModel: string;
  /** 向量模型 API 密钥 */
  embeddingApiKey: string;
  /** 向量模型 API 地址 */
  embeddingApiUrl: string;
  /** 语言模型名称 */
  llmModel: string;
  /** 语言模型 API 密钥 */
  llmApiKey: string;
  /** 语言模型 API 地址 */
  llmApiUrl: string;
  /** 向量维度 */
  embeddingDimension: number;
}

/**
 * - 传入 env 绑定时适配 Cloudflare Workers
 */
export function createSharedConfig(
  envSource: Record<string, string | undefined>,
): SharedConfig {
  const env = envSource;

  const get = (key: ENV_KEY_ENUM, defaultValue?: string): string => {
    const value = env[key] ?? defaultValue;
    if (value === undefined) {
      throw new Error(
        `[Config Error] Missing required environment variable: ${key}`,
      );
    }
    return value;
  };

  return {
    embeddingModel: get(ENV_KEY_ENUM.EMBEDDING_MODEL, 'embedding-3'),
    embeddingApiKey: get(ENV_KEY_ENUM.EMBEDDING_API_KEY, ''),
    embeddingApiUrl: get(
      ENV_KEY_ENUM.EMBEDDING_API_URL,
      'https://open.bigmodel.cn/api/paas/v4/embeddings',
    ),
    llmModel: get(ENV_KEY_ENUM.LLM_MODEL, 'deepseek-v4-pro'),
    llmApiKey: get(ENV_KEY_ENUM.LLM_API_KEY, ''),
    llmApiUrl: get(
      ENV_KEY_ENUM.LLM_API_URL,
      'https://api.deepseek.com/chat/completions',
    ),
    embeddingDimension: Number(get(ENV_KEY_ENUM.EMBEDDING_DIMENSION, '1024')),
  };
}
