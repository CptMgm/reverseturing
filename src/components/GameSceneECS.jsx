import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, AdaptiveDpr, AdaptiveEvents, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WorldProvider } from 'koota/react';
import TableSceneECS from './TableSceneECS';
import GameUI from './GameUI';
import EffectsComposerMinimalist from './EffectsComposerMinimalist';
import ErrorBoundary from './ErrorBoundary';
import { useGameLogic } from '../hooks/useGameLogic';
import { initializePlayerEntities, cleanupEntities } from '../ecs/entities';
import gameWorld from '../ecs/world';
import { SpeakingSystem } from '../ecs/systems';

const GameSceneECS = ({ playerName, onComplete }) => {
  const speakingSystemRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    gamePhase,
    currentSpeaker,
    conversation,
    isProcessing,
    players,
    currentRound,
    maxRounds,
    handleHumanResponse,
    handleHumanVote,
    startVotingPhase,
    startAnotherRound
  } = useGameLogic(playerName, onComplete);

  // Track if entities have been initialized to prevent recreation
  const entitiesInitializedRef = useRef(false);
  const playerCountRef = useRef(0);

  // Initialize ECS entities when players are loaded (only once)
  useEffect(() => {
    if (players && players.length > 0) {
      // Only initialize if not done yet OR if player count changed
      const shouldInitialize = !entitiesInitializedRef.current || playerCountRef.current !== players.length;

      if (shouldInitialize) {
        console.log('🎮 Initializing ECS entities for', players.length, 'players');

        // Cleanup previous entities only if reinitializing
        if (entitiesInitializedRef.current) {
          cleanupEntities();
        }

        // Initialize new entities
        initializePlayerEntities(players);

        // Initialize speaking system
        speakingSystemRef.current = SpeakingSystem(gameWorld);

        entitiesInitializedRef.current = true;
        playerCountRef.current = players.length;
      }
    }

    // Cleanup on unmount only
    return () => {
      if (entitiesInitializedRef.current) {
        console.log('🎮 Cleaning up ECS entities on unmount');
        cleanupEntities();
        entitiesInitializedRef.current = false;
      }
    };
  }, [players?.length]); // Only depend on length, not array reference

  // Update current speaker in ECS
  useEffect(() => {
    if (speakingSystemRef.current) {
      // Set speaker (can be null to clear speaking state)
      speakingSystemRef.current.setSpeaker(currentSpeaker);
    }
  }, [currentSpeaker]);

  return (
    <ErrorBoundary>
      <WorldProvider world={gameWorld}>
        <div className="min-h-screen bg-white relative">
          {/* 3D Scene */}
          <div className="absolute inset-0">
            <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0
            }}
          >
            {/* Adaptive performance optimization */}
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />

            {/* Camera setup */}
            <PerspectiveCamera
              makeDefault
              position={isMobile ? [0, 4, 5] : [0, 3, 3]}
              fov={isMobile ? 70 : 60}
              near={0.1}
              far={100}
            />

            {/* Orbit controls for desktop, limited for mobile */}
            <OrbitControls
              enablePan={false}
              enableZoom={isMobile ? false : true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.2}
              minPolarAngle={Math.PI / 8}
              maxAzimuthAngle={Math.PI / 4}
              minAzimuthAngle={-Math.PI / 4}
              target={[0, 1.0, -3.5]}
              maxDistance={isMobile ? 6 : 5}
              minDistance={isMobile ? 4 : 2}
              rotateSpeed={isMobile ? 0.3 : 0.5}
              dampingFactor={0.05}
              enableDamping={true}
            />

            {/* Fog for depth */}
            <fog attach="fog" args={['#e8f4ff', 20, 50]} />

            {/* Scene content */}
            <TableSceneECS />

            {/* Post-processing effects */}
            <EffectsComposerMinimalist />
          </Canvas>
        </div>

        {/* UI Overlay */}
        <GameUI
          gamePhase={gamePhase}
          conversation={conversation}
          currentSpeaker={currentSpeaker}
          onHumanResponse={handleHumanResponse}
          isProcessing={isProcessing}
          players={players}
          onHumanVote={handleHumanVote}
          onContinueToVoting={startVotingPhase}
          onPlayAnotherRound={startAnotherRound}
          currentRound={currentRound}
          maxRounds={maxRounds}
        />
        </div>
      </WorldProvider>
    </ErrorBoundary>
  );
};

export default GameSceneECS;
