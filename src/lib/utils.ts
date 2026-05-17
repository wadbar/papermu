import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const errData = await response.json();
        const errorMessage = typeof errData.error === 'object' ? errData.error.error || JSON.stringify(errData.error) : errData.error;
        throw new Error(errorMessage || errData.message || `HTTP ${response.status}`);
      }
      throw new Error(`Server returned error ${response.status} (${response.statusText})`);
    }

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    
    const text = await response.text();
    if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html")) {
      throw new Error(`API Indisponível no momento em ${url} (Recebido HTML). O servidor pode estar reiniciando ou a rota está sendo interceptada pelo frontend.`);
    }
    
    return text;
  } catch (error: any) {
    if (!error.message.includes("HTML")) {
      console.error(`[Fetch Error] ${url}:`, error);
    }
    throw error;
  }
}

export async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, backoff = 500) {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await safeFetch(url, options);
    } catch (err: any) {
      lastError = err;
      if (i < retries) {
        const delay = backoff * Math.pow(2, i);
        console.warn(`[Retry ${i + 1}/${retries}] Fetching ${url} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Sanitização e Parse Universal para respostas de IA
 */
export function robustJSONParse(content: any): any {
  if (typeof content === 'object' && content !== null) return content;
  
  let cleaned = String(content)
    .replace(/\\n/g, '\n')
    .replace(/```json\s?/gi, '')
    .replace(/```\s?/g, '')
    .trim();

  // Heurística de fechamento
  const openBraces = (cleaned.match(/\{/g) || []).length;
  const closeBraces = (cleaned.match(/\}/g) || []).length;
  if (openBraces > closeBraces) cleaned += '}'.repeat(openBraces - closeBraces);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (inner) {
        console.error("Robust parse failed:", inner);
      }
    }
    return { error: "Parse failed", raw: cleaned };
  }
}
