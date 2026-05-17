import React, { useState, useEffect, Suspense } from 'react';
import { 
  Terminal, Shield, Settings, Server, Package, 
  Database, User, Search, RefreshCw, Layers, 
  Cpu, HardDrive, ShoppingCart, Clock, ArrowLeft, 
  Trash2, Plus, Edit3, Save, Play, Loader2, 
  AlertCircle, ChevronRight, Menu, X, BrainCircuit,
  MessageSquare, Globe, BookOpen, Wrench as LucideTool,
  Trello, Activity, LayoutDashboard, Database as DatabaseIcon,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'react-hot-toast';
import wsService from './services/websocket.service';

const WebClientView = React.lazy(() => import('./components/WebClientView'));
const ServerManagerView = React.lazy(() => import('./components/ServerManagerView'));
const ToolsView = React.lazy(() => import('./components/ToolsView'));
const DatabaseView = React.lazy(() => import('./components/DatabaseView'));
const BridgeSetup = React.lazy(() => import('./components/SetupView'));
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const ItemEncyclopedia = React.lazy(() => import('./components/ItemEncyclopedia'));
const CommandCenter = React.lazy(() => import('./components/CommandCenter'));
const MarketplaceModules = React.lazy(() => import('./components/MarketplaceModules'));
const TodoList = React.lazy(() => import('./components/TodoList'));
const SourceCodeView = React.lazy(() => import('./components/SourceCodeView'));
const ConfigView = React.lazy(() => import('./components/ConfigView'));
const SecurityView = React.lazy(() => import('./components/SecurityView'));
const EventsView = React.lazy(() => import('./components/EventsView'));
const CastleSiegeView = React.lazy(() => import('./components/CastleSiegeView'));
const VipSystemView = React.lazy(() => import('./components/VipSystemView'));
const CashShopView = React.lazy(() => import('./components/CashShopView'));
const BackupsView = React.lazy(() => import('./components/BackupsView'));
const WorkspacesView = React.lazy(() => import('./components/WorkspacesView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const CortexSearch = React.lazy(() => import('./components/CortexSearch'));

type Language = 'pt' | 'en';

const i18n = {
  pt: {
    dashboard: 'Painel Central',
    serverControl: 'Gerenciar MuServer',
    databases: 'Bancos de Dados',
    webClient: 'Web Client / Launcher',
    tools: 'MuTools Integrados',
    settings: 'Configurações',
    status: 'Status do Sistema',
  },
  en: {
    dashboard: 'Dashboard',
    serverControl: 'Server Control',
    databases: 'Databases',
    webClient: 'Web Client / Launcher',
    tools: 'Integrated Tools',
    settings: 'Settings',
    status: 'System Status',
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('pt');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [serverState, setServerState] = useState<'online' | 'offline' | 'starting'>('online');
  const [isCortexOpen, setIsCortexOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCortexOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const socket = wsService.connect();
    socket.on('notification', (data: { title: string; message: string; type: 'success' | 'error' | 'info' }) => {
      switch (data.type) {
        case 'success': toast.success(`${data.title}: ${data.message}`); break;
        case 'error': toast.error(`${data.title}: ${data.message}`); break;
        default: toast(data.message, { icon: 'ℹ️' });
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      socket.off('notification');
    };
  }, []);

  const navGroups = [
    {
      title: 'Zênite / Kernel',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'server', label: 'MuServer Control', icon: Server },
        { id: 'bridge', label: 'Zenite Bridge', icon: Activity },
      ]
    },
    {
      title: 'Arquivos & Source',
      items: [
        { id: 'source', label: 'C++ Source Editor', icon: Terminal },
        { id: 'configs', label: 'Server Configs', icon: Settings },
        { id: 'database', label: 'SQL Explorer', icon: DatabaseIcon },
        { id: 'encyclopedia', label: 'Item Encyclopedia', icon: BookOpen },
      ]
    },
    {
      title: 'Eventos & Sistemas',
      items: [
        { id: 'events', label: 'Event Schedule', icon: Clock },
        { id: 'castlesiege', label: 'Castle Siege', icon: Shield },
        { id: 'vip', label: 'VIP System', icon: User },
        { id: 'cashshop', label: 'XShop Editor', icon: ShoppingCart },
      ]
    },
    {
      title: 'Plataforma Web',
      items: [
        { id: 'web-client', label: 'Web Launcher', icon: Globe },
        { id: 'marketplace', label: 'MuMarketplace', icon: Package },
        { id: 'command-center', label: 'Command Center', icon: BrainCircuit },
      ]
    },
    {
      title: 'Utilitários',
      items: [
        { id: 'tools', label: 'General Tools', icon: LucideTool },
        { id: 'backups', label: 'DB Backups', icon: Database },
        { id: 'todo', label: 'Tasks / TODO', icon: Trello },
        { id: 'workspaces', label: 'Workspaces', icon: Layers },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#050506] font-sans text-slate-300 selection:bg-orange-500/30 selection:text-orange-200">
      {/* Sidebar navigation */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} h-full border-r border-[#1e2126] bg-[#0a0b0d] flex flex-col transition-all duration-300 ease-in-out relative z-30`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-400 rounded-xl flex items-center justify-center text-[#050506] shadow-lg shadow-orange-500/20">
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">MUMaster</h1>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] leading-none">Pro Engine</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-8 py-4">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className={`text-[10px] uppercase font-bold tracking-widest text-slate-500 px-4 mb-2 ${!isSidebarOpen && 'hidden text-center truncate'}`}>
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                      activeTab === item.id 
                      ? 'bg-orange-600/10 text-orange-500 shadow-[inset_0_0_20px_rgba(234,88,12,0.05)]' 
                      : 'hover:bg-[#111317] hover:text-white'
                    }`}
                  >
                    {activeTab === item.id && (
                      <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                    )}
                    <item.icon size={20} className={activeTab === item.id ? 'text-orange-500' : 'group-hover:scale-110 transition-transform'} />
                    <span className={`text-sm font-bold ${!isSidebarOpen && 'hidden'}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-[#1e2126] bg-[#050506]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#1e2126] flex items-center justify-center text-xs font-bold text-slate-400">
              AD
            </div>
            <div className={`${!isSidebarOpen && 'hidden'}`}>
              <p className="text-xs font-bold text-white">Administrator</p>
              <p className="text-[10px] text-slate-500">Master Console v4.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[#060709] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-orange-500" /></div>}>
                {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} serverState={serverState} language={language} />}
                {activeTab === 'server' && <ServerManagerView serverState={serverState} />}
                {activeTab === 'source' && <SourceCodeView language={language} />}
                {activeTab === 'configs' && <ConfigView />}
                {activeTab === 'security' && <SecurityView />}
                {activeTab === 'events' && <EventsView />}
                {activeTab === 'castlesiege' && <CastleSiegeView />}
                {activeTab === 'vip' && <VipSystemView />}
                {activeTab === 'cashshop' && <CashShopView />}
                {activeTab === 'backups' && <BackupsView language={language} />}
                {activeTab === 'workspaces' && <WorkspacesView language={language} setActiveTab={setActiveTab} />}
                {activeTab === 'settings' && <SettingsView language={language} />}
                {activeTab === 'web-client' && <WebClientView />}
                {activeTab === 'bridge' && <BridgeSetup language={language} />}
                {activeTab === 'tools' && <ToolsView />}
                {activeTab === 'database' && <DatabaseView />}
                {activeTab === 'encyclopedia' && <ItemEncyclopedia />}
                {activeTab === 'command-center' && <CommandCenter />}
                {activeTab === 'marketplace' && <MarketplaceModules />}
                {activeTab === 'todo' && <TodoList />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <CortexSearch isOpen={isCortexOpen} onClose={() => setIsCortexOpen(false)} navigateTo={setActiveTab} />
        
        {/* Global Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
           <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             className="bg-[#111317]/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
           >
              <div className="flex items-center gap-4 border-r border-white/5 pr-6">
                 <button 
                   onClick={() => setServerState(serverState === 'online' ? 'offline' : 'online')}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                     serverState === 'online' 
                     ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                     : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white'
                   }`}
                 >
                    {serverState === 'online' ? <Play className="rotate-90" size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    {serverState === 'online' ? 'Stop Server' : 'Start Server'}
                 </button>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${serverState === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                       <span className="text-[10px] font-bold text-white uppercase">{serverState}</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 {[
                   { label: 'Reload', icon: RefreshCw, action: () => toast.success("GameServer reloaded successfully!") },
                   { label: 'Broadcast', icon: MessageSquare, action: () => toast.success("Global message sent!") },
                   { label: 'Clear Cache', icon: Trash2, action: () => toast.success("Buffer cache cleared.") },
                   { label: 'Maintenance', icon: AlertCircle, action: () => toast.success("Maintenance mode toggled.") },
                 ].map((tool, i) => (
                   <button 
                     key={i}
                     onClick={tool.action}
                     className="flex flex-col items-center gap-1 group"
                   >
                      <div className="w-10 h-10 rounded-xl bg-[#0a0b0d] border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:border-white/20 transition-all">
                         <tool.icon size={18} />
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400">{tool.label}</span>
                   </button>
                 ))}
                 <div className="w-px h-8 bg-white/5 mx-2"></div>
                 <button 
                  onClick={() => setIsCortexOpen(true)}
                  className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 text-white pl-4 pr-3 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] group"
                 >
                    <span className="text-[10px] font-black uppercase tracking-widest">Cortex AI</span>
                    <div className="bg-[#050506]/30 px-1.5 py-0.5 rounded text-[9px] font-mono group-hover:bg-black/50 overflow-hidden flex items-center gap-1">
                       <Command size={10} /> K
                    </div>
                 </button>
              </div>
           </motion.div>
        </div>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#111317',
            color: '#fff',
            border: '1px border #1e2126',
            borderRadius: '12px',
          }
        }} />
      </main>
    </div>
  );
}
