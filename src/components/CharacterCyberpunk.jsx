import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Character-specific cyberpunk styling
const CHARACTER_STYLES = {
  player2: {
    eyeGlow: '#9D00FF',
    accentColor: '#FF00FF',
    particleColor: '#9D00FF',
    personality: 'thoughtful',
  },
  player3: {
    eyeGlow: '#00FF94',
    accentColor: '#4285F4',
    particleColor: '#00FF94',
    personality: 'analytical',
  },
  player4: {
    eyeGlow: '#00F5FF',
    accentColor: '#10A37F',
    particleColor: '#00F5FF',
    personality: 'dynamic',
  },
  moderator: {
    eyeGlow: '#00FFFF',
    accentColor: '#0080FF',
    particleColor: '#00FFFF',
    personality: 'authoritative',
  },
  human: {
    eyeGlow: '#FFFFFF',
    accentColor: '#FFD700',
    particleColor: '#FFD700',
    personality: 'natural',
  },
};

const CharacterCyberpunk = ({
  player,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isSpeaking = false,
  isHolographic = false,
}) => {
  const groupRef = useRef();
  const avatarRef = useRef();
  const spotlightRef = useRef();
  const particleRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  const style = CHARACTER_STYLES[player.id] || CHARACTER_STYLES.human;

  // Set loaded immediately (we're using simple geometry instead of avatars)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Particle system for effects
  const particles = useMemo(() => {
    const particleCount = isSpeaking ? 100 : 30;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    return positions;
  }, [isSpeaking]);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Breathing animation
    if (groupRef.current && !isSpeaking) {
      const breathe = Math.sin(time * 2) * 0.02;
      groupRef.current.position.y = position[1] + breathe;
    }

    // Speaking animation - more pronounced movement
    if (groupRef.current && isSpeaking) {
      const bounce = Math.sin(time * 5) * 0.05;
      groupRef.current.position.y = position[1] + bounce;
    }

    // Rotate avatar slightly
    if (avatarRef.current) {
      const sway = Math.sin(time * 1.5) * 0.05;
      avatarRef.current.rotation.y = rotation[1] + sway;
    }

    // Animate particles
    if (particleRef.current) {
      particleRef.current.rotation.y = time * 0.5;

      // Update particle positions (floating effect)
      const positions = particleRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.01;
        if (positions[i + 1] > 3) positions[i + 1] = 0;
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Update spotlight color
    if (spotlightRef.current) {
      spotlightRef.current.color.set(
        isSpeaking ? '#FF00FF' : style.accentColor
      );
      spotlightRef.current.intensity = isSpeaking ? 4 : 2;
    }

  });

  if (!isLoaded) {
    // Loading placeholder
    return (
      <group position={position}>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={style.accentColor}
            emissive={style.accentColor}
            emissiveIntensity={1}
            wireframe
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      {/* Character spotlight */}
      <spotLight
        ref={spotlightRef}
        position={[0, 5, 0]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={isSpeaking ? 4 : 2}
        color={isSpeaking ? '#FF00FF' : style.accentColor}
        target={groupRef.current}
        castShadow
      />

      {/* Cyberpunk Character Geometry (simplified) */}
      <group ref={avatarRef} rotation={rotation} position={[0, 1.5, 0]}>
        {/* Head */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color={style.accentColor}
            emissive={style.eyeGlow}
            emissiveIntensity={isSpeaking ? 3.0 : 1.5}
            metalness={0.8}
            roughness={0.2}
            transparent={isHolographic}
            opacity={isHolographic ? 0.7 : 1.0}
          />
        </mesh>

        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 0.8, 16]} />
          <meshStandardMaterial
            color="#0A0A0F"
            emissive={style.accentColor}
            emissiveIntensity={isSpeaking ? 0.8 : 0.2}
            metalness={0.6}
            roughness={0.4}
            transparent={isHolographic}
            opacity={isHolographic ? 0.6 : 1.0}
          />
        </mesh>

        {/* Glowing Eyes */}
        <mesh position={[-0.15, 0.55, 0.25]} castShadow={false}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={style.eyeGlow}
            emissive={style.eyeGlow}
            emissiveIntensity={isSpeaking ? 5.0 : 3.0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.15, 0.55, 0.25]} castShadow={false}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={style.eyeGlow}
            emissive={style.eyeGlow}
            emissiveIntensity={isSpeaking ? 5.0 : 3.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Particle effects */}
      <points ref={particleRef} position={[0, 1.5, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isSpeaking ? 0.05 : 0.03}
          color={style.particleColor}
          transparent
          opacity={isSpeaking ? 0.8 : 0.3}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Speaking indicator ring */}
      {isSpeaking && (
        <Float speed={4} rotationIntensity={0} floatIntensity={0.3}>
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.0, 32]} />
            <meshBasicMaterial
              color="#FF00FF"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Float>
      )}

      {/* Character name label */}
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[1.5, 0.3]} />
        <meshBasicMaterial
          color={style.accentColor}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Holographic scanlines for moderator */}
      {isHolographic && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 2.5, 32, 20, true]} />
          <meshBasicMaterial
            color={style.accentColor}
            transparent
            opacity={0.1}
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Special character effects */}
      {player.id === 'player3' && (
        // Chess piece hologram for Domis
        <Float speed={2} rotationIntensity={1}>
          <mesh position={[0.8, 2, 0]}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshBasicMaterial
              color={style.accentColor}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
        </Float>
      )}

      {player.id === 'player4' && (
        // Chat bubble for Sam
        <Float speed={2} rotationIntensity={0.5}>
          <mesh position={[-0.8, 2, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial
              color={style.accentColor}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
        </Float>
      )}

      {isHolographic && (
        // Microphone icon for moderator
        <Float speed={2} rotationIntensity={0.3}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.25, 16]} />
            <meshBasicMaterial
              color={style.accentColor}
              transparent
              opacity={0.6}
            />
          </mesh>
        </Float>
      )}
    </group>
  );
};

export default CharacterCyberpunk;
