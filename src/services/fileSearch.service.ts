import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import aiEngine from './resilientAIEngine';

export interface SearchResult {
  path: string;
  relevance: number;
  reason: string;
}

export async function searchFiles(basePath: string, query: string): Promise<SearchResult[]> {
  const files: string[] = [];
  const maxFiles = 3000;
  let absBasePath = path.resolve(basePath);
  
  if (!existsSync(absBasePath)) {
    absBasePath = process.cwd(); // Fallback to current directory for testing
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
           // We only push the relative path to make it lighter
           files.push(fullPath.replace(absBasePath + path.sep, ''));
        }
      }
      
      // Process directories recursively
      await Promise.all(directories.map(d => crawl(d)));
    } catch (e) {
      // Skip folders without permission
    }
  };

  await crawl(absBasePath);

  // Semantic ranking via AI
  try {
    const aiResp = await aiEngine.generate({
      prompt: `USER QUERY: "${query}"\n\nAVAILABLE FILES (Sample):\n${JSON.stringify(files.slice(0, 800))}`,
      systemInstruction: `You are a systems search specialist. Identify the top 5-10 most relevant files for the query in a Mu Online server directory.
Return EXACTLY a JSON object with this strict structure:
{
  "matches": [
    { "path": "exact_file_path_from_list_above", "relevance": 0.95, "reason": "short explanation" }
  ]
}
If no file is relevant, return {"matches": []}.`,
      temperature: 0.1,
      responseType: 'json'
    });

    if (aiResp.success && aiResp.content && Array.isArray(aiResp.content.matches)) {
       const aiResults = aiResp.content.matches;
       // Ensure paths exist in our found files
       const validMatches = aiResults.filter((m: any) => files.includes(m.path));
       if (validMatches.length > 0) return validMatches;
    }
  } catch (error) {
    // Fallback to basic string match if AI fails
  }

  // Robust fallback: fuzzy string match
  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/);
  
  const scoredFiles = files.map(f => {
     const lowerF = f.toLowerCase();
     let score = 0;
     if (lowerF.includes(lowerQuery)) score += 0.8;
     tokens.forEach(t => {
        if (lowerF.includes(t)) score += 0.2;
     });
     return { path: f, relevance: Math.min(score, 1), reason: "Fuzzy Keyword Match" };
  }).filter(f => f.relevance > 0);

  return scoredFiles.sort((a, b) => b.relevance - a.relevance).slice(0, 15);
}
