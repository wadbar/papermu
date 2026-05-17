import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, UserPlus, ShieldX, Sword, Crown, 
  Trash2, RefreshCw, Send, AlertTriangle, 
  UserCheck, Database, Terminal, Ghost, Skull, Loader2, Sparkles, MessageSquare, BookOpen, Search
} from 'lucide-react';
import { safeFetch } from '../lib/utils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function CommandCenter() {
  const [activeView, setActiveView] = useState<'commands' | 'oracle' | 'broadcast' | 'sql'>('commands');
  const [targetChar, setTargetChar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSQL, setIsGeneratingSQL] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [customQuery, setCustomQuery] = useState('');
  const [nlPrompt, setNlPrompt] = useState('');
  const [isFixing, setIsFixing] = useState(false);

  // Oracle States
  const [question, setQuestion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [oracleAnswer, setOracleAnswer] = useState('');

  const askOracle = async () => {
    if (!question.trim()) return;
    setIsSearching(true);
    setOracleAnswer('');
    try {
      const data = await safeFetch('/api/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (data.answer) {
        setOracleAnswer(data.answer);
      } else {
        throw new Error(data.error || 'O Oráculo está em silêncio...');
      }
    } catch(e: any) {
      toast.error(e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const triggerSelfCorrection = async (failedQuery: string, errorMsg: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-slate-800">Auto-Correction Disponível</span>
        <span className="text-[10px] text-slate-500 line-clamp-2">{errorMsg}</span>
        <button 
          onClick={() => {
            toast.dismiss(t.id);
            fixQuery(failedQuery, errorMsg);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded mt-1 flex items-center justify-center gap-2"
        >
          <Sparkles size={12} /> Corrigir Sintaxe via IA
        </button>
      </div>
    ), { duration: 10000, icon: '🛡️' });
  };

  const fixQuery = async (failedQuery: string, errorMsg: string) => {
    setIsFixing(true);
    const toastId = toast.loading('Calculando correção neural...');
    try {
      const data = await safeFetch('/api/ai/fix-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: failedQuery, errorMessage: errorMsg })
      });
      if (data.fixedQuery) {
         setCustomQuery(data.fixedQuery);
         toast.success('Sintaxe corrigida! Pronta para reexecução.', { id: toastId, icon: "🩺" });
      } else {
         throw new Error(data.error || 'Falha na autocorreção');
      }
    } catch(e: any) {
       toast.error("Erro na correção: " + e.message, { id: toastId });
    } finally {
      setIsFixing(false);
    }
  };

  const generateSQL = async () => {
    if (!nlPrompt.trim()) {
      toast.error("Descreva o que deseja fazer no banco.");
      return;
    }
    setIsGeneratingSQL(true);
    const toastId = toast.loading('Consultando Oráculo Neural (Gemini)...');
    try {
      const data = await safeFetch('/api/ai/generate-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptStr: nlPrompt })
      });
      if (data.query) {
        setCustomQuery(data.query);
        toast.success("Query sintetizada com sucesso!", { id: toastId, icon: "🧠" });
      } else {
        throw new Error(data.error || 'Falha na IA');
      }
    } catch (e: any) {
      toast.error("Erro na síntese: " + e.message, { id: toastId });
    } finally {
      setIsGeneratingSQL(false);
    }
  };

  const executeCommand = async (cmd: string, args: string, successMsg: string, isManual = false) => {
    if (!targetChar && cmd !== 'global' && !isManual) {
      toast.error("Informe o nome do personagem alvo.");
      return;
    }

    if (safeMode) {
      const confirmText = isManual ? "Executar query customizada?" : `Executar "${cmd}" em "${targetChar}"?`;
      if (!confirm(confirmText)) return;
    }
    
    setIsLoading(true);
    try {
      let query = isManual ? customQuery : '';
      if (!isManual) {
        switch(cmd) {
          case 'clear-pk':
            query = `UPDATE Character SET PkLevel = 3, PkCount = 0, PkTime = 0 WHERE Name = '${targetChar}'`;
            break;
          case 'reset-stats':
            query = `UPDATE Character SET Strength = 25, Agility = 25, Vitality = 25, Energy = 25, Leadership = 25 WHERE Name = '${targetChar}'`;
            break;
          case 'add-vip':
            query = `UPDATE MEMB_INFO SET AccountVip = 1 WHERE memb___id = (SELECT AccountID FROM Character WHERE Name = '${targetChar}')`;
            break;
          case 'change-class':
            query = `UPDATE Character SET Class = ${args} WHERE Name = '${targetChar}'`;
            break;
          case 'reset-zen':
            query = `UPDATE Character SET Money = 0 WHERE Name = '${targetChar}'`;
            break;
        }
      }

      const data = await safeFetch('/api/db/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (data.success) {
        toast.success(successMsg || "Query executada com sucesso!");
        if(isManual) setCustomQuery('');
      } else {
        toast.error("Erro SQL: " + data.error);
        if (isManual) triggerSelfCorrection(query, data.error);
      }
    } catch (e: any) {
      toast.error("Falha na conexão: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const proCommands = [
    { id: 'clear-pk', label: 'Limpar PK / Killer', icon: Ghost, color: 'text-white', bg: 'bg-white/10', msg: 'Status de PK limpo com sucesso!' },
    { id: 'reset-stats', label: 'Resetar Atributos', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10', msg: 'Atributos resetados para 25.' },
    { id: 'add-vip', label: 'Dar VIP (30 Dias)', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', msg: 'VIP adicionado à conta!' },
    { id: 'reset-zen', label: 'Zerar Zen', icon: Trash2, color: 'text-red-400', bg: 'bg-red-400/10', msg: 'Zen zerado com sucesso.' },
  ];

  const classes = [
    { id: 0, label: 'Dark Wizard', color: 'text-blue-400' },
    { id: 16, label: 'Dark Knight', color: 'text-red-400' },
    { id: 32, label: 'Elf', color: 'text-green-400' },
    { id: 48, label: 'Magic Gladiator', color: 'text-purple-400' },
    { id: 64, label: 'Dark Lord', color: 'text-orange-400' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Power Center <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase">Admin Toolkit</span>
          </h2>
          <p className="text-slate-400 mt-1">Controle total sobre o banco de dados e conhecimento enciclopédico de Mu Online.</p>
        </div>
        <div className="flex bg-[#111317] border border-[#1e2126] p-1 rounded-xl">
           <button 
             onClick={() => setActiveView('commands')}
             className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeView === 'commands' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             COMANDOS
           </button>
           <button 
             onClick={() => setActiveView('oracle')}
             className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeView === 'oracle' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Sparkles size={12} /> ORÁCULO
           </button>
           <button 
             onClick={() => setActiveView('sql')}
             className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeView === 'sql' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Database size={12} /> SQL AI
           </button>
           <button 
             onClick={() => setActiveView('broadcast' as any)}
             className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeView === 'broadcast' as any ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <MessageSquare size={12} /> BROADCAST
           </button>
        </div>
      </header>

      {activeView === 'commands' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Target Character</label>
                  <div className="relative">
                      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 focus-within:text-orange-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        placeholder="Digite o nome exato (ex: Wadson)..."
                        value={targetChar}
                        onChange={(e) => setTargetChar(e.target.value)}
                        className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all font-mono placeholder:text-slate-800"
                      />
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-[#0a0b0d] border border-[#1e2126] px-5 py-3 rounded-xl">
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Safe Mode</span>
                      <span className={`text-[10px] font-black ${safeMode ? 'text-green-500' : 'text-red-500'}`}>{safeMode ? 'PROTEGIDO' : 'RISCO'}</span>
                  </div>
                  <button 
                      onClick={() => setSafeMode(!safeMode)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${safeMode ? 'bg-green-600' : 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]'}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${safeMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                  <Zap size={14} className="text-orange-500" /> Ações de Elite
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proCommands.map((cmd) => (
                      <button 
                        key={cmd.id}
                        disabled={isLoading}
                        onClick={() => executeCommand(cmd.id, '', cmd.msg)}
                        className="flex flex-col items-start p-5 rounded-2xl bg-[#111317] border border-[#1e2126] hover:border-orange-500/30 group transition-all text-left shadow-lg disabled:opacity-50"
                      >
                        <div className={`p-3 rounded-xl ${cmd.bg} ${cmd.color} mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
                            <cmd.icon size={24} />
                        </div>
                        <span className="text-sm font-black text-white mb-2 uppercase tracking-tight">{cmd.label}</span>
                        <span className="text-[11px] text-slate-500 leading-relaxed italic">Modifica registros atômicos no SQL Server.</span>
                      </button>
                  ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                  <Sword size={14} className="text-red-500" /> Morph / Classe
                </h3>
                <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 h-full shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Skull size={100} className="text-red-600" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 relative z-10">
                      {classes.map((cls) => (
                        <button 
                          key={cls.id}
                          disabled={isLoading}
                          onClick={() => executeCommand('change-class', cls.id.toString(), `Classe alterada para ${cls.label}!`)}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0b0d] border border-[#1e2126] hover:bg-[#1a1c22] hover:border-red-500/30 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${cls.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`}></div>
                              <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{cls.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-700 group-hover:text-red-500 transition-colors">HEX {cls.id.toString(16).toUpperCase()}</span>
                        </button>
                      ))}
                  </div>
                  <div className="mt-6 flex items-center gap-3 p-4 bg-orange-600/5 border border-orange-500/20 rounded-2xl backdrop-blur-sm">
                      <AlertTriangle size={24} className="text-orange-500 shrink-0" />
                      <p className="text-[10px] text-orange-500/80 leading-relaxed italic">
                        Recomenda-se realizar alterações de classe com o jogador em estado <b>DESCONECTADO</b> do GameServer.
                      </p>
                  </div>
                </div>
            </div>
          </div>
        </motion.div>
      ) : activeView === 'sql' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] flex items-center gap-2 px-1 mb-4">
                <BrainCircuit size={14} className="text-blue-500" /> Neural SQL Transpiler
            </h3>
            
            <div className="bg-[#111317] border-2 border-blue-500/10 rounded-2xl p-7 mb-6 relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.1)] flex flex-col gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles size={120} className="text-blue-500" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0 shadow-inner border border-blue-500/20">
                    <Database size={32} />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <h4 className="text-white font-black text-lg tracking-tight uppercase">Tradução de Linguagem Natural</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      Descreva a operação que deseja realizar no banco de dados (ex: "Resetar PK de todos os personagens acima do level 300") e a IA Master-GM gerará o T-SQL correspondente.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-600/5 blur-xl group-focus-within:bg-blue-600/10 transition-all pointer-events-none"></div>
                  <div className="relative bg-[#0a0b0d] border border-blue-500/20 rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: Dar 500kk de zen para todas as contas VIP..."
                      value={nlPrompt}
                      onChange={(e) => setNlPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && generateSQL()}
                      className="flex-1 bg-transparent border-none px-6 py-4 text-white placeholder-slate-800 focus:ring-0 transition-all font-medium"
                    />
                    <button 
                      onClick={generateSQL}
                      disabled={isGeneratingSQL || !nlPrompt.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isGeneratingSQL ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={14} /> GERAR QUERY</>}
                    </button>
                  </div>
                </div>
            </div>

            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-1 shadow-2xl relative group">
                <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e2126] bg-black/20 rounded-t-2xl">
                   <div className="flex items-center gap-3">
                      <Terminal size={14} className="text-slate-600" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Master-Node SQL Console</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Connection</span>
                   </div>
                </div>
                <textarea 
                  placeholder="A query gerada aparecerá aqui para revisão antes da execução..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full h-56 bg-transparent border-none p-6 text-blue-400 font-mono text-sm focus:outline-none transition-all resize-none custom-scrollbar"
                />
                <div className="p-6 bg-black/20 rounded-b-2xl border-t border-[#1e2126] flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-700 tracking-widest uppercase">Motor SQL</span>
                       <span className="text-[10px] font-mono text-slate-400">Transact-SQL (T-SQL)</span>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-700 tracking-widest uppercase">Target DB</span>
                       <span className="text-[10px] font-mono text-slate-400">MuOnline / Me_MuOnline</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setCustomQuery('')}
                      className="px-6 py-3 text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 group/clear"
                    >
                      <Trash2 size={14} className="group-hover/clear:text-red-500 transition-colors" /> LIMPAR
                    </button>
                    <button 
                      onClick={() => executeCommand('manual', '', 'Comando customizado executado!', true)}
                      disabled={isLoading || isFixing || !customQuery.trim()}
                      className="flex-1 sm:flex-none bg-white hover:bg-slate-200 text-black font-black px-10 py-4 rounded-xl transition-all text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {(isLoading || isFixing) ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} EXECUTAR SCRIPT
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111317] border border-purple-500/20 rounded-3xl p-8 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden"
        >
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
           
           <div className="text-center mb-10 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mx-auto mb-6 shadow-inner">
                 <BookOpen size={40} />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">O Oráculo de MU Online</h3>
              <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
                Acesse todo o conhecimento global sobre o universo de Mu Online. Pergunte sobre configurações, drops, eventos ou balanceamento.
              </p>
           </div>

           <div className="max-w-3xl mx-auto w-full space-y-8 relative z-10">
              <div className="relative group">
                 <Search size={22} className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-purple-500 animate-pulse' : 'text-slate-600 group-focus-within:text-purple-400'}`} />
                 <input 
                   disabled={isSearching}
                   type="text" 
                   placeholder="Qual o XP ideal para um servidor Hard Season 6? | Onde dropa Kundun Mark?"
                   className="w-full bg-[#0a0b0d] border-2 border-[#1e2126] focus:border-purple-500/50 rounded-3xl py-6 pl-16 pr-8 text-lg text-white font-medium outline-none transition-all shadow-2xl placeholder:text-slate-800"
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && askOracle()}
                 />
                 <button 
                    onClick={askOracle}
                    disabled={isSearching || !question.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                 >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'CONSULTAR'}
                 </button>
              </div>

              {isSearching && (
                 <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] animate-pulse">Sintonizando frequências neurais...</span>
                 </div>
              )}

              {oracleAnswer && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-[#050506] border border-purple-500/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                 >
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
                    <div className="prose prose-invert max-w-none prose-sm font-sans text-slate-300 leading-relaxed custom-markdown-body">
                       <ReactMarkdown>{oracleAnswer}</ReactMarkdown>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-700 tracking-widest uppercase flex items-center gap-2">
                          <BrainCircuit size={12} /> Knowledge Source: Master Oracle Node
                       </span>
                       <button onClick={() => setOracleAnswer('')} className="text-[9px] font-black text-slate-700 hover:text-white transition-colors uppercase tracking-widest">Dispensar Resposta</button>
                    </div>
                 </motion.div>
              )}

              {!oracleAnswer && !isSearching && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Como balancear o dano do Magic Gladiator?",
                      "Configuração recomendada para Jewel of Bless drop",
                      "Onde o monstro Kundun spawna por padrão?",
                      "Diferenças entre Season 6 e Season 18"
                    ].map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => { setQuestion(q); askOracle(); }}
                        className="text-left bg-[#0a0b0d] border border-[#1e2126] p-4 rounded-2xl text-[11px] text-slate-500 hover:text-purple-400 hover:border-purple-500/30 transition-all font-medium italic"
                      >
                        "{q}"
                      </button>
                    ))}
                 </div>
              )}
           </div>
        </motion.div>
      )}

      {activeView === 'broadcast' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-6">
              <MessageSquare size={18} className="text-green-500" /> Transmissão Global (Golden Notice)
            </h3>
            
            <div className="space-y-4 relative z-10 w-full max-w-2xl mx-auto block">
              <div>
                 <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Mensagem para o Servidor</label>
                 <textarea
                    rows={4}
                    placeholder="Digite a mensagem que aparecerá dourada no centro da tela de todos os players..."
                    className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-green-500/50 resize-none transition-colors"
                 ></textarea>
              </div>
              <div className="flex gap-4 items-center">
                 <button 
                   onClick={() => toast.success("Aviso global enviado via Dataserver API (Simulação)")}
                   className="bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(22,163,74,0.5)] flex items-center gap-2"
                 >
                   <Send size={14} /> Anunciar
                 </button>
                 <p className="text-xs text-slate-500 italic">Envia o pacote 0xC1 para notificação ingame.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

const BrainCircuit = ({ size, className }: { size: number, className?: string }) => <Zap size={size} className={className} />;
