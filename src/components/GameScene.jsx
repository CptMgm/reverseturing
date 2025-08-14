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
    votes,
    isProcessing,
    players,
    handleHumanResponse,
    handleHumanVote
  } = useGameLogic(playerName, onComplete);


  return (
    <div className="min-h-screen bg-black relative">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}>
          <PerspectiveCamera makeDefault position={[0, 2.2, 1.5]} fov={70} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 8}
            maxAzimuthAngle={Math.PI / 3}
            minAzimuthAngle={-Math.PI / 3}
            target={[0, 1.0, -3.5]}
            maxDistance={3.0}
            minDistance={2.0}
            rotateSpeed={0.4}
            dampingFactor={0.08}
            enableDamping={true}
          />
          <fog attach="fog" args={['#1a1a1a', 15, 35]} />
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
        votes={votes}
        onHumanVote={handleHumanVote}
      />
    </div>
  );
};

export default GameScene;