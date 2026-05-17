import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { Swords } from 'lucide-react';

export default function GuildsView() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     safeFetch('/api/guilds')
       .then(data => {
         setGuilds(data.guilds || []);
         setLoading(false);
       })
       .catch(e => {
         console.error(e);
         setLoading(false);
       });
  }, []);

  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <Swords size={28} className="text-blue-500" /> Guilds & Alianças
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Visualização do ranking e membros (Real-time DB).</p>
        </div>
        <div className="flex gap-2">
           <input type="text" placeholder="Buscar Guild..." className="bg-[#111317] border border-[#1e2126] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
           <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors shadow-lg">Buscar</button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {loading ? <div className="text-slate-500">Carregando guilds...</div> : 
          guilds.length === 0 ? <div className="text-slate-500 col-span-3 text-center py-10 bg-[#111317] border border-[#1e2126] rounded-2xl">Nenhuma guild encontrada no banco de dados.</div> :
          guilds.map((guild, i) => (
            <div key={i} className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: i === 0 ? '#ef4444' : i === 1 ? '#eab308' : '#3b82f6' }}></div>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-md bg-stone-700 border-2 border-[#1e2126] flex items-center justify-center shadow-lg font-bold text-xs p-1 overflow-hidden break-all`}>
                        {guild.logo ? "Logo" : "No"}
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-white">{guild.name}</h3>
                        <p className="text-xs text-slate-500">Master: <span className="text-orange-400 font-mono">{guild.master}</span></p>
                     </div>
                  </div>
                  <div className="bg-[#050506] px-3 py-1 rounded border border-[#1e2126] text-center">
                     <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Rank</div>
                     <div className="text-xl font-black text-white">#{i + 1}</div>
                  </div>
               </div>
               
               <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-[#050506] p-2 rounded-lg border border-[#1e2126] text-center">
                     <div className="text-[10px] text-slate-500">G-Score</div>
                     <div className="font-bold text-yellow-500 font-mono">{guild.score || 0}</div>
                  </div>
                  <div className="flex-1 bg-[#050506] p-2 rounded-lg border border-[#1e2126] text-center">
                     <div className="text-[10px] text-slate-500">Membros</div>
                     <div className="font-bold text-blue-400 font-mono">N/A</div>
                  </div>
               </div>
               
               <button className="w-full bg-[#1e2126] hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">Ver Membros (Em Breve)</button>
            </div>
         ))}
      </div>
    </div>
  );
}
