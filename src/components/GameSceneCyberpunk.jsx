import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import TableSceneCyberpunk from './TableSceneCyberpunk';
import EffectsComposerCyberpunk from './EffectsComposer';
import GameUI from './GameUI';
import { useGameLogic } from '../hooks/useGameLogic';

const GameSceneCyberpunk = ({ playerName, onComplete }) => {
  const cameraRef = useRef();

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
    startAnotherRound,
  } = useGameLogic(playerName, onComplete);

  return (
    <div className="min-h-screen bg-black relative">
      {/* 3D Scene with Cyberpunk styling */}
      <div className="absolute inset-0">
        <Canvas
          shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputEncoding: THREE.sRGBEncoding,
          }}
          dpr={[1, 2]}
        >
          {/* Camera positioned at human's seat */}
          <PerspectiveCamera
            ref={cameraRef}
            makeDefault
            position={[0, 1.8, 3.5]}
            fov={75}
            near={0.1}
            far={100}
          />

          {/* Orbit controls - limited movement for consistent viewpoint */}
          <OrbitControls
            camera={cameraRef.current}
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 6}
            maxAzimuthAngle={Math.PI / 4}
            minAzimuthAngle={-Math.PI / 4}
            target={[0, 1.2, -2]}
            rotateSpeed={0.3}
            dampingFactor={0.1}
            enableDamping={true}
          />

          {/* Cyberpunk Table Scene */}
          <TableSceneCyberpunk
            players={players}
            currentSpeaker={currentSpeaker}
          />

          {/* Post-processing Effects */}
          <EffectsComposerCyberpunk
            currentSpeaker={currentSpeaker}
            players={players}
          />
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

      {/* Cyberpunk scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 245, 255, 0.03) 2px, rgba(0, 245, 255, 0.03) 4px)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Corner brackets UI decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-cyan-400 opacity-50" />
        {/* Top-right */}
        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-400 opacity-50" />
        {/* Bottom-left */}
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-cyan-400 opacity-50" />
        {/* Bottom-right */}
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-cyan-400 opacity-50" />
      </div>
    </div>
  );
};

export default GameSceneCyberpunk;
