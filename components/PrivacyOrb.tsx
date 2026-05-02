'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ───────── Swirling Particles Inside the Orb ───────── */
function SwirlingParticles({ count = 200, radius = 1.6 }: { count?: number; radius?: number }) {
  const meshRef = useRef<THREE.Points>(null!);

  const { positions, speeds, offsets } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Random spherical coordinates inside the orb
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * radius * 0.85;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      spd[i] = 0.2 + Math.random() * 0.8;
      off[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, speeds: spd, offsets: off };
  }, [count, radius]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const x0 = positions[i * 3];
      const y0 = positions[i * 3 + 1];
      const z0 = positions[i * 3 + 2];
      const speed = speeds[i];
      const offset = offsets[i];

      // Swirl around Y-axis + gentle oscillation
      const angle = t * speed * 0.5 + offset;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      posAttr.setXYZ(
        i,
        x0 * cosA - z0 * sinA,
        y0 + Math.sin(t * speed + offset) * 0.15,
        x0 * sinA + z0 * cosA
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.slice(), 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#c084fc"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ───────── Orbiting Ring Particles ───────── */
function OrbitalRing({ radius = 2.1, count = 80, color = '#7c3aed', speed = 0.3, tilt = 0 }: {
  radius?: number; count?: number; color?: string; speed?: number; tilt?: number;
}) {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count, radius]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * speed;
      ref.current.rotation.x = tilt;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={color}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ───────── The Glass Sphere ───────── */
function GlassSphere({ hovered }: { hovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    // Subtle pulsing opacity
    const pulse = 0.12 + Math.sin(clock.getElapsedTime() * 1.5) * 0.03;
    mat.opacity = hovered ? pulse + 0.06 : pulse;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 64, 64]} />
      <meshPhysicalMaterial
        color="#8b5cf6"
        transparent
        opacity={0.12}
        roughness={0.1}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ───────── Inner Glow Core ───────── */
function InnerGlow() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const scale = 0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.08;
    ref.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshBasicMaterial
        color="#a78bfa"
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

/* ───────── Wireframe Outer Shell ───────── */
function WireframeSphere() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.08;
      ref.current.rotation.x = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.0, 1]} />
      <meshBasicMaterial
        color="#7c3aed"
        wireframe
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}

/* ───────── Scene Composition ───────── */
function OrbScene() {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle idle bob
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.1;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[-5, -3, -5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#c084fc" />

      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <GlassSphere hovered={hovered} />
        <InnerGlow />
        <WireframeSphere />
        <SwirlingParticles count={250} />
        <OrbitalRing radius={2.2} count={100} color="#8b5cf6" speed={0.25} tilt={0.3} />
        <OrbitalRing radius={2.4} count={60} color="#6366f1" speed={-0.15} tilt={-0.5} />
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
      />
    </>
  );
}

/* ───────── Exported Component ───────── */
export default function PrivacyOrb() {
  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* Ambient glow behind the orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-purple-500/15 blur-3xl" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
      </div>

      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ cursor: 'grab' }}
        gl={{ antialias: true, alpha: true }}
      >
        <OrbScene />
      </Canvas>

      {/* Label */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-[10px] font-medium text-purple-400/50 uppercase tracking-[0.2em]">
          drag to rotate
        </span>
      </div>
    </div>
  );
}
