import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, Search, Save, RefreshCw, Loader2, ChevronRight, AlertCircle, 
  Terminal, ShieldCheck, Zap, BrainCircuit, X, Database, Check, History,
  Play, Bug, ShieldAlert, Cpu, Network, Activity, Info, Code2, BellRing, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { wsService } from '../services/websocket.service';

type Language = 'pt' | 'en';

const i18n = {
  pt: {
    loadingError: "// Erro ao carregar arquivo: ",
    searchInstruction: "// Você pode usar o campo 'Buscar arquivo' para encontrar e carregar o arquivo correto na estrutura.",
    saveSuccess: "Source file guardado com sucesso na maquina!",
    saving: "Salvando Source...",
    saveLocal: "Salvar Código Fonte Local",
    header: "C++ / Java Source Editor",
    badge: "Developer Mode",
    description: "Navegue, edite e (em breve) compile o código fonte nativo do seu MuServer.",
    searchLabel: "Busca Otimizada de Arquivos:",
    searchPlaceholder: "Busque por 'Main.cpp' ou 'ServerInfo'...",
    searchButton: "BUSCAR",
    pathLabel: "Ou abra o caminho exato:",
    pathPlaceholder: "C:\\Sources\\MuServer\\GameServer\\Main.cpp e aperte ENTER",
    compile: "Compile (MSBuild)"
  },
  en: {
    loadingError: "// Error loading file: ",
    searchInstruction: "// You can use the 'Search file' field to find and load the correct file in the structure.",
    saveSuccess: "Source file saved successfully on machine!",
    saving: "Saving Source...",
    saveLocal: "Save Source Code Locally",
    header: "C++ / Java Source Editor",
    badge: "Developer Mode",
    description: "Browse, edit and (soon) compile the native source code of your MuServer.",
    searchLabel: "Optimized File Search:",
    searchPlaceholder: "Search for 'Main.cpp' or 'ServerInfo'...",
    searchButton: "SEARCH",
    pathLabel: "Or open exact path:",
    pathPlaceholder: "C:\\Sources\\MuServer\\GameServer\\Main.cpp and press ENTER",
    compile: "Compile (MSBuild)"
  }
};

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

export default function SourceCodeView({ language = 'pt' }: { language?: Language }) {
  const tabs = [
    { label: 'GameServer.cpp', file: 'Source/GameServer/GameServer.cpp' },
    { label: 'Protocol.cpp', file: 'Source/GameServer/Protocol.cpp' },
    { label: 'ObjUseSkill.cpp', file: 'Source/GameServer/ObjUseSkill.cpp' },
    { label: 'User.h', file: 'Source/GameServer/User.h' },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [code, setCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [lastChange, setLastChange] = useState<{ path: string, event: string, timestamp: string } | null>(null);
  const [currentFileModified, setCurrentFileModified] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'audit' | 'git'>('editor');
  const [gitLog, setGitLog] = useState<{hash: string, author: string, date: string, message: string}[]>([]);
  const [commitMessage, setCommitMessage] = useState("");

  // Autocomplete States
  const [autocomplete, setAutocomplete] = useState<{
    list: any[];
    index: number;
    show: boolean;
    query: string;
    pos: { top: number; left: number };
  }>({
    list: [],
    index: 0,
    show: false,
    query: '',
    pos: { top: 0, left: 0 }
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = i18n[language];

  const filteredResults = searchResults.filter(result => 
    (result.path || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  useEffect(() => {
     setCurrentFileModified(false);
     safeFetch(`/api/files/read?filepath=${encodeURIComponent(customPath || activeTab.file)}`)
       .then(d => {
         if (d.error) setCode(`${t.loadingError}${d.error}\n${t.searchInstruction}`);
         else setCode(d.content || "");
       });
  }, [activeTab, customPath, t]);

  useEffect(() => {
    const socket = wsService.getSocket();
    
    socket.on('file:changed', (data: any) => {
      setLastChange(data);
      
      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        setLastChange(current => current?.timestamp === data.timestamp ? null : current);
      }, 5000);

      // If the changed file is the one we are currently viewing, signaling with extra emphasis
      const currentFile = customPath || activeTab.file;
      const normalizedPath = osPlatform() === 'win32' ? data.path.replace(/\//g, '\\') : data.path;
      
      if (data.path === currentFile || normalizedPath === currentFile) {
         setCurrentFileModified(true);
         toast((t) => (
            <div className="flex items-center gap-3 p-1">
               <div className="bg-red-500 p-2 rounded-lg text-white">
                  <AlertCircle size={18} />
               </div>
               <div className="flex flex-col">
                  <p className="text-sm font-bold text-slate-800">File Changed Externally</p>
                  <p className="text-xs text-slate-500">{data.path}</p>
               </div>
               <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => {
                        reloadFile();
                        toast.dismiss(t.id);
                    }}
                    className="bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                  >
                     Reload
                  </button>
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors"
                  >
                     Dismiss
                  </button>
               </div>
            </div>
         ), { 
            duration: Infinity,
            position: 'top-center'
         });
      }
    });

    return () => {
      socket.off('file:changed');
    };
  }, [activeTab.file, customPath]);

  // Helper for path normalization check
  const osPlatform = () => {
    return navigator.platform.toLowerCase().includes('win') ? 'win32' : 'linux';
  };

  const searchFiles = async () => {
     if(!searchQuery.trim()) return;
     setIsSearching(true);
     
     try {
       const data = await safeFetch('/api/ai/search-files', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ query: searchQuery })
       });

       if (data.matches) {
         setSearchResults(data.matches);
         if (data.matches.length === 0) toast.error(language === 'pt' ? "Nenhum arquivo encontrado." : "No files found.");
       } else {
          toast.error("Format error in search response");
       }
     } catch (e) {
        toast.error("Search failed");
     } finally {
       setIsSearching(false)
     }
  };

  const runAuditor = async () => {
     if (!code.trim()) return;
     setIsAuditing(true);
     setAuditReport(null);
     
     try {
       const data = await safeFetch('/api/ai/audit-code', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ code, filename: activeTab.label })
       });

       if (data.vulnerabilities || data.optimizations) {
         setAuditReport(data);
         toast.success("AI Audit completed successfully.");
       } else {
         throw new Error("Audit response invalid");
       }
     } catch (e: any) {
        toast.error("Audit failed: " + e.message);
     } finally {
       setIsAuditing(false);
     }
  };

  const loadSearchedFile = (file: string) => {
     setCustomPath(file);
     setSearchResults([]);
     setCurrentFileModified(false);
  };

  const performCodeAudit = async () => {
    if (!code) return;
    setIsAuditing(true);
    setActiveSubTab('audit');
    try {
      const data = await safeFetch('/api/ai/audit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           code, 
           filename: customPath || activeTab.file 
        })
      });
      if (data.success) {
        setAuditReport(data);
        toast.success("Auditoria Neural concluída.");
      } else {
        toast.error("Motor de auditoria indisponível.");
      }
    } catch (err) {
      toast.error("Erro na comunicação com o Kernel de IA.");
    } finally {
      setIsAuditing(false);
    }
  };

  const reloadFile = () => {
    safeFetch(`/api/files/read?filepath=${encodeURIComponent(customPath || activeTab.file)}`)
      .then(d => {
        if (!d.error) {
          setCode(d.content || "");
          setCurrentFileModified(false);
          toast.success("File reloaded from disk.");
        }
      });
  };

  const fetchGitLog = async () => {
    const data = await safeFetch('/api/git/log');
    if (data.logs) setGitLog(data.logs);
  };

  const commitChanges = async () => {
    if (!commitMessage) return toast.error("Commit message required");
    const data = await safeFetch('/api/git/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commitMessage })
    });
    if (data.success) {
      toast.success("Committed");
      setCommitMessage("");
      fetchGitLog();
    }
  };
  
  const revertFile = async (filepath: string) => {
    const data = await safeFetch('/api/git/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath })
    });
    if(data.success) {
        toast.success("Reverted");
        reloadFile();
    }
  }

  const saveFile = () => {
    setIsSaving(true);
    safeFetch('/api/files/write', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ filepath: customPath || activeTab.file, content: code })
    }).then(() => {
       setIsSaving(false);
       toast.success(t.saveSuccess);
    }).catch(() => setIsSaving(false));
  };

  const handleCustomPathLoad = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCustomPath(e.currentTarget.value);
    }
  }

  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);
    };
  }, []);

  const handleCodeChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const start = e.target.selectionStart;
    setCode(val);

    if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);

    // Autocomplete Logic
    const textBefore = val.substring(0, start);
    const words = textBefore.split(/\s|\n|\(|\)|\{|\}|\[|\]|\;|\,|\.|\=|\+|\-|\*|\//);
    const lastWord = words[words.length - 1];

    if (lastWord.length >= 2) {
      autocompleteTimeoutRef.current = setTimeout(async () => {
        let resp: any = { matches: [] };
        let isSnippet = false;

        if (lastWord.startsWith('#snippet:')) {
          const query = lastWord.substring(9);
          if (query.length < 3) return; // Wait for more query
          isSnippet = true;
          const snipResp = await safeFetch('/api/ai/generate-snippet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          if (snipResp.snippet) {
            resp.matches = [{ path: snipResp.snippet, type: 'Snippet', reason: 'AI Generated' }];
          }
        } else {
          // Semantic Search via /api/ai/search-files
          resp = await safeFetch('/api/ai/search-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: lastWord })
          });
        }
        
        if (resp.matches && resp.matches.length > 0) {
          // Simple position estimation (not perfect for textarea but works roughly)
          const lines = textBefore.split('\n');
          const lineCount = lines.length;
          const charCount = lines[lineCount - 1].length;
          
          setAutocomplete({
            list: resp.matches,
            index: 0,
            show: true,
            query: lastWord,
            pos: { 
              top: lineCount * 20 + 20, // Rough pixel estimates
              left: charCount * 8 + 40 
            }
          });
        } else {
          setAutocomplete(prev => ({ ...prev, show: false }));
        }
      }, 300); // 300ms debounce
    } else {
      setAutocomplete(prev => ({ ...prev, show: false }));
    }
  };

  const applyAutocomplete = (suggestion: string) => {
     const textarea = textareaRef.current;
     if (!textarea) return;

     const start = textarea.selectionStart;
     const textBefore = code.substring(0, start);
     const textAfter = code.substring(start);
     
     const lastWordMatch = textBefore.match(/[a-zA-Z_]\w*$/);
     const lastWordLength = lastWordMatch ? lastWordMatch[0].length : 0;
     
     const newCode = textBefore.substring(0, start - lastWordLength) + suggestion + textAfter;
     setCode(newCode);
     setAutocomplete(prev => ({ ...prev, show: false }));
     
     setTimeout(() => {
       textarea.focus();
       const newPos = start - lastWordLength + suggestion.length;
       textarea.setSelectionRange(newPos, newPos);
     }, 0);
  };

  const handleAutocompleteKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autocomplete.show) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocomplete(prev => ({ ...prev, index: (prev.index + 1) % prev.list.length }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocomplete(prev => ({ ...prev, index: (prev.index - 1 + prev.list.length) % prev.list.length }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      applyAutocomplete(autocomplete.list[autocomplete.index].path);
    } else if (e.key === 'Escape') {
      setAutocomplete(prev => ({ ...prev, show: false }));
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 font-sans relative">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {t.header}
            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase font-black">{t.badge}</span>
          </h2>
          <p className="text-slate-400 mt-1">{t.description}</p>
        </div>

        <AnimatePresence>
          {currentFileModified && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-xl backdrop-blur-md"
            >
              <div className="bg-red-600 p-2 rounded-xl animate-bounce">
                <AlertCircle size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Out of Sync</span>
                <span className="text-[9px] text-white/70">File modified externally.</span>
              </div>
              <button 
                onClick={reloadFile}
                className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ml-2"
              >
                Reload
              </button>
            </motion.div>
          )}

          {lastChange && !currentFileModified && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-3 flex items-center gap-3 shadow-lg"
            >
              <div className="bg-blue-500 p-2 rounded-xl animate-pulse">
                <BellRing size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Live Update</span>
                <span className="text-[10px] font-mono text-white max-w-[200px] truncate">{lastChange.path}</span>
              </div>
              <button 
                onClick={() => setLastChange(null)}
                className="text-slate-500 hover:text-white transition-colors ml-2"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex gap-4 mb-2 items-start relative z-10">
         <div className="flex-1 relative">
            <span className="text-xs text-slate-500 font-black uppercase whitespace-nowrap mb-2 block">{t.searchLabel}</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                className="bg-[#0a0b0d] border border-[#1e2126] flex-1 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
              />
              <button onClick={searchFiles} disabled={isSearching} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : t.searchButton}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#111317] border border-[#1e2126] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-80 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-[#1e2126] bg-[#0a0b0d]">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text"
                      placeholder={language === 'pt' ? "Filtrar resultados..." : "Filter results..."}
                      className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-10 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500 shadow-inner"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((res, i) => (
                      <button key={i} onClick={() => loadSearchedFile(res.path)} className="w-full text-left px-4 py-3 hover:bg-[#1e2126] border-b border-[#1e2126] text-xs text-slate-300 transition-colors flex items-center gap-3 group">
                        <div className="bg-blue-500/10 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                           <Terminal size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1 truncate">
                           <span className="block font-mono text-white mb-0.5">{res.path}</span>
                           <span className="block text-[9px] text-slate-500 italic truncate">{res.reason || "Semantic AI Match"}</span>
                        </div>
                        {res.relevance && (
                           <div className="text-[8px] font-black text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                              {Math.round(res.relevance * 100)}%
                           </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-600 text-xs italic font-medium">
                      {language === 'pt' ? "Nenhum resultado filtrado." : "No results match filter."}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSearchResults([])}
                  className="w-full py-3 bg-[#0a0b0d] hover:bg-red-900/10 text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-[#1e2126]"
                >
                  {language === 'pt' ? "Fechar Busca" : "Close Search"}
                </button>
              </div>
            )}
         </div>

         <div className="flex-1">
            <span className="text-xs text-slate-500 font-black uppercase whitespace-nowrap mb-2 block">{t.pathLabel}</span>
            <input 
              type="text" 
              placeholder={t.pathPlaceholder} 
              className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono shadow-inner"
              onKeyDown={handleCustomPathLoad}
            />
         </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab, i) => (
           <button 
             key={i} 
             onClick={() => { setActiveTab(tab); setCustomPath(""); }}
             className={`${activeTab.file === tab.file && !customPath ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-[#111317] text-slate-400 border-[#1e2126] hover:text-white'} border px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 bg-[#111317] border border-[#1e2126] rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
         <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-600 font-mono flex items-center gap-2">
               <Terminal size={14} className="text-blue-500" />
               {customPath || activeTab.file}
            </span>
            <div className="flex gap-2">
                 <button onClick={() => setActiveSubTab('editor')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'editor' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-500'}`}>Editor</button>
                 <button onClick={() => { setActiveSubTab('audit'); performCodeAudit(); }} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'audit' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-500'}`}>Audit</button>
                 <button onClick={() => { setActiveSubTab('git'); fetchGitLog(); }} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'git' ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-500'}`}>Git</button>
                 <button onClick={runAuditor} disabled={isAuditing} className="bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-2 group/auditor">
                   {isAuditing ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={14} className="group-hover/auditor:rotate-12 transition-transform" /> }
                   Audit
                 </button>
                 <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl transition-all shadow-lg hover:bg-slate-100 flex items-center gap-2">
                    <Play size={12} fill="black" /> {t.compile}
                 </button>
            </div>
         </div>
         <div className="flex-1 flex gap-6 min-h-0 relative">
             {activeSubTab === 'editor' && (
              <div className="flex-1 flex flex-col min-w-0 relative">
                <textarea 
                  ref={textareaRef}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleAutocompleteKey}
                  className="flex-1 w-full bg-[#050506] border border-[#1e2126] rounded-2xl p-6 text-[#a3b1c6] font-mono text-sm focus:outline-none focus:border-blue-500/50 resize-none whitespace-pre shadow-inner custom-scrollbar"
                  spellCheck="false"
                />
                <AnimatePresence>
                  {autocomplete.show && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      style={{ 
                        position: 'absolute',
                        top: Math.min(autocomplete.pos.top, (textareaRef.current?.clientHeight || 0) - 150),
                        left: Math.min(autocomplete.pos.left, (textareaRef.current?.clientWidth || 0) - 200),
                        zIndex: 100 
                      }}
                      className="bg-[#111317] border border-[#1e2126] rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
                    >
                      <div className="px-3 py-1.5 bg-[#0a0b0d] border-b border-[#1e2126] text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Code2 size={10} /> Suggestions
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {autocomplete.list.map((item, i) => (
                           <button 
                            key={i}
                            onClick={() => applyAutocomplete(item.path)}
                            onMouseEnter={() => setAutocomplete(prev => ({ ...prev, index: i }))}
                            className={`w-full text-left px-4 py-2 text-xs font-mono flex items-center justify-between transition-colors gap-4 ${autocomplete.index === i ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-[#1e2126]'}`}
                           >
                             <div className="flex flex-col">
                               <span className="font-bold">{item.path}</span>
                               <span className={`text-[8px] uppercase tracking-tighter ${autocomplete.index === i ? 'text-blue-200' : 'text-slate-500'}`}>
                                 {item.type || 'unknown'} • {item.reason}
                               </span>
                             </div>
                             {autocomplete.index === i && <span className="text-[8px] bg-white/20 px-1 rounded shrink-0">Enter</span>}
                           </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex justify-end">
                   <button 
                      onClick={saveFile}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                   >
                      {isSaving ? t.saving : t.saveLocal}
                   </button>
                </div>
              </div>
             )}
             {activeSubTab === 'git' && (
                <div className="flex-1 p-6 bg-[#0a0b0d] border border-[#1e2126] rounded-2xl flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <History className="text-blue-500" size={16}/> Git History
                        </h3>
                        <button 
                            className="bg-red-500/10 text-red-400 px-3 py-1.5 text-[10px] uppercase font-bold rounded hover:bg-red-500/20"
                            onClick={() => revertFile(customPath || activeTab.file)}
                        >
                            Revert Active File
                        </button>
                    </div>
                    <div className="flex-1 space-y-2">
                        {gitLog.map((log, i) => (
                            <div key={i} className="border-b border-white/5 pb-2 text-xs hover:bg-white/5 p-2 rounded">
                                <span className="font-mono text-blue-400">{log.hash}</span>
                                <span className="text-slate-400 ml-2">{log.message}</span>
                                <span className="text-slate-600 block text-[10px]">{log.author} - {log.date}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="Commit message..."
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            className="flex-1 bg-[#111317] border border-[#1e2126] p-2 rounded text-xs text-white outline-none focus:border-blue-500"
                        />
                        <button className="bg-blue-600 px-4 py-2 text-xs text-white uppercase font-bold rounded hover:bg-blue-500" onClick={commitChanges}>Commit</button>
                    </div>
                </div>
             )}
          </div>

             <AnimatePresence>
               {auditReport && (
                 <motion.div 
                   initial={{ x: 300, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   exit={{ x: 300, opacity: 0 }}
                   className="w-80 bg-[#0a0b0d] border border-[#1e2126] rounded-2xl p-5 flex flex-col shadow-2xl shrink-0 h-full overflow-hidden"
                 >
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Sparkles size={14} className="animate-pulse" /> Results found
                       </h3>
                       <button onClick={() => setAuditReport(null)} className="text-slate-600 hover:text-white transition-colors bg-white/5 p-1 rounded-lg">
                          <X size={16} />
                       </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-4 pr-1">
                       <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">Critical Vulnerabilities</div>
                       {(auditReport.vulnerabilities || []).map((v: any, i: number) => (
                          <div key={i} className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl relative group/card">
                             <div className="absolute top-2 right-2 text-red-500/20 group-hover/card:text-red-500 transition-colors">
                                <ShieldCheck size={16} />
                             </div>
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${v.severity === 'Critical' ? 'bg-red-600' : 'bg-orange-600'}`}>
                                  {v.severity}
                                </span>
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{v.type}</span>
                             </div>
                             <p className="text-[9px] text-slate-500 font-mono mb-3 italic">line {v.line} @ {v.file ? v.file.split('/').pop() : ''}</p>
                             <div className="bg-black/80 p-3 rounded-lg border border-white/5 shadow-inner">
                                <p className="text-[10px] text-red-400 font-mono leading-relaxed"><span className="text-white/30 font-bold block text-[8px] uppercase tracking-widest mb-1">Recommended Fix:</span>{v.fix}</p>
                             </div>
                          </div>
                       ))}

                       <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2 mt-6">Performance Optimizations</div>
                       {(auditReport.optimizations || []).map((o: any, i: number) => (
                          <div key={i} className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Perf</span>
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{o.type}</span>
                             </div>
                             <p className="text-[10px] text-slate-400 leading-relaxed font-mono italic">{o.desc}</p>
                          </div>
                       ))}
                    </div>

                    <div className="pt-5 border-t border-white/5 mt-auto">
                       <button 
                         className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                       >
                          Apply AI Patches
                       </button>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
      </div>
  );
}
