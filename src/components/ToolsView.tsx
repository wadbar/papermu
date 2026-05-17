import React, { useState } from 'react';
import { Box, Target, Gift, Store, MapPin, Terminal, BrainCircuit } from 'lucide-react';
import MonsterSetBaseEditor from './MonsterSetBaseEditor';
import ItemEditor from './ItemEditor';
import EventBagEditor from './EventBagEditor';

export default function ToolsView() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: 'item', name: 'Editor de Itens', desc: 'Item.bmd / Item.txt (Dano, Req, Classe)', icon: Box, color: 'text-blue-400' },
    { id: 'monstersetbase', name: 'MonsterSetBase', desc: 'Spots, Mapas e Coordenadas.', icon: Target, color: 'text-red-400' },
    { id: 'eventbag', name: 'EventBags / Drops', desc: 'Configurar Box of Kundun, Invasões.', icon: Gift, color: 'text-purple-400' },
    { id: 'shop', name: 'Shop Editor', desc: 'Lojas NPCs (Lorencia, Noria).', icon: Store, color: 'text-yellow-400' },
    { id: 'gate', name: 'Gate Editor', desc: 'Portais de Mapas (Warp).', icon: MapPin, color: 'text-green-400' },
    { id: 'logs', name: 'Global Log Stream', icon: Terminal, desc: 'Monitoramento AI de pacotes e eventos em tempo real.', color: 'text-orange-500' },
    { id: 'cpp', name: 'Source Auditor', icon: BrainCircuit, desc: 'Análise de vulnerabilidades na Source C++ (AI Powered).', color: 'text-white' }
  ];

  if (activeTool === 'monstersetbase') return <MonsterSetBaseEditor onBack={() => setActiveTool(null)} />;
  if (activeTool === 'item') return <ItemEditor onBack={() => setActiveTool(null)} />;
  if (activeTool === 'eventbag') return <EventBagEditor onBack={() => setActiveTool(null)} />;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Ferramentas de Edição Visual</h2>
        <p className="text-slate-400 mt-1">Ferramentas avançadas para personalizar o seu servidor sem precisar editar os arquivos Txt diretamente.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <button 
            key={tool.id} 
            onClick={() => setActiveTool(tool.id)}
            className="bg-[#111317] hover:bg-[#1e2126] border border-[#1e2126] hover:border-orange-500/50 p-5 rounded-2xl flex flex-col items-start gap-4 transition-all text-left group"
          >
            <div className={`p-3 bg-[#0a0b0d] rounded-xl ${tool.color} border border-[#1e2126] group-hover:scale-110 transition-transform`}>
              <tool.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{tool.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
