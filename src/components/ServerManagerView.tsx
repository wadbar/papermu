import React, { useState } from 'react';
import { Play, Square, RefreshCw, Clock, AlertTriangle, ShieldCheck, Cpu, HardDrive, Zap, Network, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';

const mockPerformanceData = [
  { time: '10:00', cpu: 12, ram: 45, net: 10 },
  { time: '10:05', cpu: 15, ram: 48, net: 12 },
  { time: '10:10', cpu: 18, ram: 50, net: 15 },
  { time: '10:15', cpu: 25, ram: 55, net: 20 },
  { time: '10:20', cpu: 22, ram: 55, net: 18 },
  { time: '10:25', cpu: 19, ram: 52, net: 14 },
  { time: '10:30', cpu: 14, ram: 50, net: 11 },
];

export default function ServerManagerView({ serverState, handleServerAction }: { serverState: string, handleServerAction?: (a: 'start'|'stop'|'restart')=>void }) {
  const [cronJobs, setCronJobs] = useState([
    { id: 1, name: 'Auto-Restart Diário', time: '04:00 AM', enabled: true, description: 'Reinicia o GameServer para liberar cachê de memória.' },
    { id: 2, name: 'Backup do SQL', time: 'A cada 1 hora', enabled: true, description: 'Gera .bak de DB_MuOnline.' },
    { id: 3, name: 'Clear Logs', time: 'Domingo às 00:00', enabled: false, description: 'Apaga logs antigos do ConnectServer.' }
  ]);

  const toggleCron = (id: number) => {
    setCronJobs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Gerenciador do Servidor
             <span className="text-green-500 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded text-[10px] uppercase tracking-widest font-black flex items-center gap-1"><ShieldCheck size={12}/> Seguro</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-2xl">Controle Master do ecossistema. Orquestre processos interligados, gerencie automações Cron e monitore saúde sistêmica.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => handleServerAction?.('start')} disabled={serverState === 'online'} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_20px_rgba(22,163,74,0.5)] transition-all disabled:opacity-50 flex items-center gap-2">
              <Play size={14} /> Power On
           </button>
           <button onClick={() => handleServerAction?.('stop')} disabled={serverState === 'offline'} className="bg-[#111317] border border-red-500/30 hover:bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2">
              <Square size={14} /> Shutdown
           </button>
           <button onClick={() => handleServerAction?.('restart')} disabled={serverState === 'offline'} className="bg-[#111317] border border-[#1e2126] hover:bg-[#1a1d24] text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2">
              <RefreshCw size={14} /> Reboot App
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
           <div className="bg-[#111317] border border-[#1e2126] rounded-3xl p-6 shadow-2xl overflow-hidden relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 z-10 relative">
                 <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <Activity size={16} className="text-blue-500"/> Performance do Ecossistema (Ao Vivo)
                 </h3>
                 <div className="flex gap-4 mt-2 md:mt-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded bg-blue-500"></div> CPU %</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded bg-orange-500"></div> RAM %</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><div className="w-2 h-2 rounded bg-green-500"></div> Net (Mbps)</div>
                 </div>
              </div>

              <div className="h-48 z-10 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={mockPerformanceData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2126" />
                     <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                     />
                     <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                     <Area type="monotone" dataKey="ram" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[#111317] border border-[#1e2126] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
               <Cpu size={250} className="text-white" />
             </div>
             <h3 className="text-sm font-black text-white mb-6 tracking-widest uppercase flex items-center gap-2">
               <HardDrive size={16} className="text-purple-500"/> Core Modules
             </h3>
             <div className="space-y-3 relative z-10 w-full overflow-x-auto">
               <div className="min-w-[600px]">
                 {[
                   { name: 'ConnectServer.exe', protocol: 'TCP/UDP', port: '44405', status: serverState, mem: '15 MB', cpu: '0.1%' },
                   { name: 'JoinServer.exe', protocol: 'TCP', port: '55970', status: serverState, mem: '45 MB', cpu: '0.5%' },
                   { name: 'DataServer.exe', protocol: 'TCP', port: '55960', status: serverState, mem: '120 MB', cpu: '1.2%' },
                   { name: 'GameServer.exe', protocol: 'UDP', port: '55901', status: serverState, mem: '850 MB', cpu: '12.4%' },
                   { name: 'GameServerCS.exe', protocol: 'UDP', port: '55919', status: 'offline', mem: '0 MB', cpu: '0%' },
                 ].map((proc, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                     key={i} 
                     className="flex items-center justify-between p-4 bg-[#15181d] border border-white/5 rounded-2xl hover:bg-[#1a1d24] transition-colors gap-4 mb-3"
                   >
                     <div className="flex items-center gap-4 w-64">
                       <div className={`w-3 h-3 rounded-full ${proc.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : proc.status === 'starting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                       <div>
                         <h4 className="font-bold text-slate-200 text-sm">{proc.name}</h4>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Port: {proc.port}</p>
                       </div>
                     </div>
                     
                     <div className="flex-1 text-center">
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 font-bold uppercase tracking-widest border border-white/5">{proc.protocol}</span>
                     </div>

                     <div className="flex items-center gap-8 w-64 justify-end">
                       <div className="flex gap-6">
                         <div className="text-right">
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CPU</p>
                           <p className="text-sm font-mono font-bold text-blue-400">{proc.status === 'online' ? proc.cpu : '0%'}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">RAM</p>
                           <p className="text-sm font-mono font-bold text-orange-400">{proc.status === 'online' ? proc.mem : '0 MB'}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => handleServerAction?.('start')} disabled={proc.status === 'online'} className="p-2 bg-[#1e2126] text-green-500 hover:bg-green-500/20 rounded-xl border border-transparent hover:border-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-inner">
                           <Play size={14} />
                         </button>
                         <button onClick={() => handleServerAction?.('stop')} disabled={proc.status === 'offline'} className="p-2 bg-[#1e2126] text-red-500 hover:bg-red-500/20 rounded-xl border border-transparent hover:border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-inner">
                           <Square size={14} />
                         </button>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111317] border border-[#1e2126] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <h3 className="text-sm font-black text-slate-400 mb-6 tracking-widest uppercase flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Automações (Cron)
            </h3>
            <div className="space-y-4 relative z-10 w-full block">
              {cronJobs.map(job => (
                <div key={job.id} className="p-5 bg-gradient-to-br from-[#15181d] to-[#111317] border border-white/5 rounded-2xl block relative overflow-hidden group/cron">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/cron:opacity-10 transition-opacity">
                     <Clock size={40} />
                  </div>
                  <div className="flex items-center justify-between mb-3 z-10 relative">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">{job.name}</span>
                    <button 
                       onClick={() => toggleCron(job.id)}
                       className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${job.enabled ? 'bg-green-500' : 'bg-slate-800'}`}
                     >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md ${job.enabled ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-4 font-medium leading-relaxed z-10 relative">{job.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 shadow-inner rounded-lg text-[10px] text-blue-400 font-mono font-bold z-10 relative uppercase tracking-widest">
                    <Zap size={10} className="text-blue-500" /> {job.time}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-colors border border-white/5 shadow-inner">
              + Nova Rotina
            </button>
          </div>

          <div className="bg-[#111317] border border-red-500/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.05)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertTriangle size={80} className="text-red-500" />
             </div>
             <div className="flex items-center justify-between mb-4 z-10 relative">
                <h3 className="text-sm font-black text-red-500 tracking-widest uppercase flex items-center gap-2">
                  <AlertTriangle size={16}/> Crash Monitor
                </h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Active</span>
                </div>
             </div>
             <p className="text-[10px] text-slate-400 mb-6 font-medium leading-relaxed z-10 relative tracking-wide">
               A rede neural Cortex monitora Minidumps do GameServer em tempo real, executando diagnósticos de memória e reinicializações automáticas (Self-Healing).
             </p>
             <div className="p-4 bg-[#0a0b0d] border border-red-500/10 rounded-xl text-center shadow-inner relative z-10">
                <span className="text-green-500/80 text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Health 100% - Sem anomalias</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// added Activity to imports
