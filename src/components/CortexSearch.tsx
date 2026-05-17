import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BrainCircuit, Loader2, Sparkles, Command, X, ArrowRight, Zap, Target, Shield, Database, Layout, BookOpen, Terminal } from 'lucide-react';
import { safeFetch } from '../lib/utils';
import toast from 'react-hot-toast';

export default function CortexSearch({ isOpen, onClose, navigateTo }: { isOpen: boolean, onClose: () => void, navigateTo: (tab: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState([
    { label: 'Como resetar o PK de todos os jogadores?', icon: Shield, tab: 'command-center' },
    { label: 'Editor de itens (Encyclopedia)', icon: BookOpen, tab: 'encyclopedia' },
    { label: 'Logs do Servidor (RCA AI)', icon: Search, tab: 'tools' },
    { label: 'Configurar Castle Siege', icon: Layout, tab: 'castlesiege' },
    { label: 'Executar Query SQL customizada', icon: Database, tab: 'database' },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleSuggestionSelection = (index: number) => {
    const s = suggestions[index];
    if (s.tab) {
      navigateTo(s.tab);
      onClose();
    } else {
      setQuery(s.label);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionSelection(selectedIndex);
      } else if (e.key === 'Enter') {
        handleSearch();
      }
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsProcessing(true);
    setAnswer(null);

    try {
      const data = await safeFetch('/api/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });

      if (data.answer) {
        setAnswer(data.answer);
      } else {
        throw new Error("O Oráculo não conseguiu processar sua dúvida.");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-[#0a0b0d] border border-[#1e2126] rounded-3xl shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden relative z-10"
          >
            <div className="p-2">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                   {isProcessing ? <Loader2 size={20} className="text-orange-500 animate-spin" /> : <Search size={20} className="text-slate-600 group-focus-within:text-orange-500 transition-colors" />}
                </div>
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Master Command Search (Ex: Como aumentar drop de Joias?)"
                  value={query}
                  onChange={(e) => {
                     setQuery(e.target.value);
                     setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#111317] border-none rounded-2xl py-6 pl-16 pr-24 text-lg text-white font-medium outline-none focus:ring-0 placeholder:text-slate-700"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <div className="bg-[#0a0b0d] border border-[#1e2126] px-2 py-1 rounded-md text-[10px] font-black text-slate-700 tracking-widest uppercase">ENTER</div>
                   <button onClick={onClose} className="p-2 text-slate-700 hover:text-white transition-colors">
                      <X size={18} />
                   </button>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar border-t border-[#1e2126]">
               {answer ? (
                 <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 text-orange-500">
                       <Sparkles size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Cortex AI Response</span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans">
                       {answer.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button 
                          onClick={() => setAnswer(null)}
                          className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                           Nova Pesquisa <ArrowRight size={12} />
                        </button>
                    </div>
                 </div>
               ) : (
                 <div className="p-4">
                    <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-4 mb-4 mt-2">Sugestões de Comandos</h3>
                    <div className="space-y-1">
                       {suggestions.map((s, idx) => (
                         <button 
                           key={idx}
                           onClick={() => handleSuggestionSelection(idx)}
                           onMouseEnter={() => setSelectedIndex(idx)}
                           className={`w-full text-left flex items-center justify-between p-4 rounded-xl hover:bg-[#111317] group transition-all ${idx === selectedIndex ? 'bg-[#111317]' : ''}`}
                         >
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-orange-600/5 group-hover:bg-orange-600/10 border border-orange-500/10 flex items-center justify-center text-slate-600 group-hover:text-orange-500 transition-all">
                                  <s.icon size={20} />
                               </div>
                               <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{s.label}</span>
                            </div>
                            <Command size={14} className="text-slate-800 group-hover:text-slate-600" />
                         </button>
                       ))}
                    </div>

                    <div className="mt-8 mb-4 px-4 py-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl flex items-center gap-5 relative overflow-hidden group/card cursor-pointer">
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover/card:opacity-10 transition-opacity">
                           <BrainCircuit size={80} className="text-blue-500" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 shadow-inner">
                           <BrainCircuit size={28} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1 mt-1">Cortex Kernel Mode</h4>
                           <p className="text-[11px] text-slate-500 leading-tight">O motor de IA está sincronizado com a Source C++ e o Banco SQL para respostas de baixa latência e alta precisão.</p>
                        </div>
                    </div>
                 </div>
               )}
            </div>

            <footer className="bg-[#111317] p-4 flex justify-between items-center border-t border-[#1e2126]">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                     <div className="px-1.5 py-0.5 rounded bg-[#0a0b0d] border border-[#1e2126] text-slate-400">Esc</div>
                     <span>Fechar</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                     <div className="px-1.5 py-0.5 rounded bg-[#0a0b0d] border border-[#1e2126] text-slate-400">↑↓</div>
                     <span>Navegar</span>
                  </div>
               </div>
               <div className="text-[9px] font-black text-slate-700 tracking-[0.2em] uppercase flex items-center gap-2">
                  Alpha Core <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
