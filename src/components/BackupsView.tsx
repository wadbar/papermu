import React, { useState, useEffect } from 'react';
import { DatabaseBackup, FolderArchive } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Language = 'pt' | 'en';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

export default function BackupsView({ language = 'pt' }: { language?: Language }) {
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchBackups = () => {
     setIsLoading(true);
     safeFetch('/api/backups').then(d => {
        setIsLoading(false);
        if(d.backups) setBackups(d.backups);
     }).catch(()=>setIsLoading(false));
  };

  useEffect(() => {
     fetchBackups();
  }, []);

  const handleCreate = () => {
      setIsCreating(true);
      safeFetch('/api/backups', { method: 'POST' }).then(d => {
         setIsCreating(false);
         if(d.success) {
            toast.success("Backup gerado com sucesso!");
            fetchBackups();
         } else {
            toast.error("Erro: " + d.error);
         }
      }).catch(()=>setIsCreating(false));
  };

  const handleRestore = (filename: string) => {
      if(!confirm(`Tem certeza que deseja restaurar o banco de dados a partir do arquivo ${filename}? ISSO IRÁ SOBRESCREVER OS DADOS ATUAIS!`)) return;
      setIsLoading(true);
      safeFetch('/api/backups/restore', { 
         method: 'POST', 
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ filename })
      }).then(d => {
         setIsLoading(false);
         if(d.success) toast.success("Restaurado com sucesso!");
         else toast.error("Erro ao restaurar: " + d.error);
      }).catch(()=>setIsLoading(false));
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-0 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <DatabaseBackup size={28} className="text-blue-500" />
             Backups
             <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">Safety First</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Gere snapshots do banco de dados (SQLite/MSSQL) para evitar perdas.</p>
        </div>
        <button onClick={handleCreate} disabled={isCreating} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg flex items-center gap-2">
           <FolderArchive size={18} /> {isCreating ? 'Gerando...' : 'Criar Novo Backup'}
        </button>
      </header>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl flex-1 flex flex-col relative overflow-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#1e2126] text-xs uppercase tracking-widest text-slate-400 sticky top-0">
            <tr>
              <th className="px-4 py-3">Arquivo</th>
              <th className="px-4 py-3">Tamanho</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2126]">
            {isLoading ? (
               <tr><td colSpan={4} className="text-center py-8 text-slate-500">Carregando...</td></tr>
            ) : backups.length === 0 ? (
               <tr><td colSpan={4} className="text-center py-8 text-slate-500">Nenhum backup encontrado.</td></tr>
            ) : backups.map((b, i) => (
              <tr key={i} className="hover:bg-[#1e2126]/50 transition-colors">
                <td className="px-4 py-4 font-mono text-xs">{b.name}</td>
                <td className="px-4 py-4">{b.size}</td>
                <td className="px-4 py-4">{new Date(b.date).toLocaleString()}</td>
                <td className="px-4 py-4 text-right">
                   <button onClick={() => handleRestore(b.name)} className="text-blue-400 hover:text-blue-300 text-xs font-bold border border-blue-500/30 px-3 py-1 rounded bg-blue-500/10">Restaurar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
