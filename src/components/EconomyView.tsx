import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Activity, ShieldAlert, Cpu, HardDrive, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Search, AlertOctagon, Box } from 'lucide-react';
import { motion } from 'motion/react';

export default function EconomyView() {
  const [economyData, setEconomyData] = useState<any>(null);
  
  useEffect(() => {
     safeFetch('/api/economy')
       .then(d => setEconomyData(d))
       .catch(e => console.error(e));
  }, []);

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + ' Bilhões';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + ' Milhões';
    return num.toLocaleString();
  };

  const pieData = [
    { name: 'Jewel of Bless', value: 4000, color: '#fcd34d' },
    { name: 'Jewel of Soul', value: 3000, color: '#f472b6' },
    { name: 'Jewel of Chaos', value: 8000, color: '#93c5fd' },
    { name: 'Jewel of Life', value: 1500, color: '#fca5a5' },
    { name: 'Jewel of Creation', value: 500, color: '#c084fc' }
  ];

  const graphData = [
    { time: '00:00', zen: 1.2, trades: 120 },
    { time: '04:00', zen: 1.1, trades: 40 },
    { time: '08:00', zen: 1.3, trades: 80 },
    { time: '12:00', zen: 1.6, trades: 210 },
    { time: '16:00', zen: 2.1, trades: 450 },
    { time: '20:00', zen: 2.4, trades: 520 },
    { time: '23:59', zen: 2.2, trades: 300 },
  ];

  const suspiciousTrades = [
    { time: '14:02:11', players: 'DarkZ x FairyQ', item: 'Demon [0x9A4B]', reason: 'Item Serial Duplicado', severity: 'high' },
    { time: '12:45:00', players: 'Admin x Test', item: '2,000,000,000 Zen', reason: 'Volume Anormal de Zen', severity: 'medium' },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Economia & Antidupe <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-1 rounded tracking-widest font-black uppercase flex items-center gap-1"><ShieldAlert size={12}/> VIGIADO POR IA</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Monitoramento global da quantidade de jóias forjadas, zen em circulação e detecção profunda de dupes via rastreio de Seriais.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-[#111317] border border-[#1e2126] hover:bg-[#1a1d24] text-slate-300 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
             <Box size={14} /> Scan Database
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Zen Global Circulante', value: economyData ? formatNumber(economyData.totalMoney) : 'Carregando', trend: '+2.4%', icon: <DollarSign size={16} className="text-green-500"/> },
          { label: 'Risco de Inflação', value: economyData && economyData.totalMoney > 2000000000 ? 'ALTO' : 'BAIXO', color: economyData && economyData.totalMoney > 2000000000 ? 'text-red-500' : 'text-green-500', icon: <TrendingUp size={16} className="text-orange-500"/> },
          { label: 'Seriais Rastreados', value: '14,204,912', icon: <Activity size={16} className="text-blue-500"/> },
          { label: 'Dupes Bloqueados (24h)', value: '14', color: 'text-red-500', icon: <AlertOctagon size={16} className="text-red-500"/> }
        ].map((item, i) => (
          <div key={i} className="bg-[#111317] border border-[#1e2126] rounded-xl p-5 hover:border-white/10 transition-colors shadow-2xl">
             <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{item.label}</div>
                {item.icon}
             </div>
             <div className="flex items-end justify-between">
                <div className={`text-2xl font-black ${item.color || 'text-white'} tracking-tight`}>{item.value}</div>
                {item.trend && <div className="text-xs font-bold text-green-500 flex items-center"><ArrowUpRight size={14}/> {item.trend}</div>}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
           <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
             <TrendingUp size={14} className="text-blue-400"/> Fluxo de Economia (Zen x Trades)
           </h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorZen" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#2a2e36" vertical={false} />
                 <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickMargin={10} tickLine={false} axisLine={false} />
                 <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}B`} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Area type="monotone" dataKey="zen" name="Zen Circulante" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorZen)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

         <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Reserva Estimada de Jóias</h3>
            <div className="relative h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#111317', borderColor: '#1e2126', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                   itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {pieData.map((data, i) => (
                 <div key={i} className="flex justify-between items-center bg-[#15181d] p-2 rounded-lg border border-white/5 hover:bg-[#1a1d24] transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></div>
                      <span className="text-xs text-slate-300">{data.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">{data.value.toLocaleString()}</span>
                 </div>
              ))}
            </div>
         </div>
      </div>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
             <Search size={14} className="text-orange-500" /> Analisador de Anomalias (Trades / Lojas)
           </h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-slate-300">
             <thead className="bg-[#15181d] text-[10px] uppercase tracking-widest text-slate-500">
               <tr>
                 <th className="px-4 py-3 rounded-tl-lg">Horário</th>
                 <th className="px-4 py-3">Severidade</th>
                 <th className="px-4 py-3">Envolvidos</th>
                 <th className="px-4 py-3">Alvo / Quantidade</th>
                 <th className="px-4 py-3 rounded-tr-lg">Detecção da IA</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#1e2126] font-mono text-xs">
               {suspiciousTrades.map((trade, i) => (
                 <tr key={i} className="hover:bg-white/5 transition-colors">
                   <td className="px-4 py-4">{trade.time}</td>
                   <td className="px-4 py-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold ${trade.severity === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                       {trade.severity === 'high' ? 'CRÍTICO' : 'AVISO'}
                     </span>
                   </td>
                   <td className="px-4 py-4 text-blue-400">{trade.players}</td>
                   <td className="px-4 py-4 font-bold text-white">{trade.item}</td>
                   <td className="px-4 py-4 text-slate-400 flex items-center gap-2">
                     <AlertOctagon size={12} className={trade.severity === 'high' ? 'text-red-500' : 'text-orange-500'} /> 
                     {trade.reason}
                   </td>
                 </tr>
               ))}
               <tr>
                 <td className="px-4 py-4">14:00:22</td>
                 <td className="px-4 py-4"><span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">INFO</span></td>
                 <td className="px-4 py-4 text-slate-400">BladeKnight x DarkWizard</td>
                 <td className="px-4 py-4 text-slate-300">Dragon Armor +9</td>
                 <td className="px-4 py-4 text-slate-500">Trade Segura. Seriais Únicos.</td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
