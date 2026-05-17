import React from 'react';
import { Play, Square, RefreshCw } from 'lucide-react';

export default function ServerManagerView({ serverState, handleServerAction }: { serverState: string, handleServerAction?: (a: 'start'|'stop'|'restart')=>void }) {
  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">Gerenciador do Servidor</h2>
           <p className="text-slate-400 mt-1">Controle os processos, portas e serviços em execução.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => handleServerAction?.('start')} disabled={serverState === 'online'} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 flex items-center gap-2">
              <Play size={16} /> Ligar Tudo
           </button>
           <button onClick={() => handleServerAction?.('stop')} disabled={serverState === 'offline'} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 flex items-center gap-2">
              <Square size={16} /> Desligar Tudo
           </button>
           <button onClick={() => handleServerAction?.('restart')} disabled={serverState === 'offline'} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 flex items-center gap-2">
              <RefreshCw size={16} /> Restart
           </button>
        </div>
      </header>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Processos Core</h3>
        <div className="space-y-3">
          {[
            { name: 'ConnectServer.exe', port: '44405', status: serverState, mem: '15 MB' },
            { name: 'JoinServer.exe', port: '55970', status: serverState, mem: '45 MB' },
            { name: 'DataServer.exe', port: '55960', status: serverState, mem: '120 MB' },
            { name: 'GameServer.exe', port: '55901', status: serverState, mem: '850 MB' },
            { name: 'GameServerCS.exe', port: '55919', status: 'offline', mem: '0 MB' },
          ].map((proc, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-black/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${proc.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : proc.status === 'starting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                <div>
                  <h4 className="font-medium text-slate-200">{proc.name}</h4>
                  <p className="text-xs text-slate-500">Porta: {proc.port}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-slate-400">Uso de Ram</p>
                  <p className="text-sm font-mono text-slate-200">{proc.status === 'online' ? proc.mem : '0 MB'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleServerAction?.('start')} disabled={proc.status === 'online'} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded border border-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                    <Play size={16} />
                  </button>
                  <button onClick={() => handleServerAction?.('stop')} disabled={proc.status === 'offline'} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                    <Square size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
