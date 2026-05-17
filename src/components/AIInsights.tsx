import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
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
        // Tenta parse de forma segura e encapsulada
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
    <div className="bg-[#111317] border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <BrainCircuit size={80} className="text-orange-500" />
      </div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles size={20} className="text-orange-500" /> Cortex AI Insights
          </h3>
          <p className="text-slate-500 text-xs mt-1">Sumário analítico gerado via Kernel Engine</p>
        </div>
        <button 
          onClick={generateInsight}
          disabled={loading}
          className="p-2 bg-orange-600/10 text-orange-500 rounded-lg hover:bg-orange-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-32 flex flex-col items-center justify-center gap-3"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-2 h-2 bg-orange-500 rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Processando Redes Neurais</span>
          </motion.div>
        ) : insight ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4 relative z-10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 flex flex-col items-center">
                <span className="text-2xl font-black text-green-500 leading-none">{insight.healthScore || 98}</span>
                <span className="text-[8px] uppercase font-bold text-green-600 tracking-tighter mt-1">Score</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-orange-500/50 pl-4">
                "{insight.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {insight.recommendations?.slice(0, 4).map((rec: string, i: number) => (
                <div key={i} className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5 flex gap-2 items-start">
                  <TrendingUp size={12} className="text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-slate-400 font-medium">{rec}</span>
                </div>
              ))}
            </div>

            {insight.alert && (
              <div className="mt-4 bg-red-600/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{insight.alert}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-10">
            <Zap size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-xs">Nenhum insight disponível no momento.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
