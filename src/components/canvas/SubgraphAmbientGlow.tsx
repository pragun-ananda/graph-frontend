import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const DOMAIN_GLOW_CONFIG: Record<string, { color: string; clusterIdx: number }> = {
  'AI & ML': { color: '#00f0ff', clusterIdx: 0 },
  'CS': { color: '#ff007f', clusterIdx: 1 },
  'SYSTEMS': { color: '#9d4edd', clusterIdx: 2 },
  'MATH': { color: '#ffd60a', clusterIdx: 3 },
  'PHYSICS': { color: '#10b981', clusterIdx: 4 },
  'CYBERSECURITY': { color: '#f43f5e', clusterIdx: 5 },
  'ARCH': { color: '#3b82f6', clusterIdx: 6 }
};

const CATEGORIES = ['AI & ML', 'CS', 'SYSTEMS', 'MATH', 'PHYSICS', 'CYBERSECURITY', 'ARCH'];

const GlowShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00f0ff') },
    uOpacity: { value: 0.07 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec2 st = (vUv - vec2(0.5)) * 2.0;
      float d = length(st);
      if (d > 1.0) discard;

      // Ultra-soft, whisper-light exponential gaussian radial falloff
      float glow = exp(-d * d * 3.2) * pow(1.0 - d, 1.3);

      // Subtle slow cosmic breathing (0.92 to 1.08)
      float pulse = sin(uTime * 0.4) * 0.08 + 0.92;

      float finalAlpha = glow * uOpacity * pulse;
      if (finalAlpha <= 0.001) discard;

      gl_FragColor = vec4(uColor * 1.3, finalAlpha);
    }
  `
};

interface ClusterGlowProps {
  category: string;
  centroid: [number, number, number];
  radius: number;
}

function SingleClusterGlow({ category, centroid, radius }: ClusterGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const currentOpacity = useRef<number>(0.07);

  const selectedCategory = useStore((state) => state.selectedCategory);
  const hoveredCategory = useStore((state) => state.hoveredCategory);

  const colorHex = DOMAIN_GLOW_CONFIG[category]?.color ?? '#00f0ff';
  const diameter = Math.max(16.0, radius * 2.5);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      ...GlowShaderMaterial,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) },
        uOpacity: { value: 0.07 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [colorHex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Always face camera (billboard orientation)
      meshRef.current.quaternion.copy(state.camera.quaternion);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;

      // Determine active highlighted category (hover takes precedence over selection)
      const activeCat = hoveredCategory || (selectedCategory && selectedCategory !== 'ALL' ? selectedCategory : null);

      let targetOpacity = 0.07; // Whisper-soft transparent ambient glow

      if (activeCat) {
        if (activeCat === category) {
          targetOpacity = 0.24; // Soft luminous highlight
        } else {
          targetOpacity = 0.015; // Softly dimmed background
        }
      }

      currentOpacity.current = THREE.MathUtils.lerp(
        currentOpacity.current,
        targetOpacity,
        delta * 5.0
      );

      materialRef.current.uniforms.uOpacity.value = currentOpacity.current;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[centroid[0], centroid[1], centroid[2] - 1.2]}
      scale={[diameter, diameter, 1]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default function SubgraphAmbientGlow() {
  const topicNodes = useStore((state) => state.topicNodes);

  // Compute cluster centroids and radius per domain
  const clusters = useMemo(() => {
    return CATEGORIES.map((category) => {
      const nodes = topicNodes.filter((n) => n.category === category);
      if (nodes.length === 0) return null;

      let sumX = 0, sumY = 0, sumZ = 0;
      nodes.forEach((n) => {
        sumX += n.coordinates[0];
        sumY += n.coordinates[1];
        sumZ += n.coordinates[2];
      });

      const cx = sumX / nodes.length;
      const cy = sumY / nodes.length;
      const cz = sumZ / nodes.length;

      let maxDistSq = 0;
      nodes.forEach((n) => {
        const dx = n.coordinates[0] - cx;
        const dy = n.coordinates[1] - cy;
        const dz = n.coordinates[2] - cz;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq > maxDistSq) maxDistSq = dSq;
      });

      const radius = Math.sqrt(maxDistSq);

      return {
        category,
        centroid: [cx, cy, cz] as [number, number, number],
        radius
      };
    }).filter(Boolean) as { category: string; centroid: [number, number, number]; radius: number }[];
  }, [topicNodes]);

  return (
    <group>
      {clusters.map((c) => (
        <SingleClusterGlow
          key={c.category}
          category={c.category}
          centroid={c.centroid}
          radius={c.radius}
        />
      ))}
    </group>
  );
}
