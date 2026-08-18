import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useStore } from '../../store/useStore';
import { TopicNode } from '../../types/telemetry';
import PostProcessing from './PostProcessing';

// Overarching base HSL hues per domain subgraph
const DOMAIN_HUES: Record<string, number> = {
  'AI & ML': 0.52,       // ~187° Electric Cyan
  'CS': 0.91,            // ~328° Hot Pink / Magenta
  'SYSTEMS': 0.75,       // ~270° Cosmic Purple / Violet
  'MATH': 0.14,          // ~50° Solar Electric Yellow / Gold
  'PHYSICS': 0.43,       // ~155° Matrix Emerald Green
  'CYBERSECURITY': 0.96, // ~345° Vivid Coral Crimson
  'ARCH': 0.60           // ~216° Deep Electric Blue
};

// Deterministically derive different shades/tints of the subgraph's overarching color
const getCategoryShade = (id: string, category: string): string => {
  const baseHue = DOMAIN_HUES[category] ?? 0.52;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Vary Saturation (78% to 100%) and Lightness (45% to 68%) for rich shades
  const sat = 0.78 + ((positiveHash % 100) / 100) * 0.22;
  const light = 0.45 + (((positiveHash >> 3) % 100) / 100) * 0.23;

  const color = new THREE.Color();
  color.setHSL(baseHue, sat, light);
  return '#' + color.getHexString();
};

// Derive distinct incoming (lighter/warmer) and outgoing (richer/electric) edge highlight shades correlated to the active node's color
const getIncomingEdgeColor = (activeColorHex: string): string => {
  const col = new THREE.Color(activeColorHex);
  const hsl = { h: 0, s: 0, l: 0 };
  col.getHSL(hsl);
  const incoming = new THREE.Color();
  incoming.setHSL((hsl.h + 0.04) % 1.0, Math.min(1.0, hsl.s * 0.9), Math.min(0.85, hsl.l + 0.22));
  return '#' + incoming.getHexString();
};

const getOutgoingEdgeColor = (activeColorHex: string): string => {
  const col = new THREE.Color(activeColorHex);
  const hsl = { h: 0, s: 0, l: 0 };
  col.getHSL(hsl);
  const outgoing = new THREE.Color();
  outgoing.setHSL((hsl.h - 0.04 + 1.0) % 1.0, Math.min(1.0, hsl.s * 1.05), Math.max(0.4, hsl.l - 0.06));
  return '#' + outgoing.getHexString();
};

// Calculate dynamic single-line font size to fit title perfectly without wrapping
const getSingleLineFontSize = (len: number): string => {
  if (len > 40) return 'text-[7.5px]';
  if (len > 32) return 'text-[8.5px]';
  if (len > 24) return 'text-[9.5px]';
  if (len > 16) return 'text-[10px]';
  return 'text-[11px]';
};

// Shader for Soft Radial Galactic Core Glow
const GalacticCoreGlowMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColorCore: { value: new THREE.Color('#ffc107') },  // Solar gold core
    uColorInner: { value: new THREE.Color('#00f0ff') }, // Cyan inner halo
    uColorOuter: { value: new THREE.Color('#4c1d95') }  // Deep cosmic violet outer halo
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
    uniform vec3 uColorCore;
    uniform vec3 uColorInner;
    uniform vec3 uColorOuter;
    varying vec2 vUv;

    void main() {
      vec2 st = vUv - vec2(0.5);
      float r = length(st) * 2.0;

      if (r >= 1.0) discard;

      // Soft parabolic & exponential falloff
      float coreGlow = smoothstep(1.0, 0.0, r);
      float intenseCore = pow(coreGlow, 3.2);
      float outerGlow = pow(coreGlow, 1.6);

      // Gentle breathing pulse
      float pulse = sin(uTime * 0.8) * 0.08 + 0.92;

      // Color gradient from central gold -> inner cyan -> outer deep violet
      vec3 color = mix(uColorOuter, uColorInner, smoothstep(0.8, 0.25, r));
      color = mix(color, uColorCore, intenseCore * 0.85);

      float alpha = outerGlow * 0.35 * pulse;

      gl_FragColor = vec4(color * 1.5, alpha);
    }
  `
};

function GalacticCoreGlow() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    if (meshRef.current) {
      meshRef.current.quaternion.copy(state.camera.quaternion); // Always face camera (billboard)
    }
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      ...GalacticCoreGlowMaterial,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, -2.5]} scale={[42, 42, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// Shader for Solar Wind Edge Energy Flow Particles
const SolarWindShaderMaterial = {
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    uniform float uTime;
    attribute vec3 aStart;
    attribute vec3 aEnd;
    attribute float aSpeed;
    attribute float aOffset;
    attribute float aSize;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Lerp progress along directed prerequisite vector (A -> B)
      float progress = fract(uTime * aSpeed + aOffset);
      vec3 currentPos = mix(aStart, aEnd, progress);

      vColor = aColor;

      // Soft parabolic alpha fade (fade in at start, peak at middle, fade out at end)
      vAlpha = sin(progress * 3.14159265);

      vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      gl_PointSize = aSize * (160.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      float intensity = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(vColor * 2.0, intensity * vAlpha * 0.95);
    }
  `
};

function SolarWindEnergyStreams() {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const topicNodes = useStore((state) => state.topicNodes);
  const selectedTopicId = useStore((state) => state.selectedTopicId);
  const hoveredTopicId = useStore((state) => state.hoveredTopicId);

  const activeId = selectedTopicId || hoveredTopicId;
  const activeNode = useMemo(() => topicNodes.find((n) => n.id === activeId), [topicNodes, activeId]);

  const activeNodeColorHex = useMemo(() => {
    if (!activeNode) return null;
    return getCategoryShade(activeNode.id, activeNode.category);
  }, [activeNode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, TopicNode>();
    topicNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [topicNodes]);

  const { starts, ends, speeds, offsets, sizes, colors, count } = useMemo(() => {
    const startList: number[] = [];
    const endList: number[] = [];
    const speedList: number[] = [];
    const offsetList: number[] = [];
    const sizeList: number[] = [];
    const colorList: number[] = [];

    const incomingCorrelatedCol = activeNodeColorHex ? new THREE.Color(getIncomingEdgeColor(activeNodeColorHex)) : null;
    const outgoingCorrelatedCol = activeNodeColorHex ? new THREE.Color(getOutgoingEdgeColor(activeNodeColorHex)) : null;

    topicNodes.forEach((source) => {
      const sourceColorHex = getCategoryShade(source.id, source.category);
      const sourceColor = new THREE.Color(sourceColorHex);

      source.unlocks.forEach((targetId) => {
        const target = nodeMap.get(targetId);
        if (target) {
          const photonsPerEdge = 3;

          for (let p = 0; p < photonsPerEdge; p++) {
            startList.push(...source.coordinates);
            endList.push(...target.coordinates);
            speedList.push(0.35 + Math.random() * 0.2);
            offsetList.push(p / photonsPerEdge + Math.random() * 0.08);

            let col = sourceColor;
            let sz = 0.5 + Math.random() * 0.3;

            if (activeId && activeNodeColorHex) {
              if (source.id === activeId) {
                // Outgoing unlocked energy stream correlated to active node's color
                col = outgoingCorrelatedCol ?? sourceColor;
                sz = 1.05;
              } else if (target.id === activeId) {
                // Incoming prerequisite energy stream correlated to active node's color
                col = incomingCorrelatedCol ?? sourceColor;
                sz = 1.05;
              } else {
                col = sourceColor;
                sz = 0.35;
              }
            }

            sizeList.push(sz);
            colorList.push(col.r, col.g, col.b);
          }
        }
      });
    });

    return {
      starts: new Float32Array(startList),
      ends: new Float32Array(endList),
      speeds: new Float32Array(speedList),
      offsets: new Float32Array(offsetList),
      sizes: new Float32Array(sizeList),
      colors: new Float32Array(colorList),
      count: startList.length / 3
    };
  }, [topicNodes, nodeMap, activeId, activeNodeColorHex]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aStart"
          count={count}
          array={starts}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aEnd"
          count={count}
          array={ends}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={count}
          array={speeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aOffset"
          count={count}
          array={offsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[SolarWindShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Shader for Anamorphic 4-Point Starlight Cross Flare
const StarlightGlintShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00f0ff') },
    uOpacity: { value: 0.85 }
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
      vec2 st = vUv - vec2(0.5);
      float r = length(st);

      // Anamorphic 4-point cross flare beams
      float horizontalBeam = smoothstep(0.4, 0.0, abs(st.y)) * smoothstep(0.5, 0.0, abs(st.x));
      float verticalBeam = smoothstep(0.4, 0.0, abs(st.x)) * smoothstep(0.5, 0.0, abs(st.y));
      
      // Secondary 45-degree diagonal cross spikes
      vec2 rotSt = vec2(st.x * 0.707 - st.y * 0.707, st.x * 0.707 + st.y * 0.707);
      float diag1 = smoothstep(0.3, 0.0, abs(rotSt.y)) * smoothstep(0.4, 0.0, abs(rotSt.x)) * 0.4;
      float diag2 = smoothstep(0.3, 0.0, abs(rotSt.x)) * smoothstep(0.4, 0.0, abs(rotSt.y)) * 0.4;

      float centerGlow = smoothstep(0.2, 0.0, r) * 1.5;
      float flare = max(max(horizontalBeam, verticalBeam), max(diag1, diag2)) + centerGlow;

      if (flare <= 0.01) discard;

      // Pulse modulation
      float pulse = sin(uTime * 3.5) * 0.15 + 0.85;
      vec3 finalColor = uColor * (1.8 + centerGlow * 2.0);

      gl_FragColor = vec4(finalColor, flare * uOpacity * pulse);
    }
  `
};

function AnamorphicStarGlint({ color, scale = 1.0, opacity = 0.95 }: { color: string; scale?: number; opacity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
    if (meshRef.current) {
      meshRef.current.quaternion.copy(state.camera.quaternion); // Always face camera (billboard)
    }
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      ...StarlightGlintShaderMaterial,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [color, opacity]);

  return (
    <mesh ref={meshRef} scale={[scale * 3.8, scale * 3.8, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// Shader for Deep Space Distant Starfield Background
const DeepSpaceShaderMaterial = {
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    uniform float uTime;
    attribute float aSize;
    attribute float aPhase;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Soft distance size attenuation
      gl_PointSize = aSize * (170.0 / -mvPosition.z);

      // Gentle deep-space twinkling
      float twinkle = sin(uTime * 1.5 + aPhase) * 0.25 + 0.75;
      vAlpha = twinkle;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      // Soft circular star point with radial glow
      float intensity = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(vColor, intensity * vAlpha * 0.75);
    }
  `
};

function DeepSpaceStarfield() {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const count = 4800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    const palette = [
      new THREE.Color('#ffffff'), // Pure brilliant white
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff4d6'), // Soft solar yellow
      new THREE.Color('#ffe8a3'), // Golden yellow star
      new THREE.Color('#f4f8ff')  // Subtle white-blue star
    ];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 70.0 + Math.random() * 50.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      sz[i] = Math.random() * 0.9 + 0.35;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.004;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[DeepSpaceShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const sharedSphereGeometry = new THREE.SphereGeometry(0.38, 16, 16);

// Interactive Knowledge Node Component with Well-Sized Single-Line Font Scaling
const KnowledgeNode = React.memo(({ node }: { node: TopicNode }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const selectedTopicId = useStore((state) => state.selectedTopicId);
  const hoveredTopicId = useStore((state) => state.hoveredTopicId);
  const setSelectedTopicId = useStore((state) => state.setSelectedTopicId);
  const setHoveredTopicId = useStore((state) => state.setHoveredTopicId);
  const selectedCategory = useStore((state) => state.selectedCategory);
  const searchQuery = useStore((state) => state.searchQuery);

  const isSelected = selectedTopicId === node.id;
  const isHovered = hoveredTopicId === node.id;
  const isCategoryMatched = !selectedCategory || selectedCategory === 'ALL' || node.category === selectedCategory;
  const isSearchMatched = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());

  const showLabel = isSelected || isHovered || (searchQuery.length > 0 && isSearchMatched);

  const nodeColor = useMemo(() => {
    if (!isCategoryMatched || !isSearchMatched) return '#334155';
    return getCategoryShade(node.id, node.category);
  }, [node.id, node.category, isCategoryMatched, isSearchMatched]);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
    if (meshRef.current) {
      const targetScale = isSelected ? 1.8 : isHovered ? 1.4 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 6.0);
    }
  });

  const handleNodeClick = (e: { stopPropagation?: () => void }) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedTopicId(node.id);
  };

  const glintScale = isSelected ? 1.6 : isHovered ? 1.1 : 0.38;
  const glintOpacity = isSelected ? 0.95 : isHovered ? 0.75 : 0.22;
  const emissiveVal = isSelected ? 2.4 : isHovered ? 1.4 : 0.55;

  return (
    <group position={node.coordinates}>
      {/* 4-Point Starlight Flare matched to node's category shade */}
      <AnamorphicStarGlint
        color={nodeColor}
        scale={glintScale}
        opacity={glintOpacity}
      />

      <mesh
        ref={meshRef}
        geometry={sharedSphereGeometry}
        frustumCulled={false}
        onClick={handleNodeClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredTopicId(node.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredTopicId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={emissiveVal}
          roughness={0.2}
          metalness={0.8}
          transparent={!isCategoryMatched || !isSearchMatched}
          opacity={!isCategoryMatched || !isSearchMatched ? 0.2 : 1.0}
        />
      </mesh>

      {/* Orbital ring for hovered or selected node */}
      {(isSelected || isHovered) && (
        <mesh ref={ringRef} frustumCulled={false}>
          <ringGeometry args={[0.5, 0.62, 24]} />
          <meshBasicMaterial color={nodeColor} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Well-Sized Single-Line HTML Label Tag (Never wraps, never cuts off) */}
      {showLabel && (
        <Html
          position={[0, 0.65, 0]}
          center
          distanceFactor={24}
          zIndexRange={[100, 0]}
          className="pointer-events-auto select-none cursor-pointer"
        >
          <div
            onClick={handleNodeClick}
            style={{
              backgroundColor: isSelected || isHovered ? nodeColor : undefined,
              borderColor: isSelected || isHovered ? nodeColor : undefined,
              boxShadow: isSelected
                ? `0 0 18px ${nodeColor}`
                : isHovered
                ? `0 0 12px ${nodeColor}`
                : undefined
            }}
            className={`px-3 py-1 rounded font-mono font-bold uppercase tracking-wider border transition-all duration-200 whitespace-nowrap ${getSingleLineFontSize(node.name.length)} ${
              isSelected
                ? 'text-slate-950 scale-105'
                : isHovered
                ? 'text-slate-950'
                : 'bg-[#080c16]/85 text-slate-200 border-white/10 backdrop-blur-md opacity-90 hover:border-[#00f0ff]'
            }`}
          >
            <span>{node.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
});

// Render 3D Directed Prerequisite & Unlocked Edges correlated to the active node's color
function KnowledgeGraphEdges() {
  const topicNodes = useStore((state) => state.topicNodes);
  const selectedTopicId = useStore((state) => state.selectedTopicId);
  const hoveredTopicId = useStore((state) => state.hoveredTopicId);

  const activeId = selectedTopicId || hoveredTopicId;
  const activeNode = useMemo(() => topicNodes.find((n) => n.id === activeId), [topicNodes, activeId]);

  const activeNodeColorHex = useMemo(() => {
    if (!activeNode) return null;
    return getCategoryShade(activeNode.id, activeNode.category);
  }, [activeNode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, TopicNode>();
    topicNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [topicNodes]);

  const edges = useMemo(() => {
    const edgeList: {
      start: [number, number, number];
      end: [number, number, number];
      color: string;
      lineWidth: number;
      opacity: number;
    }[] = [];

    const visited = new Set<string>();

    const incomingCorrelatedCol = activeNodeColorHex ? getIncomingEdgeColor(activeNodeColorHex) : '#ffaa00';
    const outgoingCorrelatedCol = activeNodeColorHex ? getOutgoingEdgeColor(activeNodeColorHex) : '#00ff9d';

    topicNodes.forEach((source) => {
      source.unlocks.forEach((targetId) => {
        const target = nodeMap.get(targetId);
        if (target) {
          const key = `${source.id}->${target.id}`;
          if (!visited.has(key)) {
            visited.add(key);

            let color = 'rgba(255, 255, 255, 0.08)';
            let lineWidth = 0.7;
            let opacity = 0.2;

            if (activeNode && activeNodeColorHex) {
              if (source.id === activeNode.id) {
                // Outgoing unlocked edge correlated to active node's color
                color = outgoingCorrelatedCol;
                lineWidth = 2.6;
                opacity = 0.95;
              } else if (target.id === activeNode.id) {
                // Incoming prerequisite edge correlated to active node's color
                color = incomingCorrelatedCol;
                lineWidth = 2.6;
                opacity = 0.95;
              }
            }

            edgeList.push({
              start: source.coordinates,
              end: target.coordinates,
              color,
              lineWidth,
              opacity
            });
          }
        }
      });
    });

    return edgeList;
  }, [topicNodes, nodeMap, activeNode, activeNodeColorHex]);

  return (
    <group>
      {edges.map((edge, idx) => (
        <Line
          key={idx}
          points={[edge.start, edge.end]}
          color={edge.color}
          lineWidth={edge.lineWidth}
          transparent
          opacity={edge.opacity}
        />
      ))}
    </group>
  );
}

// Camera Rig: Smooth cinematic lerp for node zoom-in and homepage full-graph overview
function CameraRig({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl> }) {
  const { camera } = useThree();
  const topicNodes = useStore((state) => state.topicNodes);
  const selectedTopicId = useStore((state) => state.selectedTopicId);
  const zoomLevel = useStore((state) => state.zoomLevel);

  const prevSelectedId = useRef<string | null>(null);
  const isAnimating = useRef<boolean>(false);

  useEffect(() => {
    if (selectedTopicId !== prevSelectedId.current) {
      prevSelectedId.current = selectedTopicId;
      isAnimating.current = true;
    }
  }, [selectedTopicId]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isAnimating.current) {
      const selectedNode = topicNodes.find((n) => n.id === selectedTopicId);

      if (selectedNode) {
        // Zoom into selected node
        const [nx, ny, nz] = selectedNode.coordinates;
        const targetPos = new THREE.Vector3(nx, ny, nz);
        const camTargetPos = new THREE.Vector3(nx, ny + 0.4, nz + 8.5 / Math.max(0.5, zoomLevel));

        controls.target.lerp(targetPos, delta * 7.0);
        camera.position.lerp(camTargetPos, delta * 7.0);
        controls.update();

        if (controls.target.distanceTo(targetPos) < 0.05 && camera.position.distanceTo(camTargetPos) < 0.1) {
          isAnimating.current = false;
        }
      } else {
        // Zoom out to homepage full graph overview centered in screen
        const targetPos = new THREE.Vector3(0, 0, 0);
        const camTargetPos = new THREE.Vector3(0, 0, 52.0 / Math.max(0.3, zoomLevel));

        controls.target.lerp(targetPos, delta * 5.0);
        camera.position.lerp(camTargetPos, delta * 5.0);
        controls.update();

        if (controls.target.distanceTo(targetPos) < 0.05 && camera.position.distanceTo(camTargetPos) < 0.1) {
          isAnimating.current = false;
        }
      }
    }
  });

  return null;
}

export default function SceneCanvas() {
  const topicNodes = useStore((state) => state.topicNodes);
  const setSelectedTopicId = useStore((state) => state.setSelectedTopicId);
  const zoomIn = useStore((state) => state.zoomIn);
  const zoomOut = useStore((state) => state.zoomOut);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    };

    const container = document.getElementById('canvas-viewport');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoomIn, zoomOut]);

  return (
    <div
      id="canvas-viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => setSelectedTopicId(null)}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 52.0]} fov={60} />
        <OrbitControls
          makeDefault
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={1.0}
          panSpeed={1.2}
          zoomSpeed={0.9}
          screenSpacePanning
        />
        <CameraRig controlsRef={controlsRef} />
        <ambientLight intensity={0.6} />
        <pointLight position={[15, 15, 15]} intensity={2.0} color="#00f0ff" />
        <pointLight position={[-15, -15, -15]} intensity={1.5} color="#00ff9d" />
        
        {/* Deep Space Background Distant Starfield Layer */}
        <DeepSpaceStarfield />

        <KnowledgeGraphEdges />

        {/* Directional Energy Flow Particles along Prerequisite Edges (Solar Wind) */}
        <SolarWindEnergyStreams />

        {topicNodes.map((node) => (
          <KnowledgeNode key={node.id} node={node} />
        ))}
        
        <PostProcessing />
      </Canvas>
    </div>
  );
}
