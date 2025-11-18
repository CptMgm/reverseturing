import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  N8AO,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

/**
 * Minimalist Sci-Fi Effects Composer
 * Clean, Apple-esque aesthetic with subtle bloom and ambient occlusion
 * Uses N8AO (more performant) instead of SSAO
 */
const EffectsComposerMinimalist = () => {
  const composerRef = useRef();
  const bloomRef = useRef();

  // Detect mobile for quality adjustments
  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  // Subtle animation for bloom
  useFrame((state) => {
    if (bloomRef.current) {
      // Very subtle pulsing
      const intensity = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      bloomRef.current.intensity = intensity;
    }
  });

  return (
    <EffectComposer ref={composerRef} multisampling={isMobile ? 0 : 8}>
      {/* Subtle Bloom - Clean glow on bright surfaces */}
      <Bloom
        ref={bloomRef}
        intensity={0.4}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.7}
        height={isMobile ? 200 : 300}
        opacity={1}
        blendFunction={BlendFunction.ADD}
      />

      {/* N8AO - High-performance ambient occlusion */}
      {!isMobile && (
        <N8AO
          aoRadius={5}
          intensity={1}
          quality={isMobile ? 'low' : 'medium'}
          halfRes={isMobile}
        />
      )}

      {/* Tone Mapping - ACES for cinematic look */}
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={256}
        whitePoint={4.0}
        middleGrey={0.6}
        minLuminance={0.01}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />

      {/* Very subtle vignette for focus */}
      <Vignette
        offset={0.5}
        darkness={0.3}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default EffectsComposerMinimalist;
