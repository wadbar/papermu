import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, RefreshCw, Zap, Hexagon, Activity, Network } from 'lucide-react';
import { safeFetch, robustJSONParse } from '../lib/utils';
import toast from 'react-hot-toast';

export default function AIInsights() {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const res = await safeFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: "Analise o estado atual do servidor e gere um sumário executivo de insights (saúde, economia e segurança). Formate como um objeto JSON com as chaves: summary (string), recommendations (array), healthScore (0-100), alert (string|null).",
          responseType: 'json'
        })
      });

      if (res.success) {
        const content = typeof res.text === 'string' ? robustJSONParse(res.text) : res.text;
        if (content.error) throw new Error(content.error);
        setInsight(content);
      }
    } catch (error) {
      console.error(error);
      toast.error("O Cortex não conseguiu gerar insights agora.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsight();
  }, []);

  return (
    <div className="bg-[#111317] border border-orange-500/20 rounded-3xl p-8 relative overflow-hidden group shadow-[0_0_50px_rgba(234,88,12,0.1)]">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Network size={180} className="text-orange-500" />
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-black text-xl flex items-center gap-2 uppercase tracking-tighter italic">
            <Sparkles size={24} className="text-orange-500" /> Neural Insight Cortex
          </h3>
          <p className="text-orange-500/60 text-[10px] font-black uppercase tracking-[0.3em]">Predictive Analytics Engine V9</p>
        </div>
        <button 
          onClick={generateInsight}
          disabled={loading}
          className="p-3 bg-[#050506] text-orange-500 border border-orange-500/20 shadow-[inset_0_0_10px_rgba(234,88,12,0.1)] rounded-xl hover:bg-orange-500/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-orange-400' : ''} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-40 flex flex-col items-center justify-center gap-4 relative z-10"
          >
             <Hexagon size={48} className="text-orange-500 animate-spin" strokeWidth={1} />
             <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-orange-400 uppercase tracking-[0.3em] font-black animate-pulse">Sincronizando Mentes...</span>
                <span className="text-[10px] text-slate-600 font-mono">Decodificando topologia de rede e tabelas SQL</span>
             </div>
          </motion.div>
        ) : insight ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6 relative z-10"
          >
            <div className="flex md:flex-row flex-col items-start md:items-center gap-6 bg-[#0a0b0d] p-5 rounded-2xl border border-white/5 shadow-inner">
              <div className={`p-4 rounded-xl border flex flex-col items-center shrink-0 min-w-[100px] shadow-lg ${
                 insight.healthScore >= 90 ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-green-500/20' : 
                 insight.healthScore >= 70 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-yellow-500/20' : 
                 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/20'
              }`}>
                <span className="text-4xl font-black heading-tighter italic">{insight.healthScore || 98}</span>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-1 opacity-80">Sync Level</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                <span className="text-orange-500 font-black mr-2">»</span>
                {insight.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insight.recommendations?.slice(0, 4).map((rec: string, i: number) => (
                <div key={i} className="bg-[#15181d] p-4 rounded-2xl border border-white/5 flex gap-3 items-start group hover:border-orange-500/30 transition-all">
                  <div className="mt-0.5 p-1.5 bg-[#0a0b0d] rounded-lg text-blue-500 group-hover:bg-blue-500/10 transition-colors shrink-0">
                     <TrendingUp size={14} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors">{rec}</span>
                </div>
              ))}
            </div>

            {insight.alert && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-4 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]"
              >
                <div className="bg-[#050506] p-2 rounded-xl text-red-500 border border-red-500/20 shrink-0">
                   <AlertTriangle size={20} className="animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] text-red-500/80 font-black uppercase tracking-widest">Alerta Crítico Interceptado</span>
                   <span className="text-xs text-red-200 font-mono leading-relaxed">{insight.alert}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center opacity-50">
            <Activity size={32} className="text-slate-600 mb-3" />
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Cluster Adormecido</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
