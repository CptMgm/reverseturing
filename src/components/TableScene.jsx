import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Cylinder, MeshReflectorMaterial, RoundedBox, Plane } from '@react-three/drei';
import * as THREE from 'three';

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

  // Realistic boardroom seating around oval table
  const getPlayerPosition = (index, total, isHuman) => {
    if (isHuman) return null;
    
    const aiIndex = index > 0 ? index - 1 : index;
    
    // Natural oval table seating - closer to table, proper angles
    const tableRadius = 4.5;
    const seatHeight = 1.0;
    
    // Four seats around oval table at natural positions
    const angles = [
      -0.6,  // Left side (closer to front)
      0.6,   // Right side (closer to front)
      -2.5,  // Left back
      2.5,   // Right back
    ];
    
    const angle = angles[aiIndex] || 0;
    
    return [
      Math.sin(angle) * tableRadius,
      seatHeight,
      Math.cos(angle) * tableRadius - 3.5  // Offset table center
    ];
  };
  
  // Get rotation for player to face inward toward table
  const getPlayerRotation = (index, total, isHuman) => {
    if (isHuman) return [0, 0, 0];
    
    const aiIndex = index > 0 ? index - 1 : index;
    const angles = [-0.6, 0.6, -2.5, 2.5];
    const angle = angles[aiIndex] || 0;
    
    // Face toward center of table
    return [0, angle + Math.PI, 0];
  };

  useFrame((state) => {
    if (speakerLightRef.current) {
      speakerLightRef.current.intensity = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

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
      
      {/* Premium Oval Conference Table */}
      <group position={[0, 0.75, -3.5]}>
        {/* Elegant oval table surface - realistic proportions */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[5.5, 5.5, 0.25, 64]} />
          <meshStandardMaterial 
            color="#2d1810"
            metalness={0.2}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        
        {/* Wood grain detail ring */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[5.2, 5.2, 0.23, 64]} />
          <meshStandardMaterial 
            color="#3d2420"
            metalness={0.15}
            roughness={0.2}
          />
        </mesh>
        
        {/* Leather inlay center */}
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 0.03, 64]} />
          <meshStandardMaterial 
            color="#1a2a1a"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Refined table edge */}
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[5.5, 0.15, 16, 100]} />
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
      
      {/* Human's Executive Chair (First Person View) */}
      <group position={[0, 0, 1.8]}>
        {/* Premium seat cushion */}
        <RoundedBox args={[1.3, 0.15, 1.3]} radius={0.08} position={[0, 0.75, 0]}>
          <meshStandardMaterial 
            color="#2a2a2a" 
            roughness={0.4}
            metalness={0.05}
          />
        </RoundedBox>
        
        {/* Executive backrest */}
        <RoundedBox args={[1.3, 1.7, 0.15]} radius={0.08} position={[0, 1.6, -0.58]}>
          <meshStandardMaterial 
            color="#2a2a2a" 
            roughness={0.4}
            metalness={0.05}
          />
        </RoundedBox>
        
        {/* Comfortable armrests - visible in periphery */}
        <RoundedBox args={[0.22, 0.6, 0.9]} radius={0.05} position={[0.65, 1.15, -0.05]}>
          <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.6, 0.9]} radius={0.05} position={[-0.65, 1.15, -0.05]}>
          <meshStandardMaterial color="#3a3a3a" roughness={0.3} />
        </RoundedBox>
        
        {/* Premium chrome details */}
        <Cylinder args={[0.05, 0.05, 0.5]} position={[0.65, 0.95, -0.05]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.03} />
        </Cylinder>
        <Cylinder args={[0.05, 0.05, 0.5]} position={[-0.65, 0.95, -0.05]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.03} />
        </Cylinder>
        
        {/* Chair base - visible below */}
        <Cylinder args={[0.45, 0.45, 0.1, 32]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </Cylinder>
        
        {/* Chrome pillar */}
        <Cylinder args={[0.08, 0.1, 0.6, 16]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.03} />
        </Cylinder>
      </group>
      
      {/* AI Participants - Naturally Positioned */}
      {players.map((player, index) => {
        if (player.type === 'human') return null;
        
        const position = getPlayerPosition(index, players.length, false);
        const rotation = getPlayerRotation(index, players.length, false);
        if (!position) return null;
        
        const isSpeaking = currentSpeaker === player.id;
        const skinTones = ["#fdbcb4", "#d4a574", "#c68642", "#8b6039"];
        const suitColors = ["#1a1a2a", "#2a1a1a", "#1a2a1a", "#2a2a1a"];
        const hairColors = ["#2a1a0a", "#4a3a1a", "#6a5a3a", "#3a2a1a"];
        
        return (
          <group key={player.id} position={position} rotation={rotation}>
            {/* Premium executive chair - properly scaled */}
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
            
            {/* Professional Business Executive */}
            <group position={[0, 0, 0]}>
              {/* Well-fitted suit jacket */}
              <RoundedBox args={[0.95, 1.25, 0.42]} radius={0.06} position={[0, 0, 0]}>
                <meshStandardMaterial 
                  color={suitColors[index % 4]}
                  roughness={0.6}
                  metalness={0.08}
                />
              </RoundedBox>
              
              {/* Dress shirt with collar */}
              <RoundedBox args={[0.7, 0.9, 0.38]} radius={0.03} position={[0, 0.15, 0.02]}>
                <meshStandardMaterial color="#fafafa" roughness={0.7} />
              </RoundedBox>
              
              {/* Shirt collar detail */}
              <RoundedBox args={[0.25, 0.15, 0.35]} radius={0.02} position={[0, 0.55, 0.04]}>
                <meshStandardMaterial color="#ffffff" roughness={0.8} />
              </RoundedBox>
              
              {/* Professional tie */}
              <RoundedBox args={[0.1, 0.65, 0.02]} radius={0.01} position={[0, 0.15, 0.21]}>
                <meshStandardMaterial 
                  color={["#8b0000", "#000080", "#2f4f2f", "#4b0082"][index % 4]}
                  metalness={0.2}
                  roughness={0.7}
                />
              </RoundedBox>
              
              {/* Suit lapels */}
              <RoundedBox args={[0.08, 0.3, 0.4]} radius={0.02} position={[0.2, 0.4, 0.01]}>
                <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
              </RoundedBox>
              <RoundedBox args={[0.08, 0.3, 0.4]} radius={0.02} position={[-0.2, 0.4, 0.01]}>
                <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
              </RoundedBox>
              
              {/* Realistic head */}
              <Sphere args={[0.4, 32, 32]} position={[0, 0.9, 0]} castShadow>
                <meshStandardMaterial 
                  color={skinTones[index % 4]}
                  emissive={isSpeaking ? '#ffaa77' : '#000000'}
                  emissiveIntensity={isSpeaking ? 0.2 : 0}
                  roughness={0.8}
                  metalness={0.02}
                />
              </Sphere>
              
              {/* Detailed facial features */}
              <group position={[0, 0.9, 0]}>
                {/* Eyes with depth */}
                <Sphere args={[0.08, 16, 16]} position={[0.18, 0.05, 0.35]}>
                  <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </Sphere>
                <Sphere args={[0.08, 16, 16]} position={[-0.18, 0.05, 0.35]}>
                  <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </Sphere>
                <Sphere args={[0.04, 16, 16]} position={[0.18, 0.05, 0.38]}>
                  <meshStandardMaterial color={["#4a7c7e", "#8b4513", "#2f4f2f", "#708090"][index % 4]} />
                </Sphere>
                <Sphere args={[0.04, 16, 16]} position={[-0.18, 0.05, 0.38]}>
                  <meshStandardMaterial color={["#4a7c7e", "#8b4513", "#2f4f2f", "#708090"][index % 4]} />
                </Sphere>
                <Sphere args={[0.02, 8, 8]} position={[0.18, 0.05, 0.4]}>
                  <meshStandardMaterial color="#000000" />
                </Sphere>
                <Sphere args={[0.02, 8, 8]} position={[-0.18, 0.05, 0.4]}>
                  <meshStandardMaterial color="#000000" />
                </Sphere>
                
                {/* Eyebrows */}
                <RoundedBox args={[0.12, 0.02, 0.03]} radius={0.005} position={[0.18, 0.15, 0.36]}>
                  <meshStandardMaterial color={hairColors[index % 4]} roughness={1} />
                </RoundedBox>
                <RoundedBox args={[0.12, 0.02, 0.03]} radius={0.005} position={[-0.18, 0.15, 0.36]}>
                  <meshStandardMaterial color={hairColors[index % 4]} roughness={1} />
                </RoundedBox>
                
                {/* Professional nose */}
                <RoundedBox args={[0.06, 0.12, 0.1]} radius={0.02} position={[0, -0.02, 0.38]}>
                  <meshStandardMaterial color={skinTones[index % 4]} roughness={0.8} />
                </RoundedBox>
                
                {/* Mouth */}
                <RoundedBox args={[0.14, 0.03, 0.02]} radius={0.01} position={[0, -0.12, 0.37]}>
                  <meshStandardMaterial color="#d08080" roughness={0.6} />
                </RoundedBox>
                
                {/* Professional hairstyle */}
                <Sphere args={[0.42, 20, 20]} position={[0, 0.2, -0.08]}>
                  <meshStandardMaterial 
                    color={hairColors[index % 4]}
                    roughness={0.9}
                  />
                </Sphere>
              </group>
              
              {/* Natural arm positioning */}
              <group>
                {/* Right arm - resting on table */}
                <RoundedBox args={[0.18, 0.5, 0.18]} radius={0.05} position={[0.5, 0.2, 0.15]} rotation={[0.3, 0, -0.15]}>
                  <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
                </RoundedBox>
                <RoundedBox args={[0.16, 0.4, 0.16]} radius={0.04} position={[0.75, -0.15, 0.45]} rotation={[0.8, 0, -0.1]}>
                  <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
                </RoundedBox>
                
                {/* Left arm - natural pose */}
                <RoundedBox args={[0.18, 0.5, 0.18]} radius={0.05} position={[-0.5, 0.2, 0.15]} rotation={[0.3, 0, 0.15]}>
                  <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
                </RoundedBox>
                <RoundedBox args={[0.16, 0.4, 0.16]} radius={0.04} position={[-0.75, -0.15, 0.45]} rotation={[0.8, 0, 0.1]}>
                  <meshStandardMaterial color={suitColors[index % 4]} roughness={0.6} />
                </RoundedBox>
                
                {/* Hands positioned naturally */}
                <Sphere args={[0.11, 16, 16]} position={[0.9, -0.45, 0.65]}>
                  <meshStandardMaterial color={skinTones[index % 4]} roughness={0.8} />
                </Sphere>
                <Sphere args={[0.11, 16, 16]} position={[-0.9, -0.45, 0.65]}>
                  <meshStandardMaterial color={skinTones[index % 4]} roughness={0.8} />
                </Sphere>
                
                {/* Shirt cuffs */}
                <Cylinder args={[0.09, 0.09, 0.06, 16]} position={[0.9, -0.35, 0.55]} rotation={[Math.PI/2, 0, 0]}>
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </Cylinder>
                <Cylinder args={[0.09, 0.09, 0.06, 16]} position={[-0.9, -0.35, 0.55]} rotation={[Math.PI/2, 0, 0]}>
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </Cylinder>
              </group>
            </group>
            
            {/* Professional nameplate on table */}
            <group position={[0, -0.61, 1.8]} rotation={[-Math.PI/2, 0, 0]}>
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
            
            {/* Subtle speaking indicator */}
            {isSpeaking && (
              <group position={[0, 2.0, 0]}>
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