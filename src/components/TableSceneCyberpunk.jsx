import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import CharacterCyberpunk from './CharacterCyberpunk';

// Cyberpunk color palette
const COLORS = {
  neonCyan: '#00F5FF',
  deepMagenta: '#FF00FF',
  electricBlue: '#0080FF',
  toxicGreen: '#39FF14',
  voidBlack: '#0A0A0F',
  darkSlate: '#1A1A2E',
  charcoal: '#16213E',
};

// Hexagonal seat positions around table
const SEAT_POSITIONS = [
  { id: 'human', angle: 0, position: [0, 0, 3.5], rotation: [0, Math.PI, 0] },
  { id: 'player2', angle: 60, position: [-3.0, 0, 1.75], rotation: [0, -Math.PI * 2/3, 0] },
  { id: 'player3', angle: 120, position: [-3.0, 0, -1.75], rotation: [0, -Math.PI / 3, 0] },
  { id: 'moderator', angle: 180, position: [0, 0, -3.5], rotation: [0, 0, 0] },
  { id: 'player4', angle: 240, position: [3.0, 0, -1.75], rotation: [0, Math.PI / 3, 0] },
  { id: 'empty', angle: 300, position: [3.0, 0, 1.75], rotation: [0, Math.PI * 2/3, 0] },
];

const TableSceneCyberpunk = ({ players, currentSpeaker }) => {
  const tableRef = useRef();
  const hologramRef = useRef();
  const gridRef = useRef();
  const dataStreamRefs = useRef([]);

  // Animate elements
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Rotate center hologram slowly
    if (hologramRef.current) {
      hologramRef.current.rotation.y = time * 0.3;
    }

    // Animate grid (skip - basic material doesn't have uniforms)

    // Animate data streams
    dataStreamRefs.current.forEach((stream, i) => {
      if (stream) {
        stream.position.y = ((time * 2 + i * 2) % 20) - 10;
      }
    });

    // Pulse table edge lighting
    if (tableRef.current) {
      const pulseIntensity = 2.0 + Math.sin(time * 2) * 0.5;
      tableRef.current.children.forEach(child => {
        if (child.material?.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = pulseIntensity;
        }
      });
    }
  });

  // Generate data stream positions
  const dataStreamPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 20; i++) {
      positions.push([
        (Math.random() - 0.5) * 40,
        Math.random() * 20 - 10,
        (Math.random() - 0.5) * 40
      ]);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Ambient and atmospheric lighting */}
      <ambientLight intensity={0.1} color={COLORS.electricBlue} />
      <fog attach="fog" args={[COLORS.voidBlack, 15, 35]} />

      {/* Key spotlight from above */}
      <spotLight
        position={[0, 15, 0]}
        angle={Math.PI / 3}
        penumbra={0.5}
        intensity={3}
        color={COLORS.neonCyan}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Rim lights from sides */}
      <spotLight
        position={[-10, 5, -10]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={2}
        color={COLORS.deepMagenta}
      />
      <spotLight
        position={[10, 5, -10]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={2}
        color={COLORS.deepMagenta}
      />

      {/* Reflective floor with grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={COLORS.voidBlack}
          metalness={0.8}
          mirror={0.9}
        />
      </mesh>

      {/* Grid overlay on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[50, 50, 50, 50]} />
        <meshBasicMaterial
          color={COLORS.neonCyan}
          wireframe
          transparent
          opacity={0.15}
          ref={gridRef}
        />
      </mesh>

      {/* Hexagonal Table */}
      <group ref={tableRef} position={[0, 0.75, 0]}>
        {/* Table surface - glass with neon edge */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.0, 4.0, 0.1, 6]} />
          <meshPhysicalMaterial
            color={COLORS.voidBlack}
            metalness={0.9}
            roughness={0.1}
            transmission={0.5}
            thickness={0.5}
            envMapIntensity={1.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Neon edge lighting */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[4.0, 0.05, 16, 6]} />
          <meshStandardMaterial
            color={COLORS.neonCyan}
            emissive={COLORS.neonCyan}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>

        {/* Center holographic display */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
          <group ref={hologramRef} position={[0, 1.5, 0]}>
            {/* Hologram geometry - rotating wireframe */}
            <mesh>
              <octahedronGeometry args={[0.5, 0]} />
              <meshBasicMaterial
                color={COLORS.electricBlue}
                wireframe
                transparent
                opacity={0.6}
              />
            </mesh>

            {/* Inner rotating core */}
            <mesh>
              <icosahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                color={COLORS.neonCyan}
                emissive={COLORS.neonCyan}
                emissiveIntensity={3}
                wireframe
                toneMapped={false}
              />
            </mesh>

            {/* Hologram particles */}
            <points>
              <sphereGeometry args={[0.8, 32, 32]} />
              <pointsMaterial
                size={0.02}
                color={COLORS.neonCyan}
                transparent
                opacity={0.6}
                sizeAttenuation
              />
            </points>
          </group>
        </Float>

        {/* Table legs (minimal, geometric) */}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 3.0;
          const z = Math.sin(rad) * 3.0;
          return (
            <mesh key={i} position={[x, -0.7, z]} castShadow>
              <boxGeometry args={[0.15, 1.2, 0.15]} />
              <meshStandardMaterial
                color={COLORS.charcoal}
                metalness={0.9}
                roughness={0.2}
                emissive={COLORS.neonCyan}
                emissiveIntensity={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* Characters at seat positions */}
      {players && players.map((player) => {
        const seatConfig = SEAT_POSITIONS.find(s => s.id === player.id);
        if (!seatConfig) return null;

        return (
          <CharacterCyberpunk
            key={player.id}
            player={player}
            position={seatConfig.position}
            rotation={seatConfig.rotation}
            isSpeaking={currentSpeaker === player.id}
            isHolographic={player.id === 'moderator'}
          />
        );
      })}

      {/* Data streams (Matrix-style digital rain) */}
      {dataStreamPositions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          ref={el => dataStreamRefs.current[i] = el}
        >
          <boxGeometry args={[0.1, 2, 0.1]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? COLORS.toxicGreen : COLORS.neonCyan}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}

      {/* Floating geometric shapes in background */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 15 + i * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(i) * 5;

        return (
          <Float key={i} speed={1 + i * 0.1} rotationIntensity={1}>
            <mesh position={[x, y, z]}>
              {i % 2 === 0 ? (
                <tetrahedronGeometry args={[1, 0]} />
              ) : (
                <octahedronGeometry args={[0.8, 0]} />
              )}
              <meshBasicMaterial
                color={COLORS.neonCyan}
                wireframe
                transparent
                opacity={0.2}
              />
            </mesh>
          </Float>
        );
      })}

      {/* Volumetric light shafts */}
      <mesh position={[0, 10, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[8, 1, 20, 32, 1, true]} />
        <meshBasicMaterial
          color={COLORS.neonCyan}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default TableSceneCyberpunk;
