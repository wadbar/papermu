import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp } from 'lucide-react';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

export default function CastleSiegeView() {
  const [castleData, setCastleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     safeFetch('/api/castlesiege')
       .then(data => {
         setCastleData(data.castle);
         setLoading(false);
       })
       .catch(e => {
         console.error(e);
         setLoading(false);
       });
  }, []);

  const changeOwner = async () => {
      const guild = prompt("Digite o nome da Guild para virar dona do Castelo:");
      if (!guild) return;
      try {
         await safeFetch('/api/db/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `UPDATE MuCastle_DATA SET OWNER_GUILD = '${guild}'` })
         });
         alert("Dono atualizado. Aguarde uns instantes ou atualize a página.");
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Gerenciador Castle Siege <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">MuCastleData.dat</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Controle o estado atual do castelo, modifique a guild dona e resete o evento.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20">Forçar Mudança de Estado</button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
          <h3 className="font-bold text-white text-sm mb-4">Estado e Ciclo Atual do DB</h3>
          {loading ? (
             <div className="text-slate-500 p-4">Carregando dados do castelo...</div>
          ) : !castleData ? (
             <div className="text-slate-500 p-4">Nenhum dado de Castle Siege encontrado no SQL (MuCastle_DATA).</div>
          ) : (
             <div className="flex flex-col gap-4">
               <div className="bg-[#050506] border border-[#1e2126] p-4 rounded-xl flex justify-between items-center">
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Guild Dominante</p>
                     <p className="text-lg font-bold text-white mt-1">{castleData.OWNER_GUILD || "Nenhuma Guild"}</p>
                   </div>
                   <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><Shield size={20} /></div>
               </div>
               <div className="bg-[#050506] border border-[#1e2126] p-4 rounded-xl flex justify-between items-center">
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Tax Rate</p>
                     <p className="text-lg font-bold text-green-500 mt-1">TaxHunt: {castleData.TaxRateChaos}% | TaxShop: {castleData.TaxRateStore}%</p>
                   </div>
                   <div className="bg-green-500/10 p-2 rounded-lg text-green-400"><TrendingUp size={20} /></div>
               </div>
               
               <button onClick={changeOwner} className="w-full bg-[#1e2126] hover:bg-blue-600 border border-[#2a2d33] py-3 rounded-lg text-white font-bold text-sm transition-colors">
                  Alterar Guild Dominante (DB)
               </button>
             </div>
          )}
        </div>
        
        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
           <h3 className="font-bold text-white text-sm mb-4">Ciclos do Server (Referência)</h3>
           <div className="space-y-2">
             {['Segunda a Quarta: Registro de Guild', 'Quinta: Registro Start of Lord', 'Sexta: Anúncio de Guilds', 'Sábado: Preparação', 'Domingo: COMBATE!'].map((label, i) => (
                <div key={i} className={`text-xs px-3 py-2 rounded-lg border bg-[#050506] border-[#1e2126] text-slate-400 flex items-center`}>
                    <span className={`w-2 h-2 rounded-full mr-3 bg-slate-600`}></span>
                    {label}
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
