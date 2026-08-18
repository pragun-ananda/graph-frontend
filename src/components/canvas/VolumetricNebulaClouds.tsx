import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const DOMAIN_CONFIG: Record<string, { color: string; secondaryColor: string; clusterIdx: number }> = {
  'AI & ML': { color: '#00f0ff', secondaryColor: '#0088ff', clusterIdx: 0 },
  'CS': { color: '#ff007f', secondaryColor: '#ff00c8', clusterIdx: 1 },
  'SYSTEMS': { color: '#9d4edd', secondaryColor: '#7928ca', clusterIdx: 2 },
  'MATH': { color: '#ffd60a', secondaryColor: '#ff9900', clusterIdx: 3 },
  'PHYSICS': { color: '#10b981', secondaryColor: '#00ff9d', clusterIdx: 4 },
  'CYBERSECURITY': { color: '#f43f5e', secondaryColor: '#ff2a5f', clusterIdx: 5 },
  'ARCH': { color: '#3b82f6', secondaryColor: '#60a5fa', clusterIdx: 6 }
};

const CATEGORY_NAMES = ['AI & ML', 'CS', 'SYSTEMS', 'MATH', 'PHYSICS', 'CYBERSECURITY', 'ARCH'];

const NebulaShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uOpacities: { value: [0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24] }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uOpacities[7];

    attribute float aSize;
    attribute float aPhase;
    attribute vec3 aColor;
    attribute float aClusterIdx;
    attribute vec3 aDrift;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      int cIdx = int(aClusterIdx + 0.5);
      float clusterOpacity = uOpacities[cIdx];

      // Subtle organic cosmic drift
      vec3 pos = position + aDrift * sin(uTime * 0.18 + aPhase);

      vColor = aColor;

      // Soft breathing modulation
      float pulse = sin(uTime * 0.35 + aPhase) * 0.12 + 0.88;
      vAlpha = clusterOpacity * pulse;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Dynamic size boost when cluster is illuminated
      float sizeMultiplier = mix(0.85, 1.35, smoothstep(0.2, 0.8, clusterOpacity));
      gl_PointSize = (aSize * sizeMultiplier) * (190.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 st = gl_PointCoord - vec2(0.5);
      float r = length(st) * 2.0;
      if (r > 1.0) discard;

      // Smooth exponential gaussian cloud puff falloff
      float gaussian = exp(-r * r * 4.0) * (1.0 - r);

      // Subtle procedural cloud filament swirl
      float swirl = sin(st.x * 6.0 + uTime * 0.2) * sin(st.y * 6.0 - uTime * 0.15) * 0.08 + 0.92;

      float finalAlpha = gaussian * vAlpha * swirl;
      if (finalAlpha <= 0.003) discard;

      gl_FragColor = vec4(vColor * 1.35, finalAlpha);
    }
  `
};

export default function VolumetricNebulaClouds() {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const topicNodes = useStore((state) => state.topicNodes);
  const selectedCategory = useStore((state) => state.selectedCategory);
  const hoveredCategory = useStore((state) => state.hoveredCategory);

  // Array of current smooth interpolated opacities per cluster
  const currentOpacities = useRef<number[]>([0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24]);

  // Compute cluster centroids, spreads, and generate organic nebula dust particles
  const { positions, colors, sizes, phases, clusterIndices, drifts, count } = useMemo(() => {
    const posList: number[] = [];
    const colorList: number[] = [];
    const sizeList: number[] = [];
    const phaseList: number[] = [];
    const clusterIdxList: number[] = [];
    const driftList: number[] = [];

    CATEGORY_NAMES.forEach((category) => {
      const config = DOMAIN_CONFIG[category];
      if (!config) return;

      const nodes = topicNodes.filter((n) => n.category === category);
      if (nodes.length === 0) return;

      // 1. Calculate centroid
      let sumX = 0, sumY = 0, sumZ = 0;
      nodes.forEach((n) => {
        sumX += n.coordinates[0];
        sumY += n.coordinates[1];
        sumZ += n.coordinates[2];
      });
      const cx = sumX / nodes.length;
      const cy = sumY / nodes.length;
      const cz = sumZ / nodes.length;

      // 2. Calculate spatial dispersion radius
      let maxDistSq = 0;
      nodes.forEach((n) => {
        const dx = n.coordinates[0] - cx;
        const dy = n.coordinates[1] - cy;
        const dz = n.coordinates[2] - cz;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq > maxDistSq) maxDistSq = dSq;
      });
      const clusterRadius = Math.max(3.5, Math.sqrt(maxDistSq) * 1.15 + 1.8);

      const primaryColor = new THREE.Color(config.color);
      const secondaryColor = new THREE.Color(config.secondaryColor);

      // 3. Generate ~320 volumetric cloud puff particles per category
      const particlesPerCluster = 320;

      for (let i = 0; i < particlesPerCluster; i++) {
        // Gaussian distributed radial distance from centroid
        const u1 = Math.max(0.0001, Math.random());
        const u2 = Math.max(0.0001, Math.random());
        const gaussianR = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * 0.45;
        const r = (Math.abs(gaussianR) * 0.75 + Math.random() * 0.35) * clusterRadius;

        // Uniform spherical direction
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2.0 * Math.random() - 1.0);

        const px = cx + r * Math.sin(phi) * Math.cos(theta);
        const py = cy + r * Math.sin(phi) * Math.sin(theta);
        const pz = cz + r * Math.cos(phi) - 0.8; // Placed slightly behind the nodes

        posList.push(px, py, pz);

        // Color variation blending primary and secondary cosmic tints
        const blendFactor = Math.random();
        const pColor = primaryColor.clone().lerp(secondaryColor, blendFactor * 0.5);
        colorList.push(pColor.r, pColor.g, pColor.b);

        // Size in world units (large billowing puffs)
        const sz = 32.0 + Math.random() * 45.0;
        sizeList.push(sz);

        // Phase for pulsation & drift
        phaseList.push(Math.random() * Math.PI * 2);

        // Cluster index (0 to 6)
        clusterIdxList.push(config.clusterIdx);

        // Organic drift vector
        driftList.push(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.5
        );
      }
    });

    return {
      positions: new Float32Array(posList),
      colors: new Float32Array(colorList),
      sizes: new Float32Array(sizeList),
      phases: new Float32Array(phaseList),
      clusterIndices: new Float32Array(clusterIdxList),
      drifts: new Float32Array(driftList),
      count: posList.length / 3
    };
  }, [topicNodes]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;

      // Determine active focused category (hover takes precedence over selection)
      const activeCat = hoveredCategory || (selectedCategory && selectedCategory !== 'ALL' ? selectedCategory : null);

      // Smoothly lerp opacities for all 7 clusters
      CATEGORY_NAMES.forEach((cat, idx) => {
        let targetOpacity = 0.24; // Baseline ambient glow

        if (activeCat) {
          if (cat === activeCat) {
            targetOpacity = 0.85; // Bright, vibrant luminous cloud
          } else {
            targetOpacity = 0.05; // Soft dimmed background
          }
        }

        currentOpacities.current[idx] = THREE.MathUtils.lerp(
          currentOpacities.current[idx],
          targetOpacity,
          delta * 5.0
        );
      });

      materialRef.current.uniforms.uOpacities.value = [...currentOpacities.current];
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={count}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aClusterIdx"
          count={count}
          array={clusterIndices}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aDrift"
          count={count}
          array={drifts}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[NebulaShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
