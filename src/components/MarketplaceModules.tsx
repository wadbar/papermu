import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, ExternalLink, Shield, Globe, 
  Cpu, Layout, Package, Star, Clock, 
  Zap, Code, Server, Heart, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MarketplaceModules() {
  const [filter, setFilter] = useState<'all' | 'repack' | 'web' | 'anti-hack'>('all');
  const [cart, setCart] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addToCart = (product: any) => {
    setCart([...cart, product]);
    toast.success(`${product.title} adicionado ao carrinho!`);
  };

  const addNewTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false
      };
      const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      localStorage.setItem('tasks', JSON.stringify([...savedTasks, newTask]));
      setNewTaskTitle('');
      toast.success('Tarefa adicionada com sucesso!');
    }
  };

  const products = [
    { 
      id: 1, 
      type: 'repack', 
      title: 'IGC Network Season 6 EP3', 
      desc: 'O repack mais estável e completo do mercado para Season 6. Recomendado para servidores sérios.', 
      price: 'Premium', 
      stars: 5,
      icon: Package,
      color: 'text-orange-500'
    },
    { 
      id: 2, 
      type: 'repack', 
      title: 'MuEmu Season 4 Classic', 
      desc: 'Baseado no projeto original da Emu, extremamente leve e personalizável (Source Inclusa).', 
      price: 'Open Source', 
      stars: 4.8,
      icon: Code,
      color: 'text-blue-500'
    },
    { 
      id: 3, 
      type: 'web', 
      title: 'DMN CMS v1.5 Pro', 
      desc: 'Website premium com sistema de ranking, mercado, leilão e integração total com o painel.', 
      price: '$49.00', 
      stars: 4.9,
      icon: Globe,
      color: 'text-green-500'
    },
    { 
      id: 4, 
      type: 'anti-hack', 
      title: 'MHP Anti-Hack System', 
      desc: 'Proteção contra speed, hit-hack e injeções de memória. Plugin nativo para o GameServer.', 
      price: 'Free-trial', 
      stars: 4.5,
      icon: Shield,
      color: 'text-red-500'
    },
    { 
      id: 5, 
      type: 'repack', 
      title: 'Season 18 Part 2-2', 
      desc: 'A versão mais recente com novos personagens, mapas e sistemas de maestria (Requires MSSQL 2019+).', 
      price: 'Elite', 
      stars: 4.7,
      icon: Cpu,
      color: 'text-purple-500'
    },
  ];

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.type === filter);

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Marketplace & Repacks <span className="text-blue-500 font-mono text-xs">V.X-COMMUNITY</span>
          </h2>
          <p className="text-slate-400 mt-1">Descubra os melhores recursos, módulos e arquivos da comunidade global de Mu Online.</p>
        </div>
        <div className="flex gap-2">
           <input 
             type="text" 
             value={newTaskTitle}
             onChange={(e) => setNewTaskTitle(e.target.value)}
             placeholder="Adicionar tarefa rápida..."
             className="bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
           />
           <button 
             onClick={addNewTask}
             className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all transition-all"
           >
              ADICIONAR TAREFA
           </button>
           <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 text-xs font-bold transition-all flex items-center gap-2">
              <Heart size={14} /> LISTA DE DESEJOS
           </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'repack', 'web', 'anti-hack'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
              ${filter === f ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-[#111317] text-slate-400 border-[#1e2126] hover:text-white'}`}
          >
            {f === 'all' ? 'Ver Tudo' : f === 'repack' ? 'Arquivos de Servidor' : f === 'web' ? 'Websites & CMS' : 'Segurança / Anti-Hack'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p, idx) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6 flex flex-col hover:border-blue-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`p-3 rounded-2xl border border-[#1e2126] bg-[#0a0b0d] group-hover:scale-110 transition-transform ${p.color}`}>
                  <p.icon size={24} />
               </div>
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                     <Star size={12} fill="currentColor" />
                     <span className="text-xs font-bold">{p.stars}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#1e2126] ${p.color}`}>
                    {p.type}
                  </span>
               </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{p.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">{p.desc}</p>

            <div className="flex items-center justify-between pt-6 border-t border-[#1e2126]">
               <span className="text-lg font-mono font-bold text-white">{p.price}</span>
               <div className="flex gap-2">
                  <button 
                    onClick={() => addToCart(p)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors text-xs font-bold"
                  >
                     Adicionar ao Carrinho
                  </button>
                  <button 
                    onClick={() => toast.success("Iniciando requisição de download...")}
                    className="bg-[#1e2126] hover:bg-[#25282e] text-slate-300 p-2.5 rounded-xl transition-colors"
                  >
                     <Download size={18} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
         <div className="bg-[#050506] p-6 rounded-2xl border border-[#1e2126] shadow-2xl shrink-0">
            <ShoppingBag size={48} className="text-blue-500 opacity-50" />
         </div>
         <div>
            <h3 className="text-2xl font-bold text-white mb-2">Quer oferecer seus próprios arquivos?</h3>
            <p className="text-slate-400 max-w-xl">
               Participe da nossa rede de desenvolvedores e venda seus repacks, scripts SQL ou plugins C++ diretamente para outros administradores de servidores Mu Online através do PaperMu Cloud.
            </p>
         </div>
         <button className="bg-white text-black font-bold px-8 py-4 rounded-2xl hover:bg-slate-200 transition-all ml-auto whitespace-nowrap uppercase tracking-wider text-sm shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            Tornar-se Vendedor
         </button>
      </div>
    </div>
  );
}
