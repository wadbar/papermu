import React, { useState, useEffect } from 'react';
import { Shield, Target, Trash2, AlertTriangle, ShieldAlert, Cpu, Activity, Globe, Lock, Unlock, Zap, ZapOff, ChevronRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import ThreatMapping from './ThreatMapping';

export default function SecurityView() {
  const [threatLevel, setThreatLevel] = useState(12);
  const [isFirewallActive, setIsFirewallActive] = useState(true);
  const [blockedIps, setBlockedIps] = useState([
    { ip: '189.120.44.12', country: 'RU', reason: 'Brute Force', timestamp: '2 mins ago' },
    { ip: '45.10.88.29', country: 'CN', reason: 'Injection Attempt', timestamp: '15 mins ago' },
    { ip: '192.168.1.100', country: 'LOCAL', reason: 'Packet Overflow', timestamp: '1 hour ago' },
  ]);

  const [thresholds, setThresholds] = useState({
    threatLevel: 70,
    cpuSpike: 85,
    memSpike: 90
  });

  const saveThresholds = () => {
    toast.success("Limites de alerta atualizados com sucesso!");
  };

  const attackData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    v: Math.floor(Math.random() * 50) + (i > 15 ? 100 : 0)
  }));

  return (
    <div className="space-y-6 flex flex-col h-full font-sans overflow-y-auto">
      <header className="mb-0 flex justify-between items-end shrink-0">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Neural Threat Matrix <span className="text-red-500 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded text-[10px] uppercase tracking-widest font-black">AI Managed</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl font-medium">Monitoramento avançado de sockets, filtragem de pacotes e prevenção de vazamento de HWID.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-[#111317] border border-[#1e2126] p-3 rounded-xl flex items-center gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Risk</span>
                 <span className={`text-sm font-black ${threatLevel > 70 ? 'text-red-500' : 'text-green-500'}`}>{threatLevel}%</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${threatLevel > 70 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                 <ShieldAlert size={20} />
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0 pb-6">
         {/* Threat Analysis Column */}
         <div className="xl:col-span-3 space-y-6 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Lock size={64} className="text-blue-500" />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Lock size={12}/> Firewall Status</h3>
                  <div className="flex items-center justify-between relative z-10">
                     <span className={`text-2xl font-black ${isFirewallActive ? 'text-green-500' : 'text-red-500'}`}>{isFirewallActive ? 'ACTIVE' : 'DISABLED'}</span>
                     <button 
                       onClick={() => setIsFirewallActive(!isFirewallActive)}
                       className={`w-12 h-6 rounded-full relative transition-all ${isFirewallActive ? 'bg-green-600' : 'bg-slate-800'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isFirewallActive ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>

               <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={12}/> Socket Traffic</h3>
                  <div className="flex items-end justify-between relative z-10">
                     <div>
                        <span className="text-2xl font-black text-white">4.2 GB</span>
                        <p className="text-[10px] text-slate-600 tracking-widest uppercase font-bold">Últimas 24h</p>
                     </div>
                     <span className="text-xs font-bold text-blue-500">Normal</span>
                  </div>
               </div>

               <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={12}/> Geo-Blocking</h3>
                  <div className="flex items-end justify-between relative z-10">
                     <div>
                        <span className="text-2xl font-black text-white">14 Regions</span>
                        <p className="text-[10px] text-slate-600 tracking-widest uppercase font-bold">CN & VN Locked</p>
                     </div>
                     <button className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest">Gerenciar</button>
                  </div>
               </div>
            </div>

            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-8 flex flex-col shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <Shield size={250} className="text-white" />
               </div>
               <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                     <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Live Attack Map (Real-Time)</h3>
                     <p className="text-xs text-slate-500">Visualização de pacotes malformados e tentativas de buffer overflow detectadas.</p>
                  </div>
                  <div className="flex gap-2">
                     <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Recording Attack Vectors</span>
                  </div>
               </div>

               <div className="flex-1 min-h-[200px] relative z-10 w-full">
                  <ResponsiveContainer width="100%" height={200}>
                     <LineChart data={attackData}>
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0b0d', border: '1px solid #1e2126', borderRadius: '12px' }}
                          labelStyle={{ display: 'none' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="v" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          dot={false} 
                          animationDuration={500} 
                        />
                     </LineChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 border border-white/5 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>
               </div>

               <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Top Attack Vectors</h4>
                      <div className="space-y-2">
                         {[
                           { name: 'UDP Flood', v: '85%', color: 'bg-red-500' },
                           { name: 'SYN Stealth', v: '42%', color: 'bg-orange-500' },
                           { name: 'Null Byte injection', v: '12%', color: 'bg-blue-500' },
                         ].map((v, i) => (
                           <div key={i} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                 <span className="text-slate-400">{v.name}</span>
                                 <span className="text-white">{v.v}</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <div className={`h-full ${v.color}`} style={{ width: v.v }}></div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-[#0a0b0d] p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                            <Cpu size={24} />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">AI Security Agent</h4>
                            <p className="text-[10px] text-slate-500">Sincronizado com Gemini 1.5 Pro</p>
                         </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">"Detectado padrão de conexão serializada de 400 IPs russos simultâneos. Apliquei filtragem dinâmica de TTL para reduzir o load do GameServer."</p>
                      <button className="bg-orange-600 hover:bg-orange-500 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all" onClick={() => alert("Deep Analysis Started...")}>Ver Detalhes do Incidente</button>
                   </div>
               </div>
            </div>

            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Settings size={14} className="text-blue-500" />
                Alert Thresholds Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Threat Level Alert</span>
                    <span className="text-red-500">{thresholds.threatLevel}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-red-500"
                    value={thresholds.threatLevel}
                    onChange={e => setThresholds({...thresholds, threatLevel: Number(e.target.value)})}
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Shake dashboard card &gt; {thresholds.threatLevel}%</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>CPU Spike Trigger</span>
                    <span className="text-orange-500">{thresholds.cpuSpike}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-orange-500"
                    value={thresholds.cpuSpike}
                    onChange={e => setThresholds({...thresholds, cpuSpike: Number(e.target.value)})}
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Trigger alerts via API &gt; {thresholds.cpuSpike}%</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Memory Spikes</span>
                    <span className="text-blue-500">{thresholds.memSpike}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-blue-500"
                    value={thresholds.memSpike}
                    onChange={e => setThresholds({...thresholds, memSpike: Number(e.target.value)})}
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Notify memory limits &gt; {thresholds.memSpike}%</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2126] flex justify-end">
                <button 
                  onClick={saveThresholds}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </div>

            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-purple-500" />
                  Threat Source Mapping
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ThreatMapping />
              </div>
            </div>
         </div>

         {/* Sidebar Bans */}
         <div className="bg-[#111317] border border-[#1e2126] rounded-2xl flex flex-col shadow-2xl overflow-hidden min-h-0 h-full max-h-[850px]">
            <div className="p-6 border-b border-[#1e2126] shrink-0">
               <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" />
                  Painel de Banimento
               </h3>
            </div>
            
            <div className="p-4 border-b border-[#1e2126] bg-[#0a0b0d] shrink-0">
               <div className="flex gap-2">
                  <input type="text" placeholder="IP ou HWID..." className="flex-1 bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500" />
                  <button className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl transition-all">
                     <Lock size={16} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
               <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 pt-2 mb-2">Shadow Ban List (3)</h4>
               {blockedIps.map((b, i) => (
                 <div key={i} className="group bg-[#0a0b0d] border border-[#1e2126] hover:border-red-500/20 p-4 rounded-xl flex items-center justify-between transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500/30 group-hover:text-red-500 transition-colors">
                          <ShieldAlert size={16} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white font-mono">{b.ip}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                             <span>{b.country}</span>
                             <span>•</span>
                             <span>{b.reason}</span>
                          </div>
                       </div>
                    </div>
                    <button className="text-slate-800 hover:text-red-500 transition-colors">
                       <Trash2 size={14} />
                    </button>
                 </div>
               ))}
               
               <div className="p-4 text-center">
                  <button className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto">
                     Ver Histórico Completo <ChevronRight size={12} />
                  </button>
               </div>
            </div>

            <div className="p-6 bg-red-600/5 border-t border-[#1e2126] shrink-0">
               <div className="flex items-center gap-3 mb-4">
                  <Shield size={16} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Self-Destruct Sockets</span>
               </div>
               <button className="w-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all">TERMINAR TODAS CONEXÕES</button>
            </div>
         </div>
      </div>
    </div>
  );
}
