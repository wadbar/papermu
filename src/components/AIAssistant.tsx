import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Send, Loader2, User } from 'lucide-react';
import { fetchWithRetry } from '../lib/utils';
import { wsService } from '../services/websocket.service';

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; meta?: any }[]>([
    {
      role: 'model',
      text: 'Olá! Sou sua IA Especialista em Mu Online. Posso executar queries SQL no seu banco de dados, criar eventos, configurar o servidor, ou enviar mensagens globais (através de comandos). Como posso ajudar com seu MuServer hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = wsService.connect();
    socket.on('task:sync', (data: any) => console.log('[WS] Sync:', data));
    
    return () => {
      socket.off('task:sync');
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const newMessageId = Date.now().toString();
    setMessages(prev => [...prev, { role: 'user', text: userText }, { role: 'model', text: '', meta: { id: newMessageId } }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           messages: messages.slice(-10),
           userText
        })
      });

      if (!response.ok) throw new Error("Erro na requisição da IA");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        let done = false;
        let buffer = '';
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                if (!dataStr) continue;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  if (data.text) {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const targetMessage = newMessages[newMessages.length - 1]; // Assume model message is last
                      targetMessage.text += data.text;
                      return newMessages;
                    });
                  }
                } catch (e: any) {
                  // Only logged internally
                  if (e.message !== "Unexpected end of JSON input") {
                    console.error("Parse stream err:", e.message);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao conectar ao Kernel AI.';
      setMessages(prev => {
         const msgs = [...prev];
         const modelMsg = msgs[msgs.length - 1];
         modelMsg.text += `\n[ERRO DE KERNEL]: ${errorMessage}`;
         return msgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111317] border border-[#1e2126] rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[#1e2126] bg-[#050506] flex items-center gap-3">
        <div className="text-orange-400">✧</div>
        <div>
          <h2 className="font-bold text-white uppercase tracking-tight">MU-AI CO-PILOT</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">A.I. Game Master Integrado</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center ${msg.role === 'user' ? 'bg-orange-500 text-black font-bold' : 'bg-[#1e2126] text-orange-400'}`}>
              {msg.role === 'user' ? <User size={16} /> : "✧"}
            </div>
            
            <div className={`p-3 rounded-lg relative group ${
              msg.role === 'user' 
                ? 'bg-[#1e2126] text-white border border-[#2a2d33]' 
                : 'bg-[#050506] text-slate-300 border border-[#1e2126]'
            }`}>
               <div className="markdown-body text-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0d0d14] prose-pre:border prose-pre:border-white/10">
                 <Markdown>{msg.text}</Markdown>
               </div>
               {msg.meta && (
                 <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 p-1 rounded text-[8px] font-black uppercase text-slate-500 flex flex-col items-end">
                   <span>{msg.meta.provider}</span>
                   <span>{msg.meta.latency}ms</span>
                 </div>
               )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
             <div className="shrink-0 w-8 h-8 rounded bg-[#1e2126] text-orange-400 flex items-center justify-center">✧</div>
             <div className="p-3 rounded-lg bg-[#050506] border border-[#1e2126] flex items-center text-orange-500 text-xs italic">
               Analisando... <Loader2 className="w-3 h-3 ml-2 animate-spin text-orange-500" />
             </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#050506] border-t border-[#1e2126]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Pergunte à IA do Servidor (Ex: Quantos chars nível 400 temos?)"
            className="w-full bg-[#1e2126] text-slate-200 border border-[#2a2d33] rounded-lg pl-3 pr-10 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all disabled:opacity-50 font-sans"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-2 text-orange-500 hover:text-orange-400 disabled:opacity-50 transition-colors">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
