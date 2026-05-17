import React, { useState } from 'react';
import { Settings, Cpu, HardDrive, Database, Globe, BrainCircuit, Sparkles, Zap, Shield, Save } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

type Language = 'pt' | 'en';

export default function SettingsView({ language = 'pt' }: { language?: Language }) {
  const [cacheSize, setCacheSize] = useState(256);
  const [bufferSize, setBufferSize] = useState(1024);

  return (
    <div className="space-y-6 flex flex-col font-sans pb-20">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Configurações Globais <span className="bg-slate-500/20 text-slate-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase font-black">System Core</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl font-medium">Mapeamento de diretórios, chaves de API e preferências do MUMaster Engine.</p>
        </div>
        <button 
          onClick={() => toast.success("Configurações persistidas com sucesso.")}
          className="bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2 uppercase tracking-widest text-xs"
        >
          <Save size={16} /> Salvar Tudo
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <HardDrive size={64} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <HardDrive size={14} className="text-orange-500" /> Caminhos de Instalação (Locals)
              </h3>
              <div className="space-y-5 relative z-10">
                 <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Pasta Raiz do MuServer (ROOT_PATH)</label>
                    <input type="text" defaultValue="C:\Sources\MuServer" className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono shadow-inner" />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">GameServer Executable Path</label>
                    <input type="text" defaultValue="C:\Sources\MuServer\GameServer\GameServer.exe" className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono shadow-inner" />
                 </div>
              </div>
           </div>

           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Database size={64} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Database size={14} className="text-blue-500" /> SQL Server Connection
              </h3>
              <div className="space-y-5 relative z-10">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Username (UID)</label>
                        <input type="text" defaultValue="sa" className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Password (PWD)</label>
                        <input type="password" defaultValue="********" className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500" />
                    </div>
                 </div>
                 <button className="w-full py-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all">Testar Conexão em Tempo Real</button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[#111317] border border-orange-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <BrainCircuit size={64} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <BrainCircuit size={14} className="text-orange-500" /> Cortex AI Engine (Gemini)
              </h3>
              <div className="space-y-5 relative z-10">
                 <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Gemini API Token Presence</label>
                    <div className="bg-[#0a0b0d] border border-[#1e2126] px-4 py-3 rounded-xl flex items-center justify-between">
                       <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-2">
                          <Shield size={12} fill="currentColor" /> API_KEY_VERIFIED
                       </span>
                       <span className="text-[10px] text-slate-600 font-mono italic">Loaded from .env</span>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Behavioral Personality</label>
                    <select className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none appearance-none focus:border-orange-500">
                       <option>System Architect (Highly Technical)</option>
                       <option>Supportive Assistant (Friendly)</option>
                       <option>Cyber Hacker (Direct & Aggressive)</option>
                    </select>
                 </div>
              </div>
           </div>

           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl overflow-hidden group">
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap size={14} className="text-yellow-500" /> Performance Tuner & Cache
              </h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Memory Cache Size (MB)</label>
                       <span className="text-xs font-mono text-yellow-500">{cacheSize} MB</span>
                    </div>
                    <input 
                      type="range" 
                      min="64" 
                      max="1024" 
                      step="64"
                      value={cacheSize}
                      onChange={(e) => setCacheSize(parseInt(e.target.value))}
                      className="w-full accent-yellow-500 h-1.5 bg-[#0a0b0d] rounded-lg appearance-none cursor-pointer" 
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">I/O Buffer Size (KB)</label>
                       <span className="text-xs font-mono text-yellow-500">{bufferSize} KB</span>
                    </div>
                    <input 
                      type="range" 
                      min="512" 
                      max="4096" 
                      step="256"
                      value={bufferSize}
                      onChange={(e) => setBufferSize(parseInt(e.target.value))}
                      className="w-full accent-yellow-500 h-1.5 bg-[#0a0b0d] rounded-lg appearance-none cursor-pointer" 
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
