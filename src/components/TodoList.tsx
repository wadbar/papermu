import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, PriorityLevel } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Calendar, Tag, AlertTriangle, Search, Filter, WifiHigh, WifiOff, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

// --- CUSTOM HOOK: Persistência com Validação Zod-like e Self-Healing ---
function useTaskStorage(key: string, initialValue: Task[]) {
  const [storedValue, setStoredValue] = useState<Task[]>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Self-Healing
        return parsed.map((t: any) => ({
          id: t.id || Date.now().toString(),
          title: t.title || 'Untitled Task',
          completed: !!t.completed,
          dueDate: t.dueDate,
          priority: t.priority || 'medium',
          tags: t.tags || [],
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString()
        }));
      }
      return initialValue;
    } catch (error) {
      console.warn('[STORAGE] Data recovery failed. Resetting state.', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: Task[] | ((val: Task[]) => Task[]), emitMesh: boolean = true) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    } catch (error) {
      console.error('[STORAGE] Error writing to storage', error);
      toast.error('Erro ao salvar tarefa no banco de dados local.');
      return storedValue;
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

const PriorityColors: Record<PriorityLevel, string> = {
  urgent: 'text-red-500 bg-red-500/10 border-red-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  medium: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  low: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
};

export default function TodoList() {
  const [tasks, setTasks] = useTaskStorage('oms_tasks', []);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'all'>('all');
  const [isMeshConnected, setIsMeshConnected] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const [newTags, setNewTags] = useState<string[]>([]);

  // --- THE CTO: GEMINI PREDICTIVE CAPABILITIES ---
  const predictTaskMetadata = async () => {
    if (!newTask.trim()) {
      toast.error('Informe o título da tarefa para classificação de IA.');
      return;
    }
    
    setIsPredicting(true);
    const toastId = toast.loading('Calculando metadados via Gemini API...');
    
    try {
      const response = await fetch('/api/ai/predict-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask })
      });
      
      if (!response.ok) throw new Error('AI API Error');
      const data = await response.json();
      
      if (data.cleanTitle) setNewTask(data.cleanTitle);
      if (data.dueDate) setNewDueDate(data.dueDate);
      if (data.priority) setNewPriority(data.priority);
      if (data.tags) setNewTags(data.tags);
      
      toast.success('Metadados preditivos injetados!', { id: toastId, icon: '🧠' });
    } catch (err: any) {
      toast.error('Falha na orquestração neural. Usando classificação manual.', { id: toastId });
    } finally {
      setIsPredicting(false);
    }
  };

  // --- MESH NETWORK INITIALIZATION ---
  useEffect(() => {
    // Protocolo The Guardian - Inicializa conexão WS resiliente na porta detectada ou no path atual
    const socket = io({
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsMeshConnected(true);
      toast.success('Real-time Mesh conectada ao Ecossistema.', { icon: '🕸️' });
    });

    socket.on('disconnect', () => {
      setIsMeshConnected(false);
    });

    socket.on('task:sync', (incomingTasks: Task[]) => {
      // THE OPTIMIZER: Reconciliação atômica de base de dados P2P
      // Em um ambiente mais avançado usaríamos CRDTs, aqui fazemos um overwrite 
      // baseado na carga da rede. O Hook não emite o evento de loop para evitar Echo.
      setTasks(incomingTasks, false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const broadcastState = useCallback((nextState: Task[]) => {
    if (socketRef.current?.connected) {
       socketRef.current.emit('task:sync', nextState);
    }
  }, []);

  // --- OTIMIZAÇÃO: Memoização de Filtros e Ordenação ---
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(t => filterPriority === 'all' ? true : t.priority === filterPriority)
      .sort((a, b) => {
        // Ordena por completado, depois por prioridade (urgente primeiro), depois createdAt
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        const pWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        const pA = pWeights[a.priority || 'medium'];
        const pB = pWeights[b.priority || 'medium'];
        if (pA !== pB) return pB - pA;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, searchQuery, filterPriority]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [tasks]);

  const addTask = useCallback(() => {
    if (!newTask.trim()) {
      toast.error('O título da tarefa não pode ser vazio.');
      return;
    }
    
    const task: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: newTask.trim(),
      completed: false,
      dueDate: newDueDate || undefined,
      priority: newPriority,
      tags: newTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextState = setTasks(prev => [task, ...prev]);
    broadcastState(nextState as Task[]);
    
    setNewTask('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewTags([]);
    toast.success('Tarefa adicionada com sucesso.');
  }, [newTask, newDueDate, newPriority, newTags, setTasks, broadcastState]);

  const toggleTask = useCallback((id: string) => {
    const nextState = setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } 
        : task
    ));
    broadcastState(nextState as Task[]);
  }, [setTasks, broadcastState]);

  const deleteTask = useCallback((id: string) => {
    const nextState = setTasks(prev => prev.filter(task => task.id !== id));
    broadcastState(nextState as Task[]);
    toast.success('Tarefa excluída permanentemente.');
  }, [setTasks, broadcastState]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HEADER & METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#0f1115] border border-[#1e2126] p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isMeshConnected ? 'text-green-500' : 'text-slate-500'}`}>
              {isMeshConnected ? 'MESH ONLINE' : 'MESH OFFLINE'}
            </span>
            {isMeshConnected ? (
              <WifiHigh className="text-green-500 animate-pulse" size={16} />
            ) : (
              <WifiOff className="text-slate-500" size={16} />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="text-blue-500" />
            Central de Comando de Tarefas
          </h2>
          <p className="text-slate-400 text-sm">
            Gerenciamento e rastreamento avançado de pendências do ecossistema.
          </p>
        </div>
        <div className="bg-[#0f1115] border border-[#1e2126] p-6 rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-semibold tracking-wider">PROGRESSO GLOBAL</span>
            <span className="text-blue-500 font-bold">{stats.progress}%</span>
          </div>
          <div className="w-full bg-[#1e2126] rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span>{stats.completed} Completadas</span>
            <span>{stats.total - stats.completed} Pendentes</span>
          </div>
        </div>
      </div>

      {/* INTELLIGENT INPUT */}
      <div className="bg-[#0f1115] border border-[#1e2126] p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3">
        <div className="flex-grow flex gap-2 w-full md:w-auto relative">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Descreva a nova diretriz ou tarefa..."
            className="w-full bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={predictTaskMetadata}
            disabled={isPredicting || !newTask.trim()}
            className="absolute right-2 top-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 p-2 rounded-lg transition-all border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Auto-Classificar via IA"
          >
            {isPredicting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          </button>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-blue-500 transition-all custom-calendar-icon"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
          className="bg-[#0a0b0d] border border-[#1e2126] rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-blue-500 transition-all"
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
        <button
          onClick={addTask}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center justify-center min-w-[50px] md:w-auto flex-grow"
        >
          <Plus size={20} />
        </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex gap-4 items-center bg-[#0a0b0d] p-3 rounded-xl border border-[#1e2126]">
        <div className="flex items-center gap-2 flex-grow bg-[#0f1115] rounded-lg px-3 py-2 border border-[#1e2126]">
          <Search size={16} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Filtrar tarefas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="bg-[#0f1115] border border-[#1e2126] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Apenas Urgentes</option>
            <option value="high">Apenas Altas</option>
          </select>
        </div>
      </div>

      {/* TASK ENGINE */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAndSortedTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10 bg-[#0f1115] border border-[#1e2126] rounded-2xl"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                <CheckCircle className="text-slate-600" size={32} />
              </div>
              <h3 className="text-white font-medium mb-1">Nenhuma Tarea Pendente</h3>
              <p className="text-slate-500 text-sm">Seu ecossistema está rodando perfeitamente.</p>
            </motion.div>
          )}

          {filteredAndSortedTasks.map((task) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.2 }}
              key={task.id}
              className={`group flex items-center justify-between p-4 bg-[#0f1115] border ${task.completed ? 'border-green-500/20' : 'border-[#1e2126] hover:border-blue-500/50'} rounded-2xl transition-all`}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {task.completed ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                      <CheckCircle className="text-green-500" size={22} />
                    </motion.div>
                  ) : (
                    <Circle className="text-slate-600 group-hover:text-blue-500 transition-colors" size={22} />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className={`text-base font-medium transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                  
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${PriorityColors[task.priority || 'medium']}`}>
                      {task.priority || 'medium'}
                    </span>
                    
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${
                        !task.completed && new Date(task.dueDate) < new Date() ? 'text-red-400 font-bold' : 'text-slate-500'
                      }`}>
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}

                    {!task.completed && new Date(task.dueDate || '2099-01-01') < new Date() && (
                      <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded text-xs animate-pulse">
                        VENCIDA
                      </span>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 items-center ml-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="text-[10px] flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            <Tag size={10} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500/50 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Excluir Definitivamente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
