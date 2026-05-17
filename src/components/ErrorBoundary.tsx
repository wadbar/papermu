import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[#111317] border border-red-500/20 rounded-2xl shadow-2xl relative overflow-hidden group w-full h-full min-h-[300px]">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <AlertTriangle size={200} className="text-red-500" />
          </div>
          <div className="z-10 text-center">
             <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4">
                <AlertTriangle size={32} />
             </div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Falha Crítica no Componente</h2>
             <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
               O Sistema Operacional Cognitivo isolou uma falha de renderização para proteger a integridade do Dashboard.
             </p>
             <div className="bg-black/50 p-4 rounded-xl border border-red-500/10 mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-red-400/80">
               {this.state.error?.message || 'Erro desconhecido'}
             </div>
             <button
               onClick={this.handleReset}
               className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all font-black uppercase text-xs tracking-widest mx-auto"
             >
               <RefreshCcw size={16} /> Reinicializar Módulo
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
