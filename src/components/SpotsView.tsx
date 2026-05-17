import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { Map, Boxes, Terminal, RefreshCw } from 'lucide-react';
import SupremeMap3D from './SupremeMap3D';

export default function SpotsView() {
  const [msbContent, setMsbContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  const [markers, setMarkers] = useState([
    { x: -2, z: -2, label: "Spiders (135,120)", color: "#ef4444" },
    { x: 3, z: 2, label: "Bull Fighter (180,200)", color: "#f97316" }
  ]);

  useEffect(() => {
     safeFetch('/api/files/read?filepath=Data/MonsterSetBase.txt')
        .then(d => setMsbContent(d.content || ""))
        .catch(e => console.error(e));
  }, []);

  const handleSave = () => {
     setIsSaving(true);
     safeFetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: 'Data/MonsterSetBase.txt', content: msbContent })
     }).then(() => {
        setIsSaving(false);
        alert('MonsterSetBase salvo com sucesso na máquina!');
     }).catch(() => setIsSaving(false));
  };

  return (
    <div className="space-y-6">
       <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <Map size={28} className="text-green-500" /> Spots & Monstros <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">MonsterSetBase.txt</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Edite os monstros de forma real.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-[#111317] border border-[#1e2126] rounded-xl p-1">
              <button 
                onClick={() => setViewMode('2d')} 
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewMode === '2d' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                RADAR 2D
              </button>
              <button 
                onClick={() => setViewMode('3d')} 
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewMode === '3d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
              >
                PROJEÇÃO 3D
              </button>
           </div>
           <button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Salvar MSB'}
           </button>
        </div>
      </header>

      <div className="flex gap-6 h-[600px]">
         <div className="w-1/3 flex flex-col gap-4">
             <div className="flex-1 bg-[#111317] border border-[#1e2126] rounded-2xl p-4 overflow-y-auto">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-4">Código MonsterSetBase.txt</h3>
                <textarea 
                   className="w-full h-[500px] bg-[#050506] border border-[#1e2126] p-3 text-slate-300 font-mono text-xs focus:outline-none focus:border-green-500 rounded resize-none"
                   value={msbContent}
                   onChange={e => setMsbContent(e.target.value)}
                />
             </div>
         </div>

         <div className="flex-1 bg-[#111317] border border-[#1e2126] rounded-2xl p-1 relative flex items-center justify-center overflow-hidden">
             {viewMode === '3d' ? (
                <SupremeMap3D markers={markers} />
             ) : (
                <>
                  {/* Fake map image representation */}
                  <div className="absolute inset-0 bg-[#050506] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                  
                  {/* Grid */}
                  <div className="absolute inset-0" style={{ backgroundSize: '50px 50px', backgroundImage: 'linear-gradient(to right, #1e2126 1px, transparent 1px), linear-gradient(to bottom, #1e2126 1px, transparent 1px)' }}></div>
                  
                  {/* Safezone Map center */}
                  <div className="w-40 h-40 border-2 border-green-500/30 bg-green-500/10 rounded-full flex items-center justify-center relative z-10">
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Safe Zone Bar</span>
                  </div>

                  {/* Fake markers */}
                  <div className="absolute top-1/4 left-1/4 group cursor-pointer">
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_10px_red]"></div>
                    <span className="absolute -top-6 -left-10 bg-[#0a0b0d] border border-red-500/30 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Spiders (135,120)</span>
                  </div>
                  
                  <div className="absolute bottom-1/4 right-1/3 group cursor-pointer">
                    <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_10px_orange]"></div>
                    <span className="absolute -top-6 -left-10 bg-[#0a0b0d] border border-orange-500/30 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Bull Fighter (180,200)</span>
                  </div>

                  <div className="absolute top-4 right-4 bg-[#0a0b0d] border border-[#1e2126] px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-400">Arraste os pontos para mover no MonsterSetBase</span>
                  </div>
                </>
             )}
         </div>
      </div>
    </div>
  );
}
