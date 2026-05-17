import React, { useState } from 'react';
import { Download, TerminalSquare, Shield, Play } from 'lucide-react';
import { safeFetch } from '../lib/utils';

export default function DatabaseView() {
  const [query, setQuery] = useState("UPDATE Character SET cLevel = 400 WHERE Name = 'Admin'");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const executeQuery = async (sqlString: string, successMsg?: string) => {
    setIsExecuting(true);
    setOutput("Executando...");
    try {
      const data = await safeFetch('/api/db/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlString })
      });
      
      let outText = successMsg ? `[SUCESSO] ${successMsg}\n\n` : '';
      if (data.rowsAffected && data.rowsAffected.length > 0) {
        outText += `Linhas Afetadas: ${data.rowsAffected.join(', ')}\n`;
      }
      if (data.result) {
        outText += `\nResultados:\n${JSON.stringify(data.result, null, 2)}`;
      }
      setOutput(outText);
    } catch (e: any) {
      setOutput(`[ERRO]: ${e.message}`);
    } finally {
       setIsExecuting(false);
    }
  };

  const handleShrink = () => {
    if(confirm("Tem certeza que deseja limpar os logs (Shrink) do banco de dados MuOnline?")) {
      executeQuery(`DBCC SHRINKDATABASE (N'MuOnline')`, 'Banco de dados reduzido e logs limpos com sucesso!');
    }
  };

  const handleReset = () => {
    if(confirm("CUIDADO: Isso vai zerar o nível (cLevel = 1) e os Resets de TODOS os personagens! Tem certeza absoluta?")) {
      executeQuery(`UPDATE Character SET cLevel = 1, ResetCount = 0, Experience = 0`, 'Todos os personagens foram resetados para Nível 1, 0 Resets.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Banco de Dados (SQL)</h2>
        <p className="text-slate-400 mt-1">Execute Queries, gerencie contas e limpe logs em tempo real na Database do servidor.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Ações de Manutenção (Real-time)</h3>
          <div className="space-y-3">
             <button disabled className="opacity-50 w-full bg-[#1e2126] text-left text-sm text-slate-400 p-4 rounded-lg flex justify-between items-center">
                MDB: Restaurar MuOnline.bak (Use o Script Manager) <Download size={16} />
             </button>
             <button 
                onClick={handleShrink} 
                className="w-full bg-[#1e2126] hover:bg-[#2a2d33] text-left text-sm text-slate-300 p-4 rounded-lg transition-colors flex justify-between items-center group">
                Limpar Logs (Shrink Database) <TerminalSquare size={16} className="text-slate-500 group-hover:text-orange-400" />
             </button>
             <button 
                onClick={handleReset} 
                className="w-full bg-red-900/20 hover:bg-red-900/40 text-left text-sm text-red-400 p-4 rounded-lg border border-red-900/30 transition-colors flex justify-between items-center group">
                Resetar Personagens (Geral/Full Reset) <Shield size={16} className="text-red-500/50 group-hover:text-red-500" />
             </button>
          </div>
          
          <div className="mt-6 flex-1 bg-[#050506] border border-[#1e2126] rounded-lg p-4 font-mono text-[10px] text-slate-400 overflow-y-auto whitespace-pre-wrap max-h-[150px]">
            {output || "// A saída (output) das execuções aparecerá aqui..."}
          </div>
        </div>

        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Query Executor</h3>
          <textarea 
            aria-label="SQL Query"
            className="flex-1 w-full bg-[#0a0b0d] border border-[#1e2126] rounded-lg p-4 text-orange-400 font-mono text-xs focus:outline-none focus:border-orange-500 min-h-[200px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
             onClick={() => executeQuery(query)}
             disabled={isExecuting}
             className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-3 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
            <Play size={16} /> {isExecuting ? "EXECUTANDO..." : "EXECUTAR QUERY"}
          </button>
        </div>
      </div>
    </div>
  );
}
