import { registerAs } from '@nestjs/config'

/**
 * 加载大模型服务地址、模型名和访问密钥。
 */
export default registerAs('llm', () => ({
  url: process.env.LLM_API_URL,
  model: process.env.LLM_API_MODEL,
  apiKey: process.env.LLM_API_KEY,
}))
