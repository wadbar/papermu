import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function EventBagEditor({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex justify-between items-center bg-[#111317] p-4 rounded-xl border border-[#1e2126]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Event Item Bag Editor</h2>
            <p className="text-xs text-slate-400">Configure Box of Kundun, Blood Castle, Chaos Castle drops.</p>
          </div>
        </div>
        <button className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-1.5 rounded text-sm transition-colors shadow-lg">
          Salvar IGC_Drop.xml / EventBag.txt
        </button>
      </header>

      <div className="grid grid-cols-4 gap-4 flex-1">
         <div className="col-span-1 bg-[#111317] border border-[#1e2126] rounded-2xl flex flex-col p-2 space-y-1 overflow-y-auto">
            <div className="bg-[#1e2126] text-white p-3 rounded text-xs cursor-pointer font-bold border-l-2 border-orange-500">Box of Kundun +1</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Box of Kundun +2</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Box of Kundun +3</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Box of Kundun +4</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Box of Kundun +5</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer mt-4">Chaos Castle 1</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Blood Castle 1 (Reward)</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Medal of Gold</div>
            <div className="text-slate-400 hover:bg-[#1e2126] p-3 rounded text-xs cursor-pointer">Heart of Love</div>
         </div>
         
         <div className="col-span-3 bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h3 className="text-xl font-bold text-white mb-1">Box of Kundun +1.txt</h3>
                  <p className="text-sm text-slate-400 font-mono">Section: Drop Event Rate</p>
               </div>
               <button className="bg-[#1e2126] hover:bg-[#2a2d33] text-white border border-[#2a2d33] px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2">
                 + Adicionar Item ao Drop
               </button>
            </div>

            <div className="bg-[#050506] border border-[#1e2126] rounded-xl overflow-hidden">
               <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#1e2126] text-xs uppercase tracking-widest text-slate-400">
                     <tr>
                        <th className="px-4 py-3">Item Index</th>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Lvl Min</th>
                        <th className="px-4 py-3">Option</th>
                        <th className="px-4 py-3">Luck</th>
                        <th className="px-4 py-3">Skill</th>
                        <th className="px-4 py-3">Exc</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2126] font-mono text-xs">
                     <tr className="hover:bg-[#111317]">
                        <td className="px-4 py-3 text-orange-400">0 0</td>
                        <td className="px-4 py-3 text-white">Kris</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3 text-green-400">0</td>
                        <td className="px-4 py-3 text-right"><button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></td>
                     </tr>
                     <tr className="hover:bg-[#111317]">
                        <td className="px-4 py-3 text-orange-400">0 1</td>
                        <td className="px-4 py-3 text-white">Short Sword</td>
                        <td className="px-4 py-3">2</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3 text-green-400">1</td>
                        <td className="px-4 py-3 text-right"><button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></td>
                     </tr>
                     <tr className="hover:bg-[#111317]">
                        <td className="px-4 py-3 text-orange-400">7 0</td>
                        <td className="px-4 py-3 text-white">Bronze Helm</td>
                        <td className="px-4 py-3">3</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">1</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3 text-green-400">0</td>
                        <td className="px-4 py-3 text-right"><button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></td>
                     </tr>
                     <tr className="hover:bg-[#111317]">
                        <td className="px-4 py-3 text-orange-400">12 11</td>
                        <td className="px-4 py-3 text-purple-400 font-bold">Bless</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3 text-green-400">0</td>
                        <td className="px-4 py-3 text-right"><button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></td>
                     </tr>
                  </tbody>
               </table>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <label className="text-xs text-slate-400">Rate Config: % Chance de Drop Excellent dessa Box</label>
              <input type="number" defaultValue={20} className="w-32 bg-[#0a0b0d] border border-[#1e2126] rounded px-3 py-2 text-sm text-white" />
            </div>
         </div>
      </div>
    </div>
  );
}
