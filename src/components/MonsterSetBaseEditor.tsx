import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trash2, Search, Map as MapIcon, Info, Crosshair, Pin } from 'lucide-react';
import { MU_MAPS, MU_MONSTERS } from '../lib/muKnowledge';

export default function MonsterSetBaseEditor({ onBack }: { onBack: () => void }) {
  const [selectedMap, setSelectedMap] = useState(0); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mobSearch, setMobSearch] = useState('');
  const [selectedMobId, setSelectedMobId] = useState<number | null>(null);
  
  const [spots, setSpots] = useState([
    { id: 1, map: 0, x: 135, y: 125, mobId: 1, mobName: 'Budge Dragon', radius: 3, count: 5 },
    { id: 2, map: 0, x: 145, y: 110, mobId: 6, mobName: 'Lich', radius: 5, count: 8 },
    { id: 3, map: 2, x: 220, y: 30, mobId: 19, mobName: 'Elite Yeti', radius: 3, count: 10 },
  ]);

  const filteredMonsters = useMemo(() => {
    if (!mobSearch) return [];
    return MU_MONSTERS.filter(m => 
      m.name.toLowerCase().includes(mobSearch.toLowerCase()) || 
      m.id.toString() === mobSearch
    ).slice(0, 5);
  }, [mobSearch]);

  const currentMap = useMemo(() => MU_MAPS.find(m => m.id === selectedMap), [selectedMap]);

  const handleAddSpot = () => {
    if (selectedMobId === null) return;
    const mob = MU_MONSTERS.find(m => m.id === selectedMobId);
    if (!mob) return;

    const newSpot = {
      id: Date.now(),
      map: selectedMap,
      x: mousePos.x,
      y: mousePos.y,
      mobId: mob.id,
      mobName: mob.name,
      radius: 3,
      count: 5
    };
    setSpots([...spots, newSpot]);
  };

  const removeSpot = (id: number) => {
    setSpots(spots.filter(s => s.id !== id));
  };

  const hotSpots = [
    { name: 'Lorencia Bar', x: 125, y: 125, map: 0 },
    { name: 'Devias Church', x: 220, y: 30, map: 2 },
    { name: 'Noria Chaos Machine', x: 180, y: 103, map: 3 },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex justify-between items-center bg-[#111317] p-4 rounded-xl border border-[#1e2126] shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors bg-[#1e2126] p-2 rounded-lg group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">MonsterSetBase Editor</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-black uppercase tracking-widest">Knowledge Pro</span>
            </div>
            <p className="text-xs text-slate-500">Gestão visual de spawns baseada em coordenadas reais de MU Online.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <MapIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
            <select 
              className="bg-[#0a0b0d] border border-[#1e2126] text-sm text-white pl-10 pr-8 py-2 rounded-xl outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer min-w-[180px]"
              value={selectedMap}
              onChange={(e) => setSelectedMap(parseInt(e.target.value))}
            >
              {MU_MAPS.map(m => <option key={m.id} value={m.id}>[{m.id}] {m.name}</option>)}
            </select>
          </div>
          <button className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-2 rounded-xl text-xs transition-all shadow-lg hover:shadow-orange-600/20 uppercase tracking-widest">
            Exportar MSB.txt
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
        {/* Map Visualization */}
        <div className="xl:col-span-3 bg-[#050506] border border-[#1e2126] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
             <div className="bg-orange-600/10 border border-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
                <MapIcon size={14} className="text-orange-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">{currentMap?.name || 'Unknown'}</span>
             </div>
             {hotSpots.filter(h => h.map === selectedMap).map(h => (
               <button 
                 key={h.name}
                 className="bg-slate-900/80 hover:bg-slate-800 border border-[#1e2126] px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2"
                 title="Quick Jump"
               >
                 <Pin size={10} /> {h.name}
               </button>
             ))}
          </div>

          <div 
             className="w-[512px] h-[512px] bg-[#0a0b0d] border border-[#1e2126] relative cursor-crosshair shadow-2xl transition-all"
             onMouseMove={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const mapX = Math.floor(((e.clientX - rect.left) / rect.width) * 255);
               const mapY = Math.floor(((e.clientY - rect.top) / rect.height) * 255);
               setMousePos({ x: mapX, y: mapY });
             }}
             onClick={handleAddSpot}
          >
             {/* Map Grid Labels */}
             <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-700 font-mono py-2">
                <span>0</span><span>64</span><span>128</span><span>192</span><span>255</span>
             </div>
             <div className="absolute top-[-24px] left-0 right-0 flex justify-between text-[10px] text-slate-700 font-mono px-2">
                <span>0</span><span>64</span><span>128</span><span>192</span><span>255</span>
             </div>

             {/* Spot Markers */}
             {spots.filter(s => s.map === selectedMap).map((spot) => (
                <div 
                  key={spot.id} 
                  className="absolute w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,1)] z-10 flex items-center justify-center cursor-pointer hover:scale-125 transition-all group/spot"
                  style={{ 
                    left: `${(spot.x / 255) * 100}%`, 
                    top: `${(spot.y / 255) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute -top-10 scale-0 group-hover/spot:scale-100 transition-transform origin-bottom z-30 pointer-events-none">
                    <div className="bg-black/90 border border-red-500/50 px-3 py-2 rounded-xl backdrop-blur-xl shadow-2xl min-w-[120px]">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{spot.mobName}</p>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>X: {spot.x}</span>
                        <span>Y: {spot.y}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 border-t border-white/5 pt-1">
                        <span>R: {spot.radius}</span>
                        <span>QTY: {spot.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
             ))}

             {/* Active Marker for selected mob */}
             {selectedMobId && (
               <div 
                 className="absolute w-8 h-8 rounded-full border-2 border-dashed border-red-500/50 animate-[spin_4s_linear_infinite] z-0 pointer-events-none"
                 style={{ 
                  left: `${(mousePos.x / 255) * 100}%`, 
                  top: `${(mousePos.y / 255) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
               ></div>
             )}
          </div>

          <div className="absolute bottom-6 right-6 flex items-center gap-4">
             <div className="bg-[#111317]/90 backdrop-blur-xl border border-[#1e2126] px-4 py-2 rounded-xl flex items-center gap-4 shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">MAP COORDS</span>
                  <div className="flex gap-2 font-mono text-xs text-orange-400">
                    <span>X: <strong className="text-white">{mousePos.x}</strong></span>
                    <span>Y: <strong className="text-white">{mousePos.y}</strong></span>
                  </div>
                </div>
                <div className="h-8 w-px bg-[#1e2126]"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">GRID RATIO</span>
                  <span className="text-xs font-mono text-slate-400">256 x 256</span>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-5 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 mb-6 border-b border-[#1e2126] pb-4">
              <Crosshair size={18} className="text-red-500" />
              <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Configurar Spot</h3>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Pesquisar Mob</label>
                 <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                     type="text" 
                     placeholder="Nome ou ID (ex: Skeleton)..." 
                     className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-9 py-2.5 text-xs text-white focus:border-red-500 outline-none transition-all placeholder:text-slate-800"
                     value={mobSearch}
                     onChange={(e) => setMobSearch(e.target.value)}
                   />
                 </div>
                 
                 <div className="relative">
                   {filteredMonsters.length > 0 && (
                     <div className="bg-[#0a0b0d] border border-[#1e2126] rounded-xl overflow-hidden mt-2 absolute z-40 w-full shadow-2xl">
                        {filteredMonsters.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => {
                              setSelectedMobId(m.id);
                              setMobSearch('');
                            }}
                            className="w-full text-left p-3 hover:bg-[#1e2126] text-xs text-slate-400 hover:text-white flex items-center justify-between transition-colors border-b last:border-0 border-[#1e2126]"
                          >
                            <span>{m.name}</span>
                            <span className="text-[10px] font-mono text-slate-600">ID {m.id}</span>
                          </button>
                        ))}
                     </div>
                   )}
                 </div>

                 {selectedMobId !== null && (
                   <div className="flex flex-col gap-2">
                     <div className="p-4 bg-red-600/5 border border-red-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500 font-black text-xs">
                            {selectedMobId}
                          </div>
                          <span className="text-xs font-bold text-white">
                            {MU_MONSTERS.find(m => m.id === selectedMobId)?.name}
                          </span>
                        </div>
                        <button onClick={() => setSelectedMobId(null)} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest">Limpar</button>
                     </div>
                     <p className="text-[9px] text-slate-500 italic">Dica: Com o mob selecionado, clique no mapa para posicionar.</p>
                   </div>
                 )}
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#0a0b0d] p-3 rounded-xl border border-[#1e2126]">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1 text-center">X</label>
                    <div className="text-lg font-mono font-bold text-orange-500 text-center">{mousePos.x}</div>
                 </div>
                 <div className="bg-[#0a0b0d] p-3 rounded-xl border border-[#1e2126]">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1 text-center">Y</label>
                    <div className="text-lg font-mono font-bold text-orange-500 text-center">{mousePos.y}</div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Distância</label>
                   <input type="number" defaultValue={3} className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-red-500 outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Qtd Mobs</label>
                   <input type="number" defaultValue={5} className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-red-500 outline-none" />
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-5 flex flex-col flex-1 min-h-0 shadow-2xl overflow-hidden">
            <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4 flex justify-between items-center shrink-0">
              <span>Spots em {currentMap?.name}</span>
              <span className="bg-[#0a0b0d] border border-[#1e2126] px-2 py-0.5 rounded text-slate-400 font-mono text-[9px]">{spots.filter(s => s.map === selectedMap).length} ITEMS</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 -mr-1">
               {spots.filter(s => s.map === selectedMap).length > 0 ? (
                 spots.filter(s => s.map === selectedMap).map(spot => (
                    <div key={spot.id} className="group bg-[#0a0b0d] border border-[#1e2126] hover:border-red-500/30 rounded-xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 group-hover:animate-pulse"></div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{spot.mobName}</p>
                          <p className="text-[10px] text-slate-600 font-mono">X:{spot.x} Y:{spot.y} | <span className="text-slate-400">QTY:{spot.count}</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSpot(spot.id); }}
                        className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                   <Crosshair size={32} className="text-slate-600 mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sem spots</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
