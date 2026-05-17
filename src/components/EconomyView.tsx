import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';

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
    { name: 'Jewel of Life', value: 1500, color: '#fca5a5' }
  ];

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Economia & Drops <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">Análise de Inflação</span>
        </h2>
        <p className="text-slate-400 mt-1 max-w-3xl">Monitoramento global da quantidade de jóias forjadas, zen em circulação e transações suspeitas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Zen Total em Circulação', value: economyData ? formatNumber(economyData.totalMoney) : 'Carregando' },
          { label: 'Zen (Personagens)', value: economyData ? formatNumber(economyData.charactersMoney) : 'Carregando' },
          { label: 'Zen (Baú/Warehouse)', value: economyData ? formatNumber(economyData.warehouseMoney) : 'Carregando' },
          { label: 'Risco de Inflação', value: economyData && economyData.totalMoney > 2000000000 ? 'Alto' : 'Baixo', color: economyData && economyData.totalMoney > 2000000000 ? 'text-red-500' : 'text-green-500' }
        ].map((item, i) => (
          <div key={i} className="bg-[#111317] border border-[#1e2126] rounded-xl p-5">
             <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">{item.label}</div>
             <div className={`text-xl font-bold ${item.color || 'text-white'}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="col-span-1 bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Estimativa de Jóias</h3>
            <div className="flex flex-col gap-4">
              {pieData.map((data, i) => (
                 <div key={i} className="flex justify-between items-center bg-[#050506] p-3 rounded-lg border border-[#1e2126]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                      <span className="text-sm text-slate-300">{data.name}</span>
                    </div>
                    <span className="font-bold font-mono text-white">{data.value} und</span>
                 </div>
              ))}
            </div>
         </div>
         
         <div className="col-span-2 bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Logs de Trade & Loja Pessoal (Store)</h3>
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-300">
                 <thead className="bg-[#1e2126] text-xs uppercase tracking-widest text-slate-400">
                   <tr>
                     <th className="px-4 py-2">Horário</th>
                     <th className="px-4 py-2">Tipo</th>
                     <th className="px-4 py-2">Expedidor</th>
                     <th className="px-4 py-2">Receptor/Item</th>
                     <th className="px-4 py-2">Volume</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1e2126] font-mono text-xs">
                   <tr>
                     <td className="px-4 py-3">14:00:22</td>
                     <td className="px-4 py-3"><span className="text-blue-400 bg-blue-500/10 px-2 rounded">TRADE</span></td>
                     <td className="px-4 py-3">BladeKnight</td>
                     <td className="px-4 py-3">DarkWizard</td>
                     <td className="px-4 py-3 text-orange-400">+5B Zen, Dragon Armor +9</td>
                   </tr>
                   <tr>
                     <td className="px-4 py-3">14:05:10</td>
                     <td className="px-4 py-3"><span className="text-yellow-400 bg-yellow-500/10 px-2 rounded">PERSONAL</span></td>
                     <td className="px-4 py-3">ElfLove</td>
                     <td className="px-4 py-3">Jewel of Chaos</td>
                     <td className="px-4 py-3 text-orange-400">14.000.000 Zen</td>
                   </tr>
                   <tr>
                     <td className="px-4 py-3">14:10:00</td>
                     <td className="px-4 py-3"><span className="text-green-400 bg-green-500/10 px-2 rounded">NPC</span></td>
                     <td className="px-4 py-3">Tester</td>
                     <td className="px-4 py-3">Potion of Healing x10</td>
                     <td className="px-4 py-3 text-red-400">-1.000 Zen</td>
                   </tr>
                 </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
