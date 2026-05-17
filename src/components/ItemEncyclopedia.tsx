import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, Plus, Filter, Info, ShoppingCart, Target, Sparkles, Loader2, Hammer, Zap, Sword, User, BookOpen, BrainCircuit, X, AlertCircle } from 'lucide-react';
import { safeFetch } from '../lib/utils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface Item {
  group: number;
  id: number;
  name: string;
  slot: string;
  damage?: number;
  attackSpeed?: number;
  reqLevel?: number;
}

export default function ItemEncyclopedia() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [minDamage, setMinDamage] = useState<string>('');
  const [minSpeed, setMinSpeed] = useState<string>('');
  const [maxLevel, setMaxLevel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [forgePrompt, setForgePrompt] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [forgedItem, setForgedItem] = useState<any>(null);

  const [aiAnalysisTarget, setAiAnalysisTarget] = useState<Item | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  useEffect(() => {
    safeFetch('/api/mu/reference')
      .then(data => {
        setItems(data.items || [
          { group: 0, id: 0, name: 'Kris', slot: 'weapon', damage: 6, attackSpeed: 50, reqLevel: 0 },
          { group: 0, id: 1, name: 'Short Sword', slot: 'weapon', damage: 10, attackSpeed: 50, reqLevel: 0 },
          { group: 0, id: 19, name: 'Sword of Destruction', slot: 'weapon', damage: 120, attackSpeed: 40, reqLevel: 220 },
          { group: 14, id: 13, name: 'Jewel of Bless', slot: 'jewel' },
          { group: 12, id: 0, name: 'Wings of Heaven', slot: 'wings', reqLevel: 180 },
        ]);
        setIsLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) || 
                           `${item.group}:${item.id}`.includes(activeSearchTerm);
      const matchesGroup = selectedGroup === 'all' || item.group === selectedGroup;
      
      const dmg = parseInt(minDamage);
      const matchesDamage = isNaN(dmg) || (item.damage !== undefined && item.damage >= dmg);
      
      const speed = parseInt(minSpeed);
      const matchesSpeed = isNaN(speed) || (item.attackSpeed !== undefined && item.attackSpeed >= speed);
      
      const level = parseInt(maxLevel);
      const matchesLevel = isNaN(level) || (item.reqLevel !== undefined && item.reqLevel <= level);

      return matchesSearch && matchesGroup && matchesDamage && matchesSpeed && matchesLevel;
    });
  }, [items, activeSearchTerm, selectedGroup, minDamage, minSpeed, maxLevel]);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(i => i.group))).sort((a, b) => a - b);
  }, [items]);

  const forgeItem = async () => {
    if (!forgePrompt) return;
    setIsForging(true);
    try {
      const data = await safeFetch('/api/ai/generate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: forgePrompt })
      });
      setForgedItem(data);
      toast.success("Item forjado nas forjas neurais!");
    } catch (e) {
      toast.error("Falha na forja");
    } finally {
      setIsForging(false);
    }
  };

  const analyzeItem = async (item: Item) => {
    setAiAnalysisTarget(item);
    setIsAnalyzing(true);
    setAnalysisResult('');
    try {
      const data = await safeFetch('/api/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `Forneça lore, estratégia de uso e raridade recomendada para o item de Mu Online: ${item.name} (Grupo ${item.group} ID ${item.id}).` })
      });
      setAnalysisResult(data.answer);
    } catch (e) {
      toast.error("O Oráculo não pôde analisar este item.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111317] p-8 rounded-3xl border border-[#1e2126] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Package size={120} className="text-orange-500" />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight italic flex items-center gap-3">
             <Package className="text-orange-600" /> ITEM ENCYCLOPEDIA
          </h2>
          <p className="text-slate-500 mt-2 font-medium tracking-tight">Cátalogo inteligente de itens e forja procedimental por IA.</p>
        </div>
        <div className="flex gap-2 relative z-10">
           <div className="text-right">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Total Database</span>
              <span className="text-2xl font-black text-white italic">{items.length} <small className="text-[10px] uppercase text-orange-500">Items</small></span>
           </div>
           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700 border border-white/5">
              <Target size={20} />
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 flex gap-4">
            <div className="flex-1 relative text-slate-400 focus-within:text-white transition-colors group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por nome, ID ou Grupo (ex: 14:13 ou Wings)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveSearchTerm(searchTerm)}
                className="w-full bg-[#111317] border border-[#1e2126] rounded-2xl py-4 pl-16 pr-4 focus:outline-none focus:border-orange-500/50 transition-all font-bold text-sm shadow-inner"
              />
            </div>
            <button 
              onClick={() => setActiveSearchTerm(searchTerm)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl hover:shadow-orange-600/20 uppercase tracking-widest text-xs"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Pesquisar</span>
            </button>
          </div>
          <div className="relative text-slate-400 group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" size={18} />
            <select 
              value={selectedGroup === 'all' ? 'all' : selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full bg-[#111317] border border-[#1e2126] rounded-2xl py-4 pl-14 pr-10 focus:outline-none focus:border-orange-500/50 appearance-none font-bold text-xs cursor-pointer shadow-inner uppercase tracking-widest"
            >
              <option value="all">Filtro de Grupos</option>
              {groups.map(g => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative text-slate-500 focus-within:text-white transition-colors">
            <Sword className="absolute left-5 top-1/2 -translate-y-1/2" size={16} />
            <input 
              type="number" 
              placeholder="Dano Mínimo..."
              value={minDamage}
              onChange={(e) => setMinDamage(e.target.value)}
              className="w-full bg-[#111317] border border-[#1e2126] rounded-2xl py-3 pl-14 pr-4 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
            />
          </div>
          <div className="relative text-slate-500 focus-within:text-white transition-colors">
            <Zap className="absolute left-5 top-1/2 -translate-y-1/2" size={16} />
            <input 
              type="number" 
              placeholder="Velocidade Mín..."
              value={minSpeed}
              onChange={(e) => setMinSpeed(e.target.value)}
              className="w-full bg-[#111317] border border-[#1e2126] rounded-2xl py-3 pl-14 pr-4 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
            />
          </div>
          <div className="relative text-slate-500 focus-within:text-white transition-colors">
            <User className="absolute left-5 top-1/2 -translate-y-1/2" size={16} />
            <input 
              type="number" 
              placeholder="Level Máximo..."
              value={maxLevel}
              onChange={(e) => setMaxLevel(e.target.value)}
              className="w-full bg-[#111317] border border-[#1e2126] rounded-2xl py-3 pl-14 pr-4 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
            />
          </div>
          <button 
            onClick={() => { setMinDamage(''); setMinSpeed(''); setMaxLevel(''); setSearchTerm(''); setActiveSearchTerm(''); setSelectedGroup('all'); }}
            className="bg-[#1e2126] hover:bg-[#2a2d33] text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Buscando definições no Kernel do Servidor...</p>
          </div>
        ) : filteredItems.map((item, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={`${item.group}-${item.id}`}
            className="group bg-[#111317] border border-[#1e2126] rounded-3xl p-6 hover:border-orange-500/30 transition-all relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
               <BrainCircuit size={60} className="text-orange-500" />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-[#0a0b0d] rounded-2xl flex items-center justify-center border border-[#1e2126] group-hover:bg-orange-600/10 group-hover:border-orange-500/20 transition-all shadow-inner">
                <Package className="text-slate-700 group-hover:text-orange-500" size={28} />
              </div>
              <span className="bg-orange-500/5 text-orange-500 text-[9px] font-black px-2.5 py-1 rounded-lg border border-orange-500/10 tracking-widest uppercase">
                {item.group}:{item.id}
              </span>
            </div>

            <h4 className="text-xl font-black text-white mb-1 group-hover:text-orange-500 transition-colors uppercase leading-tight tracking-tight">{item.name}</h4>
            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] mb-4 uppercase">{item.slot}</p>

            {(item.damage !== undefined || item.attackSpeed !== undefined || item.reqLevel !== undefined) && (
              <div className="flex flex-wrap gap-3 mb-6 text-[10px] font-mono">
                {item.damage !== undefined && (
                  <div className="flex items-center gap-1.5 text-red-500 bg-red-500/5 px-2.5 py-1 rounded-lg border border-red-500/10">
                    <Sword size={12} /> {item.damage}
                  </div>
                )}
                {item.attackSpeed !== undefined && (
                  <div className="flex items-center gap-1.5 text-blue-500 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10">
                    <Zap size={12} /> {item.attackSpeed}
                  </div>
                )}
                {item.reqLevel !== undefined && (
                  <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/5 px-2.5 py-1 rounded-lg border border-yellow-500/10">
                    <User size={12} /> LVL {item.reqLevel}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-auto">
               <button 
                onClick={() => analyzeItem(item)}
                className="bg-white/5 hover:bg-white/10 text-white font-bold p-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95 group/btn"
               >
                 <BrainCircuit size={16} className="text-white group-hover/btn:text-orange-500 transition-colors" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Oracle</span>
               </button>
               <button 
                className="bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white font-bold p-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-orange-500/20 active:scale-95"
               >
                 <Edit3 size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">EDITAR</span>
               </button>
            </div>
          </motion.div>
        ))}

        {filteredItems.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center bg-[#111317] rounded-3xl border-2 border-dashed border-[#1e2126] opacity-50">
             <Package size={48} className="mx-auto text-slate-800 mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Nenhum item indexado para "{activeSearchTerm}"</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {aiAnalysisTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111317] border border-[#1e2126] w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col p-8 overflow-hidden relative"
            >
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <BrainCircuit size={150} className="text-orange-500" />
               </div>
               
               <header className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                        <Package size={24} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none">{aiAnalysisTarget.name}</h3>
                        <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase mt-1">Análise Neural via Suprema Engine</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setAiAnalysisTarget(null)}
                    className="p-3 bg-[#0a0b0d] hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all shadow-inner border border-[#1e2126]"
                  >
                    <X size={20} />
                  </button>
               </header>

               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-[300px] mb-6">
                  {isAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                       <Loader2 size={40} className="animate-spin text-orange-500" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] animate-pulse">Sintonizando Kernel do Servidor...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none prose-sm font-sans custom-markdown-body">
                       <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                  )}
               </div>

               <footer className="mt-auto flex justify-between items-center pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3">
                     <BrainCircuit size={16} className="text-orange-500" />
                     <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">Master Mu Oracle Intelligence</span>
                  </div>
                  <button 
                    onClick={() => setAiAnalysisTarget(null)}
                    className="bg-white text-black font-black px-10 py-3 rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest hover:bg-slate-200"
                  >
                    FECHAR
                  </button>
               </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Forge Section with AI */}
      <div className="bg-[#111317] border border-orange-500/20 rounded-[2.5rem] p-10 mt-12 relative overflow-hidden shadow-2xl shadow-orange-500/5 group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
           <Hammer size={180} className="text-orange-600" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                <Sparkles size={32} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">CRIADOR PROCEDIMENTAL</h3>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em]">Neural Forging Engine</p>
             </div>
          </div>
          
          <p className="text-slate-400 mb-8 leading-relaxed font-medium">Use a inteligência artificial para criar novos itens, armas ou sets exclusivos. Descreva o visual ou tema e receba as linhas prontas de Item.txt e stats balanceados.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Ex: Uma espada feita de lava que inflama os inimigos..."
              value={forgePrompt}
              onChange={(e) => setForgePrompt(e.target.value)}
              className="flex-1 bg-[#0a0b0d] border-2 border-[#1e2126] focus:border-orange-500/50 rounded-2xl px-6 py-4 text-white font-bold outline-none transition-all shadow-inner placeholder:text-slate-800"
            />
            <button 
              onClick={forgeItem}
              disabled={isForging || !forgePrompt.trim()}
              className="bg-white hover:bg-slate-200 text-black font-black px-12 py-4 rounded-2xl transition-all shadow-xl hover:shadow-white/10 active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3 disabled:opacity-50"
            >
              {isForging ? <Loader2 className="animate-spin" size={18} /> : <Hammer size={18} />}
              FORJAR
            </button>
          </div>

          {forgedItem && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="mt-10 p-8 bg-[#0a0b0d] border border-orange-500/30 rounded-[2rem] shadow-2xl backdrop-blur-xl relative"
            >
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">{forgedItem.name}</h4>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{forgedItem.type}</span>
                  </div>
                  <button onClick={() => setForgedItem(null)} className="p-2 text-slate-700 hover:text-white transition-colors"><X size={18} /></button>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {Object.entries(forgedItem.stats || {}).map(([stat, val]) => (
                    <div key={stat} className="bg-[#111317] p-3 rounded-xl border border-white/5 flex flex-col items-center">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{stat}</span>
                       <span className="text-sm font-bold text-white font-mono">{String(val)}</span>
                    </div>
                  ))}
               </div>

               <div className="bg-black/40 p-4 rounded-xl border border-[#1e2126] font-mono text-[10px] text-green-500 overflow-x-auto whitespace-nowrap shadow-inner customs-scrollbar">
                  {forgedItem.itemTxtLine}
               </div>
               
               <p className="mt-4 text-[9px] text-slate-600 italic flex items-center justify-end gap-2 font-black uppercase tracking-widest">
                  Power Factor: Balanced via Kernel AI <Target size={10} className="text-orange-500" />
               </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const Edit3 = ({ size, className }: { size: number, className?: string }) => <Plus size={size} className={className} />;
