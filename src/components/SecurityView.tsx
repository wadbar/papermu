import React, { useState, useEffect, useRef } from 'react';
import { Shield, Target, Trash2, AlertTriangle, ShieldAlert, Cpu, Activity, Globe, Lock, Settings, ChevronRight, Unlock, Sun, Moon, Zap } from 'lucide-react';
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
      style: { borderRadius: '16px', background: isLightMode ? '#f3edf7' : '#211f26', color: isLightMode ? '#1d1b20' : '#e6e0e9' }
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
            style: { borderRadius: '16px', background: isLightMode ? '#f3edf7' : '#211f26', color: isLightMode ? '#1d1b20' : '#e6e0e9' }
          });
        }
      } catch (e) {
        toast.error("Network error while applying limits.");
      }
    }, 500);
  };

  const [manualIpToBlock, setManualIpToBlock] = useState('');

  const handleManualBlock = async () => {
    if (!manualIpToBlock) return;
    try {
      const res = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: manualIpToBlock })
      });
      if (res.ok) {
        toast.success(`IP ${manualIpToBlock} blocked`, {
          style: { borderRadius: '16px', background: isLightMode ? '#f3edf7' : '#211f26', color: isLightMode ? '#1d1b20' : '#e6e0e9' }
        });
        setManualIpToBlock('');
      } else {
        toast.error("Failed to block IP");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleResetCounters = async () => {
    try {
      const res = await fetch('/api/security/reset-counters', { method: 'POST' });
      if (res.ok) {
        toast.success("Counters reset successfully", {
          style: { borderRadius: '16px', background: isLightMode ? '#f3edf7' : '#211f26', color: isLightMode ? '#1d1b20' : '#e6e0e9' }
        });
      } else {
        toast.error("Failed to reset counters");
      }
    } catch {
      toast.error("Network error");
    }
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
          style: { borderRadius: '16px', background: isLightMode ? '#f3edf7' : '#211f26', color: isLightMode ? '#1d1b20' : '#e6e0e9' }
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

  // MD3 Dynamic Token Mapping
  const md3 = isLightMode ? {
    bg: 'bg-[#fef7ff] text-[#1d1b20]',
    surface: 'bg-[#f3edf7]',
    surfaceContainerHigh: 'bg-[#ece6f0]',
    surfaceContainerHighest: 'bg-[#e6e0e9]',
    primary: 'bg-[#6750a4] text-[#ffffff]',
    primaryContainer: 'bg-[#eaddff] text-[#21005d]',
    secondaryContainer: 'bg-[#e8def8] text-[#1d192b]',
    tertiaryContainer: 'bg-[#ffd8e4] text-[#31111d]',
    errorContainer: 'bg-[#f9dedc] text-[#410e0b]',
    error: 'bg-[#b3261e] text-[#ffffff]',
    successContainer: 'bg-[#c4eed0] text-[#072711]',
    outline: 'border-[#79747e]',
    outlineVariant: 'border-[#cac4d0]',
    onSurfaceVariant: 'text-[#49454f]'
  } : {
    bg: 'bg-[#141218] text-[#e6e0e9]',
    surface: 'bg-[#211f26]',
    surfaceContainerHigh: 'bg-[#2b2930]',
    surfaceContainerHighest: 'bg-[#36343b]',
    primary: 'bg-[#d0bcff] text-[#381e72]',
    primaryContainer: 'bg-[#4f378b] text-[#eaddff]',
    secondaryContainer: 'bg-[#4a4458] text-[#e8def8]',
    tertiaryContainer: 'bg-[#633b48] text-[#ffd8e4]',
    errorContainer: 'bg-[#8c1d18] text-[#f9dedc]',
    error: 'bg-[#f2b8b5] text-[#601410]',
    successContainer: 'bg-[#0f5223] text-[#c4eed0]',
    outline: 'border-[#938f99]',
    outlineVariant: 'border-[#49454f]',
    onSurfaceVariant: 'text-[#cac4d0]'
  };

  const reputationColor = myIpStatus.isBanned 
    ? (isLightMode ? 'bg-[#b3261e]' : 'bg-[#f2b8b5]')
    : myIpStatus.reputation > 50 
      ? (isLightMode ? 'bg-[#a83800]' : 'bg-[#ffb59a]')
      : (isLightMode ? 'bg-[#116d32]' : 'bg-[#1f9344]');

  return (
    <div className={`space-y-6 flex flex-col h-full font-sans overflow-y-auto pb-8 px-4 transition-colors duration-300 ${md3.bg} rounded-3xl m-2 ring-1 ${md3.outlineVariant}`}>
      
      {/* HEADER SECTION - MD3 Typography & Spacing */}
      <header className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 shrink-0 pt-6 pb-2">
        <div>
           <div className="flex items-center gap-4 mb-3">
             <h2 className="text-4xl font-normal tracking-tight">Security Center</h2>
             <span className={`font-medium px-4 py-1.5 rounded-full text-sm tracking-wide ${md3.errorContainer}`}>
               AI Managed
             </span>
           </div>
           <p className={`text-base max-w-2xl font-normal ${md3.onSurfaceVariant} leading-relaxed`}>
             Advanced socket monitoring, packet filtration, routing limits, and global threat mitigation mapped via Neural Matrix protocols.
           </p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           {/* Theme Toggle */}
           <button 
             onClick={() => setIsLightMode(!isLightMode)}
             className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-[#6750a4]/20 ${md3.surfaceContainerHighest}`}
           >
              {isLightMode ? <Moon size={24} className="text-[#1d1b20]" /> : <Sun size={24} className="text-[#e6e0e9]" />}
           </button>

           {/* Current User IP Status Indicator (Required CSS Selector) */}
           <motion.div 
             className={`security-status-indicator rounded-3xl p-5 flex flex-col justify-center shadow-sm relative overflow-hidden min-w-[240px] border transition-colors duration-500 ${myIpStatus.isBanned ? md3.errorContainer : (myIpStatus.reputation > 50 ? md3.tertiaryContainer : md3.surfaceContainerHigh)} ${md3.outlineVariant}`}
           >
              <div className="flex justify-between items-start mb-3">
                 <span className={`text-[13px] font-medium tracking-wide ${myIpStatus.isBanned ? '' : md3.onSurfaceVariant}`}>Connection Node</span>
                 <motion.div 
                   className={`w-3.5 h-3.5 rounded-full shadow-lg ${reputationColor}`} 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                 />
              </div>
              <div className="flex items-end gap-3 w-full">
                 <span className="text-lg font-medium tracking-tight truncate">{myIpStatus.ip}</span>
                 <span className="text-[11px] ml-auto font-bold uppercase tracking-wider bg-black/10 px-2 py-1 rounded-lg shrink-0">
                   {myIpStatus.isBanned ? `BANNED ${Math.round(myIpStatus.expiresIn / 1000)}s` : `TRUSTED`}
                 </span>
              </div>
           </motion.div>

           <div className={`rounded-3xl p-5 flex items-center gap-5 shadow-sm border ${md3.outlineVariant} ${md3.surfaceContainerHigh}`}>
              <div className="flex flex-col items-end">
                 <span className={`text-[13px] font-medium tracking-wide ${md3.onSurfaceVariant}`}>Global Risk</span>
                 <span className={`text-2xl font-bold tracking-tight ${threatLevel > 70 ? (isLightMode ? 'text-[#b3261e]' : 'text-[#f2b8b5]') : (isLightMode ? 'text-[#116d32]' : 'text-[#4ade80]')}`}>
                   {threatLevel}%
                 </span>
              </div>
              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${threatLevel > 70 ? md3.errorContainer : md3.successContainer}`}>
                 <ShieldAlert size={28} strokeWidth={2} />
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
         
         {/* LEFT COLUMN (MAIN CONTENT) */}
         <div className="xl:col-span-3 space-y-6 flex flex-col">
            
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div 
                 className={`p-6 rounded-[2rem] flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${md3.surface}`} 
                 onClick={() => setIsFirewallActive(!isFirewallActive)}
               >
                  <h3 className={`text-base font-medium flex items-center gap-3 mb-8 ${md3.onSurfaceVariant}`}>
                     <Lock size={20} /> Firewall Status
                  </h3>
                  <div className="flex items-center justify-between z-10 w-full">
                     <span className={`text-4xl font-normal tracking-tight ${isFirewallActive ? (isLightMode ? 'text-[#116d32]' : 'text-[#4ade80]') : (isLightMode ? 'text-[#b3261e]' : 'text-[#f2b8b5]')}`}>
                        {isFirewallActive ? 'Active' : 'Disabled'}
                     </span>
                     <button 
                       className={`w-16 h-10 rounded-full relative transition-all duration-300 flex items-center shadow-inner ${isFirewallActive ? (isLightMode ? 'bg-[#116d32]' : 'bg-[#4ade80]') : md3.surfaceContainerHighest}`}
                     >
                        <div className={`w-8 h-8 rounded-full bg-white shadow-md absolute transition-all duration-300 ${isFirewallActive ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>

               <div className={`p-6 rounded-[2rem] flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${md3.surface}`}>
                  <h3 className={`text-base font-medium flex items-center gap-3 mb-8 ${md3.onSurfaceVariant}`}>
                     <Activity size={20} /> Socket Traffic
                  </h3>
                  <div className="flex items-end justify-between z-10">
                     <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-normal tracking-tight">4.2</span>
                        <span className={`text-xl font-medium ${md3.onSurfaceVariant}`}>GB</span>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${md3.secondaryContainer}`}>Optimal</span>
                  </div>
               </div>

               <div className={`p-6 rounded-[2rem] flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${md3.surface}`}>
                  <h3 className={`text-base font-medium flex items-center gap-3 mb-8 ${md3.onSurfaceVariant}`}>
                     <Globe size={20} /> Edge Geo-Routing
                  </h3>
                  <div className="flex items-end justify-between z-10">
                     <div>
                        <span className="text-4xl font-normal tracking-tight">{blockedIps.length}</span>
                        <p className={`text-sm font-medium mt-1 ${md3.onSurfaceVariant}`}>Active Blocks</p>
                     </div>
                     <button className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${md3.primaryContainer}`}>
                        <Settings size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* LIVE ATTACK GRAPH */}
            <div className={`rounded-[2rem] p-8 flex flex-col shadow-sm relative overflow-hidden ${md3.surface} border-none`}>
               <div className="flex justify-between items-start mb-10 z-10">
                  <div>
                     <h3 className="text-2xl font-normal">Live Vector Graph</h3>
                     <p className={`text-base mt-2 ${md3.onSurfaceVariant}`}>Visualizing real-time payload interceptions across edges.</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest animate-pulse flex items-center gap-2 ${md3.errorContainer}`}>
                     <div className={`w-2.5 h-2.5 rounded-full ${isLightMode ? 'bg-[#b3261e]' : 'bg-[#f2b8b5]'}`}></div> Tracking Signals
                  </span>
               </div>

               <div className="flex-1 min-h-[220px] w-full z-10">
                  <ResponsiveContainer width="100%" height={220}>
                     <LineChart data={attackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isLightMode ? '#f3edf7' : '#2b2930', border: 'none', borderRadius: '16px', color: isLightMode ? '#1d1b20' : '#e6e0e9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                          labelStyle={{ display: 'none' }}
                          itemStyle={{ fontSize: '16px', fontWeight: 500 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="v" 
                          stroke={isLightMode ? '#6750a4' : '#d0bcff'} 
                          strokeWidth={4} 
                          dot={{ r: 0 }} 
                          activeDot={{ r: 8, strokeWidth: 0, fill: isLightMode ? '#6750a4' : '#d0bcff' }}
                          animationDuration={500} 
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>
            
            {/* CONFIGURATION ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* DDOS / RATE LIMIT CONFIGURATION PANEL (Required CSS Selector) */}
               <div id="ddos-security-panel" className="rounded-[2rem] p-8 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex flex-col hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-shadow bg-black/80 backdrop-blur-md border border-orange-500/20 text-orange-50">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-4 rounded-2xl bg-orange-500/20 text-orange-400">
                        <Zap size={28} strokeWidth={2} />
                     </div>
                     <h3 className="text-2xl font-normal text-orange-400">Rate Allocation</h3>
                  </div>

                  <div className="space-y-10 flex-1">
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <span className="text-base font-medium">Max Requests Window</span>
                           <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-500/10 text-orange-300">{ddosConfig.maxReqs} reqs</span>
                        </div>
                        <input 
                           type="range" min="10" max="1000" step="10"
                           className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-500/30 bg-orange-900/50"
                           style={{ accentColor: '#f97316' }}
                           value={ddosConfig.maxReqs}
                           onChange={e => handleDdosConfigChange('maxReqs', Number(e.target.value))}
                        />
                        <p className="text-sm text-orange-200/50">Allowed calls per IP in a 10s timeframe.</p>
                     </div>

                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <span className="text-base font-medium">Ban Penalty Duration</span>
                           <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-500/10 text-orange-300">{Math.round(ddosConfig.banDuration / 1000)}s</span>
                        </div>
                        <input 
                           type="range" min="10000" max="3600000" step="10000"
                           className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-500/30 bg-orange-900/50"
                           style={{ accentColor: '#f97316' }}
                           value={ddosConfig.banDuration}
                           onChange={e => handleDdosConfigChange('banDuration', Number(e.target.value))}
                        />
                        <p className="text-sm text-orange-200/50">Wait time for banned IPs before clearance.</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-2">
                           <span className="text-base font-medium">Manual IP Block</span>
                           <div className="flex gap-2">
                              <input 
                                 type="text" 
                                 placeholder="Enter IP to block"
                                 value={manualIpToBlock}
                                 onChange={(e) => setManualIpToBlock(e.target.value)}
                                 className="flex-1 px-4 py-2 rounded-xl focus:outline-none bg-orange-950/30 border border-orange-500/20 text-orange-100 placeholder:text-orange-900/50"
                              />
                              <button 
                                 onClick={handleManualBlock}
                                 className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-xl transition-colors font-medium">
                                 Block
                              </button>
                           </div>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                           <button 
                              onClick={handleResetCounters}
                              className="w-full bg-orange-950/50 hover:bg-orange-900/50 border border-orange-500/20 text-orange-400 py-2 rounded-xl transition-colors font-medium h-[42px]">
                              Reset Counters
                           </button>
                        </div>
                     </div>
                   </div>
               </div>

               {/* THREAT MAP COMPONENT */}
               <div className={`rounded-[2rem] p-8 shadow-sm relative flex flex-col ${md3.surface}`}>
                  <div className="mb-6 flex items-center gap-4">
                     <div className={`p-4 rounded-2xl ${md3.secondaryContainer}`}>
                        <Globe size={28} strokeWidth={2} />
                     </div>
                     <h3 className="text-2xl font-normal">Origin Mapping</h3>
                  </div>
                  <div className={`flex-1 min-h-[300px] w-full rounded-3xl overflow-hidden ${md3.surfaceContainerHighest}`}>
                    <ThreatMapping />
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN (SIDEBAR) */}
         <div className={`rounded-[2rem] shadow-sm overflow-hidden min-h-0 h-full flex flex-col ${md3.surface}`}>
            <div className={`p-8 border-b ${md3.outlineVariant}`}>
               <h3 className="text-2xl font-normal flex items-center gap-3">
                  <ShieldAlert size={28} className={isLightMode ? 'text-[#b3261e]' : 'text-[#f2b8b5]'} /> Restriction Index
               </h3>
               <p className={`text-base mt-2 ${md3.onSurfaceVariant}`}>Manage currently blacklisted nodes instantly.</p>
            </div>
            
            <div className={`p-8 ${md3.surfaceContainerHigh}`}>
               <div className="flex gap-4">
                  <input 
                     type="text" 
                     placeholder="IP Address" 
                     className={`flex-1 border-none rounded-[1.25rem] px-6 h-16 text-lg focus:outline-none focus:ring-4 focus:ring-[#6750a4]/20 ${md3.surfaceContainerHighest} placeholder:opacity-50`} 
                  />
                  <button className={`h-16 w-16 rounded-[1.25rem] shadow-md flex items-center justify-center transition-all active:scale-95 ${md3.primary}`}>
                     <Lock size={24} />
                  </button>
               </div>
            </div>

            <div className="ddos-log-stream flex-1 overflow-y-auto px-8 py-8 space-y-6">
               {/* Quick DDoS Config Form inside Sidebar (Requested Selector area) */}
               <div className={`p-8 rounded-[1.5rem] mb-8 ${md3.surfaceContainerHighest}`}>
                 <h4 className={`text-sm font-semibold uppercase tracking-widest mb-6 ${md3.onSurfaceVariant}`}>Quick Toggles</h4>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="flex flex-col gap-3">
                     <label className={`text-sm font-medium ${md3.onSurfaceVariant}`}>Max Reqs / 10s</label>
                     <input 
                        type="number" 
                        min="1"
                        value={ddosConfig.maxReqs}
                        onChange={e => handleDdosConfigChange('maxReqs', Number(e.target.value))}
                        className={`w-full rounded-2xl px-5 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#6750a4]/20 transition-shadow ${md3.surface}`}
                     />
                   </div>
                   <div className="flex flex-col gap-3">
                     <label className={`text-sm font-medium ${md3.onSurfaceVariant}`}>Ban Time (ms)</label>
                     <input 
                        type="number" 
                        min="1000"
                        value={ddosConfig.banDuration}
                        onChange={e => handleDdosConfigChange('banDuration', Number(e.target.value))}
                        className={`w-full rounded-2xl px-5 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#6750a4]/20 transition-shadow ${md3.surface}`}
                     />
                   </div>
                 </div>
               </div>

               <div className="flex justify-between items-center px-2 mb-6">
                  <h4 className={`text-sm font-semibold uppercase tracking-widest ${md3.onSurfaceVariant}`}>Active Shadow Bans</h4>
                  <span className={`text-sm px-4 py-1.5 rounded-full font-bold ${md3.surfaceContainerHighest}`}>{blockedIps.length}</span>
               </div>

               <AnimatePresence>
                 {blockedIps.map((b, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     key={b.ip} 
                     className={`p-6 rounded-[1.5rem] flex flex-col gap-5 transition-all shadow-sm ${md3.surfaceContainerHigh}`}
                   >
                      <div className="flex justify-between items-center">
                         <span className="font-mono text-lg font-semibold tracking-tight">{b.ip}</span>
                         <button 
                           onClick={() => manualUnban(b.ip)}
                           className={`border-none transition-colors p-3 rounded-full cursor-pointer hover:bg-black/10 active:scale-95 ${md3.onSurfaceVariant}`}
                           title="Release IP"
                         >
                            <Unlock size={20} />
                         </button>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase ${md3.errorContainer}`}>RESTRICTED</span>
                         <span className={`text-base font-semibold flex-1 text-right ${md3.onSurfaceVariant}`}>{Math.round(b.expiresIn / 1000)}s left</span>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
               {blockedIps.length === 0 && (
                 <div className={`flex flex-col items-center justify-center h-48 ${md3.onSurfaceVariant} opacity-70`}>
                    <Shield size={56} className="mb-4" strokeWidth={1} />
                    <span className="text-lg font-medium">No active bans</span>
                 </div>
               )}
            </div>

            <div className={`p-8 border-t ${md3.outlineVariant}`}>
               <button className={`w-full h-16 border font-bold rounded-[1.25rem] text-lg transition-all focus:outline-none focus:ring-4 active:scale-95 shadow-sm flex items-center justify-center gap-3 ${md3.errorContainer} ${isLightMode ? 'border-[#b3261e]/30' : 'border-[#f2b8b5]/30'}`}>
                  <AlertTriangle size={20} /> Kill All Sockets
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

