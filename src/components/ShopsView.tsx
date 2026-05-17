import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { Store } from 'lucide-react';

export default function ShopsView() {
  const [shopContent, setShopContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
     safeFetch('/api/files/read?filepath=Data/Shop0.txt')
        .then(d => setShopContent(d.content || ""))
        .catch(e => console.error(e));
  }, []);

  const handleSave = () => {
     setIsSaving(true);
     safeFetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: 'Data/Shop0.txt', content: shopContent })
     }).then(() => {
        setIsSaving(false);
        alert('Shop salvo com sucesso no servidor!');
     }).catch(() => setIsSaving(false));
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-0">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Store size={28} className="text-yellow-500" /> Lojas NPCs <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase">EventItemBag / Shops</span>
        </h2>
        <p className="text-slate-400 mt-1 max-w-3xl">Configure os itens vendidos pelos NPCs, como a Potion Girl, Ferreiro/Blacksmith, entre outros. Usando arquivos txt reais do servidor.</p>
      </header>

      <div className="flex gap-4">
        <select className="w-1/3 bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500">
           <option>Shop 0 (Liaman the Barmaid)</option>
        </select>
        <button onClick={handleSave} disabled={isSaving} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50">
           {isSaving ? 'Salvando...' : 'Salvar Shop0.txt'}
        </button>
      </div>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl flex-1 p-6 relative flex flex-col">
          <textarea 
             value={shopContent}
             onChange={(e) => setShopContent(e.target.value)}
             className="w-full h-full bg-[#050506] border border-[#1e2126] p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-yellow-500 rounded resize-none"
          />
          
          <div className="absolute top-6 right-6 w-72 bg-[#050506] border border-[#1e2126] rounded-xl p-4">
             <h4 className="font-bold text-white mb-2 text-sm">Adicionar Item Rápido</h4>
             <div className="space-y-3">
                <input type="text" placeholder="ID (Ex: 14 0)" className="w-full bg-[#111317] border border-[#1e2126] rounded px-3 py-2 text-xs text-white" />
                <button onClick={() => setShopContent(shopContent + '\n14 \t 0 \t 0 \t 0 \t 0 \t 0 \t 0 // Novo Item')} className="w-full bg-[#1e2126] hover:bg-yellow-600 hover:text-black text-white font-bold py-2 rounded text-xs transition-colors">ADICIONAR LINHA</button>
             </div>
          </div>
      </div>
    </div>
  );
}
