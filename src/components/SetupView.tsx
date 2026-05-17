import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { FolderArchive, TerminalSquare, Database } from 'lucide-react';
import { i18n, Language } from '../i18n';

export default function SetupView({ language }: { language: Language }) {
  const [muServerPath, setMuServerPath] = useState("");
  const [connectionMode, setConnectionMode] = useState<'local' | 'remote'>('local');
  const [sshConfig, setSshConfig] = useState({ host: '', port: 22, username: 'Administrator', password: '' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [sqlQuery, setSqlQuery] = useState("CREATE TABLE Character (Name VARCHAR(50), Class INT, cLevel INT, MapNumber INT, MapPosX INT, MapPosY INT, CtlCode INT, AccountID VARCHAR(50));");
  const [isExecutingDb, setIsExecutingDb] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);

  const [saPassword, setSaPassword] = useState("MyStr0ngP@ssw0rd");
  const [sqlInstallMethod, setSqlInstallMethod] = useState<"native" | "docker" | "localdb">("native");
  const [isInstallingSql, setIsInstallingSql] = useState(false);

  const t = i18n[language];

  useEffect(() => {
    safeFetch('/api/config')
      .then(d => {
         setMuServerPath(d.muServerPath || "");
         setConnectionMode(d.connectionMode || 'local');
         if(d.sshConfig) setSshConfig(d.sshConfig);
      })
      .catch(e => console.error(e));
  }, []);

  const saveConfig = async () => {
     setIsSavingConfig(true);
     try {
         await safeFetch('/api/config', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ muServerPath, mode: connectionMode, ssh: sshConfig })
         });
         alert("Configurações de conexão salvas! Se habilitou SSH remoto, todas as leituras de arquivo e executáveis agirão através dele.");
     } catch(e) {
         console.error(e);
     }
     setIsSavingConfig(false);
  };

  const handleInstallFolders = async () => {
     setIsInstalling(true);
     setInstallLogs(prev => [...prev, `[INFO] Iniciando criação das pastas em ${muServerPath}...`]);
     try {
         const data = await safeFetch('/api/install/folders', { method: 'POST' });
         if (data.success) {
            setInstallLogs(prev => [...prev, `[SUCCESS] Super estrutura de pastas do DataServer, JoinServer e GameServer criadas com sucesso!`]);
         } else {
            setInstallLogs(prev => [...prev, `[ERROR] ${data.error}`]);
         }
     } catch (e: any) {
         setInstallLogs(prev => [...prev, `[ERROR] Falha de rede: ${e.message}`]);
     }
     setIsInstalling(false);
  };

  const executeSqlQuery = async () => {
      setIsExecutingDb(true);
      setDbResult(null);
      try {
         const data = await safeFetch('/api/db/execute', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sqlQuery })
         });
         if (data.success) {
            setDbResult({ success: true, message: `Query executada. Linhas afetadas: ${data.rowsAffected}`, data: data.result });
         } else {
            setDbResult({ success: false, error: data.error });
         }
      } catch (e: any) {
         setDbResult({ success: false, error: e.message });
      }
      setIsExecutingDb(false);
  };

  const handleInstallSQL = async () => {
      setIsInstallingSql(true);
      try {
          const data = await safeFetch('/api/install/sql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  saPassword, 
                  method: sqlInstallMethod,
                  os: 'auto'
              })
          });
          if (data.success) {
              alert(data.message + "\n\nO servidor SQL foi inicializado/baixado e já está acessível.");
          } else {
              alert("Erro: " + data.error);
              console.error(data);
          }
      } catch(e: any) {
          alert("Falha de rede: " + e.message);
      }
      setIsInstallingSql(false);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             {t.setup.title} <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase">WSL/Windows DB</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">{t.setup.subtitle}</p>
        </div>
      </header>
      
      <div className="bg-[#111317] border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.05)] rounded-2xl p-6 mb-6">
        <h3 className="font-bold text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">{t.setup.envConfig}</h3>
        
        <div className="flex bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 gap-3 text-sm text-blue-300">
           <FolderArchive size={24} className="flex-shrink-0" />
           <div>
             <p className="font-bold text-white mb-1">Você já possui arquivos (.rar / .zip) do Servidor?</p>
             <p className="text-blue-300/80">
               1. Extraia seu arquivo <code className="text-blue-200">.rar</code> ou <code className="text-blue-200">.zip</code> manualmente usando WinRAR ou 7-Zip para uma pasta da sua máquina (ex: <code className="text-blue-200">C:\MuServer</code>).<br/>
               2. Cole o caminho exato dessa pasta no campo abaixo e salve.<br/>
               Infelizmente arquivos <b>.rar</b> são proprietários e nativamente, Node e Sistemas Operacionais em Cloud não conseguem extraí-los sem ter o WinRAR ou dependência externa instalada na máquina hospedeira.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 block">{t.setup.pathLabel}</label>
            <input 
               type="text" 
               className="w-full bg-[#050506] border border-[#1e2126] text-white text-sm font-mono p-3 rounded-lg focus:outline-none focus:border-blue-500" 
               value={muServerPath} 
               onChange={e => setMuServerPath(e.target.value)} 
               placeholder="C:\MuServer ou /home/pi/PaperMu"
            />
            <p className="text-[10px] text-slate-500 mt-2">{t.setup.pathHint}</p>
          </div>
          <div>
             <label className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 block">{t.setup.connMode}</label>
             <div className="flex gap-2">
                <button onClick={() => setConnectionMode('local')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-[11px] transition-all border ${connectionMode === 'local' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-[#050506] text-slate-400 border-[#1e2126]'}`}>
                   {t.setup.localNode}
                </button>
                <button onClick={() => setConnectionMode('remote')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-[11px] transition-all border ${connectionMode === 'remote' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-[#050506] text-slate-400 border-[#1e2126]'}`}>
                   {t.setup.remoteSsh}
                </button>
             </div>
             <div className="flex bg-green-500/10 border border-green-500/20 rounded p-2 mt-2 gap-2 text-xs text-green-400">
               <span>💡</span>
               <p dangerouslySetInnerHTML={{ __html: t.setup.armHint }}></p>
             </div>
          </div>
        </div>

        {connectionMode === 'remote' && (
          <div className="mt-4 p-4 bg-[#050506] border border-orange-500/30 rounded-xl grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="text-xs text-slate-500 block mb-1">{t.setup.vpsHost}</label><input type="text" value={sshConfig.host} onChange={e => setSshConfig({...sshConfig, host: e.target.value})} className="w-full bg-[#1e2126] border-none rounded p-2 text-white text-xs" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">{t.setup.sshPort}</label><input type="number" value={sshConfig.port} onChange={e => setSshConfig({...sshConfig, port: Number(e.target.value)})} className="w-full bg-[#1e2126] border-none rounded p-2 text-white text-xs" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">{t.setup.sshUser}</label><input type="text" value={sshConfig.username} onChange={e => setSshConfig({...sshConfig, username: e.target.value})} className="w-full bg-[#1e2126] border-none rounded p-2 text-white text-xs" /></div>
            <div><label className="text-xs text-slate-500 block mb-1">{t.setup.sshPass}</label><input type="password" value={sshConfig.password} onChange={e => setSshConfig({...sshConfig, password: e.target.value})} className="w-full bg-[#1e2126] border-none rounded p-2 text-white text-xs" placeholder="••••••••" /></div>
          </div>
        )}
        
        <button onClick={saveConfig} disabled={isSavingConfig} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
            {isSavingConfig ? t.setup.saving : t.setup.saveConfig}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
               <span className="p-2 bg-[#1e2126] aspect-square rounded-md text-green-500"><TerminalSquare size={18} /></span>
               {t.setup.folders}
            </h3>
            <p className="text-sm text-slate-400 mb-6" dangerouslySetInnerHTML={{ __html: t.setup.foldersDesc.replace('{path}', `<code>${muServerPath}</code>`) }}></p>

            <div className="bg-[#050506] border border-[#1e2126] p-4 rounded-xl flex-1 mb-4 overflow-auto max-h-[150px] font-mono text-[10px] text-slate-400">
               {installLogs.length === 0 ? (
                  <span className="text-slate-600">{t.setup.waitInstall}</span>
               ) : (
                  installLogs.map((log, i) => <div key={i} className={log.includes('[ERROR]') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : 'text-slate-400'}>{log}</div>)
               )}
            </div>

            <button 
               onClick={handleInstallFolders}
               disabled={isInstalling}
               className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
               {isInstalling ? t.setup.creating : t.setup.createFolders}
            </button>
         </div>

         <div className="flex flex-col gap-6">
            <div className="bg-[#111317] border border-orange-500/30 rounded-2xl p-6 flex flex-col">
               <h3 className="font-bold text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                  <span className="p-2 bg-orange-500/20 aspect-square rounded-md text-orange-500"><Database size={18} /></span>
                  Instalar Servidor SQL
               </h3>
               <p className="text-sm text-slate-400 mb-4">
                  Baixa e instala o Microsoft SQL Server localmente ou num container. Útil se a máquina ainda não tem banco de dados.
               </p>
               
               <div className="flex flex-col gap-3 mb-4">
                  <div>
                     <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Método</label>
                     <div className="flex gap-2">
                         <button onClick={() => setSqlInstallMethod('native')} className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold rounded border ${sqlInstallMethod === 'native' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-[#050506] border-[#1e2126] text-slate-400'}`}>Full (Win/Linux)</button>
                         <button onClick={() => setSqlInstallMethod('localdb')} className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold rounded border ${sqlInstallMethod === 'localdb' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-[#050506] border-[#1e2126] text-slate-400'}`}>LocalDB (Portable)</button>
                         <button onClick={() => setSqlInstallMethod('docker')} className={`flex-1 py-2 px-2 text-[10px] uppercase font-bold rounded border ${sqlInstallMethod === 'docker' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-[#050506] border-[#1e2126] text-slate-400'}`}>Docker/Container</button>
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Senha Conta Root (SA)</label>
                     <input 
                        type="text" 
                        value={saPassword} 
                        onChange={e => setSaPassword(e.target.value)} 
                        className="w-full bg-[#050506] border border-[#1e2126] p-2 text-xs text-white rounded focus:border-orange-500 outline-none" 
                     />
                  </div>
               </div>

               <button 
                  onClick={handleInstallSQL}
                  disabled={isInstallingSql}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
               >
                  {isInstallingSql ? 'Iniciando Instalação (Aguarde...)' : 'Baixar e Instalar SQL Server'}
               </button>
            </div>

            <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col flex-1">
               <h3 className="font-bold text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                  <span className="p-2 bg-[#1e2126] aspect-square rounded-md text-blue-500"><Database size={18} /></span>
                  {t.setup.sqlScript}
               </h3>
               <p className="text-sm text-slate-400 mb-4">{t.setup.sqlDesc}</p>

               <textarea 
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full bg-[#050506] border border-[#1e2126] text-blue-400 font-mono text-[11px] p-4 rounded-xl focus:outline-none focus:border-blue-500 resize-none h-[100px] mb-4"
                  spellCheck="false"
               />

               {dbResult && (
                  <div className={`p-4 rounded-xl mb-4 text-xs font-mono overflow-auto max-h-[100px] border ${dbResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                     {dbResult.success ? dbResult.message : dbResult.error}
                  </div>
               )}

               <button 
                  onClick={executeSqlQuery}
                  disabled={isExecutingDb}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 mt-auto"
               >
                  {isExecutingDb ? t.setup.executing : t.setup.runSql}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
