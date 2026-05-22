import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/utils';
import { Activity, Cpu, HardDrive, Zap, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const data = await safeFetch('/api/performance');
      setStats(data);
      setHistory(prev => {
        const newHist = [...prev, {
          time: new Date().toLocaleTimeString(),
          heapUsed: Math.round(data.memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(data.memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(data.memoryUsage.rss / 1024 / 1024)
        }];
        return newHist.slice(-30);
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerGC = async () => {
    try {
      const res = await safeFetch('/api/performance/gc', { method: 'POST' });
      if (res.success) {
        toast.success(res.message);
        fetchStats();
      } else {
        toast.error(res.error || "Failed to trigger GC");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to trigger GC");
    }
  };

  if (!stats) return <div className="p-8 text-center text-slate-500">Loading performance data...</div>;

  const mem = stats.memoryUsage;
  const heap = stats.heapStats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">RSS Memory</span>
            <HardDrive size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-white">{Math.round(mem.rss / 1024 / 1024)} MB</span>
        </div>
        
        <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Heap Used</span>
            <Activity size={16} className="text-orange-500" />
          </div>
          <span className="text-2xl font-bold text-white">{Math.round(mem.heapUsed / 1024 / 1024)} MB</span>
          <div className="w-full bg-[#0a0b0d] h-1 mt-2 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(mem.heapUsed / heap.heap_size_limit) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Heap Total</span>
            <Cpu size={16} className="text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-white">{Math.round(mem.heapTotal / 1024 / 1024)} MB</span>
        </div>

        <div className="bg-[#111317] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">External</span>
            <Zap size={16} className="text-yellow-500" />
          </div>
          <span className="text-2xl font-bold text-white">{Math.round(mem.external / 1024 / 1024)} MB</span>
        </div>
      </div>

      <div className="bg-[#111317] border border-[#1e2126] rounded-2xl p-6">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest">Memory Footprint</h3>
           <button onClick={triggerGC} className="flex items-center gap-2 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 text-orange-500 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
              <Trash2 size={14} /> Force GC
           </button>
         </div>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e2126" vertical={false} />
                 <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#0a0b0d', borderColor: '#1e2126' }} itemStyle={{ color: '#fff' }} />
                 <Area type="monotone" dataKey="heapUsed" stroke="#f97316" fillOpacity={1} fill="url(#colorHeap)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
