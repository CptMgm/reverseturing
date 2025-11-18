import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import TableScene from './TableScene';
import GameUI from './GameUI';
import { useGameLogic } from '../hooks/useGameLogic';

const GameScene = ({ playerName, onComplete }) => {
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


  return (
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
          <PerspectiveCamera makeDefault position={[0, 3, 3]} fov={60} />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 8}
            maxAzimuthAngle={Math.PI / 4}
            minAzimuthAngle={-Math.PI / 4}
            target={[0, 1.0, -3.5]}
            maxDistance={5}
            minDistance={2}
            rotateSpeed={0.5}
            dampingFactor={0.05}
            enableDamping={true}
          />
          <fog attach="fog" args={['#e8f4ff', 20, 50]} />
          <TableScene 
            players={players}
            currentSpeaker={currentSpeaker}
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
    </div>
  );
};

export default GameScene;