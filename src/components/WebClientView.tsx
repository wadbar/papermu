import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box as ThreeBox, Text, Environment, ContactShadows, Float } from '@react-three/drei';
import { Gamepad2, Loader2 } from 'lucide-react';

function MiniWebGLGame() {
  const meshRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls autoRotate autoRotateSpeed={2} />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <ThreeBox ref={meshRef} args={[2, 2, 2]}>
          <meshStandardMaterial color="#f97316" wireframe />
        </ThreeBox>
        <Text
           position={[0, -2, 0]}
           fontSize={0.4}
           color="white"
           anchorX="center"
           anchorY="middle"
        >
          MuEngine.wasm (Simulated)
        </Text>
      </Float>
      
      <ContactShadows opacity={0.5} scale={10} blur={2} position={[0, -3, 0]} far={10} />
      <Environment preset="city" />
    </>
  );
}

export default function WebClientView() {
  const [hasClient, setHasClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasClient) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [hasClient]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
      <header className="mb-2 shrink-0">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Seu Mu Online Web <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded tracking-widest uppercase">Self-Hosted WebGL</span>
        </h2>
        <p className="text-slate-400 mt-1 max-w-3xl">Faça o upload do seu client compilado em WebGL/WASM para jogar o seu próprio servidor direto no navegador.</p>
      </header>

      {!hasClient ? (
        <div className="flex-1 rounded-2xl border-2 border-dashed border-[#1e2126] bg-[#111317] flex flex-col items-center justify-center p-8 text-center">
            <Gamepad2 size={64} className="text-[#1e2126] mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum Client Web Instalado</h3>
            <p className="text-slate-400 max-w-lg mb-8">
              Para jogar <b>O SEU</b> próprio Mu Online no navegador de forma independente, você precisa da source do Client (Main.exe) compilada para WebGL.
            </p>
            <div className="flex gap-4">
               <button onClick={() => setHasClient(true)} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                 SIMULAR DEPLOY DO CLIENTE
               </button>
            </div>
            <div className="mt-8 text-xs text-slate-500 max-w-3xl bg-[#050506] p-5 rounded-lg border border-[#1e2126] text-left leading-relaxed">
              <span className="font-bold text-orange-500 mb-3 block text-sm border-b border-[#1e2126] pb-2">O QUE SERIA NECESSÁRIO NA VIDA REAL?</span>
               <p>O Mu Online clássico usa DirectX/OpenGL antigos que não rodam no Chrome/Edge. Para termos ele real aqui no seu painel:</p>
               <ol className="list-decimal pl-5 mt-3 space-y-2 text-slate-400">
                 <li>Sua empresa precisaria descompilar a source do <span className="text-white">Main.exe</span> (C++).</li>
                 <li>Usar a ferramenta <span className="text-green-400 font-mono">Emscripten</span> para converter o C++ em <span className="text-blue-400 font-mono">WebAssembly (.wasm)</span>.</li>
                 <li>Converter todas as texturas (.bmd, .ozt, .ozj) para formatos web (.gltf, .png, .webp).</li>
                 <li>Fazer o upload da pasta <span className="text-orange-400 font-mono">/dist</span> para o nosso Painel Controlar e hospedar no seu servidor! (O Havek é um ótimo exemplo open-source disso).</li>
               </ol>
            </div>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl overflow-hidden border border-[#1e2126] bg-black relative flex flex-col items-center justify-center cursor-pointer">
             <div className="absolute top-4 right-4 z-20">
               <button onClick={() => setHasClient(false)} className="bg-[#1e2126] hover:bg-red-500/20 text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                  ENCERRAR CLIENTE
               </button>
             </div>
             
             {isLoading ? (
               <div className="z-10 flex flex-col items-center justify-center animate-pulse">
                  <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                  <h3 className="text-white font-bold text-xl mb-1">Compilando e Carregando Engine...</h3>
                  <div className="w-64 h-2 bg-[#1e2126] rounded-full mt-4 overflow-hidden">
                     <div className="h-full bg-orange-500 w-[85%] rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-slate-500 text-xs mt-3 font-mono">Mounting WebAssembly modules...</p>
               </div>
             ) : (
               <div className="absolute inset-0 w-full h-full">
                  <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                     <MiniWebGLGame />
                  </Canvas>
                  <div className="absolute top-4 left-4 text-xs font-mono text-green-400 p-2 bg-black/50 rounded backdrop-blur border border-green-500/20">
                    WebGL Render Active<br/>
                    FPS: 60<br/>
                    Draw Calls: 7<br/>
                    Triangles: 124
                  </div>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                     <p className="text-slate-400 text-sm bg-black/80 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-800">
                       Arraste para mover a câmera 3D. <br/>Aqui entraria o jogo real!
                     </p>
                  </div>
               </div>
             )}
        </div>
      )}
    </div>
  );
}
