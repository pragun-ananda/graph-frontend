import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

export default function PostProcessing() {
  const isOverloaded = useStore((state) => state.isOverloaded);
  const bloomIntensity = useStore((state) => state.bloomIntensity);

  // Dynamic values driven by overload state
  const currentBloom = isOverloaded ? bloomIntensity * 2.2 : bloomIntensity;
  const chromaOffset = new THREE.Vector2(
    isOverloaded ? 0.005 : 0.0015,
    isOverloaded ? 0.005 : 0.0015
  );

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={currentBloom}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={chromaOffset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        eskil={false}
        offset={0.25}
        darkness={0.8}
      />
      <Noise
        opacity={isOverloaded ? 0.12 : 0.04}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
