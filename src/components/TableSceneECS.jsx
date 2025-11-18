import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Sphere, Cylinder, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery, useTrait } from 'koota/react';
import gameWorld from '../ecs/world';
import { Player, Position, Rotation, Speaking, Nameplate } from '../ecs/components';
import { PlayerSystem, SpeakingSystem } from '../ecs/systems';

// Chair component using Koota hooks
const ChairForEntity = ({ entity }) => {
  const player = useTrait(entity, Player);
  const position = useTrait(entity, Position);

  // Skip human and moderator (moderator has hardcoded display)
  if (!player || !position || player.type === 'human' || player.type === 'moderator') {
    return null;
  }

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Clean chair design */}
      <group position={[0, 0, 0.3]}>
        {/* Seat */}
        <RoundedBox args={[0.9, 0.08, 0.8]} radius={0.04} position={[0, 0.5, 0]}>
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.3}
            metalness={0.1}
          />
        </RoundedBox>

        {/* Backrest */}
        <RoundedBox args={[0.9, 1.2, 0.08]} radius={0.04} position={[0, 1.0, -0.36]}>
          <meshStandardMaterial
            color="#fafafa"
            roughness={0.3}
            metalness={0.1}
          />
        </RoundedBox>

        {/* Chrome legs */}
        <Cylinder args={[0.04, 0.04, 0.5, 16]} position={[0, 0.25, 0]}>
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.95}
            roughness={0.05}
          />
        </Cylinder>
      </group>
    </group>
  );
};

// Wrapper to filter entities for avatar rendering
const AvatarWrapper = ({ entity }) => {
  const player = useTrait(entity, Player);

  // Skip human and moderator (moderator has hardcoded display)
  if (!player || player.type === 'human' || player.type === 'moderator') {
    return null;
  }

  return <PlayerAvatar entity={entity} />;
};

// Avatar Component using ECS data
const PlayerAvatar = ({ entity }) => {
  const floatGroupRef = useRef();
  const floatOffsetRef = useRef(0);

  // Safety check - ensure entity exists
  if (!entity) {
    return null;
  }

  // Get trait data using Koota React hooks
  const player = useTrait(entity, Player);
  const position = useTrait(entity, Position);
  const rotation = useTrait(entity, Rotation);
  const speaking = useTrait(entity, Speaking);
  const nameplate = useTrait(entity, Nameplate);

  if (!player || !position) {
    return null;
  }

  const isSpeaking = speaking?.isSpeaking || false;

  useFrame((state) => {
    if (floatGroupRef.current) {
      if (isSpeaking) {
        // Subtle float animation for speaker
        floatOffsetRef.current = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        floatGroupRef.current.position.y = floatOffsetRef.current;
      } else {
        // Smoothly return to base position
        floatOffsetRef.current *= 0.95;
        floatGroupRef.current.position.y = floatOffsetRef.current;
      }
    }
  });

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation?.x || 0, rotation?.y || 0, rotation?.z || 0]}
    >
      {/* Nested group for float animation */}
      <group ref={floatGroupRef}>
      {/* Minimalist avatar - clean geometric design */}
      <group position={[0, 0.2, 0]}>
        {/* Head - glowing sphere */}
        <Sphere args={[0.35, 32, 32]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial
            color={isSpeaking ? '#e0f7ff' : '#f5f5f5'}
            emissive={isSpeaking ? '#4a9eff' : '#cccccc'}
            emissiveIntensity={isSpeaking ? 0.6 : 0.1}
            roughness={0.3}
            metalness={0.1}
          />
        </Sphere>

        {/* Body - clean capsule shape */}
        <Cylinder args={[0.25, 0.35, 1.0, 32]} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial
            color="#fafafa"
            roughness={0.4}
            metalness={0.05}
          />
        </Cylinder>

        {/* Shoulders */}
        <Sphere args={[0.18, 16, 16]} position={[0.35, 0.55, 0]} castShadow>
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[-0.35, 0.55, 0]} castShadow>
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </Sphere>

        {/* Eyes - minimal design */}
        <Sphere args={[0.05, 16, 16]} position={[0.12, 1.0, 0.32]} castShadow>
          <meshStandardMaterial
            color={isSpeaking ? '#4a9eff' : '#333333'}
            emissive={isSpeaking ? '#4a9eff' : '#000000'}
            emissiveIntensity={isSpeaking ? 0.5 : 0}
          />
        </Sphere>
        <Sphere args={[0.05, 16, 16]} position={[-0.12, 1.0, 0.32]} castShadow>
          <meshStandardMaterial
            color={isSpeaking ? '#4a9eff' : '#333333'}
            emissive={isSpeaking ? '#4a9eff' : '#000000'}
            emissiveIntensity={isSpeaking ? 0.5 : 0}
          />
        </Sphere>

        {/* Speaking indicator ring */}
        {isSpeaking && (
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.5, 32]} />
            <meshStandardMaterial
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Floating nameplate */}
      {nameplate?.text && (
        <group position={[0, 2.5, 0]}>
          <RoundedBox args={[(nameplate.text?.length || 5) * 0.12 + 0.3, 0.25, 0.04]} radius={0.02}>
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.15}
              roughness={0.1}
              metalness={0.8}
            />
          </RoundedBox>
          <Text
            position={[0, 0, 0.03]}
            fontSize={nameplate.fontSize || 0.25}
            color="#4a9eff"
            anchorX="center"
            anchorY="middle"
          >
            {nameplate.text}
          </Text>
        </group>
      )}
      </group> {/* Close float group */}
    </group>
  );
};

// Minimalist Sci-Fi Table Scene
const TableSceneECS = () => {
  const speakerLightRef = useRef();
  const playerSystemRef = useRef();
  const speakingSystemRef = useRef();
  const entitiesInitializedRef = useRef(false);

  // Detect mobile for performance optimizations
  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  // Initialize systems
  useEffect(() => {
    playerSystemRef.current = PlayerSystem(gameWorld);
    speakingSystemRef.current = SpeakingSystem(gameWorld);

    return () => {
      // Cleanup systems
      playerSystemRef.current = null;
      speakingSystemRef.current = null;
    };
  }, []);

  // Use Koota's reactive query hook to get all player entities
  const playerEntities = useQuery(Player, Position, Speaking);

  // Initialize player positions when entities first appear
  useEffect(() => {
    if (playerEntities.length > 0 && !entitiesInitializedRef.current && playerSystemRef.current) {
      console.log('🎯 Initializing player positions for', playerEntities.length, 'entities');
      playerSystemRef.current.init();
      entitiesInitializedRef.current = true;
    }
  }, [playerEntities.length]);

  // Update systems every frame
  useFrame((state, delta) => {
    if (speakingSystemRef.current) {
      speakingSystemRef.current.update(delta);
    }
    if (playerSystemRef.current) {
      playerSystemRef.current.update(delta);
    }

    // Animate speaker light
    if (speakerLightRef.current) {
      speakerLightRef.current.intensity = 3.0 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group>
      {/* Minimalist Sci-Fi Lighting */}
      <ambientLight intensity={0.4} color="#e8f4ff" />

      {/* Main soft lighting from above */}
      <directionalLight
        position={[0, 20, 5]}
        intensity={1.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Clean accent lighting */}
      <pointLight position={[-8, 10, -3]} intensity={1.2} color="#b8e0ff" distance={20} decay={2} />
      <pointLight position={[8, 10, -3]} intensity={1.2} color="#b8e0ff" distance={20} decay={2} />

      {/* Table spotlight */}
      <spotLight
        position={[0, 12, -3.5]}
        target-position={[0, 0.75, -3.5]}
        angle={0.6}
        penumbra={0.4}
        intensity={2.0}
        color="#ffffff"
        distance={15}
        castShadow
      />

      {/* Environment - Clean minimalist room */}
      <group>
        {/* Room cube - white minimalist */}
        <mesh>
          <boxGeometry args={[40, 20, 40]} />
          <meshStandardMaterial
            color="#fafafa"
            side={THREE.BackSide}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>

        {/* Subtle wall panels */}
        <RoundedBox args={[35, 15, 0.1]} position={[0, 7.5, -19.95]} radius={0.05}>
          <meshStandardMaterial
            color="#f0f4f8"
            roughness={0.8}
            metalness={0.1}
          />
        </RoundedBox>

        {/* Clean accent line */}
        <Cylinder args={[0.02, 0.02, 35, 16]} position={[0, 10, -19.9]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial
            color="#4a9eff"
            emissive="#4a9eff"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
          />
        </Cylinder>
      </group>

      {/* Premium minimalist floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#f8f8f8"
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Subtle floor pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[40, 40, 20, 20]} />
        <meshStandardMaterial
          color="#e8e8e8"
          transparent
          opacity={0.1}
          roughness={0.8}
          wireframe
        />
      </mesh>

      {/* Modern Round Table */}
      <group position={[0, 0.75, -3.5]}>
        {/* Main table surface - glass-like with transmission */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.5, 4.5, 0.15, 64]} />
          {isMobile ? (
            // Mobile fallback - simple transparent material
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              roughness={0.05}
              metalness={0.9}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          ) : (
            // Desktop - full transmission material
            <MeshTransmissionMaterial
              transmission={0.9}
              thickness={0.5}
              roughness={0.05}
              color="#ffffff"
              chromaticAberration={0.02}
              anisotropy={1}
            />
          )}
        </mesh>

        {/* Table edge ring - subtle chrome */}
        <mesh position={[0, -0.075, 0]}>
          <torusGeometry args={[4.5, 0.08, 16, 100]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>

        {/* Modern pedestal */}
        <Cylinder args={[1.2, 1.5, 0.5, 32]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.8}
            roughness={0.1}
          />
        </Cylinder>

        {/* Base plate */}
        <Cylinder args={[2.0, 2.0, 0.08, 32]} position={[0, -0.48, 0]} receiveShadow>
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.7}
            roughness={0.2}
          />
        </Cylinder>

        {/* Central holographic hub */}
        <group position={[0, 0.15, 0]}>
          <Cylinder args={[0.3, 0.3, 0.05, 32]}>
            <meshStandardMaterial
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.8}
            />
          </Cylinder>

          {/* Pulsing ring indicator */}
          <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.35, 0.4, 32]} />
            <meshStandardMaterial
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      </group>

      {/* Modern minimalist chairs for AI players */}
      {playerEntities.map((entity) => {
        // Create a wrapper component to use hooks
        return <ChairForEntity key={entity} entity={entity} />;
      })}

      {/* Render player avatars */}
      {playerEntities.map((entity) => (
        <AvatarWrapper key={entity} entity={entity} />
      ))}

      {/* Holographic Moderator Display */}
      <group position={[0, 5, -12]}>
        {/* Clean display frame */}
        <RoundedBox args={[6, 4, 0.2]} radius={0.1}>
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
          />
        </RoundedBox>

        {/* Holographic moderator indicator */}
        <group position={[0, 0, 0.15]}>
          <Sphere args={[0.6, 32, 32]} position={[0, 0.5, 0]}>
            <meshStandardMaterial
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={1.5}
              transparent
              opacity={0.8}
            />
          </Sphere>

          <Text
            position={[0, -1.2, 0]}
            fontSize={0.35}
            color="#4a9eff"
            anchorX="center"
            anchorY="middle"
          >
            MODERATOR
          </Text>
        </group>

        {/* Speaker light */}
        <pointLight
          ref={speakerLightRef}
          position={[0, 0, 2]}
          color="#4a9eff"
          intensity={3}
          distance={15}
          decay={2}
        />
      </group>
    </group>
  );
};

export default TableSceneECS;
