import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

function Marker({ position, color, label, onClick }: { position: [number, number, number], color: string, label: string, onClick?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={hovered ? '#fff' : color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </Float>
      {hovered && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

export default function SupremeMap3D({ markers = [] }: { markers?: any[] }) {
  return (
    <div className="w-full h-full bg-[#0a0b0d] rounded-2xl overflow-hidden border border-blue-500/10 shadow-2xl">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={['#050506']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={20} 
          fadeStrength={5} 
          sectionSize={1} 
          sectionColor="#3b82f633" 
          cellColor="#1e293b" 
        />

        {markers.map((m, i) => (
          <Marker 
            key={i} 
            position={[m.x, 0.1, m.z]} 
            color={m.color || '#ef4444'} 
            label={m.label} 
          />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl">
           <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Cortex Engine 3D</h4>
           <p className="text-[9px] text-slate-400">Renderizando coordenadas em tempo real</p>
        </div>
      </div>
    </div>
  );
}
