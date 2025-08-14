import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Cylinder, MeshReflectorMaterial, RoundedBox, Plane, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import readyPlayerMeService from '../services/readyPlayerMeService';

// Ready Player Me Avatar Component  
const Avatar = ({ playerId, position, rotation, scale = 1, isSpeaking }) => {
  const avatarRef = useRef();
  const [avatarUrl, setAvatarUrl] = useState('https://models.readyplayer.me/689d222db09df363fd10ef30.glb'); // Start with default
  
  // Get character-specific avatar URL
  useEffect(() => {
    const loadAvatarUrl = async () => {
      try {
        console.log(`🎭 Loading avatar for ${playerId}...`);
        const url = await readyPlayerMeService.generateAvatarUrl(playerId);
        setAvatarUrl(url);
        console.log(`✅ Avatar URL set for ${playerId}: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to load avatar for ${playerId}:`, error);
        // Keep the default URL
      }
    };
    
    if (playerId) {
      loadAvatarUrl();
    }
  }, [playerId]);
  
  // Always call useGLTF with a URL (React hooks rule)
  const { scene, error } = useGLTF(avatarUrl);
  
  console.log(`🎯 GLTF state for ${playerId}:`, { scene: !!scene, error: !!error, avatarUrl });
  
  // Clone the scene to avoid conflicts with multiple instances
  const clonedScene = useMemo(() => {
    if (scene) {
      const cloned = scene.clone();
      console.log('Ready Player Me avatar loaded successfully');
      
      // Ensure the avatar is properly positioned and scaled
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Improve material properties for better lighting
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });
      
      return cloned;
    }
    return null;
  }, [scene]);
  
  // Add speaking animation
  useFrame((state) => {
    if (avatarRef.current && isSpeaking) {
      avatarRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      avatarRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    } else if (avatarRef.current) {
      avatarRef.current.rotation.y = rotation[1];
      avatarRef.current.position.y = position[1];
    }
  });
  
  // Error handling
  if (error) {
    console.error(`❌ Error loading Ready Player Me avatar for ${playerId}:`, error);
    return (
      <group position={position} rotation={rotation}>
        <Sphere args={[0.4, 32, 32]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial 
            color="#ff6b6b" 
            emissive={isSpeaking ? '#ff4444' : '#000000'}
            emissiveIntensity={isSpeaking ? 0.3 : 0}
          />
        </Sphere>
        <RoundedBox args={[0.8, 1.2, 0.3]} radius={0.05} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#333333" />
        </RoundedBox>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.1}
          color="#ff6b6b"
          anchorX="center"
          anchorY="middle"
        >
          Avatar Load Error
        </Text>
      </group>
    );
  }
  
  if (!clonedScene) {
    console.log(`⏳ Ready Player Me avatar scene not ready for ${playerId}, showing loading fallback...`);
    return (
      <group position={position} rotation={rotation}>
        <Sphere args={[0.4, 32, 32]} position={[0, 0.9, 0]} castShadow>
          <meshStandardMaterial 
            color="#87CEEB" 
            emissive={isSpeaking ? '#4169E1' : '#000000'}
            emissiveIntensity={isSpeaking ? 0.3 : 0}
          />
        </Sphere>
        <RoundedBox args={[0.8, 1.2, 0.3]} radius={0.05} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#333333" />
        </RoundedBox>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.1}
          color="#87CEEB"
          anchorX="center"
          anchorY="middle"
        >
          GLTF Loading...
        </Text>
      </group>
    );
  }
  
  return (
    <primitive
      ref={avatarRef}
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
    />
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
      {/* Cinematic Lighting System */}
      <ambientLight intensity={0.3} color="#f8f6f0" />
      
      {/* Main overhead lighting with soft shadows */}
      <directionalLight 
        position={[0, 30, 8]} 
        intensity={2.2} 
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0001}
      />
      
      {/* Warm executive lighting */}
      <pointLight position={[-10, 15, -2]} intensity={0.8} color="#ffb366" distance={25} decay={1.5} />
      <pointLight position={[10, 15, -2]} intensity={0.8} color="#ffb366" distance={25} decay={1.5} />
      <pointLight position={[0, 12, -8]} intensity={1.0} color="#ffffff" distance={20} decay={1.8} />
      
      {/* Table accent lighting */}
      <spotLight 
        position={[0, 8, -3.5]} 
        target-position={[0, 0.75, -3.5]}
        angle={0.8}
        penumbra={0.5}
        intensity={0.6}
        color="#fff8e7"
        distance={12}
      />

      {/* Elegant Room Architecture */}
      <group>
        {/* Sophisticated room with gradient walls */}
        <mesh>
          <boxGeometry args={[50, 25, 50]} />
          <meshStandardMaterial 
            color="#1a2332"
            side={THREE.BackSide}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
        
        {/* Upper wall accent */}
        <Box args={[48, 8, 0.2]} position={[0, 16, -24.9]}>
          <meshStandardMaterial 
            color="#2a3a52" 
            roughness={0.6}
            metalness={0.2}
          />
        </Box>
        
        {/* Elegant wainscoting */}
        <Box args={[48, 4, 0.3]} position={[0, 2, -24.85]}>
          <meshStandardMaterial 
            color="#8b7355" 
            roughness={0.3}
            metalness={0.2}
          />
        </Box>
        <Box args={[0.3, 4, 48]} position={[-24.85, 2, 0]}>
          <meshStandardMaterial 
            color="#8b7355" 
            roughness={0.3}
            metalness={0.2}
          />
        </Box>
        <Box args={[0.3, 4, 48]} position={[24.85, 2, 0]}>
          <meshStandardMaterial 
            color="#8b7355" 
            roughness={0.3}
            metalness={0.2}
          />
        </Box>
        
        {/* Executive windows with city view simulation */}
        <group position={[0, 8, -24.6]}>
          <Box args={[12, 8, 0.2]}>
            <meshPhysicalMaterial 
              color="#87ceeb"
              transmission={0.9}
              thickness={0.1}
              roughness={0.05}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0}
            />
          </Box>
          {/* Window frame */}
          <Box args={[12.4, 8.4, 0.15]} position={[0, 0, -0.1]}>
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.2} />
          </Box>
        </group>
        
        {/* Side windows */}
        <group position={[-24.6, 8, -8]}>
          <Box args={[0.2, 8, 8]}>
            <meshPhysicalMaterial 
              color="#87ceeb"
              transmission={0.9}
              thickness={0.1}
              roughness={0.05}
            />
          </Box>
        </group>
        <group position={[24.6, 8, -8]}>
          <Box args={[0.2, 8, 8]}>
            <meshPhysicalMaterial 
              color="#87ceeb"
              transmission={0.9}
              thickness={0.1}
              roughness={0.05}
            />
          </Box>
        </group>

        {/* Crown molding */}
        <Box args={[48, 0.5, 0.5]} position={[0, 12, -24.75]}>
          <meshStandardMaterial color="#f5f5f0" metalness={0.3} roughness={0.4} />
        </Box>
        
        {/* Recessed ceiling */}
        <Box args={[46, 0.8, 46]} position={[0, 12.1, 0]}>
          <meshStandardMaterial color="#e8e8e8" roughness={0.6} />
        </Box>
      </group>
      
      {/* Premium marble floor with subtle reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={2048}
          mixBlur={0.6}
          mixStrength={35}
          roughness={0.15}
          depthScale={1.0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1.1}
          color="#0a0a0a"
          metalness={0.7}
        />
      </mesh>
      
      {/* Marble veining pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#1a1a1a"
          transparent
          opacity={0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Luxurious Persian rug with pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3.5]} receiveShadow>
        <planeGeometry args={[13, 9]} />
        <meshStandardMaterial
          color="#6b1a2a"
          roughness={0.9}
          metalness={0}
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
      
      {/* Premium Round Poker Table */}
      <group position={[0, 0.75, -3.5]}>
        {/* Round table surface - perfect for 6-player poker setup */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[5.0, 5.0, 0.25, 64]} />
          <meshStandardMaterial 
            color="#2d1810"
            metalness={0.2}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        
        {/* Wood grain detail ring */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[4.7, 4.7, 0.22, 64]} />
          <meshStandardMaterial 
            color="#3d2420"
            metalness={0.15}
            roughness={0.2}
          />
        </mesh>
        
        {/* Poker felt center */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 0.02, 64]} />
          <meshStandardMaterial 
            color="#1a4a1a"
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
        
        {/* Refined table edge */}
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[5.0, 0.15, 16, 100]} />
          <meshStandardMaterial 
            color="#1a0f08"
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
        
        {/* Executive pedestal base - more stable */}
        <Cylinder args={[1.8, 2.2, 0.6, 32]} position={[0, -0.3, 0]} castShadow>
          <meshStandardMaterial 
            color="#1a0f08"
            metalness={0.4}
            roughness={0.15}
          />
        </Cylinder>
        
        {/* Heavy base plate */}
        <Cylinder args={[3.0, 3.0, 0.12, 32]} position={[0, -0.58, 0]} receiveShadow>
          <meshStandardMaterial 
            color="#0f0805"
            metalness={0.5}
            roughness={0.25}
          />
        </Cylinder>
        
        {/* Modern conference hub */}
        <group position={[0, 0.15, 0]}>
          <Cylinder args={[0.5, 0.5, 0.08, 32]}>
            <meshStandardMaterial 
              color="#2a2a2a"
              metalness={0.8}
              roughness={0.1}
            />
          </Cylinder>
          
          {/* Conference phone elements */}
          <Sphere args={[0.06, 16, 16]} position={[0.2, 0.06, 0]}>
            <meshStandardMaterial 
              color="#00aa00"
              emissive="#00aa00"
              emissiveIntensity={0.8}
            />
          </Sphere>
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