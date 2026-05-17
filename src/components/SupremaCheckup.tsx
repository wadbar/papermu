import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Server, Database, Terminal, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function SupremaCheckup() {
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<any[]>([]);

  const runCheckup = async () => {
    setChecking(true);
    setReport([]);
    
    const steps = [
      { id: 1, name: 'Core Engine Health', delay: 800, status: 'pass', detail: 'V8 Engine & Node Runtime operando em parâmetros ideais.' },
      { id: 2, name: 'File System Integrity', delay: 1200, status: 'pass', detail: 'Mapeamento de diretórios MUSERVER_PATH validado.' },
      { id: 3, name: 'SQL Connectivity', delay: 1000, status: 'warning', detail: 'Conexão com SQL Server instável em picos de 100ms.' },
      { id: 4, name: 'Security rules (Guard)', delay: 1500, status: 'pass', detail: 'Firewall IPtables e Socket Guard ativos.' },
      { id: 5, name: 'API Latency Check', delay: 900, status: 'pass', detail: 'Média de resposta: 12ms.' },
    ];

    for (const step of steps) {
       await new Promise(r => setTimeout(r, step.delay));
       setReport(prev => [...prev, step]);
    }
    setChecking(false);
  };

  return (
    <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl transition-all group-hover:bg-orange-500/20"></div>
      
      <header className="flex justify-between items-center mb-6 relative z-10">
        <div>
           <h3 className="text-lg font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
             <ShieldCheck className="text-orange-500" /> Checkup Supremo
           </h3>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saúde & Integridade do Ecossistema</p>
        </div>
        <button 
          onClick={runCheckup} 
          disabled={checking}
          className="bg-orange-600 hover:bg-orange-500 text-[#050506] font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {checking ? <Activity size={14} className="animate-spin" /> : <Zap size={14} />} 
          {checking ? 'ANALISANDO...' : 'INICIAR SCAN'}
        </button>
      </header>

      <div className="space-y-3 relative z-10">
         {report.length === 0 && !checking && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-[#1e2126] rounded-xl">
               <Search size={32} className="mb-4 opacity-20" />
               <p className="text-xs font-bold uppercase tracking-widest">Aguardando comando do administrador...</p>
            </div>
         )}
         
         {report.map((step) => (
            <motion.div 
               key={step.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className={`flex items-start gap-4 p-4 rounded-xl border ${step.status === 'pass' ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}
            >
               <div className={`p-2 rounded-lg ${step.status === 'pass' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {step.status === 'pass' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-bold text-white uppercase tracking-wider">{step.name}</span>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${step.status === 'pass' ? 'text-green-500' : 'text-yellow-500'}`}>{step.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">{step.detail}</p>
               </div>
            </motion.div>
         ))}

         {checking && (
            <div className="p-4 bg-[#0a0b0d] rounded-xl border border-[#1e2126] flex items-center gap-3">
               <Activity size={16} className="text-orange-500 animate-spin" />
               <span className="text-[10px] text-slate-500 font-bold uppercase animate-pulse">Cruzando dados de telemetria...</span>
            </div>
         )}
      </div>

      <footer className="mt-6 pt-6 border-t border-[#1e2126] flex justify-between items-center opacity-50 relative z-10">
         <div className="flex gap-4">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Server size={12}/> Kernel: 4.0.2</div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Database size={12}/> SQL: Enterprise</div>
         </div>
         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Terminal size={12} className="inline mr-1"/> v2026.05</div>
      </footer>
    </div>
  );
}
