import { AI_CONFIG } from '../config/ai.config';

/**
 * CORTEX RESILIENT AI ENGINE - UNIVERSAL AGI PIPELINE
 * Versão: 4.0.0-PROD
 * 
 * DESIGN PATTERNS:
 * - Chain of Responsibility: Sequenciamento de fallback (L1 -> L2 -> L3).
 * - Strategy Pattern: Provedores encapsulados (Native Fetch).
 * - Robust Parser: Sanitizador JSON/Markdown.
 */

// --- CONFIGURAÇÃO DE TIPOS E INTERFACES ---
export type AIProvider = 'ollama' | 'gemini' | 'nvidia' | 'simulator';
export type AIResponseType = 'json' | 'text';

export interface GenerateParams {
  prompt: string;
  systemInstruction?: string;
  responseType?: AIResponseType;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  success: boolean;
  provider: AIProvider;
  model: string;
  content: any;
  timestamp: string;
  latencyMs: number;
}

const LOG_PREFIX = '\x1b[38;5;208m[CORTEX-KERNEL]\x1b[0m';
const logger = {
  info: (msg: string) => console.log(`${LOG_PREFIX} \x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} | ${msg}`),
  success: (msg: string) => console.log(`${LOG_PREFIX} \x1b[32m[OK]\x1b[0m ${new Date().toISOString()} | ${msg}`),
  warn: (msg: string) => console.warn(`${LOG_PREFIX} \x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} | ${msg}`),
  error: (msg: string, err?: any) => console.error(`${LOG_PREFIX} \x1b[31m[CRITICAL]\x1b[0m ${new Date().toISOString()} | ${msg}`, err || ''),
};

/**
 * Sanitiza a saída do modelo removendo Markdown e artefatos de buffer.
 */
const robustParser = (raw: any, type: AIResponseType): any => {
  if (type !== 'json') return String(raw || '');
  if (typeof raw === 'object' && raw !== null) return raw;

  let content = String(raw || '').trim();
  content = content
    .replace(/```json\s?/gi, '')
    .replace(/```\s?/g, '')
    .trim();

  // Heurística básica de recuperação de chaves não fechadas
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces > closeBraces) content += '}'.repeat(openBraces - closeBraces);

  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) content += ']'.repeat(openBrackets - closeBrackets);

  try {
    return JSON.parse(content);
  } catch (e) {
    logger.warn(`JSON.parse falhou na primeira tentativa. Tentando extrair escopo JSON limpo.`);
    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) { /* Fail silent */ }
    }
    logger.warn(`Estrutura JSON irrecuperável. Raw: ${content.substring(0, 50)}...`);
    return { error: "Parse Failure. Formato não suportado.", raw: content, success: false };
  }
};

const secureFetch = async (url: string, options: RequestInit, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
};

// --- STRATEGY: PROVIDER IMPLEMENTATIONS ---

const callOllama = async (params: GenerateParams) => {
  const host = AI_CONFIG.ollama.host;
  const model = AI_CONFIG.ollama.model;
  try {
    const response = await secureFetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        system: params.systemInstruction,
        stream: false,
        options: { temperature: params.temperature ?? 0.7 }
      })
    }, 5000);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return { content: data.response, model };
  } catch (e: any) {
    throw new Error(`Offline (${e.message})`);
  }
};

const callGemini = async (params: GenerateParams) => {
  const apiKey = AI_CONFIG.gemini.apiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY MISSING");

  const models = AI_CONFIG.gemini.models;
  let lastErr;
  for (const modelName of models) {
    try {
      logger.info(`[GEMINI] Tentando modelo: ${modelName}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const systemPrompt = (params.systemInstruction || '') + (params.responseType === 'json' ? '\n\nIMPORTANT: OUTPUT ONLY VALID JSON. NO MARKDOWN.' : '');
      
      const response = await secureFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `SYSTEM: ${systemPrompt}\nPROMPT: ${params.prompt}` }] }],
          generationConfig: { temperature: params.temperature ?? 0.7 }
        })
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty Response");
      return { content: text, model: modelName };
    } catch (e: any) {
      lastErr = e;
      logger.warn(`[GEMINI] Falha no modelo ${modelName}: ${e.message}`);
      continue;
    }
  }
  throw lastErr;
};

const callNvidia = async (params: GenerateParams) => {
  const apiKey = AI_CONFIG.nvidia.apiKey;
  const baseUrl = AI_CONFIG.nvidia.baseUrl;
  if (!apiKey) throw new Error("NVIDIA_API_KEY MISSING");

  const response = await secureFetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_CONFIG.nvidia.model,
      messages: [
        ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature ?? 0.7
    })
  });

  if (!response.ok) throw new Error(`NVIDIA API Error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content, model: AI_CONFIG.nvidia.model };
};

const callShield = async (params: GenerateParams) => {
  return {
    content: params.responseType === 'json' 
      ? { error: "Pipeline Exhausted", success: false } 
      : "Sistema em modo de segurança: Provedores de IA indisponíveis.",
    model: 'safety-shield-v1'
  };
};

export async function generate(params: GenerateParams): Promise<AIResponse> {
  const startTime = Date.now();
  const providers = [
    { id: 'ollama' as const, fn: callOllama, name: 'Local Ollama' },
    { id: 'gemini' as const, fn: callGemini, name: 'Google Gemini' },
    { id: 'nvidia' as const, fn: callNvidia, name: 'NVIDIA NIM' },
    { id: 'simulator' as const, fn: callShield, name: 'System Shield' }
  ];

  for (const provider of providers) {
    try {
      logger.info(`Acionando ${provider.name}...`);
      const raw = await provider.fn(params);
      const content = robustParser(raw.content, params.responseType || 'text');
      
      // Se o parser falhou e esperávamos JSON, forçamos erro para pular para o próximo provider
      if (params.responseType === 'json' && content && typeof content === 'object' && 'error' in content) {
        throw new Error(`Parse failure from ${provider.name}: ${content.error}`);
      }
      
      const latency = Date.now() - startTime;
      logger.success(`${provider.name} respondeu em ${latency}ms.`);

      return {
        success: true,
        provider: provider.id,
        model: raw.model,
        content,
        timestamp: new Date().toISOString(),
        latencyMs: latency
      };
    } catch (err: any) {
      if (!(provider.id === 'ollama' && err.message.includes('Offline'))) {
        logger.info(`${provider.name} falhado/indisponível: ${err.message}. Lançando fallback...`);
      }
    }
  }

  return {
    success: false,
    provider: 'simulator',
    model: 'safety-shield-v1',
    content: params.responseType === 'json' ? { error: "Colapso total da infraestrutura.", success: false } : "Colapso total da infraestrutura.",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime
  };
}

export async function* generateStream(params: GenerateParams): AsyncGenerator<string, void, unknown> {
  const apiKey = AI_CONFIG.gemini.apiKey;
  const modelName = AI_CONFIG.gemini.models[0];
  
  if (apiKey) {
    // Try Gemini streaming first
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const systemPrompt = (params.systemInstruction || '') + (params.responseType === 'json' ? '\n\nIMPORTANT: OUTPUT ONLY VALID JSON. NO MARKDOWN.' : '');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `SYSTEM: ${systemPrompt}\nPROMPT: ${params.prompt}` }] }],
          generationConfig: { temperature: params.temperature ?? 0.7 }
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr && dataStr !== '[DONE]') {
                 try {
                    const data = JSON.parse(dataStr);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) yield text;
                 } catch(e) {}
              }
            }
          }
        }
        return; // Successfully streamed from Gemini
      }
    } catch (err: any) {
      logger.info(`Stream Gemini falhou: ${err.message}. Fazendo fallback para engines completas.`);
    }
  }
  
  // Fallback to normal generate and simulate stream
  try {
     const fallbackResponse = await generate(params);
     if (fallbackResponse.success) {
        const contentStr = typeof fallbackResponse.content === 'string' 
          ? fallbackResponse.content 
          : JSON.stringify(fallbackResponse.content);
          
        // Simulate stream chunking
        const chunkSize = 20;
        for (let i = 0; i < contentStr.length; i += chunkSize) {
          yield contentStr.slice(i, i + chunkSize);
          await new Promise(r => setTimeout(r, 10)); // small delay
        }
     } else {
        yield JSON.stringify({ error: fallbackResponse.content?.error || "AI failed", success: false });
     }
  } catch(e: any) {
     yield JSON.stringify({ error: e.message, success: false });
  }
}

const resilientAI = { generate, generateStream };
export default resilientAI;

