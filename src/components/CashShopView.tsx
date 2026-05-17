import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

export default function CashShopView() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
     safeFetch('/api/files/read?filepath=Data/IGC_CashShop.xml') // Exemplo
        .then(d => {
           if (d.error) setContent("// Arquivo IGC_CashShop.xml ou CashShopOption.txt não encontrado.\n// Adicione seu arquivo de CashShop no diretório correto do servidor.");
           else setContent(d.content || "");
        })
        .catch(e => console.error(e));
  }, []);

  const handleSave = () => {
     setIsSaving(true);
     safeFetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: 'Data/IGC_CashShop.xml', content })
     })
     .then(d => {
        if (d.success) toast.success("Salvo com sucesso!");
        else toast.error("Erro: " + d.error);
     })
     .finally(() => setIsSaving(false));
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="mb-0 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Cash Shop / XShop <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded tracking-widest uppercase">In-Game Store</span>
           </h2>
           <p className="text-slate-400 mt-1 max-w-3xl">Edição direta do arquivo de cashshop (Adicione, edite ou remova itens reais).</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-lg flex items-center gap-2">
           <ShoppingCart size={18} /> {isSaving ? 'Salvando...' : 'Salvar XShop'}
        </button>
      </header>

      <div className="flex-1 bg-[#050506] border border-[#1e2126] rounded-2xl overflow-hidden flex flex-col">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-transparent text-slate-300 font-mono text-xs p-6 focus:outline-none resize-none leading-relaxed"
            spellCheck="false"
          />
      </div>
    </div>
  );
}
