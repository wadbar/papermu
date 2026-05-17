import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { BrainCircuit, FileText, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogsView() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tudo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Tudo' || log.toUpperCase().includes(activeFilter.toUpperCase());
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if(isPaused) return;
    const interval = setInterval(() => {
      safeFetch('/api/logs')
        .then(data => {
            if(data.logs) {
                setLogs(data.logs);
            }
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleAnalyzeLogs = async () => {
    if (logs.length === 0) {
      toast.error("Nenhum log para analisar.");
      return;
    }
    
    // Get the last 100 lines for context, favoring errors
    const recentLogs = logs.slice(-100).join('\n');
    
    setIsAnalyzing(true);
    const toastId = toast.loading('Consultando Oráculo Neural (Gemini)...');
    try {
      const data = await safeFetch('/api/ai/analyze-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: recentLogs })
      });
      
      if (data.rootCause) {
        toast.dismiss(toastId);
        toast((t) => (
          <div className="flex flex-col gap-2 min-w-[300px]">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1"><BrainCircuit size={16} /> Análise Concluída</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${data.severity === 'Critical' ? 'bg-red-500 text-white' : data.severity === 'High' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'}`}>{data.severity || 'Medium'}</span>
             </div>
             <div className="text-xs text-slate-600 bg-slate-100 p-2 rounded border border-slate-200">
               <strong>Causa Raiz:</strong><br/>{data.rootCause}
             </div>
             {data.suggestedFix && (
               <div className="text-[10px] font-mono text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 mt-1 whitespace-pre-wrap">
                 <strong>Solução C++ / Fix:</strong><br/>{data.suggestedFix}
               </div>
             )}
             <button onClick={() => toast.dismiss(t.id)} className="mt-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 rounded">Fechar</button>
          </div>
        ), { duration: 30000, position: 'top-center', style: { minWidth: '400px' } });
      } else {
        throw new Error(data.error || 'Falha na IA');
      }
    } catch(e: any) {
       toast.error("Erro na análise: " + e.message, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-2 shrink-0 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <FileText size={28} className="text-orange-500" /> Console em Tempo Real
           </h2>
           <p className="text-slate-400 mt-1">Logs interceptados diretamente do servidor usando a nova API.</p>
        </div>
        <div className="flex gap-2">
            <div className="group relative">
               <Activity size={12} className="absolute left-2.5 top-2.5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Filtrar logs..." 
                 className="bg-[#111317] border border-[#1e2126] text-white text-xs p-2 pl-8 pr-8 rounded-lg focus:outline-none focus:border-orange-500/50 w-32 md:w-64 transition-all"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               {search && (
                 <button 
                   onClick={() => setSearch('')}
                   className="absolute right-2 top-2 text-slate-500 hover:text-white transition-colors"
                 >
                   <Activity size={12} className="rotate-45" /> 
                 </button>
               )}
            </div>
            <button onClick={() => setIsPaused(!isPaused)} className={`${isPaused ? 'bg-orange-600' : 'bg-[#111317]'} hover:bg-[#1e2126] border border-[#1e2126] text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors`}>
             {isPaused ? 'Retomar' : 'Pausar'}
           </button>
           <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Baixar .TXT</button>
           <button 
             onClick={handleAnalyzeLogs}
             disabled={isAnalyzing}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center gap-2"
           >
             {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />} Análise Neural
           </button>
        </div>
      </header>

      <div className="flex gap-2">
         {['Tudo', 'ConnectServer', 'JoinServer', 'GameServer', 'ExDB', 'ChatServer'].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeFilter === filter ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#111317] border border-[#1e2126] text-slate-400 hover:text-white'}`}
            >
              {filter}
            </button>
         ))}
      </div>

      <div className="flex-1 bg-[#050506] border border-[#1e2126] rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-1 relative">
         <div className="sticky top-0 right-0 float-right flex gap-2 z-10 bg-[#050506]/80 p-1 rounded-bl-lg">
           <span className={`${isPaused ? 'text-red-500' : 'text-green-500 animate-pulse'} flex items-center gap-1`}>
             <div className={`w-2 h-2 ${isPaused ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div> 
             {isPaused ? 'Pausado' : 'Lendo StdOut...'}
           </span>
         </div>
         {filteredLogs.map((line, idx) => {
            const upLine = line.toUpperCase();
            const isError = upLine.includes('ERROR') || upLine.includes('CRITICAL');
            const isGS = upLine.includes('GAMESERVER');
            
            return (
              <p 
                key={idx} 
                className={`
                  ${isError ? 'text-red-500 font-bold bg-red-500/5 px-1 rounded' : isGS ? 'text-blue-400' : 'text-slate-300'}
                `}
              >
                {line}
              </p>
            );
         })}
         {filteredLogs.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
             <Activity size={32} className="opacity-20" />
             <p>{logs.length === 0 ? 'Aguardando logs do servidor...' : 'Nenhum log corresponde aos filtros aplicados.'}</p>
             {(search || activeFilter !== 'Tudo') && (
               <button 
                 onClick={() => { setSearch(''); setActiveFilter('Tudo'); }}
                 className="text-[10px] text-orange-500 hover:underline uppercase tracking-widest font-bold"
               >
                 Limpar Filtros
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
}
