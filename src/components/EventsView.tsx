import React from 'react';
import { Clock } from 'lucide-react';

function EventTimeline({ title, color, border, bg, times }: { title: string, color: string, border: string, bg: string, times: string[] }) {
  return (
     <div>
        <h3 className={`font-bold ${color} mb-2 flex items-center gap-2 text-sm`}>
          <div className={`w-2 h-2 rounded-full ${bg} shadow-[0_0_8px_currentColor]`}></div> {title}
        </h3>
        <div className="relative pt-4 pb-2">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#1e2126] -translate-y-1/2"></div>
           <div className="flex justify-between relative z-10 px-2">
              {['00h', '04h', '08h', '12h', '16h', '20h', '23h'].map((t, i) => (
                 <div key={i} className="flex flex-col items-center">
                    <div className="w-1 h-3 bg-[#2a2d33] mb-1"></div>
                    <span className="text-[10px] text-slate-500 font-mono">{t}</span>
                 </div>
              ))}
              
              {/* Event Markers Overlay */}
              <div className="absolute inset-0 flex">
                 {times.map((time, i) => {
                    const hours = parseInt(time.split(':')[0]);
                    const percent = (hours / 24) * 100;
                    return (
                       <div key={i} className="absolute top-1/2 flex flex-col items-center -translate-x-1/2 group cursor-pointer" style={{ left: `${percent}%` }}>
                          <div className={`w-3 h-3 ${bg} rounded border-2 border-black rotate-45 transform group-hover:scale-150 transition-transform`}></div>
                          <div className={`absolute -top-7 opacity-0 group-hover:opacity-100 bg-[#0a0b0d] border ${border} text-white text-[10px] px-1.5 py-0.5 rounded font-mono transition-opacity`}>
                            {time}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
     </div>
  );
}

export default function EventsView() {
  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Horários & Eventos <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">EventManagement.dat</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Programe Invasion, Blood Castle, Chaos Castle e outros eventos do GameServer simultaneamente.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-purple-900/20">Salvar Eventos</button>
      </header>
      
      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl overflow-hidden p-6 relative">
         <div className="absolute top-0 right-0 p-4">
           <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-2">
             <Clock size={12}/> Horário do Servidor: <span className="text-white font-mono">14:05:00</span>
           </div>
         </div>

         <div className="space-y-8 mt-6">
            <EventTimeline title="Blood Castle" color="text-red-500" border="border-red-500" bg="bg-red-500" times={['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']} />
            <EventTimeline title="Devil Square" color="text-yellow-500" border="border-yellow-500" bg="bg-yellow-500" times={['02:00', '06:00', '10:00', '14:00', '18:00', '22:00']} />
            <EventTimeline title="Chaos Castle" color="text-blue-500" border="border-blue-500" bg="bg-blue-500" times={['01:00', '05:00', '09:00', '13:00', '17:00', '21:00']} />
            <EventTimeline title="Golden Invasion" color="text-yellow-300" border="border-yellow-300" bg="bg-yellow-300" times={['19:00', '23:00']} />
         </div>
      </div>
    </div>
  );
}
