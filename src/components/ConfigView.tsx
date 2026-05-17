import React, { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    { label: 'commonserver.cfg', file: 'GameServer/Data/commonserver.cfg' },
    { label: 'Message.txt', file: 'Data/Local/Message.txt' },
    { label: 'Events.ini', file: 'GameServer/Data/Events.ini' },
    { label: 'IGC_Common.ini', file: 'GameServer/IGC_Common.ini' },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [code, setCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
       toast.success("Arquivo " + activeTab.label + " salvo com sucesso!");
    }).catch(() => setIsSaving(false));
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Editor de Configurações (Arquivos Reais)</h2>
        <p className="text-slate-400 mt-1">Edite os arquivos do emulador diretamente na MUSERVER_PATH da sua máquina.</p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab, i) => (
           <button 
             key={i} 
             onClick={() => setActiveTab(tab)}
             className={`${activeTab.file === tab.file ? 'bg-[#1e2126] text-white border-orange-500/50' : 'bg-[#1e2126]/50 text-slate-400 border-[#1e2126] hover:text-white'} border px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 bg-[#050506] border border-[#1e2126] rounded-2xl overflow-hidden relative">
        <textarea 
          aria-label="Code Editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-transparent text-slate-300 font-mono text-xs p-6 focus:outline-none resize-none leading-relaxed"
          spellCheck="false"
        />
        <button onClick={saveFile} disabled={isSaving} className="absolute bottom-6 right-6 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 border-none rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
           <HardDrive size={16} /> {isSaving ? "SALVANDO..." : "SALVAR ARQUIVO"}
        </button>
      </div>
    </div>
  );
}
