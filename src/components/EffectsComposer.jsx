import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const EffectsComposerCyberpunk = ({ currentSpeaker, players }) => {
  const composerRef = useRef();
  const bloomRef = useRef();
  const chromaticRef = useRef();

  // Get position of current speaker for DOF focus
  const speakerPosition = players?.find(p => p.id === currentSpeaker)?.position || [0, 1.5, 0];

  // Animate effects
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Subtle chromatic aberration pulse
    if (chromaticRef.current) {
      const aberration = 0.0015 + Math.sin(time * 2) * 0.0005;
      chromaticRef.current.offset.set(aberration, aberration);
    }

    // Bloom intensity varies with time
    if (bloomRef.current) {
      const intensity = 1.5 + Math.sin(time * 1.5) * 0.2;
      bloomRef.current.intensity = intensity;
    }
  });

  return (
    <EffectComposer ref={composerRef} multisampling={8}>
      {/* Bloom - Essential for neon glow effect */}
      <Bloom
        ref={bloomRef}
        intensity={1.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        height={300}
        opacity={1}
        blendFunction={BlendFunction.ADD}
      />

      {/* Chromatic Aberration - Subtle digital glitch */}
      <ChromaticAberration
        ref={chromaticRef}
        offset={new THREE.Vector2(0.002, 0.002)}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Film Grain/Noise - Analog camera aesthetic */}
      <Noise
        opacity={0.08}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* Vignette - Darkening at edges */}
      <Vignette
        offset={0.3}
        darkness={0.5}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Depth of Field - Focus on current speaker (optional, can be heavy on performance) */}
      {currentSpeaker && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={3}
          height={480}
        />
      )}
    </EffectComposer>
  );
};

export default EffectsComposerCyberpunk;
