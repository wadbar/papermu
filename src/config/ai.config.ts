export const AI_CONFIG = {
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY,
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
  }
};
