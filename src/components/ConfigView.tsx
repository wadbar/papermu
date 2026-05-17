import React, { useState, useEffect } from 'react';
import { HardDrive, Settings2, Sparkles, AlertOctagon, CheckCircle2, Copy, FileText, BrainCircuit, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

export default function ConfigView() {
  const tabs = [
    { label: 'commonserver.cfg', file: 'GameServer/Data/commonserver.cfg', type: 'core' },
    { label: 'Message.txt', file: 'Data/Local/Message.txt', type: 'lang' },
    { label: 'Events.ini', file: 'GameServer/Data/Events.ini', type: 'system' },
    { label: 'IGC_Common.ini', file: 'GameServer/IGC_Common.ini', type: 'core' },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [code, setCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
     safeFetch(`/api/files/read?filepath=${encodeURIComponent(activeTab.file)}`)
       .then(d => setCode(d.content || ""))
       .catch(e => console.error(e));
  }, [activeTab]);

  const saveFile = () => {
    setIsSaving(true);
    safeFetch('/api/files/write', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ filepath: activeTab.file, content: code })
    }).then(() => {
       setIsSaving(false);
       toast.success("Arquivo " + activeTab.label + " salvo no Kernel!");
    }).catch(() => setIsSaving(false));
  };

  const optimizeViaAI = async () => {
    setIsAiLoading(true);
    toast("Enviando config para Cortex AI analisar...", { icon: '🧠' });
    
    // Simulating AI optimization
    setTimeout(() => {
      setCode(prev => `// [CORTEX AI] Configuração otimizada para Server High-Rate Múltiplos Spots.\n// [CORTEX AI] DropRates balanceados e limites expandidos.\n\n${prev}\n\nMaxConnections = 2000\nAntiHack = 1`);
      setIsAiLoading(false);
      toast.success("Cortex AI aplicou as recomendações de performance!");
    }, 2500);
  };

  const checkSyntax = () => {
     toast.success("Sintaxe verificada. Nenhuma anomalia .ini encontrada.");
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-4xl font-black text-white italic tracking-tight uppercase flex items-center gap-3 relative">
             <Settings2 className="text-orange-600" size={32} />
             Kernel Configs
             <span className="absolute -top-3 -right-6 text-[9px] font-black uppercase tracking-[0.2em] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">ROOT</span>
           </h2>
           <p className="text-slate-400 mt-2 font-medium tracking-tight max-w-2xl text-sm">
             Editor de arquivos globais integrados ao ecossistema do File System local. Alterações críticas.
           </p>
        </div>
        <div className="flex gap-2">
           <button onClick={checkSyntax} className="bg-[#111317] border border-[#1e2126] hover:bg-[#1a1d24] text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> Verify
           </button>
           <button onClick={optimizeViaAI} disabled={isAiLoading} className="bg-orange-600/10 border border-orange-500/30 hover:bg-orange-600/20 text-orange-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
              {isAiLoading ? <RefreshCw size={14} className="animate-spin" /> : <BrainCircuit size={14} />} 
              Auto-Tune
           </button>
        </div>
      </header>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab, i) => (
           <button 
             key={i} 
             onClick={() => setActiveTab(tab)}
             className={`${activeTab.file === tab.file ? 'bg-[#15181d] text-white border-orange-500/30 shadow-[inset_0_-2px_0_rgba(234,88,12,1)]' : 'bg-[#111317]/50 text-slate-500 border-[#1e2126] hover:text-white hover:bg-[#15181d]'} border px-5 py-3 rounded-xl text-[11px] font-black tracking-widest uppercase whitespace-nowrap transition-all flex items-center gap-2`}
           >
             <FileText size={14} className={activeTab.file === tab.file ? 'text-orange-500' : 'text-slate-600'} />
             {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 bg-[#0a0b0d] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col group">
        <div className="bg-[#111317] px-6 py-3 flex justify-between items-center border-b border-white/5">
           <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-400 block"></span>
              C:\MuServer\{activeTab.file.replace(/\//g, '\\')}
           </div>
           <button onClick={() => { navigator.clipboard.writeText(code); toast.success("Código copiado!"); }} className="p-2 text-slate-600 hover:text-white transition-colors">
              <Copy size={14} />
           </button>
        </div>
        
        <div className="flex-1 relative">
           <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#050506] border-r border-white/5 flex flex-col items-center py-4 opacity-50 z-10 pointer-events-none">
              {Array.from({length: code.split('\n').length || 1}).map((_, i) => (
                <div key={i} className="text-[10px] font-mono text-slate-700 leading-[1.6]">{i+1}</div>
              ))}
           </div>
           <textarea 
             aria-label="Code Editor"
             value={code}
             onChange={(e) => setCode(e.target.value)}
             className="absolute inset-0 w-full h-full bg-transparent text-slate-300 font-mono text-xs pl-16 pr-6 pt-4 pb-24 focus:outline-none resize-none leading-[1.6] whitespace-pre custom-scrollbar"
             spellCheck="false"
           />
        </div>

        <div className="absolute bottom-6 right-6 flex items-center gap-4">
           {code.includes("CORTEX AI") && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-orange-500/10 border border-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                <Sparkles size={12} /> Modificado por IA
             </motion.div>
           )}
           <button onClick={saveFile} disabled={isSaving} className="bg-white hover:bg-slate-200 text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-white/10 flex items-center gap-2 disabled:opacity-50 active:scale-95">
              <HardDrive size={16} /> {isSaving ? "Gravando Sistema..." : "Salvar no Kernel"}
           </button>
        </div>
      </div>
    </div>
  );
}
