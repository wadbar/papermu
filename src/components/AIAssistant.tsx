import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, User, Cpu, Sparkles, ServerCrash, Play, Square, MonitorDot } from 'lucide-react';
import { fetchWithRetry, safeFetch } from '../lib/utils';
import { wsService } from '../services/websocket.service';

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; meta?: any }[]>([
    {
      role: 'model',
      text: '### Sistema Operacional Cognitivo V9\nTodas as pontes e links de Kernel **ATIVOS**.\n\nSou a matriz de inteligência local, projetada para a super-gestão do seu Server.\nPosso **injetar Query SQLs diretas**, vasculhar os source files, formatar EventBags, rebalancear MonsterSets e operar manutenções de telemetria autônoma. O que vamos construir hoje, *Admin*?',
      meta: { provider: 'Cortex M.I.N.D' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [gsStatus, setGsStatus] = useState<'online' | 'offline' | 'starting' | 'error'>('offline');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- BRAIN CORE: SMOOTH TYPING BUFFER ---
  useEffect(() => {
    if (streamBuffer.length > 0) {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      
      typingIntervalRef.current = setInterval(() => {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'model') {
            const currentText = lastMsg.text;
            if (currentText.length < streamBuffer.length) {
              const nextChar = streamBuffer[currentText.length];
              const updated = [...prev];
              updated[updated.length - 1] = { ...lastMsg, text: currentText + nextChar };
              return updated;
            } else {
              if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
              return prev;
            }
          }
          return prev;
        });
        requestAnimationFrame(() => scrollToBottom(true));
      }, 5); 
    }
    return () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); };
  }, [streamBuffer]);

  useEffect(() => {
    const socket = wsService.connect();
    socket.on('task:sync', (data: any) => console.log('[WS] Sync:', data));
    
    // Polling GS Status
    const checkGS = async () => {
       try {
         const data = await safeFetch('/api/mu/gs-status');
         setGsStatus(data.status);
       } catch (e) {
         setGsStatus('error');
       }
    };

    checkGS();
    const interval = setInterval(checkGS, 8000);

    return () => {
      socket.off('task:sync');
      clearInterval(interval);
    };
  }, []);

  const scrollToBottom = (forceImmediate = false) => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ 
      behavior: forceImmediate ? 'auto' : 'smooth',
      block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const newMessageId = Date.now().toString();
    setMessages(prev => [...prev, { role: 'user', text: userText }, { role: 'model', text: '', meta: { id: newMessageId, provider: 'Cortex Engine', latency: 4 } }]);
    setIsLoading(true);

    let accumulatedText = "";

    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           messages: messages.slice(-10),
           userText
        })
      });

      if (!response.ok) throw new Error("A porta de comunicação com o Kernel falhou.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const dataStr = part.slice(6).trim();
              if (dataStr === '[DONE]') break;
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);
                if (data.error) throw new Error(data.error);
                if (data.text) {
                  accumulatedText += data.text;
                  setStreamBuffer(accumulatedText);
                }
              } catch (e: any) {
                if (e.message !== "Unexpected end of JSON input") {
                  console.warn("[STREAM-PARSER] Warning:", e.message);
                }
              }
            }
          }
          // Immediate scroll attempt for better fluidity during high-frequency updates
          requestAnimationFrame(() => scrollToBottom(true));
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Corrupção no link neural.';
      setMessages(prev => {
         const msgs = [...prev];
         const modelMsg = msgs[msgs.length - 1];
         modelMsg.text += `\n\n> **[FALHA MATRIZ]: ${errorMessage}**`;
         return msgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0b0d] border border-blue-500/20 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.1)] relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Cpu size={300} className="text-blue-500" />
      </div>

      <div className="p-6 border-b border-white/5 bg-[#111317] flex items-center justify-between z-10 relative shadow-md">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">
              <Sparkles size={24} />
           </div>
           <div>
             <h2 className="font-black text-white text-xl uppercase tracking-tighter italic">Cortex M.I.N.D</h2>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_5px_rgba(59,130,246,1)]"></div>
                <p className="text-[10px] text-blue-500/80 uppercase tracking-widest font-black">Link de Acesso Master Estabelecido</p>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* GS Status Component */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded-2xl shadow-inner group">
             <div className="relative">
                <MonitorDot size={18} className={`${
                   gsStatus === 'online' ? 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                   gsStatus === 'offline' ? 'text-red-500' :
                   gsStatus === 'starting' ? 'text-yellow-500' : 'text-slate-600'
                }`} />
                {gsStatus === 'starting' && (
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-yellow-500 rounded-full blur-md"
                  />
                )}
             </div>
             
             <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Engine Instance</span>
                <div className="flex items-center gap-2">
                   <h4 className="text-[10px] font-black text-white uppercase tracking-tighter">GameServer.exe</h4>
                   <div className="flex items-center gap-1.5">
                      {gsStatus === 'online' ? <Play size={8} className="text-green-500 fill-green-500" /> : <Square size={8} className="text-red-500 fill-red-500" />}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                         gsStatus === 'online' ? 'text-green-500' :
                         gsStatus === 'offline' ? 'text-red-500' :
                         gsStatus === 'starting' ? 'text-yellow-500 animate-pulse' : 'text-slate-600'
                      }`}>
                         {gsStatus === 'online' ? 'Online' : gsStatus === 'starting' ? 'Starting' : 'Offline'}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase hidden sm:block">
            Latency: <span className="text-green-500">4ms</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar z-10 relative">
        {messages.map((msg, idx) => (
          (msg.role === 'model' && msg.text === '' && isLoading) ? null : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
              msg.role === 'user' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]'
            }`}>
              {msg.role === 'user' ? <User size={18} /> : "✧"}
            </div>
            
            <div className={`p-4 rounded-2xl relative group shadow-lg ${
              msg.role === 'user' 
                ? 'bg-orange-950/10 text-orange-100 border border-orange-500/20 rounded-tr-sm' 
                : 'bg-black/60 text-slate-300 border border-blue-500/10 rounded-tl-sm backdrop-blur-md'
            }`}>
               {msg.meta && msg.role === 'model' && (
                 <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/70">{msg.meta.provider}</span>
                 </div>
               )}
               <div className="markdown-body text-[13px] prose prose-invert prose-p:leading-[1.8] prose-pre:bg-[#050506] prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner prose-a:text-blue-400 prose-headings:text-white prose-strong:text-orange-400">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                 {isLoading && idx === messages.length - 1 && msg.role === 'model' && (
                   <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-1.5 h-4 ml-1 bg-blue-500 align-middle"
                   />
                 )}
               </div>
            </div>
          </motion.div>
          )
        ))}
        {isLoading && messages[messages.length - 1]?.text === '' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%]">
             <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">✧</div>
             <div className="p-4 rounded-2xl bg-black/60 border border-blue-500/10 rounded-tl-sm flex items-center gap-3 text-blue-400 text-xs italic font-black uppercase tracking-widest">
               Sintetizando Dados Nucleares <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
             </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-[#111317] border-t border-white/5 z-10 relative">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
             <Cpu size={20} />
          </div>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ordene a execução de Scans, Queries SQL ou otimizações..."
            className="w-full bg-[#0a0b0d] text-slate-200 border border-[#1e2126] rounded-2xl pl-12 pr-14 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all disabled:opacity-50 font-mono shadow-inner"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-xl border border-blue-500/20 disabled:opacity-50 transition-all">
            <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
