import React, { useState, useCallback } from 'react';
import { 
  Upload, File, ShieldCheck, AlertTriangle, FileCode, Check, 
  Loader2, Trash2, Search, BrainCircuit, Sparkles, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeFetch } from '../lib/utils';
import toast from 'react-hot-toast';

interface Artifact {
  name: string;
  size: number;
  lastModified: number;
  status: 'pending' | 'scanning' | 'safe' | 'danger';
  type: string;
}

export default function SupremeFileManager() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Usando o endpoint real que criamos no server.ts
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        setArtifacts(prev => [{
          name: file.name,
          size: file.size,
          lastModified: Date.now(),
          status: 'pending',
          type: file.name.split('.').pop() || 'unknown'
        }, ...prev]);
        toast.success(`Artefato ${file.name} integrado ao Nexus.`);
      } else {
        toast.error(data.error || "Prorocolo de upload recusado.");
      }
    } catch (err) {
      toast.error("Erro na comunicação com o Kernel de Upload.");
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const analyzeArtifact = async (artifactName: string) => {
    setIsScanning(true);
    setArtifacts(prev => prev.map(a => a.name === artifactName ? { ...a, status: 'scanning' } : a));
    
    try {
      // Simulação da análise via IA baseada no endpoint analyze-patch do server.ts
      const res = await safeFetch('/api/ai/analyze-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: artifactName })
      });

      if (res.success) {
        setArtifacts(prev => prev.map(a => a.name === artifactName ? { ...a, status: 'safe' } : a));
        toast.success("O Sentinel confirmou a integridade do artefato.");
      } else {
        setArtifacts(prev => prev.map(a => a.name === artifactName ? { ...a, status: 'danger' } : a));
        toast.error("Anomalia detectada no artefato!");
      }
    } catch (e) {
      toast.error("Falha no link de escaneamento neural.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drop Zone */}
        <div className="md:col-span-2">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden bg-[#111317] ${
              dragActive ? 'border-orange-500 bg-orange-500/5 scale-[0.99]' : 'border-[#1e2126] hover:border-slate-700'
            }`}
          >
            <AnimatePresence>
              {isUploading ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                  <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Sincronizando com o Nexus...</p>
                </motion.div>
              ) : (
                <>
                  <Upload size={48} className={`mb-4 transition-transform ${dragActive ? 'scale-110 text-orange-500' : 'text-slate-600'}`} />
                  <p className="text-sm font-bold text-slate-300">Arraste patches ou configurações aqui</p>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">Protocolo: .txt, .ini, .lua, .xml</p>
                  <label className="mt-4 px-4 py-2 bg-[#1e2126] hover:bg-[#2a2d33] border border-[#2a2d33] rounded-lg text-xs font-bold text-white cursor-pointer transition-colors shadow-lg">
                    SELECIONAR ARQUIVO
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                  </label>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Panel */}
        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-5 space-y-4">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <Activity size={12} /> Shield Monitor
           </h3>
           <div className="space-y-3">
              <div className="flex justify-between items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-400">Sentinel Guardian</span>
                 </div>
                 <span className="text-[9px] font-black text-green-500">ENGAGED</span>
              </div>
              <div className="flex justify-between items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-bold text-slate-400">Nexus Intake</span>
                 </div>
                 <span className="text-[9px] font-black text-blue-500">READY</span>
              </div>
           </div>
           
           <div className="pt-4 border-t border-white/5">
              <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl">
                 <p className="text-[10px] text-orange-400/80 leading-relaxed italic">
                   "Todo artefato enviado é sanitizado e analisado pelo motor heurístico antes de ser integrado ao ecossistema do MuServer."
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Artifact List */}
      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#1e2126] bg-black/20 flex justify-between items-center">
           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
             <FileCode size={14} className="text-orange-500" /> Recentes Integrados no Nexus
           </h3>
           <span className="text-[10px] font-mono text-slate-500">{artifacts.length} Artefatos</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a1d23] text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Artefato</th>
                <th className="px-6 py-3">Tamanho</th>
                <th className="px-6 py-3">Status Sentinel</th>
                <th className="px-6 py-3 text-right">Ações Neuronais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2126]">
              {artifacts.map((a, i) => (
                <tr key={i} className="hover:bg-[#1a1d23]/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1e2126] rounded-lg flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                        <File size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white tracking-tight">{a.name}</p>
                        <p className="text-[10px] text-slate-500">MIME: application/{a.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono text-slate-400">{(a.size / 1024).toFixed(2)} KB</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {a.status === 'safe' ? (
                          <div className="flex items-center gap-1.5 text-green-500">
                             <ShieldCheck size={12} />
                             <span className="text-[10px] font-black uppercase">SAFE</span>
                          </div>
                       ) : a.status === 'danger' ? (
                          <div className="flex items-center gap-1.5 text-red-500">
                             <AlertTriangle size={12} />
                             <span className="text-[10px] font-black uppercase">DANGER</span>
                          </div>
                        ) : a.status === 'scanning' ? (
                          <div className="flex items-center gap-1.5 text-blue-500">
                             <Loader2 size={12} className="animate-spin" />
                             <span className="text-[10px] font-black uppercase tracking-tighter">AUDITING...</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5 text-slate-500">
                             <Search size={12} />
                             <span className="text-[10px] font-black uppercase">PENDING SCAN</span>
                          </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => analyzeArtifact(a.name)}
                        disabled={isScanning || a.status === 'safe'}
                        className="bg-blue-600/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                         <BrainCircuit size={12} /> Neural Verify
                      </button>
                      <button className="bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-500 p-2 rounded-lg transition-all border border-transparent hover:border-red-500/20">
                         <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {artifacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-600 text-xs font-medium italic">
                    Nenhum artefato carregado no Nexus ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
