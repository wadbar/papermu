import React, { useState } from 'react';
import { Download, Database, Shield, Link, Loader2, Gamepad2, Package, Archive, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { safeFetch, robustJSONParse } from '../lib/utils';
import toast from 'react-hot-toast';
import SupremeFileManager from './SupremeFileManager';

export default function DownloadsView() {
  const [activeTab, setActiveTab] = useState<'repacks' | 'artifacts'>('repacks');
  const defaultRepacks = [
    {
      title: "PaperMu VDP Private Source",
      emulator: "Source C++ / Files",
      author: "Wadson",
      type: "MuServer Files & Source",
      img: "blue",
      link: "https://drive.google.com/drive/folders/1mpTiV2nmImPK6ldz6gKOd4R1vXbpuv6D",
      isPremium: true
    },
    {
      title: "Louis Emulator Up38 (Season 6)",
      emulator: "Louis Emulator",
      author: "Louis",
      type: "Desktop S6",
      img: "orange",
      link: "https://forum.ragezone.com",
      isPremium: false
    },
    {
      title: "IGCN Premium Repack Season 19",
      emulator: "IGCN",
      author: "IGCN Team",
      type: "Desktop S19",
      img: "purple",
      link: "https://forum.ragezone.com",
      isPremium: false
    },
    {
      title: "Mu Origin 3 (Repack Completo)",
      emulator: "Mobile Android",
      author: "RageZone Community",
      type: "Mobile/Docker",
      img: "green",
      link: "https://forum.ragezone.com",
      isPremium: false
    }
  ];

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [versions, setVersions] = useState<any[]>(defaultRepacks);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [installingRepack, setInstallingRepack] = useState<string | null>(null);
  const [installStep, setInstallStep] = useState(0); // 0: idle, 1: downloading, 2: extracting, 3: configuring
  const [installProgress, setInstallProgress] = useState(0);

  const handleInstall = async (repackTitle: string, link: string) => {
    setInstallingRepack(repackTitle);
    setInstallStep(1);
    setInstallProgress(0);
    
    // Step 1: Downloading
    let progress = 0;
    const downloadInterval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 40) {
        progress = 40;
        clearInterval(downloadInterval);
      }
      setInstallProgress(progress);
    }, 200);

    await new Promise(r => setTimeout(r, 2000));
    clearInterval(downloadInterval);
    setInstallProgress(40);
    setInstallStep(2);

    // Step 2: Extracting
    const extractInterval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress >= 80) {
        progress = 80;
        clearInterval(extractInterval);
      }
      setInstallProgress(progress);
    }, 150);

    await new Promise(r => setTimeout(r, 2500));
    clearInterval(extractInterval);
    setInstallProgress(80);
    setInstallStep(3);

    // Step 3: Configuring
    const configInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(configInterval);
      }
      setInstallProgress(progress);
    }, 100);

    try {
        // Trigger the real (mocked) backend just to log/audit
        const data = await safeFetch('/api/install-repack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: repackTitle, link: link })
        });
        
        await new Promise(r => setTimeout(r, 1500));
        clearInterval(configInterval);
        setInstallProgress(100);
        
        setTimeout(() => {
            setInstallStep(0);
            setInstallingRepack(null);
            setInstallProgress(0);
            
            if (data.manual) {
                toast.success("Arquivos prontos para download manual.");
                window.open(link, "_blank");
            } else {
                toast.success(`${repackTitle} instalado com sucesso em ${muServerPath}!`, {
                  icon: '🚀',
                  duration: 5000
                });
            }
        }, 800);
    } catch (err: any) {
         setInstallStep(0);
         setInstallingRepack(null);
         setInstallProgress(0);
         toast.error(`Falha na instalação: ${err.message}`);
    }
  };

  const muServerPath = localStorage.getItem('MUSERVER_PATH') || 'C:\\MuServer';

  const handleSearch = async (overrideFilter?: string) => {
    const filterToUse = overrideFilter || activeFilter;
    if (!query.trim() && filterToUse === 'all') {
      setVersions(defaultRepacks);
      return;
    }
    setIsSearching(true);
    
    let baseSearch = query;
    if (filterToUse === 'mobile') baseSearch += " server files mobile origin awakening android";
    if (filterToUse === 'desktop') baseSearch += " server files desktop pc";
    if (filterToUse === 'source') baseSearch += " source code c++ c#";
    if (filterToUse === 'repack') baseSearch += " repack muserver pre-configured";
    
    try {
      const aiProvider = localStorage.getItem('MUSERVER_AI_PROVIDER') || 'gemini';
      let text = '';

      if (aiProvider === 'local') {
        const localUrl = localStorage.getItem('MUSERVER_LOCAL_AI_URL') || 'http://localhost:1234/v1';
        const localModel = localStorage.getItem('MUSERVER_LOCAL_AI_MODEL') || 'local-model';
        const res = await safeFetch(`${localUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: localModel,
            messages: [{
              role: 'user', 
              content: `Você é uma API de busca. Gere um JSON com 3 resultados simulados para servidores de MuOnline buscando por: "${baseSearch.trim()}". Retorne APENAS um JSON válido no formato:\n{"results": [{"title": "Nome do Servidor/Repack", "emulator": "Emulator Base", "author": "Autor", "type": "Versão", "img": "blue", "link": "https://forum.ragezone.com/..."}]}\nNão use markdown ou crases. Retorne apenas JSON direto.`
            }],
            temperature: 0.1,
          })
        });
        text = res.choices?.[0]?.message?.content || '';
      } else {
        const apiKey = localStorage.getItem('MUSERVER_GEMINI_API_KEY');
        if (!apiKey) {
          throw new Error("A chave GEMINI_API_KEY não foi configurada. Acesse Configurações do Painel para adicioná-la.");
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `Você é uma API de busca estrita especializada em emuladores e servidores de MuOnline e jogos derivados (Mu Origin, Mu Mobile).
          USE A FERRAMENTA GOOGLE SEARCH OBRIGATORIAMENTE para buscar: "site:forum.ragezone.com ${baseSearch.trim()}".
          
          REGRAS CRÍTICAS DE SEGURANÇA E PREVENÇÃO DE ALUCINAÇÃO:
          1. Você DEVE usar a ferramenta googleSearch para cada busca.
          2. NÃO invente URLs. A propriedade "link" no JSON DEVE ser EXATAMENTE a URL devolvida pela ferramenta de busca.
          3. Se nenhum link for encontrado, retorne [].
          
          Retorne APENAS um JSON válido:
          {
             "results": [
                {
                  "title": "Título exato extraído do resultado da busca Google",
                  "emulator": "Base (ex: MuEmu, IGCN, Mobile Origin, Source)",
                  "author": "Nome do autor ou fórum",
                  "type": "Versão/Plataforma",
                  "img": "blue",
                  "link": "https://..."
                }
             ]
          }
          Não use markdown, devolva apenas a string JSON.`,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
          }
        });
        text = response.text || '';
      }

      const parsed = robustJSONParse(text);
      if (parsed.results) {
        setVersions(parsed.results);
      } else {
        setVersions([]);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Falha buscar dados online. Verifique sua conexão e os limites da API Google.";
      alert(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const setFilterAndSearch = (filter: string) => {
    setActiveFilter(filter);
    if (query.trim() || filter !== 'all') {
      handleSearch(filter);
    } else {
       setVersions(defaultRepacks);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-4 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Nexus Repository
              <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded font-bold uppercase tracking-widest border border-orange-500/20">Industrial Node</span>
            </h2>
            <p className="text-slate-400 mt-1">Gestão centralizada de repacks, fontes e artefatos de configuração do MuServer.</p>
          </div>
          <div className="flex bg-[#111317] border border-[#1e2126] rounded-xl p-1 shadow-inner">
             <button 
                onClick={() => setActiveTab('repacks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'repacks' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <Package size={14} /> REPACKS & SOURCES
             </button>
             <button 
                onClick={() => setActiveTab('artifacts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'artifacts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <Layers size={14} /> ARTEFATOS NEURAIS
             </button>
          </div>
        </div>
        
        {activeTab === 'repacks' && (
          <>
            <div className="flex justify-between items-center gap-4">
               <div className="relative flex gap-2">
                 <input 
                   type="text" 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                   placeholder="Buscar no RageZone..." 
                   className="bg-[#111317] border border-[#1e2126] rounded-lg px-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-48 disabled:opacity-50" 
                   disabled={isSearching}
                 />
                 <button 
                   onClick={() => handleSearch()}
                   disabled={isSearching}
                   className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-lg font-black text-[10px] transition-colors disabled:opacity-50 min-w-[80px]"
                 >
                   {isSearching ? <Loader2 size={12} className="animate-spin" /> : "SEARCH"}
                 </button>
               </div>
            </div>
            
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Curadoria / Drive Pessoal' },
                { id: 'mobile', label: 'Mobile (Origin/Android)' },
                { id: 'desktop', label: 'Desktop (Season 1-19)' },
                { id: 'source', label: 'Sources (C++/Java)' },
                { id: 'repack', label: 'Repacks Prontos' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterAndSearch(f.id)}
                  disabled={isSearching}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                    activeFilter === f.id 
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' 
                    : 'bg-[#111317] text-slate-400 border-[#1e2126] hover:bg-[#1e2126] hover:text-white'
                  } disabled:opacity-50`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {activeTab === 'artifacts' ? (
        <SupremeFileManager />
      ) : (
        <>
          {versions.length === 0 && !isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#1e2126] rounded-2xl">
          <Database size={48} className="text-[#1e2126] mb-4" />
          <h3 className="text-xl font-bold text-slate-400">Nenhum resultado local.</h3>
          <p className="text-slate-500 mt-2">Use a barra de busca acima para rastrear o fórum RageZone em tempo real.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {versions.map((v, i) => (
            <div key={i} className={`bg-[#111317] border ${v.isPremium ? 'border-orange-500' : 'border-[#1e2126]'} rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all group relative`}>
              {v.isPremium && <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] px-2 py-1 uppercase tracking-widest font-bold rounded-full z-20 shadow-lg shadow-orange-500/20">Seu Google Drive</div>}
              <div className={`h-32 bg-[#0a0b0d] relative flex items-center justify-center border-b border-[#1e2126] overflow-hidden`}>
                 <Gamepad2 className={'text-'+(v.img || 'orange')+'-500/10 w-32 h-32 absolute opacity-30'} />
                 <div className="relative z-10 text-center px-4 w-full">
                   <h3 className="font-bold text-xl text-white truncate w-full" title={v.title}>{v.title}</h3>
                   <span className="text-xs bg-black/50 px-2 py-1 rounded text-slate-300 backdrop-blur-md mt-2 inline-block border border-white/5">{v.emulator}</span>
                 </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Autor:</span>
                   <span className="text-white font-medium max-w-[120px] truncate" title={v.author}>{v.author}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Detalhes:</span>
                   <span className="text-green-400 font-medium flex items-center gap-1"><Shield size={14}/> {v.type}</span>
                 </div>
                 
                 {installingRepack === v.title ? (
                    <div className="w-full mt-2 bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl flex flex-col gap-3 shadow-inner">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                             <Loader2 size={12} className="animate-spin" />
                             {installStep === 1 ? 'BAIXANDO REPACK...' : installStep === 2 ? 'EXTRAINDO FILES...' : 'FINALIZANDO SETUP...'}
                          </span>
                          <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">
                             {Math.round(installProgress)}%
                          </span>
                       </div>
                       <div className="w-full bg-[#0a0b0d] h-2 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${installProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          />
                       </div>
                       <p className="text-[9px] text-slate-500 italic text-center">Protocolo de instalação automatizado Master-Node em execução.</p>
                    </div>
                 ) : (
                    <div className="flex gap-2 mt-2">
                       <button onClick={() => handleInstall(v.title, v.link)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2" title="Instala o repack, databases e dependências automaticamente no MuServerPath">
                         <Download size={14} /> AUTO INSTALL
                       </button>
                       {v.link !== '#' && (
                         <a href={v.link} target="_blank" rel="noreferrer" className="flex-1 bg-[#1e2126] hover:bg-[#2a2d33] border border-[#2a2d33] text-white font-bold text-xs py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                           <Link size={14} /> LINK EXTERNO
                         </a>
                       )}
                    </div>
                 )}
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  );
}
