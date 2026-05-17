import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Plus, Trash2, Edit3, Settings, Shield, Award, Zap, Star } from 'lucide-react';
import { safeFetch } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface VipTier {
  id: number;
  name: string;
  expBonus: number;
  dropBonus: number;
  taxDiscount: number;
  price: number;
  color: string;
}

export default function VipSystemView() {
  const [tiers, setTiers] = useState<VipTier[]>([
    { id: 1, name: 'VIP Bronze', expBonus: 10, dropBonus: 5, taxDiscount: 0, price: 500, color: '#cd7f32' },
    { id: 2, name: 'VIP Silver', expBonus: 25, dropBonus: 15, taxDiscount: 5, price: 1200, color: '#c0c0c0' },
    { id: 3, name: 'VIP Gold', expBonus: 50, dropBonus: 30, taxDiscount: 15, price: 2500, color: '#ffd700' },
    { id: 4, name: 'VIP Platinum', expBonus: 100, dropBonus: 50, taxDiscount: 25, price: 5000, color: '#e5e4e2' },
  ]);

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, we would send the JSON to the server to update the XML/SQL
      await safeFetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filepath: 'Data/IGC_VipSettings.xml', 
          content: JSON.stringify(tiers, null, 2) // Simulating XML as JSON for the example
        })
      });
      toast.success("Sincronização com o GameServer concluída!");
    } catch (e) {
      toast.error("Erro ao sincronizar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTier = (id: number, field: keyof VipTier, value: any) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-6 flex justify-between items-start">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Gerenciador VIP <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase font-black">Architecture Pro</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl font-medium">Controle granular de privilégios, taxas e bônus de experiência por nível de conta.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setTiers([...tiers, { id: Date.now(), name: 'Novo Plano', expBonus: 0, dropBonus: 0, taxDiscount: 0, price: 0, color: '#ffffff' }])} className="bg-[#111317] border border-[#1e2126] text-white font-bold p-3 rounded-xl hover:bg-[#1e2126] transition-all">
              <Plus size={20} />
           </button>
           <button onClick={handleSave} disabled={isLoading} className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 py-2 rounded-xl text-xs transition-all shadow-lg uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} /> {isLoading ? 'Sincronizando...' : 'Publicar Alterações'}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {tiers.map((tier) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={tier.id} 
              className="bg-[#111317] border border-[#1e2126] rounded-2xl overflow-hidden flex flex-col group hover:border-yellow-500/30 transition-all shadow-xl"
            >
               <div className="h-2 w-full" style={{ backgroundColor: tier.color }}></div>
               <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <input 
                          value={tier.name} 
                          onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                          className="bg-transparent text-lg font-black text-white focus:outline-none focus:text-yellow-500 transition-colors w-full"
                        />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{tier.price} WCOINS / MÊS</span>
                     </div>
                     <button onClick={() => setTiers(tiers.filter(t => t.id !== tier.id))} className="text-slate-700 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126] relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">EXP Bonus</span>
                             <span className="text-xl font-mono font-black text-white">+{tier.expBonus}%</span>
                           </div>
                           <Award size={20} className="text-yellow-500/20" />
                        </div>
                        <input 
                          type="range" min="0" max="500" value={tier.expBonus} 
                          onChange={(e) => updateTier(tier.id, 'expBonus', parseInt(e.target.value))}
                          className="w-full h-1 bg-yellow-500/10 appearance-none rounded-full mt-4 accent-yellow-500 cursor-pointer"
                        />
                     </div>

                     <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126] relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Drop Bonus</span>
                             <span className="text-xl font-mono font-black text-white">+{tier.dropBonus}%</span>
                           </div>
                           <Star size={20} className="text-blue-500/20" />
                        </div>
                        <input 
                          type="range" min="0" max="100" value={tier.dropBonus} 
                          onChange={(e) => updateTier(tier.id, 'dropBonus', parseInt(e.target.value))}
                          className="w-full h-1 bg-blue-500/10 appearance-none rounded-full mt-4 accent-blue-500 cursor-pointer"
                        />
                     </div>

                     <div className="bg-[#0a0b0d] p-4 rounded-xl border border-[#1e2126] relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tax Discount</span>
                             <span className="text-xl font-mono font-black text-white">-{tier.taxDiscount}%</span>
                           </div>
                           <Shield size={20} className="text-green-500/20" />
                        </div>
                        <input 
                          type="range" min="0" max="100" value={tier.taxDiscount} 
                          onChange={(e) => updateTier(tier.id, 'taxDiscount', parseInt(e.target.value))}
                          className="w-full h-1 bg-green-500/10 appearance-none rounded-full mt-4 accent-green-500 cursor-pointer"
                        />
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                     <div className="flex gap-1">
                        {[ '#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#3b82f6', '#ef4444' ].map(c => (
                          <button 
                            key={c} 
                            onClick={() => updateTier(tier.id, 'color', c)}
                            className={`w-4 h-4 rounded-full border border-white/10 transition-transform ${tier.color === c ? 'scale-125 border-white' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                     </div>
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Tier ID: {tier.id.toString().slice(-4)}</span>
                  </div>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 bg-yellow-600/5 border border-yellow-500/10 p-6 rounded-2xl flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
             <Settings size={24} />
          </div>
          <div className="flex-1">
             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Lógica Global de Venda</h4>
             <p className="text-xs text-slate-500">As configurações de preço acima são aplicadas diretamente no script do Website e do XShop se sincronizados.</p>
          </div>
          <button className="bg-[#111317] border border-[#1e2126] px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">Configurações Avançadas</button>
      </div>
    </div>
  );
}
