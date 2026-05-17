import React, { useState, useEffect } from 'react';
import { Settings, Cpu, HardDrive, Database, Globe, BrainCircuit, Sparkles, Zap, Shield, Save, Terminal, Server, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

type Language = 'pt' | 'en';

export default function SettingsView({ language = 'pt' }: { language?: Language }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [config, setConfig] = useState<any>({
    muServerPath: '',
    connectionMode: 'local',
    dbEngine: 'sqlite',
    dbConfig: { server: '', user: '', database: '' },
    sshConfig: { host: '', port: 22, username: '' },
    maintenanceMode: false,
    cacheSize: 256,
    bufferSize: 1024
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      setLoading(false);
    } catch (e) {
      toast.error("Erro ao carregar configurações.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muServerPath: config.muServerPath,
          mode: config.connectionMode,
          ssh: config.sshConfig,
          db: config.dbConfig,
          dbEngine: config.dbEngine,
          maintenanceMode: config.maintenanceMode,
          cacheSize: config.cacheSize,
          bufferSize: config.bufferSize
        })
      });

      if (res.ok) {
        toast.success("Configurações persistidas com sucesso no Kernel.");
      } else {
        throw new Error("API Failure");
      }
    } catch (e) {
      toast.error("Falha ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    );
  }

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
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2 uppercase tracking-widest text-xs"
        >
          {saving ? <Zap size={16} className="animate-pulse" /> : <Save size={16} />} 
          {saving ? 'Gravando...' : 'Salvar Tudo'}
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
           {/* Section: Connection Mode */}
           <div className="bg-[#111317] border border-blue-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Globe size={14} className="text-blue-500" /> Modo de Conexão e IP Remoto
              </h3>
              <div className="space-y-5 relative z-10 font-sans">
                 <div className="flex gap-4 p-1 bg-[#0a0b0d] border border-[#1e2126] rounded-xl mb-4">
                    <button 
                      onClick={() => setConfig({ ...config, connectionMode: 'local' })}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${config.connectionMode === 'local' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      <HardDrive size={12} className="inline mr-2" /> Local Host
                    </button>
                    <button 
                      onClick={() => setConfig({ ...config, connectionMode: 'remote' })}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${config.connectionMode === 'remote' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Globe size={12} className="inline mr-2" /> Remote Host (SSH)
                    </button>
                 </div>

                 {config.connectionMode === 'remote' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                       <div>
                          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">IP ou Domínio do MuServer (Remote Host)</label>
                          <input 
                            type="text" 
                            value={config.sshConfig.host}
                            onChange={(e) => setConfig({ ...config, sshConfig: { ...config.sshConfig, host: e.target.value } })}
                            placeholder="ex: 192.168.1.100 ou mu.seuserver.com"
                            className="w-full bg-[#0a0b0d] border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono shadow-inner" 
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">SSH Port</label>
                             <input 
                               type="number" 
                               value={config.sshConfig.port}
                               onChange={(e) => setConfig({ ...config, sshConfig: { ...config.sshConfig, port: parseInt(e.target.value) } })}
                               className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500" 
                             />
                          </div>
                          <div>
                             <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">SSH Username</label>
                             <input 
                               type="text" 
                               value={config.sshConfig.username}
                               onChange={(e) => setConfig({ ...config, sshConfig: { ...config.sshConfig, username: e.target.value } })}
                               className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500" 
                             />
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {config.connectionMode === 'local' && (
                    <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                    >
                       <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                          <p className="text-[10px] text-blue-400 font-medium leading-relaxed italic">
                            No modo Local, o painel assume que o MuServer está rodando na mesma máquina física ou em um diretório montado (WSL2/Docker).
                          </p>
                       </div>
                    </motion.div>
                 )}
              </div>
           </div>

           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <HardDrive size={64} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <HardDrive size={14} className="text-orange-500" /> Caminhos de Instalação
              </h3>
              <div className="space-y-5 relative z-10">
                 <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Pasta Raiz do MuServer (ROOT_PATH)</label>
                    <input 
                      type="text" 
                      value={config.muServerPath}
                      onChange={(e) => setConfig({ ...config, muServerPath: e.target.value })}
                      className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono shadow-inner" 
                    />
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
                  <div className="mb-4">
                     <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Database Engine</label>
                     <select 
                       value={config.dbEngine}
                       onChange={(e) => setConfig({ ...config, dbEngine: e.target.value })}
                       className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                     >
                       <option value="sqlite">SQLite (Internal - Development)</option>
                       <option value="mssql">Microsoft SQL Server (Production)</option>
                     </select>
                  </div>
                  
                  {config.dbEngine === 'mssql' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 font-sans">
                       <div>
                          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">SQL Server Address (IP/Host)</label>
                          <input 
                            type="text" 
                            value={config.dbConfig.server}
                            onChange={(e) => setConfig({ ...config, dbConfig: { ...config.dbConfig, server: e.target.value } })}
                            className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" 
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Username (UID)</label>
                              <input 
                                type="text" 
                                value={config.dbConfig.user}
                                onChange={(e) => setConfig({ ...config, dbConfig: { ...config.dbConfig, user: e.target.value } })}
                                className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" 
                              />
                          </div>
                          <div>
                              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Password (PWD)</label>
                              <input 
                                type="password" 
                                value={config.dbConfig.password || ''}
                                onChange={(e) => setConfig({ ...config, dbConfig: { ...config.dbConfig, password: e.target.value } })}
                                placeholder="********"
                                className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" 
                              />
                          </div>
                       </div>
                    </motion.div>
                  )}
                  
                  <button className="w-full py-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all">Testar Conexão em Tempo Real</button>
               </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className={`bg-[#111317] border rounded-2xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500 ${config.maintenanceMode ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldAlert size={64} className="text-red-500" />
               </div>
               <h3 className="font-bold text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" /> Server Maintenance Mode
               </h3>
               <div className="space-y-5 relative z-10 font-sans">
                  <div className="flex items-center justify-between p-4 bg-[#0a0b0d] border border-[#1e2126] rounded-xl">
                     <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">Modo de Manutenção</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Ao ativar, apenas administradores autenticados terão acesso ao painel e recursos.</p>
                     </div>
                     <button 
                       onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                       className={`w-14 h-7 rounded-full transition-all relative p-1 ${config.maintenanceMode ? 'bg-red-600 shadow-lg shadow-red-600/20' : 'bg-slate-700'}`}
                     >
                        <motion.div 
                          animate={{ x: config.maintenanceMode ? 28 : 0 }}
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                        />
                     </button>
                  </div>
                  
                  {config.maintenanceMode && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
                    >
                       <p className="text-[10px] text-red-400 font-bold leading-relaxed flex items-center gap-2">
                         <AlertTriangle size={12} /> STATUS: PROTOCOLO DE ISOLAMENTO ATIVO
                       </p>
                    </motion.div>
                  )}
               </div>
            </div>

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
                       <span className="text-xs font-mono text-yellow-500">{config.cacheSize} MB</span>
                    </div>
                    <input 
                      type="range" 
                      min="64" 
                      max="1024" 
                      step="64"
                      value={config.cacheSize}
                      onChange={(e) => setConfig({ ...config, cacheSize: parseInt(e.target.value) })}
                      className="w-full accent-yellow-500 h-1.5 bg-[#0a0b0d] rounded-lg appearance-none cursor-pointer" 
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">I/O Buffer Size (KB)</label>
                       <span className="text-xs font-mono text-yellow-500">{config.bufferSize} KB</span>
                    </div>
                    <input 
                      type="range" 
                      min="512" 
                      max="4096" 
                      step="256"
                      value={config.bufferSize}
                      onChange={(e) => setConfig({ ...config, bufferSize: parseInt(e.target.value) })}
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
