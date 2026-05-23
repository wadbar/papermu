import React, { useState, useEffect, useRef } from 'react';
import { Shield, Target, Trash2, AlertTriangle, ShieldAlert, Cpu, Activity, Globe, Lock, Settings, ChevronRight, Unlock, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import ThreatMapping from './ThreatMapping';

export default function SecurityView() {
  const [threatLevel, setThreatLevel] = useState(12);
  const [isFirewallActive, setIsFirewallActive] = useState(true);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);

  const [thresholds, setThresholds] = useState({
    threatLevel: 70,
    cpuSpike: 85,
    memSpike: 90
  });

  const [ddosConfig, setDdosConfig] = useState({
    maxReqs: 200,
    banDuration: 60000
  });

  const [myIpStatus, setMyIpStatus] = useState<any>({
    ip: '127.0.0.1',
    isBanned: false,
    reputation: 0,
    expiresIn: 0
  });

  const ddosConfigTimeout = useRef<any>(null);

  useEffect(() => {
    fetch('/api/security/ddos-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.maxReqs !== undefined) {
          setDdosConfig({
            maxReqs: data.maxReqs,
            banDuration: data.banDuration
          });
        }
      })
      .catch(err => console.error("Failed to load DDoS config", err));
  }, []);

  useEffect(() => {
    const fetchBannedIps = () => {
      fetch('/api/security/banned-ips')
        .then(res => res.json())
        .then(data => {
          if (data && data.blockedIps) setBlockedIps(data.blockedIps);
        })
        .catch(() => {});
    };

    const fetchMyIpStatus = () => {
      fetch('/api/security/my-ip-status')
        .then(res => res.json())
        .then(data => {
          if (data) setMyIpStatus(data);
        })
        .catch(() => {});
    };

    fetchBannedIps();
    fetchMyIpStatus();
    const interval = setInterval(() => {
      fetchBannedIps();
      fetchMyIpStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const saveThresholds = () => {
    toast.success("Alert thresholds updated successfully!", {
      style: { borderRadius: '16px', background: isLightMode ? '#fff' : '#333', color: isLightMode ? '#000' : '#fff' }
    });
  };

  const handleDdosConfigChange = (key: string, value: number) => {
    const newConfig = { ...ddosConfig, [key]: value };
    setDdosConfig(newConfig);

    if (ddosConfigTimeout.current) clearTimeout(ddosConfigTimeout.current);
    ddosConfigTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/security/ddos-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig)
        });
        if (res.ok) {
          toast.success("Runtime limits applied", {
            style: { borderRadius: '16px', background: isLightMode ? '#fff' : '#333', color: isLightMode ? '#000' : '#fff' }
          });
        }
      } catch (e) {
        toast.error("Network error while applying limits.");
      }
    }, 500);
  };

  const manualUnban = async (ip: string) => {
    try {
      const res = await fetch('/api/security/unban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        toast.success(`IP ${ip} released successfully!`, {
          style: { borderRadius: '16px', background: isLightMode ? '#fff' : '#333', color: isLightMode ? '#000' : '#fff' }
        });
        setBlockedIps(prev => prev.filter(b => b.ip !== ip));
      } else {
        toast.error("Failed to unban IP");
      }
    } catch {
      toast.error("Network error while trying to unban");
    }
  };

  const attackData = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    v: Math.floor(Math.random() * 50) + (i > 15 ? 100 : 0)
  }));

  const surfaceClass = isLightMode ? "bg-white border border-slate-200" : "bg-[#1E1E1E] border border-transparent";
  const textClass = isLightMode ? "text-slate-900" : "text-white";
  const mutedTextClass = isLightMode ? "text-slate-500" : "text-gray-400";
  const secSurfaceClass = isLightMode ? "bg-slate-50 border border-slate-200" : "bg-[#252525]";
  const dividerClass = isLightMode ? "border-slate-200" : "border-gray-800";
  
  const reputationColor = myIpStatus.isBanned 
    ? 'bg-red-500 shadow-red-500/50' 
    : myIpStatus.reputation > 50 
      ? 'bg-orange-500 shadow-orange-500/50' 
      : 'bg-green-500 shadow-green-500/50';

  const reputationText = myIpStatus.isBanned 
    ? 'text-red-500' 
    : myIpStatus.reputation > 50 
      ? 'text-orange-500' 
      : 'text-green-500';

  return (
    <div className={`space-y-6 flex flex-col h-full font-sans overflow-y-auto pb-8 px-2 transition-colors duration-300 ${isLightMode ? 'bg-[#f4f5f7] text-[#1a1c1e]' : 'text-slate-300'}`}>
      
      {/* HEADER SECTION - MD3 Typography & Spacing */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6 shrink-0 pt-4 pb-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <h2 className={`text-4xl font-normal tracking-tight ${textClass}`}>Security Center</h2>
             <span className="bg-red-900/10 text-red-500 font-medium px-3 py-1 rounded-full text-xs tracking-wide">
               AI Managed
             </span>
           </div>
           <p className={`text-base max-w-2xl font-normal ${mutedTextClass}`}>
             Advanced socket monitoring, packet filtration, routing limits, and global threat mitigation mapped via Neural Matrix protocols.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Theme Toggle */}
           <button 
             onClick={() => setIsLightMode(!isLightMode)}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm ${isLightMode ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-[#1E1E1E] text-slate-300 hover:bg-[#252525]'}`}
           >
              {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
           </button>

           {/* Current User IP Status Indicator */}
           <motion.div 
             className={`security-status-indicator rounded-3xl p-4 flex flex-col justify-center shadow-lg relative overflow-hidden min-w-[200px] border transition-colors duration-500 ${isLightMode ? 'border-slate-200' : 'border-transparent'}`}
             animate={{ 
               backgroundColor: myIpStatus.isBanned 
                 ? (isLightMode ? '#fee2e2' : '#3f1115') 
                 : myIpStatus.reputation > 50
                   ? (isLightMode ? '#fef3c7' : '#3d250d')
                   : (isLightMode ? '#dcfce7' : '#1E1E1E')
             }}
           >
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-[11px] font-medium uppercase tracking-wider ${myIpStatus.isBanned || isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Your App Connection</span>
                 <motion.div 
                   className={`w-3 h-3 rounded-full shadow-lg ${reputationColor}`} 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                 />
              </div>
              <div className="flex items-end gap-2">
                 <span className={`text-sm font-semibold tracking-tighter ${isLightMode || myIpStatus.isBanned ? 'text-slate-900' : 'text-white'}`}>{myIpStatus.ip}</span>
                 <span className={`text-xs ml-auto font-bold uppercase tracking-wider ${reputationText}`}>
                   {myIpStatus.isBanned ? `BANNED ${Math.round(myIpStatus.expiresIn / 1000)}s` : `TRUSTED`}
                 </span>
              </div>
           </motion.div>

           <div className={`${surfaceClass} rounded-3xl p-4 flex items-center gap-5 shadow-sm`}>
              <div className="flex flex-col items-end">
                 <span className={`text-[11px] font-medium uppercase tracking-wider ${mutedTextClass}`}>Global Risk</span>
                 <span className={`text-xl font-semibold tracking-tighter ${threatLevel > 70 ? 'text-red-500' : 'text-green-500'}`}>
                   {threatLevel}%
                 </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${threatLevel > 70 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                 <ShieldAlert size={28} strokeWidth={1.5} />
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
         
         {/* LEFT COLUMN (MAIN CONTENT) */}
         <div className="xl:col-span-3 space-y-8 flex flex-col">
            
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className={`${surfaceClass} p-6 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer`} onClick={() => setIsFirewallActive(!isFirewallActive)}>
                  <h3 className={`text-sm font-medium flex items-center gap-2 mb-8 ${mutedTextClass}`}>
                     <Lock size={16} /> Firewall Status
                  </h3>
                  <div className="flex items-center justify-between z-10 w-full">
                     <span className={`text-4xl font-light tracking-tight ${isFirewallActive ? 'text-green-500' : 'text-red-500'}`}>
                        {isFirewallActive ? 'Active' : 'Disabled'}
                     </span>
                     <button 
                       className={`w-14 h-8 rounded-full relative transition-all duration-300 flex items-center shadow-inner ${isFirewallActive ? 'bg-green-500' : 'bg-slate-400'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute transition-all duration-300 ${isFirewallActive ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>

               <div className={`${surfaceClass} p-6 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                  <h3 className={`text-sm font-medium flex items-center gap-2 mb-8 ${mutedTextClass}`}>
                     <Activity size={16} /> Socket Traffic
                  </h3>
                  <div className="flex items-end justify-between z-10">
                     <div>
                        <span className={`text-4xl font-light tracking-tight flex items-baseline ${textClass}`}>
                           4.2 <span className={`text-2xl font-light ml-1 ${mutedTextClass}`}>GB</span>
                        </span>
                        <p className={`text-xs font-medium mt-1 ${mutedTextClass}`}>Last 24h Vol.</p>
                     </div>
                     <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-medium">Optimal</span>
                  </div>
               </div>

               <div className={`${surfaceClass} p-6 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                  <h3 className={`text-sm font-medium flex items-center gap-2 mb-8 ${mutedTextClass}`}>
                     <Globe size={16} /> Edge Geo-Routing
                  </h3>
                  <div className="flex items-end justify-between z-10">
                     <div>
                        <span className={`text-4xl font-light tracking-tight ${textClass}`}>{blockedIps.length}</span>
                        <p className={`text-xs font-medium mt-1 ${mutedTextClass}`}>Active Blocks</p>
                     </div>
                     <button className="text-blue-500 hover:text-blue-600 font-medium bg-transparent border-0 outline-none pb-1 transition-colors">Manage</button>
                  </div>
               </div>
            </div>

            {/* LIVE ATTACK GRAPH */}
            <div className={`${surfaceClass} rounded-3xl p-8 flex flex-col shadow-sm relative overflow-hidden`}>
               <div className="flex justify-between items-start mb-10 z-10">
                  <div>
                     <h3 className={`text-2xl font-normal ${textClass}`}>Live Vector Graph</h3>
                     <p className={`text-sm mt-1 ${mutedTextClass}`}>Visualizing real-time payload interceptions.</p>
                  </div>
                  <span className="bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-xs font-medium animate-pulse flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div> Tracking Signals
                  </span>
               </div>

               <div className="flex-1 min-h-[220px] w-full z-10">
                  <ResponsiveContainer width="100%" height={220}>
                     <LineChart data={attackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isLightMode ? '#fff' : '#252525', border: 'none', borderRadius: '16px', color: isLightMode ? '#000' : '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                          labelStyle={{ display: 'none' }}
                          itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="v" 
                          stroke="#ef4444" 
                          strokeWidth={3} 
                          dot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }} 
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#f87171' }}
                          animationDuration={500} 
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>
            
            {/* CONFIGURATION ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* DDOS / RATE LIMIT CONFIGURATION PANEL */}
               <div id="ddos-security-panel" className={`${surfaceClass} rounded-3xl p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-3 mb-10">
                     <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
                        <ShieldAlert size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className={`text-xl font-normal ${textClass}`}>Rate Limits & DDoS</h3>
                  </div>

                  <div className="space-y-10 flex-1">
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <span className={`text-base font-medium ${textClass}`}>Max Requests Window</span>
                           <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isLightMode ? 'bg-slate-100 text-slate-700' : 'bg-gray-800 text-white'}`}>{ddosConfig.maxReqs} reqs</span>
                        </div>
                        <input 
                           type="range" min="10" max="1000" step="10"
                           className="w-full h-2.5 bg-slate-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                           value={ddosConfig.maxReqs}
                           onChange={e => handleDdosConfigChange('maxReqs', Number(e.target.value))}
                        />
                        <p className={`text-sm ${mutedTextClass}`}>Maximum allowed calls per IP in a 10s timeframe.</p>
                     </div>

                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <span className={`text-base font-medium ${textClass}`}>Ban Penalty Duration</span>
                           <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isLightMode ? 'bg-slate-100 text-slate-700' : 'bg-gray-800 text-white'}`}>{Math.round(ddosConfig.banDuration / 1000)}s</span>
                        </div>
                        <input 
                           type="range" min="10000" max="3600000" step="10000"
                           className="w-full h-2.5 bg-slate-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                           value={ddosConfig.banDuration}
                           onChange={e => handleDdosConfigChange('banDuration', Number(e.target.value))}
                        />
                        <p className={`text-sm ${mutedTextClass}`}>Wait time for banned IPs before clearance.</p>
                     </div>
                  </div>
               </div>

               {/* ALERT THRESHOLDS PANEL */}
               <div className={`${surfaceClass} rounded-3xl p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-3 mb-10">
                     <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-500">
                        <Settings size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className={`text-xl font-normal ${textClass}`}>System Tolerances</h3>
                  </div>

                  <div className="space-y-8 flex-1">
                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-base font-medium mb-1">
                           <span className={textClass}>Global Threat Alert</span>
                           <span className="text-indigo-500 font-bold">{thresholds.threatLevel}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           className="w-full h-2.5 bg-slate-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                           value={thresholds.threatLevel}
                           onChange={e => setThresholds({...thresholds, threatLevel: Number(e.target.value)})}
                        />
                     </div>
                     
                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-base font-medium mb-1">
                           <span className={textClass}>CPU Spike Limit</span>
                           <span className="text-indigo-500 font-bold">{thresholds.cpuSpike}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           className="w-full h-2.5 bg-slate-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                           value={thresholds.cpuSpike}
                           onChange={e => setThresholds({...thresholds, cpuSpike: Number(e.target.value)})}
                        />
                     </div>

                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-base font-medium mb-1">
                           <span className={textClass}>Memory Pressure Limit</span>
                           <span className="text-indigo-500 font-bold">{thresholds.memSpike}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           className="w-full h-2.5 bg-slate-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                           value={thresholds.memSpike}
                           onChange={e => setThresholds({...thresholds, memSpike: Number(e.target.value)})}
                        />
                     </div>
                  </div>

                  <button 
                     onClick={saveThresholds}
                     className="mt-10 w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-medium transition-colors shadow-md flex items-center justify-center"
                  >
                     Save Thresholds
                  </button>
               </div>
            </div>

            {/* THREAT MAP COMPONENT */}
            <div className={`${surfaceClass} rounded-3xl p-8 shadow-sm relative`}>
               <div className="mb-6 flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-2xl text-purple-500">
                     <Globe size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className={`text-xl font-normal ${textClass}`}>Origin Mapping</h3>
               </div>
               <div className="h-[350px] w-full rounded-3xl overflow-hidden bg-black/5 dark:bg-black/20">
                 <ThreatMapping />
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN (SIDEBAR) */}
         <div className={`${surfaceClass} rounded-3xl shadow-sm overflow-hidden min-h-0 h-full flex flex-col`}>
            <div className={`p-8 border-b ${dividerClass}`}>
               <h3 className={`text-xl font-normal flex items-center gap-3 ${textClass}`}>
                  <ShieldAlert size={24} className="text-red-500" /> Restriction Index
               </h3>
               <p className={`text-sm mt-3 ${mutedTextClass}`}>Manage currently blacklisted nodes instantly.</p>
            </div>
            
            <div className={`p-6 ${secSurfaceClass}`}>
               <div className="flex gap-3">
                  <input 
                     type="text" 
                     placeholder="IP Address / Node ID" 
                     className={`flex-1 border-none rounded-2xl px-5 h-14 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLightMode ? 'bg-white shadow-sm text-slate-800 placeholder-slate-400' : 'bg-black/20 text-white placeholder-gray-500'}`} 
                  />
                  <button className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md flex items-center justify-center transition-colors">
                     <Lock size={20} />
                  </button>
               </div>
            </div>

            <div className="ddos-log-stream flex-1 overflow-y-auto px-6 py-6 space-y-4">
               <div className="flex justify-between items-center px-2 mb-4">
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${mutedTextClass}`}>Active Shadow Bans</h4>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-gray-800 text-gray-300'}`}>{blockedIps.length}</span>
               </div>

               <AnimatePresence>
                 {blockedIps.map((b, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     key={b.ip} 
                     className={`${secSurfaceClass} hover:opacity-90 p-5 rounded-3xl flex flex-col gap-4 transition-all shadow-sm group`}
                   >
                      <div className="flex justify-between items-center">
                         <span className={`font-mono text-base font-semibold tracking-tight ${textClass}`}>{b.ip}</span>
                         <button 
                           onClick={() => manualUnban(b.ip)}
                           className="bg-transparent border-none text-slate-400 hover:text-green-500 hover:bg-green-500/10 transition-colors p-2 rounded-full cursor-pointer"
                           title="Release IP"
                         >
                            <Unlock size={18} />
                         </button>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase">IP RESTRICTED</span>
                         <span className={`text-sm font-semibold flex-1 text-right ${mutedTextClass}`}>{Math.round(b.expiresIn / 1000)}s left</span>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
               {blockedIps.length === 0 && (
                 <div className={`flex flex-col items-center justify-center h-48 ${mutedTextClass}`}>
                    <Shield size={48} className="opacity-20 mb-4" strokeWidth={1} />
                    <span className="text-base font-medium">No active bans</span>
                 </div>
               )}
            </div>

            <div className={`p-8 ${dividerClass} border-t`}>
               <h4 className="text-base font-medium text-red-500 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} /> Critical Action
               </h4>
               <button className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold rounded-2xl text-base transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 active:scale-95 shadow-sm">
                  Kill All Sockets
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

