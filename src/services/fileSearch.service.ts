import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import aiEngine from './resilientAIEngine';

export interface SearchResult {
  path: string;
  relevance: number;
  reason: string;
}

export async function searchFiles(basePath: string, query: string, includeSymbols: boolean = false): Promise<SearchResult[]> {
  const files: string[] = [];
  const maxFiles = 3000;
  let absBasePath = path.resolve(basePath);
  
  if (!existsSync(absBasePath)) {
    absBasePath = process.cwd(); 
  }

  const crawl = async (dir: string) => {
    if (files.length >= maxFiles) return;
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const directories: string[] = [];
      
      for (const item of items) {
        if (files.length >= maxFiles) break;
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          const ignoreDirs = ['node_modules', '.git', 'dist', 'bin', 'build', '.idea', '.vscode'];
          if (!ignoreDirs.includes(item.name)) {
             directories.push(fullPath);
          }
        } else {
           files.push(fullPath.replace(absBasePath + path.sep, ''));
        }
      }
      
      await Promise.all(directories.map(d => crawl(d)));
    } catch (e) {}
  };

  await crawl(absBasePath);

  // Semantic ranking via AI - Enhanced for symbols
  try {
    const aiResp = await aiEngine.generate({
      prompt: `USER QUERY: "${query}"\nINCLUDE SYMBOLS: ${includeSymbols}\n\nFILES:\n${JSON.stringify(files.slice(0, 500))}`,
      systemInstruction: `You are a systems search specialist. Identify relevant files OR symbols (functions/variables) for the query.
If INCLUDE SYMBOLS is true, search for likely C++/Java symbols that match the query intent.
Return EXACTLY a JSON object:
{
  "matches": [
    { "path": "file_path_or_symbol_name", "relevance": 0.95, "reason": "why this matches", "type": "file" | "function" | "variable" }
  ]
}
Return up to 10 best matches.`,
      temperature: 0.1,
      responseType: 'json'
    });

    if (aiResp.success && aiResp.content && Array.isArray(aiResp.content.matches)) {
        return aiResp.content.matches;
    }
  } catch (error) {}

  // Fallback
  const lowerQuery = query.toLowerCase();
  return files
    .filter(f => f.toLowerCase().includes(lowerQuery))
    .slice(0, 10)
    .map(f => ({ path: f, relevance: 0.8, reason: "Filename match", type: 'file' as const }));
}
