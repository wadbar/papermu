import React, { useState } from 'react';
import { 
  ArrowLeft, Box, Copy, Check, Terminal, Search, 
  Layers, Package, Shield, Sword, User, Zap, Activity 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ItemEditor({ onBack }: { onBack: () => void }) {
  const [item, setItem] = useState({
    type: 0,
    index: 0,
    name: 'Kris',
    slot: 0,
    skill: 0,
    x: 1,
    y: 2,
    serial: 1,
    option: 1,
    drop: 1,
    level: 6,
    dmgMin: 6,
    dmgMax: 11,
    speed: 50,
    dur: 20,
    magicDur: 0,
    reqLevel: 0,
    reqStr: 40,
    reqAgi: 40,
    reqEne: 0,
    reqVit: 0,
    reqCmd: 0,
    classes: [1, 1, 1, 1, 1, 0, 0] // DW, DK, FE, MG, DL, SU, RF
  });

  const [isCopied, setIsCopied] = useState(false);

  const generateItemTxtLine = () => {
    const cw = item.classes.join(' ');
    return `${item.index}\t${item.slot}\t${item.skill}\t${item.x}\t${item.y}\t${item.serial}\t${item.option}\t${item.drop}\t"${item.name}"\t${item.level}\t${item.dmgMin}\t${item.dmgMax}\t${item.speed}\t${item.dur}\t${item.magicDur}\t${item.reqLevel}\t${item.reqStr}\t${item.reqAgi}\t${item.reqEne}\t${item.reqVit}\t${item.reqCmd}\t0\t${cw}`;
  };

  const handleCopy = () => {
    const line = `${item.type}\n${generateItemTxtLine()}\nend`;
    navigator.clipboard.writeText(line);
    setIsCopied(true);
    toast.success('Linha Item.txt copiada!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleClassToggle = (index: number) => {
    const newClasses = [...item.classes];
    newClasses[index] = newClasses[index] === 1 ? 0 : 1;
    setItem(prev => ({ ...prev, classes: newClasses }));
  };

  const classNames = ["DW/SM", "DK/BK", "Elf/ME", "MG", "DL", "SUM", "RF"];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex justify-between items-center bg-[#111317] p-4 rounded-xl border border-[#1e2126] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors bg-[#1e2126] p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Box size={24} className="text-blue-400" /> Item Editor (Visual)</h2>
            <p className="text-xs text-slate-400">Edite propriedades de items e exporte para o Item.txt.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleCopy} className="bg-[#1e2126] hover:bg-[#2a2d35] text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-[#2a2d35] flex items-center gap-2">
             {isCopied ? <Check size={16} className="text-green-500" /> : <Layers size={16} />} Copiar Item.txt
           </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Item List Proxy */}
        <div className="lg:col-span-1 bg-[#0a0b0d] border border-[#1e2126] rounded-2xl flex flex-col p-5 overflow-hidden">
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Navegador de Itens</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text" 
                placeholder="Buscar item..." 
                className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-9 py-2.5 text-xs text-white focus:border-blue-500 outline-none" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
             <div className="bg-blue-600/10 text-blue-500 p-3 rounded-xl text-[11px] cursor-pointer font-bold border border-blue-500/20 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
               0 0 - Kris
             </div>
             {[
               { id: "0 1", name: "Short Sword" },
               { id: "0 2", name: "Rapier" },
               { id: "0 3", name: "Katana" },
             ].map((it, i) => (
               <div key={i} className="text-slate-400 hover:bg-[#111317] hover:text-white p-3 rounded-xl text-[11px] cursor-pointer transition-all flex items-center gap-3 group border border-transparent hover:border-[#1e2126]">
                  <span className="text-slate-600 font-mono">{it.id}</span>
                  <span className="font-medium">{it.name}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3 bg-[#0a0b0d] border border-[#1e2126] rounded-2xl p-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-8 mb-12">
             <div className="w-32 h-32 bg-[#111317] border border-[#1e2126] rounded-2xl flex flex-col justify-center items-center shrink-0 shadow-2xl relative group cursor-pointer transition-transform hover:scale-105 active:scale-95">
                 <Box size={48} className="text-blue-500 opacity-20 group-hover:opacity-40 mb-3 transition-opacity" />
                 <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Icon Preview</span>
             </div>
             <div className="flex-1 space-y-6">
                <div className="relative group">
                  <input 
                    type="text" 
                    name="name" 
                    value={item.name} 
                    onChange={handleChange} 
                    className="bg-transparent border-b-2 border-[#1e2126] focus:border-blue-500 outline-none text-4xl font-black text-white w-full py-2 transition-all placeholder:text-slate-800" 
                    placeholder="Nome do Item..."
                  />
                  <div className="absolute right-0 bottom-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Identificador Visual</div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-[#111317] p-4 rounded-2xl border border-[#1e2126]">
                     <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] block mb-2">Group / Type</label>
                     <input type="number" name="type" value={item.type} onChange={handleChange} className="w-full bg-[#0a0b0d] border border-[#1e2126] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center" />
                   </div>
                   <div className="bg-[#111317] p-4 rounded-2xl border border-[#1e2126]">
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] block mb-2">Item Index</label>
                      <input type="number" name="index" value={item.index} onChange={handleChange} className="w-full bg-[#0a0b0d] border border-[#1e2126] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center" />
                   </div>
                   <div className="bg-[#111317] p-4 rounded-2xl border border-[#1e2126]">
                       <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] block mb-2">Slot</label>
                       <input type="number" name="slot" value={item.slot} onChange={handleChange} className="w-full bg-[#0a0b0d] border border-[#1e2126] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center" />
                   </div>
                   <div className="bg-[#111317] p-4 rounded-2xl border border-[#1e2126]">
                       <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] block mb-2">Skill</label>
                       <input type="number" name="skill" value={item.skill} onChange={handleChange} className="w-full bg-[#0a0b0d] border border-[#1e2126] focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center" />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Properties Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                 <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><Package size={18} /></div>
                 <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Propriedades</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4 bg-[#111317]/50 p-6 rounded-2xl border border-[#1e2126]">
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Dimensão X</label>
                    <input type="number" name="x" value={item.x} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Dimensão Y</label>
                    <input type="number" name="y" value={item.y} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Durabilidade</label>
                    <input type="number" name="dur" value={item.dur} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Nível</label>
                    <input type="number" name="level" value={item.level} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
               </div>
               
               <div className="space-y-3">
                 {[
                   { label: "Possui Serial", field: "serial" },
                   { label: "Pode ter Option", field: "option" },
                   { label: "Drop nativo", field: "drop" },
                 ].map((opt) => (
                   <label key={opt.field} className="flex items-center justify-between p-3 bg-[#111317] rounded-xl border border-[#1e2126] cursor-pointer">
                      <span className="text-[11px] font-bold text-slate-400">{opt.label}</span>
                      <input 
                        type="checkbox" 
                        checked={(item as any)[opt.field] === 1} 
                        onChange={(e) => setItem({...item, [opt.field]: e.target.checked ? 1 : 0})} 
                        className="w-4 h-4 rounded bg-[#0a0b0d] border-[#1e2126] text-blue-500" 
                      />
                   </label>
                 ))}
               </div>
            </div>

            {/* Combat Stats Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                 <div className="p-2 bg-red-600/10 rounded-lg text-red-500"><Sword size={18} /></div>
                 <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Poder</h3>
               </div>
               
               <div className="space-y-4 bg-[#111317]/50 p-6 rounded-2xl border border-[#1e2126]">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">Dano Min</label>
                      <input type="number" name="dmgMin" value={item.dmgMin} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">Dano Max</label>
                      <input type="number" name="dmgMax" value={item.dmgMax} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                   </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Velocidade</label>
                    <input type="number" name="speed" value={item.speed} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">Magic Dur</label>
                    <input type="number" name="magicDur" value={item.magicDur} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                 </div>
               </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                 <div className="p-2 bg-yellow-600/10 rounded-lg text-yellow-500"><User size={18} /></div>
                 <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Requisitos</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4 bg-[#111317]/50 p-6 rounded-2xl border border-[#1e2126]">
                 {[
                   { label: "Level", name: "reqLevel" },
                   { label: "Força", name: "reqStr" },
                   { label: "Agi", name: "reqAgi" },
                   { label: "Ene", name: "reqEne" },
                 ].map((req) => (
                   <div key={req.name} className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">{req.label}</label>
                      <input type="number" name={req.name} value={(item as any)[req.name]} onChange={handleChange} className="w-full bg-[#111317] border border-[#1e2126] rounded-xl px-4 py-2 text-sm text-white" />
                   </div>
                 ))}
               </div>

               <div className="bg-[#111317] p-5 rounded-2xl border border-[#1e2126]">
                  <div className="flex flex-wrap gap-2">
                    {classNames.map((name, idx) => (
                      <button 
                        key={name}
                        onClick={() => handleClassToggle(idx)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${item.classes[idx] === 1 ? 'bg-blue-600 text-white' : 'bg-[#0a0b0d] text-slate-600'}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
             <h3 className="text-xs uppercase tracking-widest text-slate-500 font-black flex items-center gap-2">
               <Terminal size={14} className="text-blue-500" /> Export Preview
             </h3>
             <div className="relative p-6 bg-[#0a0b0d] border border-[#1e2126] rounded-xl text-xs font-mono overflow-x-auto shadow-2xl">
                <div className="text-slate-600 mb-2">{item.type}</div>
                <div className="text-white">{generateItemTxtLine()}</div>
                <div className="text-red-500 mt-2">end</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
