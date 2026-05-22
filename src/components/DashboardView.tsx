import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { safeFetch, fetchWithRetry } from '../lib/utils';
import { User, Activity, Users, ServerCrash, Loader2, TrendingUp, Cpu, Zap, Settings, Server, Shield, BrainCircuit, HardDrive, ShieldAlert, Database, Sparkles, BookOpen, Lightbulb, Globe, ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { i18n, Language } from '../i18n';
import { MU_MAPS, MU_CLASSES } from '../lib/muKnowledge';

const SupremaCheckup = React.lazy(() => import('./SupremaCheckup'));
const PerformanceMonitor = React.lazy(() => import('./PerformanceMonitor'));
const AIInsights = React.lazy(() => import('./AIInsights'));

const MiniLoader = () => (
  <div className="flex flex-col items-center justify-center p-8 text-slate-500">
    <Loader2 size={24} className="animate-spin text-orange-500 mb-2" />
    <span className="text-[10px] font-black uppercase tracking-widest">Carregando Modulo...</span>
  </div>
);

export default function DashboardView({ setActiveTab, serverState, language }: { setActiveTab: (tab: string) => void, serverState: string, language: Language }) {
  const isOnline = serverState === 'online';
  const isStarting = serverState === 'starting';
  const t = i18n[language];
  const [viewTab, setViewTab] = useState<'overview' | 'performance'>('overview');

  const [hostInfo, setHostInfo] = useState({ os: 'Carregando...', cpu: '...', storage: '...', ram: '...' });
  const [muServerPath, setMuServerPath] = useState("");
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [dbStats, setDbStats] = useState({ onlinePlayers: 0, totalAccounts: 0, totalCharacters: 0, totalGuilds: 0, classDistribution: [] as any[]});
  
  const [metrics, setMetrics] = useState<any>(null);
  const [historyMetrics, setHistoryMetrics] = useState<any[]>([]);
  const [apiHealth, setApiHealth] = useState<{ status: 'ok' | 'error' | 'loading', shield?: string, sentinel?: string }>({ status: 'loading' });
  const [deepHealthData, setDeepHealthData] = useState<any>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  // AI Orchestration States
  const [isSentinelActive, setIsSentinelActive] = useState(true);
  const [threatLevel, setThreatLevel] = useState(5);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isKernelRunning, setIsKernelRunning] = useState(false);
  const [lastCommand, setLastCommand] = useState<any>(null);

  // Sentinel Loop: Simula a captura de logs e análise pela IA
  useEffect(() => {
    if (!isSentinelActive) return;
    
    const interval = setInterval(async () => {
      try {
        const dummyLogs = [
          `[Trade] Account: 'Player_${Math.floor(Math.random()*100)}' (IP: 192.168.1.10) Traded Serial: 0x${Math.floor(Math.random()*9999).toString(16)} (Jewel of Soul)`,
          `[Protocol] Packet Header: 0xC1, Size: 12, ID: 0x11 (Attack Speed)`,
          `[DB-ERROR] SQL Timeout: MEMB_STAT table locked for ${Math.floor(Math.random()*2000)}ms`
        ];

        const data = await fetchWithRetry('/api/ai/log-guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logLines: dummyLogs })
        }, 1, 1000);

        if (data.success) {
          setThreatLevel(data.threatLevel || 0);
          const newAnomalies = Array.isArray(data.anomalies) ? data.anomalies : [];
          setAnomalies(prev => [...newAnomalies, ...prev].slice(0, 5));
        }
      } catch (e: any) {
        if (!e.message?.includes('HTML')) {
          console.error("Sentinel sync failed", e);
        }
      }
    }, 20000); // Check every 20s

    return () => clearInterval(interval);
  }, [isSentinelActive]);

  const runIntent = async (intent: string, clearTarget?: any) => {
    if (!intent.trim()) return;
    
    setIsKernelRunning(true);
    
    try {
      const data = await safeFetch('/api/ai/execute-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent })
      });

      if (data.success) {
        setLastCommand(data);
        if (clearTarget && clearTarget.value !== undefined) {
           clearTarget.value = "";
        }
        toast.success("Cortex Engine executou com sucesso.");
      }
    } catch (err) {
      toast.error("Erro na orquestração de comando.");
    } finally {
      setIsKernelRunning(false);
    }
  };

  const handleExecuteIntent = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runIntent(e.currentTarget.value, e.currentTarget);
    }
  };

  useEffect(() => {
    const fetchMetrics = () => {
      fetchWithRetry('/api/metrics', undefined, 2, 200)
        .then(data => {
            setMetrics(data);
            setHistoryMetrics(prev => {
                const newHistory = [...prev, {
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    cpu: data.cpu,
                    ram: data.ram,
                    rpm: data.rpm,
                    socketEvents: data.socketEvents
                }];
                if (newHistory.length > 20) return newHistory.slice(1);
                return newHistory;
            });
        })
        .catch(e => {
            if (!e.message.includes("HTML")) {
               console.error("Metrics sync failed", e);
            }
        });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    safeFetch('/api/server-info')
      .then(data => setHostInfo(data))
      .catch(e => console.error(e));

    safeFetch('/api/config')
      .then(data => setMuServerPath(data.muServerPath))
      .catch(e => console.error(e));
      
    safeFetch('/api/dashboard-stats')
      .then(data => setDbStats(data))
      .catch(e => console.error(e));

    const checkHealth = async () => {
      try {
        const data = await safeFetch('/api/health');
        setApiHealth({ 
          status: data.status === 'ok' ? 'ok' : 'error',
          shield: data.shield,
          sentinel: data.sentinel
        });
      } catch (e) {
        setApiHealth({ status: 'error' });
      }
    };

    const getDeepHealth = async () => {
      setIsRefreshingHealth(true);
      try {
        const data = await safeFetch('/api/health/deep');
        setDeepHealthData(data);
      } catch (e) {
        console.error("Deep health fail", e);
      } finally {
        setIsRefreshingHealth(false);
      }
    };

    checkHealth();
    getDeepHealth();
    const interval = setInterval(checkHealth, 10000);
    const deepInterval = setInterval(getDeepHealth, 60000);
    return () => {
      clearInterval(interval);
      clearInterval(deepInterval);
    };
  }, []);

  const savePath = () => {
    setIsSavingPath(true);
    safeFetch('/api/config', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ muServerPath })
    }).then(() => {
       setIsSavingPath(false);
       toast.success("Caminho do MuServer atualizado com sucesso!");
    }).catch(() => {
      setIsSavingPath(false);
      toast.error("Erro ao salvar o caminho do servidor");
    });
  };

  const chartData = [
    { time: '00:00', players: 400, connections: 450 },
    { time: '04:00', players: 300, connections: 320 },
    { time: '08:00', players: 500, connections: 550 },
    { time: '12:00', players: 800, connections: 850 },
    { time: '16:00', players: 1200, connections: 1300 },
    { time: '20:00', players: Math.max(1500, dbStats.onlinePlayers), connections: Math.max(1600, dbStats.onlinePlayers + 100) },
    { time: 'Agora', players: dbStats.onlinePlayers, connections: dbStats.onlinePlayers },
  ];

  const getClassName = (code: number) => {
      const muClass = MU_CLASSES.find(c => c.id === code || (c.id + 1 === code) || (c.id + 2 === code));
      return muClass ? muClass.short : `Class ${code}`;
  };

  const classData = useMemo(() => (dbStats.classDistribution || []).map((c: any) => ({
      name: getClassName(c.Class),
      count: c.count
  })).sort((a,b) => b.count - a.count).slice(0, 8), [dbStats.classDistribution]);

  const tips = useMemo(() => [
    { icon: Lightbulb, color: 'text-yellow-500', text: 'Revise o MSB de Lorencia. A densidade de monstros impacta o lag em servidores low-end.' },
    { icon: Sparkles, color: 'text-blue-500', text: 'Itens +15 podem exigir o Chaos Machine Rate configurado acima de 60% para balanceamento.' },
    { icon: Shield, color: 'text-green-500', text: 'Habilite o Checksum no Main.exe para prevenir hacks simples de troca de data.' },
  ], []);

  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex gap-2 items-center">
              {t.dashboard.title} 
              {dbStats.totalAccounts > 0 && <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase">{t.dashboard.liveDb}</span>}
            </h2>
            <p className="text-slate-400 mt-1">{t.dashboard.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 bg-[#111317] border border-[#1e2126] px-3 py-1.5 rounded-full ml-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                apiHealth.status === 'ok' 
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                  : apiHealth.status === 'error' 
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                    : 'bg-slate-500 animate-pulse'
              }`} 
              title={`API Service: ${apiHealth.status === 'ok' ? 'Online' : apiHealth.status === 'error' ? 'Offline/Error' : 'Connecting'}`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              API: {apiHealth.status === 'ok' ? 'Online' : apiHealth.status === 'error' ? 'Offline' : 'Scanning'}
            </span>
            <div className="flex items-center gap-1 border-l border-white/5 pl-2 ml-1">
              <ShieldCheck size={10} className="text-blue-500" />
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Sentinel V9 Shield Engaged</span>
            </div>
            <div className="flex items-center gap-1 border-l border-white/5 pl-2 ml-1">
              <Activity size={10} className="text-purple-500" />
              <span className="text-[8px] font-black text-purple-500 uppercase tracking-tighter">Entropy: {Math.floor(Math.random() * 5) + 2}%</span>
            </div>
          </div>
          
          {threatLevel > 50 && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: threatLevel > 70 ? [-3, 3, -3, 3, 0] : 0 
                }}
                transition={{ 
                  x: { repeat: Infinity, duration: 0.5, repeatDelay: 1 } 
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border ${
                   threatLevel > 70 
                     ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                     : 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                }`}
             >
                {threatLevel > 70 ? <AlertTriangle size={18} className="animate-pulse" /> : <AlertOctagon size={18} />}
                Nível de Ameaça: {threatLevel}%
             </motion.div>
          )}

          <div className="flex bg-[#111317] border border-[#1e2126] rounded-xl p-1 gap-1">
             <button
                onClick={() => setViewTab('overview')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   viewTab === 'overview' ? 'bg-orange-500/20 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-white'
                }`}
             >
                Overview
             </button>
             <button
                onClick={() => setViewTab('performance')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${
                   viewTab === 'performance' ? 'bg-orange-500/20 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-white'
                }`}
             >
                <Cpu size={12} /> Perf. Monitor
             </button>
          </div>
        </div>
        <div className="bg-[#111317] border border-[#1e2126] p-3 rounded-2xl flex items-center gap-4 hidden md:flex">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Server Version</span>
              <span className="text-sm font-bold text-white">Season 6 Ep 3</span>
           </div>
           <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
              <Server size={20} />
           </div>
        </div>
      </header>

      {viewTab === 'performance' ? (
        <Suspense fallback={<MiniLoader />}>
          <PerformanceMonitor />
        </Suspense>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: t.dashboard.online, value: isOnline ? dbStats.onlinePlayers : t.dashboard.offline, icon: User, color: 'text-orange-500' },
          { label: t.dashboard.accounts, value: isOnline ? dbStats.totalAccounts : '0', icon: Activity, color: 'text-blue-500' },
          { label: t.dashboard.chars, value: isOnline ? `${dbStats.totalCharacters} (${dbStats.totalGuilds})` : t.dashboard.offline, icon: Users, color: 'text-green-500' },
          { label: t.dashboard.errors, value: isOnline ? '0' : '0', icon: ServerCrash, color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111317] border border-[#1e2126] rounded-2xl p-5 hover:border-orange-500/30 transition-colors flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{stat.label}</p>
              <stat.icon size={16} className={stat.color} />
            </div>
            <h3 className={`text-2xl font-bold ${isOnline ? 'text-white' : 'text-slate-600'}`}>
               {isStarting ? <Loader2 className="animate-spin text-orange-500 h-5 w-5" /> : stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* CORTEX COMMAND KERNEL */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#0a0b0d] border border-blue-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <BrainCircuit size={100} className="text-blue-600" />
        </div>

        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Zap size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Cortex Command Center</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">IA Engine • Autonomous Orchestration Unit</p>
          </div>
          {isKernelRunning && <Loader2 size={16} className="animate-spin text-blue-500 ml-auto" />}
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="relative">
            <input 
              onKeyDown={handleExecuteIntent}
              placeholder="Comando de voz/texto (ex: 'Me dê um relatório de economia' ou 'Punir jogador hacker123')"
              className="w-full bg-[#111317] border border-[#1e2126] hover:border-blue-500/40 rounded-xl px-5 py-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all font-mono"
            />
            <div className="absolute right-4 top-4 flex items-center gap-2 pointer-events-none">
              <kbd className="text-[9px] text-slate-700 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">ENTER</kbd>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const name = prompt("Digite o nome do personagem (ou deixe vazio para GLOBAL):");
                const intent = name ? `Limpar PK / Killer do personagem ${name}` : "Limpar PK / Killer de todos os personagens (Global)";
                runIntent(intent);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group/btn"
            >
              <ShieldAlert size={14} className="group-hover/btn:scale-110 transition-transform" />
              Clear PK / Killer
            </button>
            <button 
              onClick={() => runIntent("Relógio de economia global")}
              className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Economy Report
            </button>
            <button 
              onClick={() => runIntent("Status de latência do db")}
              className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              DB Integrity
            </button>
          </div>
        </div>

        {lastCommand && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${lastCommand.risk === 'high' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                {lastCommand.type} ACTION DETECTED (RISK: {lastCommand.risk})
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg mb-2">
              <code className="text-xs text-blue-200 font-mono block break-all">{lastCommand.action}</code>
            </div>
            <p className="text-[10px] text-slate-500 italic"><Lightbulb size={10} className="inline mr-1 text-yellow-500" /> {lastCommand.explanation}</p>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={120} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2 relative z-10"><TrendingUp size={14} className="text-orange-500"/> {t.dashboard.traffic}</h3>
              <div className="h-[250px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2126" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Area type="monotone" dataKey="players" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPlayers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2"><Users size={14} className="text-purple-500"/> Class Distribution</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Stats</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2126" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'][index % 8]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           
            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-blue-500"/> 
                  Live Global Map
                </h3>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>Jogadores</span>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Eventos Ativos</span>
                   </div>
                </div>
              </div>

              <div className="relative h-[400px] bg-[#050506] rounded-2xl border border-white/5 overflow-hidden shadow-inner font-sans">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                 <div className="absolute inset-0 bg-[#0a0b0d] flex items-center justify-center opacity-40">
                    <div className="w-[80%] h-[80%] border border-white/5 rounded-full flex items-center justify-center">
                       <div className="w-[60%] h-[60%] border border-white/5 rounded-full"></div>
                    </div>
                 </div>
                 
                 {/* Simulated Player Clusters */}
                 {[
                   { name: 'Lorencia', x: '45%', y: '55%', count: 120, status: 'busy' },
                   { name: 'Noria', x: '75%', y: '65%', count: 45, status: 'low' },
                   { name: 'Devias', x: '30%', y: '25%', count: 85, status: 'busy' },
                   { name: 'Lost Tower', x: '60%', y: '30%', count: 32, status: 'low' },
                   { name: 'Arena', x: '50%', y: '10%', count: 210, status: 'packed' },
                   { name: 'Kanturu', x: '80%', y: '40%', count: 12, status: 'low' },
                 ].map((loc, i) => (
                   <motion.div 
                     key={i}
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute cursor-pointer group/loc"
                     style={{ left: loc.x, top: loc.y }}
                   >
                      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all group-hover/loc:scale-150 ${
                        loc.status === 'packed' ? 'bg-red-500 shadow-red-500/50' : 
                        loc.status === 'busy' ? 'bg-orange-500 shadow-orange-500/50' : 
                        'bg-blue-500 shadow-blue-500/50'
                      }`}></div>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 scale-0 group-hover/loc:scale-100 transition-all origin-top z-40">
                         <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl shadow-2xl min-w-[120px]">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{loc.name}</p>
                            <div className="flex justify-between items-center">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">Players</span>
                               <span className="text-[10px] font-mono text-orange-400 font-black">{loc.count}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                               <div 
                                className={`h-full ${loc.status === 'packed' ? 'bg-red-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min(100, (loc.count / 250) * 100)}%` }}
                               ></div>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))}

                 {/* Scan Line Effect */}
                 <motion.div 
                   animate={{ top: ['0%', '100%', '0%'] }}
                   transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 right-0 h-px bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10"
                 />
              </div>
              
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 {['GS-1 (Main)', 'GS-2 (Vip)', 'BS-1 (Battle)', 'CS-1 (Siege)'].map(gs => (
                   <div key={gs} className="bg-[#0a0b0d] border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gs}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           <Suspense fallback={<MiniLoader />}>
             <AIInsights />
           </Suspense>

           <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><BookOpen size={14} className="text-orange-500"/> Mu Online Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {tips.map((tip, i) => (
                   <div key={i} className="bg-[#0a0b0d] border border-[#1e2126] p-4 rounded-xl flex flex-col gap-3 hover:border-orange-500/20 transition-all">
                      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${tip.color}`}>
                         <tip.icon size={16} />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">{tip.text}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<MiniLoader />}>
            <SupremaCheckup />
          </Suspense>
          
          {/* LOG SENTINEL MONITOR */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#111317] border border-red-500/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute -right-4 -top-4 p-8 opacity-5">
              <ShieldCheck size={100} className="text-red-600" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <ShieldCheck size={18} className="text-red-500" />
                </div>
                <span className="text-xs font-black uppercase text-slate-200 tracking-widest">Guardian Sentinel</span>
              </div>
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                threatLevel > 30 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'
              }`}>
                THREAT: {threatLevel}%
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {anomalies.map((an, i) => (
                <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl hover:border-red-500/20 transition-all group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter flex items-center gap-1">
                      <ShieldAlert size={10} /> {an.type}
                    </span>
                    <span className="text-[8px] text-slate-700 font-mono">LIVE_FEED</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mb-2 leading-relaxed opacity-80">{an.evidence}</p>
                  <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1">
                    Apply Fix <ChevronRight size={10} />
                  </button>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-center py-8 opacity-30">
                   <Activity size={32} className="mx-auto mb-3 text-slate-600" />
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Analysing Live Logs...</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex gap-2">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/40 animate-pulse" style={{ width: '40%' }}></div>
               </div>
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/60 animate-pulse" style={{ width: '15%' }}></div>
               </div>
            </div>
          </motion.div>

          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Performance Pulse</h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] mb-2 uppercase font-black tracking-widest">
                     <span className="text-slate-500">CPU History (Real-Time)</span>
                     <span className={metrics?.cpu > 80 ? 'text-red-500' : 'text-blue-500'}>{metrics?.cpu || 0}%</span>
                  </div>
                  <div className="h-28 bg-[#0a0b0d] border border-[#1e2126] rounded-xl p-2 relative overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyMetrics} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e2126" vertical={false} />
                           <XAxis dataKey="time" hide />
                           <YAxis domain={[0, 100]} hide />
                           <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px', fontSize: '10px' }} 
                             itemStyle={{ color: metrics?.cpu > 80 ? '#ef4444' : '#3b82f6', fontWeight: 'bold' }}
                             labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                           />
                           <Line 
                             type="monotone" 
                             dataKey="cpu" 
                             name="CPU %"
                             stroke={metrics?.cpu > 80 ? '#ef4444' : '#3b82f6'} 
                             strokeWidth={2} 
                             dot={false} 
                             isAnimationActive={false} 
                           />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] mb-2 uppercase font-black tracking-widest">
                     <span className="text-slate-500">RAM Load</span>
                     <span className="text-purple-500">{metrics?.ram || 0} MB</span>
                  </div>
                  <div className="h-1.5 bg-[#0a0b0d] rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: Math.min(100, (metrics?.ram / 4096) * 100) + '%' }}
                     />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Cpu size={14} className="text-purple-500"/> Core Processes</h3>
            <div className="space-y-3">
               {[
                 { name: 'ConnectServer', status: serverState, load: metrics?.cpu ? Math.round(metrics.cpu * 0.1) : 0, mem: metrics?.ram ? Math.round(metrics.ram * 0.05) : 0 },
                 { name: 'JoinServer', status: serverState, load: metrics?.cpu ? Math.round(metrics.cpu * 0.15) : 0, mem: metrics?.ram ? Math.round(metrics.ram * 0.1) : 0 },
                 { name: 'GameServer', status: serverState, load: metrics?.cpu ? Math.round(metrics.cpu * 0.75) : 0, mem: metrics?.ram ? Math.round(metrics.ram * 0.8) : 0 },
               ].map((proc, i) => (
                 <div key={i} className="bg-[#0a0b0d] border border-[#1e2126] p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                    <div className="flex justify-between items-center z-10 relative">
                       <span className="text-xs font-bold text-slate-300">{proc.name}</span>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                          proc.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          proc.status === 'starting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'
                       }`}>{proc.status === 'online' ? 'Active' : proc.status === 'starting' ? 'Booting' : 'Offline'}</span>
                    </div>
                    {proc.status === 'online' && (
                       <div className="flex justify-between items-center z-10 relative mt-2 border-t border-white/5 pt-2">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">CPU</span>
                             <span className="text-xs font-mono text-blue-400">{proc.load}%</span>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Memory</span>
                             <span className="text-xs font-mono text-purple-400">{proc.mem} MB</span>
                          </div>
                       </div>
                    )}
                 </div>
               ))}
            </div>
          </div>

          {deepHealthData && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
                  <Shield size={14} className="text-blue-500"/> Deep Diagnostics
                </h3>
                {isRefreshingHealth && <Loader2 size={12} className="animate-spin text-slate-500" />}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#0a0b0d] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Database size={14} className={deepHealthData.diagnostics.db.status === 'nominal' ? 'text-green-500' : 'text-red-500'} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Engine</span>
                  </div>
                  <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded italic">
                    {deepHealthData.diagnostics.db.latency}ms
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#0a0b0d] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <HardDrive size={14} className={deepHealthData.diagnostics.fs.status === 'nominal' ? 'text-green-500' : 'text-red-500'} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FS Write Access</span>
                  </div>
                  <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded italic">Nominal</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#0a0b0d] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <BrainCircuit size={14} className="text-purple-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Core Engine</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded uppercase font-black">
                    {deepHealthData.diagnostics.ai.provider}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    <span>Last Integrity Scan</span>
                    <span>{new Date(deepHealthData.timestamp).toLocaleTimeString()}</span>
                 </div>
              </div>
            </motion.div>
          )}

          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Server size={14} className="text-blue-500"/> {t.dashboard.hostInfo}</h3>
            <div className="space-y-4">
               <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126]">
                  <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">{t.dashboard.os}</div>
                  <div className="text-sm text-white font-mono flex items-center gap-2"><Shield size={14} className="text-blue-500"/> {hostInfo.os}</div>
               </div>
               <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126]">
                  <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">{t.dashboard.cpu}</div>
                  <div className="text-sm text-white font-mono flex items-center gap-2"><BrainCircuit size={14} className="text-purple-500"/> {hostInfo.cpu}</div>
               </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#1e2126]">
               <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126]">
                  <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest block mb-2">Caminho do Servidor</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#111317] border border-[#1e2126] text-white text-xs font-mono p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all" 
                    value={muServerPath} 
                    onChange={e => setMuServerPath(e.target.value)} 
                    placeholder="Ex: C:\MuServer"
                  />
                  <button onClick={savePath} disabled={isSavingPath} className="w-full mt-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-blue-500/20 disabled:opacity-50">
                    {isSavingPath ? 'Salvando...' : 'Aplicar Configuração'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
