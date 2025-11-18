import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Cylinder, MeshReflectorMaterial, RoundedBox, Plane } from '@react-three/drei';
import * as THREE from 'three';
import readyPlayerMeService from '../services/readyPlayerMeService';

// Minimalist Avatar Component
const Avatar = ({ playerId, position, rotation, scale = 1, isSpeaking, playerName }) => {
  const avatarRef = useRef();
  const floatGroupRef = useRef();

  // Floating animation for speaking
  useFrame((state) => {
    if (floatGroupRef.current && isSpeaking) {
      floatGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    } else if (floatGroupRef.current) {
      floatGroupRef.current.position.y *= 0.95; // Smooth return
    }
  });

  return (
    <group ref={avatarRef} position={position} rotation={rotation}>
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
        {playerName && (
          <group position={[0, 2.5, 0]}>
            <RoundedBox args={[playerName.length * 0.12 + 0.3, 0.25, 0.04]} radius={0.02}>
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
              fontSize={0.25}
              color="#4a9eff"
              anchorX="center"
              anchorY="middle"
            >
              {playerName}
            </Text>
          </group>
        )}
      </group>
    </group>
  );
};

// Avatar URLs will be loaded dynamically per character

const TableScene = ({ players, currentSpeaker }) => {
  const speakerLightRef = useRef();
  
  // Create a nice gradient background
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a2332');
    gradient.addColorStop(0.5, '#2a3a52');
    gradient.addColorStop(1, '#0f1419');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Round poker table seating arrangement
  const getPlayerPosition = (index, total, isHuman, playerId) => {
    if (isHuman) return null;
    
    // Round table seating - evenly spaced around circle
    const tableRadius = 3.0;
    const seatHeight = 1.0;
    const tableCenter = [0, 0, -3.5];
    
    // Total players around table: 6 (human + moderator + 4 AIs)
    const totalSeats = 6;
    const angleStep = (2 * Math.PI) / totalSeats;
    
    // Seat assignments around the table (starting from human at angle 0)
    const seatAngles = {
      'human': 0,           // Bottom (closest to camera)
      'moderator': Math.PI, // Top (dealer position, opposite human)
      'player1': Math.PI * 2/3,    // Upper left
      'player2': Math.PI * 4/3,    // Lower left  
      'player3': Math.PI * 1/3,    // Upper right
      'player4': Math.PI * 5/3,    // Lower right
    };
    
    const angle = seatAngles[playerId] || 0;
    
    return [
      Math.sin(angle) * tableRadius + tableCenter[0],
      seatHeight,
      Math.cos(angle) * tableRadius + tableCenter[2]
    ];
  };
  
  // Get rotation for player to face inward toward table center
  const getPlayerRotation = (index, total, isHuman, playerId) => {
    if (isHuman) return [0, 0, 0];
    
    // Same seat angles as positioning
    const seatAngles = {
      'moderator': Math.PI, // Top (dealer position)
      'player1': Math.PI * 2/3,    // Upper left
      'player2': Math.PI * 4/3,    // Lower left  
      'player3': Math.PI * 1/3,    // Upper right
      'player4': Math.PI * 5/3,    // Lower right
    };
    
    const angle = seatAngles[playerId] || 0;
    
    // Face toward center of table (add PI to face inward)
    return [0, angle + Math.PI, 0];
  };

  useFrame((state) => {
    if (speakerLightRef.current) {
      speakerLightRef.current.intensity = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  console.log('TableScene rendering with players:', players);
  
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
      
      {/* Rug border pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -3.5]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color="#4a1220"
          roughness={0.95}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Central medallion */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, -3.5]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial
          color="#8b3545"
          roughness={0.9}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Modern Minimalist Round Table */}
      <group position={[0, 0.75, -3.5]}>
        {/* Main table surface - glass-like with subtle transparency */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.5, 4.5, 0.15, 64]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            roughness={0.05}
            metalness={0.9}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
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
          <Sphere args={[0.06, 16, 16]} position={[-0.2, 0.06, 0]}>
            <meshStandardMaterial 
              color="#aa0000"
              emissive="#aa0000"
              emissiveIntensity={0.3}
            />
          </Sphere>
          
          {/* Center speaker */}
          <Cylinder args={[0.15, 0.15, 0.03, 16]} position={[0, 0.07, 0]}>
            <meshStandardMaterial 
              color="#1a1a1a"
              metalness={0.7}
              roughness={0.3}
            />
          </Cylinder>
        </group>
        
        {/* Documents and materials on table */}
        <group position={[2.5, 0.14, 1]}>
          <Box args={[0.8, 0.01, 1.1]}>
            <meshStandardMaterial color="#f8f8f8" roughness={0.9} />
          </Box>
          <Box args={[0.6, 0.01, 0.9]} position={[0.1, 0.01, 0.1]}>
            <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
          </Box>
        </group>
        
        <group position={[-2.2, 0.14, 0.8]}>
          <Box args={[0.6, 0.01, 0.8]}>
            <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
          </Box>
        </group>
      </group>
      
      {/* Human's Executive Chair (First Person View) - Only show parts visible from seated position */}
      <group position={[0, 0, 1.8]}>        
        {/* Show only armrests visible in peripheral vision */}
        <RoundedBox args={[0.22, 0.6, 0.9]} radius={0.05} position={[0.65, 1.15, -0.05]}>
          <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.6, 0.9]} radius={0.05} position={[-0.65, 1.15, -0.05]}>
          <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
        </RoundedBox>
        
        {/* Chrome armrest details */}
        <Cylinder args={[0.05, 0.05, 0.5]} position={[0.65, 0.95, -0.05]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.03} />
        </Cylinder>
        <Cylinder args={[0.05, 0.05, 0.5]} position={[-0.65, 0.95, -0.05]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.03} />
        </Cylinder>
      </group>
      
      {/* AI Participants and Moderator - Ready Player Me Avatars */}
      {players.map((player, index) => {
        if (player.type === 'human') return null;
        
        const position = getPlayerPosition(index, players.length, false, player.id);
        const rotation = getPlayerRotation(index, players.length, false, player.id);
        if (!position) return null;
        
        const isSpeaking = currentSpeaker === player.id;
        
        return (
          <group key={player.id}>
            {/* Premium executive chair */}
            <group position={position}>
              <group position={[0, -0.75, 0.3]}>
                {/* Seat cushion */}
                <RoundedBox args={[1.1, 0.12, 1.0]} radius={0.06} position={[0, 0, 0]}>
                  <meshStandardMaterial 
                    color="#2a2a2a" 
                    roughness={0.4}
                    metalness={0.05}
                  />
                </RoundedBox>
                
                {/* High backrest */}
                <RoundedBox args={[1.1, 1.5, 0.12]} radius={0.06} position={[0, 0.8, -0.44]}>
                  <meshStandardMaterial 
                    color="#2a2a2a" 
                    roughness={0.4}
                    metalness={0.05}
                  />
                </RoundedBox>
                
                {/* Padded armrests */}
                <RoundedBox args={[0.18, 0.35, 0.6]} radius={0.03} position={[0.54, 0.2, -0.05]}>
                  <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
                </RoundedBox>
                <RoundedBox args={[0.18, 0.35, 0.6]} radius={0.03} position={[-0.54, 0.2, -0.05]}>
                  <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
                </RoundedBox>
                
                {/* Chair base and wheels */}
                <Cylinder args={[0.4, 0.4, 0.08, 32]} position={[0, -0.4, 0]}>
                  <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
                </Cylinder>
                
                {/* Chrome pillar */}
                <Cylinder args={[0.06, 0.08, 0.5, 16]} position={[0, -0.25, 0]}>
                  <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.05} />
                </Cylinder>
              </group>
            </group>
            
            {/* Ready Player Me Avatar with better error handling */}
            <Suspense fallback={
              <group position={[position[0], position[1] + 0.9, position[2]]}>
                <Sphere args={[0.4, 32, 32]} position={[0, 0, 0]} castShadow>
                  <meshStandardMaterial 
                    color="#f0c674" 
                    emissive={isSpeaking ? '#ffaa77' : '#000000'}
                    emissiveIntensity={isSpeaking ? 0.2 : 0}
                  />
                </Sphere>
                <RoundedBox args={[0.8, 1.2, 0.3]} radius={0.05} position={[0, -0.8, 0]} castShadow>
                  <meshStandardMaterial color="#333333" />
                </RoundedBox>
                {/* Eyes */}
                <Sphere args={[0.06, 16, 16]} position={[0.15, 0.1, 0.35]} castShadow>
                  <meshStandardMaterial color="#000000" />
                </Sphere>
                <Sphere args={[0.06, 16, 16]} position={[-0.15, 0.1, 0.35]} castShadow>
                  <meshStandardMaterial color="#000000" />
                </Sphere>
              </group>
            }>
              <Avatar
                playerId={player.id}
                playerName={player.name}
                position={[position[0], position[1] + 0.2, position[2]]}
                rotation={rotation}
                scale={1.0}
                isSpeaking={isSpeaking}
              />
            </Suspense>
            
            {/* Professional nameplate on table */}
            <group position={[position[0], position[1] - 0.61, position[2] + 1.8]} rotation={[-Math.PI/2, 0, 0]}>
              <RoundedBox args={[1.6, 0.08, 0.3]} radius={0.02}>
                <meshStandardMaterial 
                  color="#2a2a2a" 
                  metalness={0.7} 
                  roughness={0.3}
                />
              </RoundedBox>
              <Text
                position={[0, 0.05, 0]}
                fontSize={0.15}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                rotation={[Math.PI/2, 0, 0]}
              >
                {player.name}
              </Text>
            </group>
            
            {/* Floating name label above head */}
            <group position={[position[0], position[1] + 3.2, position[2]]}>
              {/* Background for better contrast */}
              <RoundedBox args={[player.name.length * 0.12 + 0.4, 0.3, 0.05]} radius={0.02}>
                <meshStandardMaterial 
                  color="#000000" 
                  transparent 
                  opacity={0.8}
                  emissive="#000000"
                  emissiveIntensity={0.2}
                />
              </RoundedBox>
              <Text
                position={[0, 0, 0.03]}
                fontSize={0.25}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
              >
                {player.name}
              </Text>
            </group>
            
            {/* Subtle speaking indicator */}
            {isSpeaking && (
              <group position={[position[0], position[1] + 2.0, position[2]]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.25}
                  color="#88ff88"
                  anchorX="center"
                  anchorY="middle"
                >
                  Speaking...
                </Text>
                <mesh position={[0, -0.2, 0]}>
                  <ringGeometry args={[0.3, 0.35, 32]} />
                  <meshStandardMaterial 
                    color="#88ff88"
                    emissive="#88ff88"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
      
      
      {/* Ultra-Modern Moderator Display */}
      <group position={[0, 4.5, -9.5]}>
        {/* Premium display frame */}
        <RoundedBox args={[8, 5, 0.3]} radius={0.1}>
          <meshStandardMaterial 
            color="#0a0a0a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </RoundedBox>
        
        {/* OLED screen */}
        <RoundedBox args={[7.6, 4.6, 0.05]} radius={0.05} position={[0, 0, 0.18]}>
          <meshStandardMaterial 
            color="#000011"
            emissive="#001133"
            emissiveIntensity={currentSpeaker === 'moderator' ? 1.2 : 0.4}
            metalness={0.95}
            roughness={0.05}
          />
        </RoundedBox>
        
        {/* Holographic moderator */}
        <group position={[0, 0, 0.25]}>
          <Sphere args={[0.8, 32, 32]} position={[0, 0.8, 0]}>
            <meshStandardMaterial 
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={currentSpeaker === 'moderator' ? 2.0 : 0.8}
              transparent
              opacity={0.9}
            />
          </Sphere>
          
          <RoundedBox args={[1.6, 2.2, 0.3]} radius={0.1} position={[0, -0.6, 0]}>
            <meshStandardMaterial 
              color="#4a9eff"
              emissive="#4a9eff"
              emissiveIntensity={currentSpeaker === 'moderator' ? 1.5 : 0.6}
              transparent
              opacity={0.8}
            />
          </RoundedBox>
          
          {/* Animated elements when speaking */}
          {currentSpeaker === 'moderator' && (
            <group>
              {[...Array(3)].map((_, i) => (
                <mesh key={i} position={[0, -1.8, 0]} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
                  <ringGeometry args={[0.3 + i * 0.2, 0.35 + i * 0.2, 32]} />
                  <meshStandardMaterial 
                    color="#00ff88"
                    emissive="#00ff88"
                    emissiveIntensity={2.0 - i * 0.4}
                    transparent
                    opacity={0.8 - i * 0.2}
                  />
                </mesh>
              ))}
            </group>
          )}
        </group>
        
        <Text
          position={[0, -2.8, 0.25]}
          fontSize={0.5}
          color="#4a9eff"
          anchorX="center"
          anchorY="middle"
        >
          MODERATOR AI
        </Text>
        
        {/* Premium speaker lighting */}
        {currentSpeaker === 'moderator' && (
          <pointLight
            ref={speakerLightRef}
            position={[0, 0, 3]}
            color="#4a9eff"
            intensity={4}
            distance={20}
            decay={2}
          />
        )}
      </group>
      
      {/* Executive Office Atmosphere */}
      <group>
        {/* Premium office plants */}
        <group position={[-18, 0, -18]}>
          <Cylinder args={[0.8, 1.0, 2, 16]}>
            <meshStandardMaterial color="#4a3a2a" metalness={0.2} roughness={0.8} />
          </Cylinder>
          <group position={[0, 2.5, 0]}>
            {[...Array(8)].map((_, i) => (
              <RoundedBox 
                key={i}
                args={[0.2, 1.5, 0.8]} 
                radius={0.1}
                position={[
                  Math.cos((i / 8) * Math.PI * 2) * 0.8,
                  Math.random() * 0.5,
                  Math.sin((i / 8) * Math.PI * 2) * 0.8
                ]}
                rotation={[Math.random() * 0.3, (i / 8) * Math.PI * 2, Math.random() * 0.3]}
              >
                <meshStandardMaterial color="#2a5a2a" roughness={0.9} />
              </RoundedBox>
            ))}
          </group>
        </group>
        
        <group position={[18, 0, -18]}>
          <Cylinder args={[0.8, 1.0, 2, 16]}>
            <meshStandardMaterial color="#4a3a2a" metalness={0.2} roughness={0.8} />
          </Cylinder>
          <group position={[0, 2.5, 0]}>
            {[...Array(8)].map((_, i) => (
              <RoundedBox 
                key={i}
                args={[0.2, 1.5, 0.8]} 
                radius={0.1}
                position={[
                  Math.cos((i / 8) * Math.PI * 2) * 0.8,
                  Math.random() * 0.5,
                  Math.sin((i / 8) * Math.PI * 2) * 0.8
                ]}
                rotation={[Math.random() * 0.3, (i / 8) * Math.PI * 2, Math.random() * 0.3]}
              >
                <meshStandardMaterial color="#2a5a2a" roughness={0.9} />
              </RoundedBox>
            ))}
          </group>
        </group>
        
        {/* Executive water station */}
        <group position={[20, 0, 8]}>
          <Cylinder args={[0.4, 0.4, 2.5, 16]}>
            <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
          </Cylinder>
          <Cylinder args={[0.35, 0.35, 0.8, 16]} position={[0, 3, 0]}>
            <meshPhysicalMaterial 
              color="#4a9eff"
              transmission={0.95}
              thickness={0.3}
              roughness={0.05}
            />
          </Cylinder>
        </group>
      </group>
    </group>
  );
};

export default TableScene;