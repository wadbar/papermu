import React from 'react';
import { Layers, Plus, Terminal, RefreshCw } from 'lucide-react';

type Language = 'pt' | 'en';

export default function WorkspacesView({ language = 'pt', setActiveTab }: { language?: Language, setActiveTab: (tab: string) => void }) {
  const workspaces = [
    { title: "Desenvolvimento 97d", subtitle: "Arquivos 1.0.0.0", active: true },
    { title: "Temporada 18 - Testes", subtitle: "IGC Emulator Legacy", active: false },
    { title: "Season 2 Classic", subtitle: "Nativo Dev", active: false },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Meus Workspaces <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">Multi-Project</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Alternar entre diferentes instalações de MuServer na mesma máquina.</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-500 text-[#050506] font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg flex items-center gap-2">
           <Plus size={18} /> Novo Workspace
        </button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workspaces.map((ws, i) => (
           <div key={i} className={`bg-[#111317] border p-6 rounded-2xl transition-all group ${ws.active ? 'border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.1)]' : 'border-[#1e2126] hover:border-slate-700'}`}>
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-xl ${ws.active ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-500'}`}>
                    <Layers size={24} />
                 </div>
                 {ws.active && <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Ativo Agora</span>}
              </div>
              <h3 className="font-bold text-white text-lg">{ws.title}</h3>
              <p className="text-xs text-slate-500 mb-6">{ws.subtitle}</p>
              
              <div className="flex gap-2">
                 <button className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ws.active ? 'bg-orange-600 text-[#050506]' : 'bg-[#1e2126] text-slate-300 hover:bg-orange-600/20 hover:text-orange-500'}`}>
                    {ws.active ? 'Configurado' : 'Ativar'}
                 </button>
                 <button className="p-2 border border-[#1e2126] text-slate-500 rounded-lg group-hover:text-white"><RefreshCw size={14}/></button>
              </div>
           </div>
        ))}

        <button onClick={() => setActiveTab('settings')} className="border-2 border-dashed border-[#1e2126] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white hover:border-slate-700 transition-all">
           <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
              <Plus size={24} />
           </div>
           <span className="text-sm font-bold uppercase tracking-widest">Configurar Novo MuServer</span>
        </button>
      </div>
      
      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
         <div className="flex items-center gap-3 mb-4">
            <Terminal size={20} className="text-orange-500" />
            <h3 className="font-bold text-white text-sm uppercase tracking-widest">Logs de Troca de Contexto</h3>
         </div>
         <div className="bg-[#050506] rounded-xl p-4 font-mono text-xs text-orange-500/70 space-y-1">
            <p className="opacity-50"># Switch workflow initiated...</p>
            <p>{`>`} Mapping C:\Sources\MuServer_Test...</p>
            <p>{`>`} Verifying GameServer.exe signature...</p>
            <p className="text-white"># Workspace "{workspaces[0].title}" ready.</p>
         </div>
      </div>
    </div>
  );
}
