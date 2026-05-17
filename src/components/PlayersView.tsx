import React, { useState, useEffect } from 'react';
import { Shield, Box } from 'lucide-react';
import { safeFetch } from '../lib/utils';

export default function PlayersView() {
  const [players, setPlayers] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>({ status: 'disconnected', error: null });
  const [dbSettings, setDbSettings] = useState({ engine: 'mssql', server: 'localhost', user: 'sa', password: '', database: 'MuOnline' });
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [editObj, setEditObj] = useState<any>({});

  const fetchDbConfig = () => {
     safeFetch('/api/db-config')
       .then(d => {
          setDbStatus({ status: d.status, error: d.error });
          setDbSettings(prev => ({ ...prev, engine: d.engine || prev.engine, server: d.server || prev.server, user: d.user || prev.user, database: d.database || prev.database }));
          if (d.status === 'connected') fetchPlayers();
          else setIsLoading(false);
       })
       .catch(e => {
          console.error(e);
          setIsLoading(false);
       });
  };

  const fetchPlayers = () => {
    setIsLoading(true);
    safeFetch('/api/players')
      .then(d => {
         setIsLoading(false);
         if (d.players) setPlayers(d.players);
         else if (d.error) setDbStatus({ status: 'disconnected', error: d.error });
      })
      .catch(e => {
         setIsLoading(false);
         console.error(e);
      });
  };

  useEffect(() => {
     fetchDbConfig();
  }, []);

  const saveDbConfig = () => {
     setIsLoading(true);
     safeFetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbSettings)
     }).then(d => {
        setIsLoading(false);
        setDbStatus({ status: d.success ? 'connected' : 'disconnected', error: d.error });
        if (d.success) {
           setShowDbConfig(false);
           fetchPlayers();
        }
     });
  };

  const getClassName = (code: number) => {
      const classes: Record<number, string> = {
         0: 'Dark Wizard', 1: 'Soul Master', 2: 'Grand Master',
         16: 'Dark Knight', 17: 'Blade Knight', 18: 'Blade Master',
         32: 'Elf', 33: 'Muse Elf', 34: 'High Elf',
         48: 'Magic Gladiator', 50: 'Duel Master',
         64: 'Dark Lord', 66: 'Lord Emperor',
         80: 'Summoner', 81: 'Bloody Summoner', 82: 'Dimension Master'
      };
      return classes[code] || `Class ${code}`;
  };

  const getMapName = (code: number) => {
      const maps: Record<number, string> = {
         0: 'Lorencia', 1: 'Dungeon', 2: 'Devias', 3: 'Noria', 4: 'LostTower',
         6: 'Arena', 7: 'Atlans', 8: 'Tarkan', 9: 'Devil Square', 10: 'Icarus'
      };
      return maps[code] || `Map ${code}`;
  };

  const handleEditPlayer = async () => {
     try {
       await safeFetch('/api/db/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             query: `UPDATE Character SET cLevel = ${editObj.cLevel || 1}, ResetCount = ${editObj.ResetCount || 0}, CtlCode = ${editObj.CtlCode || 0} WHERE Name = '${selectedPlayer.Name}'` 
          })
       });
       setSelectedPlayer(null);
       fetchPlayers();
     } catch (e) {
       alert("Failed to edit player.");
     }
  };

  const handleBanPlayer = async (name: string) => {
     if(confirm(`Tem certeza que deseja banir ${name}?`)) {
        try {
           await safeFetch('/api/db/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `UPDATE Character SET CtlCode = 1 WHERE Name = '${name}'` })
           });
           fetchPlayers();
        } catch(e) {
           alert("Falha ao banir");
        }
     }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-0 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Contas & Personagens <span className={`text-[10px] px-2 py-1 rounded tracking-widest uppercase ${dbStatus.status === 'connected' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{dbStatus.status === 'connected' ? 'DB Conectado' : 'Sem DB'}</span>
          </h2>
          <p className="text-slate-400 mt-1 max-w-3xl">Gerencie jogadores reais usando a conexão ODBC/MSSQL.</p>
        </div>
        <button onClick={() => setShowDbConfig(!showDbConfig)} className="bg-[#111317] hover:bg-[#1e2126] border border-[#1e2126] text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg">
           Configurar DB
        </button>
      </header>

      {showDbConfig && (
        <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-wrap gap-4">
           <select value={dbSettings.engine} onChange={e => setDbSettings({...dbSettings, engine: e.target.value})} className="bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-sm text-white focus:border-orange-500 min-w-[120px]">
               <option value="mssql">SQL Server (Nativo)</option>
               <option value="sqlite">SQLite (Embutido/Lite)</option>
           </select>
           {dbSettings.engine === 'mssql' && (
             <>
               <input type="text" placeholder="Server (ex: localhost)" value={dbSettings.server} onChange={e => setDbSettings({...dbSettings, server: e.target.value})} className="flex-1 bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-sm text-white focus:border-orange-500" />
               <input type="text" placeholder="Usuário (sa)" value={dbSettings.user} onChange={e => setDbSettings({...dbSettings, user: e.target.value})} className="flex-1 bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-sm text-white focus:border-orange-500" />
               <input type="password" placeholder="Senha" value={dbSettings.password} onChange={e => setDbSettings({...dbSettings, password: e.target.value})} className="flex-1 bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-sm text-white focus:border-orange-500" />
               <input type="text" placeholder="Database (MuOnline)" value={dbSettings.database} onChange={e => setDbSettings({...dbSettings, database: e.target.value})} className="flex-1 bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-sm text-white focus:border-orange-500" />
             </>
           )}
           <button onClick={saveDbConfig} disabled={isLoading} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-2 rounded text-sm disabled:opacity-50 min-w-[120px]">Conectar</button>
        </div>
      )}

      {dbStatus.error && (
         <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-mono">
            Erro de DB: {dbStatus.error}
         </div>
      )}

      <div className="flex gap-4">
        <input type="text" placeholder="Buscar personagem ou conta (Ex: Admin)..." className="flex-1 bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500" />
        <button onClick={fetchPlayers} disabled={isLoading} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50">Refresh DB</button>
      </div>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl flex-1 flex flex-col relative overflow-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#1e2126] text-xs uppercase tracking-widest text-slate-400 sticky top-0">
            <tr>
              <th className="px-4 py-3">Personagem</th>
              <th className="px-4 py-3">Classe</th>
              <th className="px-4 py-3">Level / Resets</th>
              <th className="px-4 py-3">Map / Pos</th>
              <th className="px-4 py-3">Conta / CtlCode</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2126]">
            {isLoading ? (
               <tr><td colSpan={6} className="text-center py-8 text-slate-500">Carregando dados do banco...</td></tr>
            ) : players.length === 0 ? (
               <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nenhum personagem encontrado no banco de dados.</td></tr>
            ) : players.map((p, i) => (
              <tr key={i} className="hover:bg-[#1e2126]/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="font-bold text-white flex items-center gap-2">
                    {p.Name} 
                    {p.CtlCode > 0 && <span className="bg-red-500/20 text-red-500 text-[9px] px-1 rounded uppercase border border-red-500/30">GM / BAN</span>}
                  </div>
                </td>
                <td className="px-4 py-4">{getClassName(p.Class)}</td>
                <td className="px-4 py-4 text-orange-400 font-mono">
                  {p.cLevel} <span className="text-slate-500">/</span> {p.ResetCount}
                </td>
                <td className="px-4 py-4 text-xs font-mono">{getMapName(p.MapNumber)} ({p.MapPosX}, {p.MapPosY})</td>
                <td className="px-4 py-4 text-xs font-mono text-slate-400">{p.AccountID} <span className="text-slate-600">[{p.CtlCode}]</span></td>
                <td className="px-4 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setSelectedPlayer(p); setEditObj({ cLevel: p.cLevel, ResetCount: p.ResetCount, CtlCode: p.CtlCode }); }} className="bg-[#0a0b0d] hover:bg-orange-500/20 text-orange-400 border border-[#2a2d33] hover:border-orange-500/50 p-1.5 rounded transition-colors" title="Editar Level">
                    <Box size={16} />
                  </button>
                  <button onClick={() => handleBanPlayer(p.Name)} className="bg-[#0a0b0d] hover:bg-red-500/20 text-red-500 border border-[#2a2d33] hover:border-red-500/50 p-1.5 rounded transition-colors" title="Banir / Desconectar">
                    <Shield size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {selectedPlayer && (
          <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto transition-opacity z-50">
             <div className="bg-[#111317] border border-[#1e2126] rounded-xl p-6 w-96 max-w-full">
                <h3 className="text-white font-bold mb-4">Editando: {selectedPlayer.Name}</h3>
                <div className="space-y-4">
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Level</label>
                     <input type="number" value={editObj.cLevel || 0} onChange={e => setEditObj({...editObj, cLevel: parseInt(e.target.value)})} className="w-full bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-white" />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Resets</label>
                     <input type="number" value={editObj.ResetCount || 0} onChange={e => setEditObj({...editObj, ResetCount: parseInt(e.target.value)})} className="w-full bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-white" />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">CtlCode (0=Normal, 1=Ban, 8=GM)</label>
                     <input type="number" value={editObj.CtlCode || 0} onChange={e => setEditObj({...editObj, CtlCode: parseInt(e.target.value)})} className="w-full bg-[#050506] border border-[#1e2126] rounded px-3 py-2 text-white" />
                   </div>
                   <div className="flex gap-2 pt-2">
                     <button onClick={() => setSelectedPlayer(null)} className="flex-1 bg-[#1e2126] text-white py-2 rounded font-bold text-sm">Cancelar</button>
                     <button onClick={handleEditPlayer} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-bold text-sm">Salvar SQL</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
