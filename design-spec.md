# Telemetry HUD & 3D Engine Architecture & Design Specification

This document serves as the master design system contract and subagent implementation manifest for the high-performance futuristic interactive telemetry web application.

---

## 1. Design System & Tokens

### Color Palette

| Token Name | Hex / RGBA Code | Usage & Context |
| :--- | :--- | :--- |
| **Void Background** | `#050811` | Deep obsidian backdrop for WebGL canvas canvas clear color & ambient CSS fallback |
| **Neon Cyan (Primary)** | `#00f0ff` | Primary active borders, locked target reticles, glow highlights, active state indicators |
| **Cyan Glow (Subtle)** | `rgba(0, 240, 255, 0.15)` | Subtle panel box shadows, active tab backdrops, audio visualizer bars |
| **Warning Amber** | `#ffaa00` | Warning telemetry, degraded grid power level, tracking phase indicators |
| **Critical Red / Overload** | `#ff3366` | Overloaded state alert, emergency status warnings, high CPU spike alerts |
| **Matrix Emerald** | `#00ff9d` | Optimal system status badge, normal frequency readout, sub-graph vector indicators |
| **Subtle Glass Border** | `rgba(255, 255, 255, 0.08)` | Default 1px high-tech panel boundaries, divider lines |
| **Active Glass Border** | `rgba(0, 240, 255, 0.35)` | Hover state and active panel border highlights |
| **Glass Surface Dark** | `rgba(8, 12, 22, 0.70)` | Panel container fill with `backdrop-filter: blur(12px)` |

### Typography Standards

| Role | Font Family | Size Range | Weight / Tracking | Primary Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Monospace Telemetry** | `'JetBrains Mono', 'Fira Code', monospace` | `10px` - `13px` | 400/500, `letter-spacing: 0.1em` (`tracking-widest`) | Telemetry data, coordinates, RAM/CPU stream, uptime counter, status codes |
| **Display Headers** | `'Orbitron', 'Syne', sans-serif` | `16px` - `32px` | 700/800, `letter-spacing: 0.08em` (`uppercase`) | Main HUD title, section headings, mode switches, modal header titles |
| **Interface Labels** | `'Inter', sans-serif` | `11px` - `14px` | 500/600, `letter-spacing: 0.05em` | Button labels, slider text, navigation tab titles |

### Component Layering Rules (Z-Indices)

```
+-----------------------------------------------------------------------+
|  Z-30: Modal / Diagnostic Detail Layer / Keybinding Overlay           |
+-----------------------------------------------------------------------+
|  Z-20: HUD Overlay & Telemetry UI (Top Bar, Left Feed, Controls)     |
|         [Container: fixed inset-0 pointer-events-none]                |
+-----------------------------------------------------------------------+
|  Z-10: CRT Scanlines / Grain Noise Texture / Screen Vignette          |
+-----------------------------------------------------------------------+
|  Z-0:  3D Viewport / React Three Fiber Canvas & Post Processing       |
+-----------------------------------------------------------------------+
```

* **`z-0` Canvas Viewport**: R3F `<Canvas>` mounting geometry, camera rigs, and light arrays.
* **`z-10` Post-processing & Texture Overlay**: Fixed overlay containing noise texture, scanline SVG/CSS pattern, and CRT edge shading.
* **`z-20` Telemetry HUD Layer**: High-tech HUD layer with `pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6`. Interactive panels MUST explicitly declare `pointer-events-auto`.
* **`z-30` Modal & Focus Layer**: Diagnostic modals, target details, full-screen overrides, keybindings help.

---

## 2. Modular Subagent Task Manifests

Each subagent MUST operate strictly within its assigned file boundary, adhering strictly to imports, shared store contracts in `src/store/useStore.ts`, and performance constraints.

---

### Subagent A: 3D Scene / Canvas
* **Target File**: `src/components/canvas/SceneCanvas.tsx`
* **Dependencies / Imports**:
  * `react`, `@react-three/fiber`, `@react-three/drei`, `three`
  * `src/store/useStore.ts`
* **State Consumed**:
  * `mousePosition` (`normalizedX`, `normalizedY`)
  * `systemStatus` (`'OPTIMAL' | 'DEGRADED' | 'OVERLOADED' | 'OFFLINE' | 'STANDBY'`)
  * `particleDensity` (`number`)
  * `audioData` (`bass`, `mid`, `treble`, `volume`)
  * `cameraFocus` (`boolean`)
* **Technical & Performance Mandates**:
  1. **Strict Zero-Rerender Animation Loop**: Do NOT put per-frame values in React state (`useState`). Use `useFrame` with `useRef` (e.g. `useRef<THREE.Points>`, `useRef<THREE.Mesh>`) for all motion logic.
  2. **Geometry & Material Instantiation**: Instantiate geometries and `ShaderMaterial` / `PointsMaterial` once. Modify uniform values directly on each frame inside `useFrame`.
  3. **Visual Elements**:
     * Morphing 3D particle cloud / geometry lattice (using `BufferGeometry` with dynamic position/color attributes or custom GLSL vertex distortion).
     * Smooth rotation and tilt driven by `mousePosition.normalizedX` and `mousePosition.normalizedY`.
     * Particle size and color modulation dynamically shifting when `systemStatus === 'OVERLOADED'` or based on audio `bass` levels.
  4. **Canvas Setup**: Container must fill `w-full h-full`. Pass `dpr={[1, 2]}` and camera parameters to R3F `<Canvas>`.
  5. **Export**: Must default export `SceneCanvas`. Do NOT render any DOM HUD elements inside this file.

---

### Subagent B: HUD Overlay & Telemetry
* **Target File**: `src/components/hud/TelemetryHUD.tsx`
* **Dependencies / Imports**:
  * `react`, `framer-motion`, `lucide-react`
  * `src/store/useStore.ts`
* **State Consumed & Mutated**:
  * Consumes: `systemStatus`, `activeMode`, `diagnostics`, `targetLocks`, `activeTargetId`, `particleDensity`, `audioData`, `hudVisible`, `isOverloaded`, `gridPowerLevel`
  * Mutates via actions: `setActiveMode`, `setParticleDensity`, `setSystemStatus`, `setActiveTargetId`, `resetState`, `setGridPowerLevel`, `setIsOverloaded`
* **Technical & Design Mandates**:
  1. **Root Wrapper Pointer Rules**:
     * Root wrapper: `<div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6">`
     * Every child interactive panel/button/slider MUST have `pointer-events-auto`.
  2. **Panels Layout**:
     * **Top Bar**: System uptime clock (`HH:MM:SS`), Grid frequency badge (`60.02 Hz`), System status pill with pulsing indicator, Mini audio waveform/meter.
     * **Left Panel**: Collapsible diagnostic feed showing CPU/RAM usage bars, target lock coordinates list with interactive selection.
     * **Bottom Center Control Deck**: Mode switches (`DIAGNOSTIC`, `SURVEILLANCE`, `SIMULATION`, `QUANTUM`), Particle density interactive slider, Emergency overload toggle, Reset state trigger.
  3. **Aesthetics & Micro-Interactions**:
     * JetBrains Mono typography for all numerical telemetry readouts.
     * 1px high-tech glass borders (`border-white/10` with cyan corner accents).
     * Framer Motion hover animations, holographic flicker on tab click, magnetic button response.
  4. **Export**: Must default export `TelemetryHUD`.

---

### Subagent C: Audio / Audio-reactive Engine
* **Target File**: `src/utils/audioEngine.ts`
* **Dependencies / Imports**:
  * Web Audio API (`AudioContext`, `AnalyserNode`, `OscillatorNode`, `GainNode`)
  * `src/store/useStore.ts`
* **Responsibilities & Features**:
  1. **Web Audio Analyzer Singleton**: Class or module managing an `AudioContext` and `AnalyserNode` with `fftSize = 128`.
  2. **Procedural Synth & Audio Generator**: Generates futuristic ambient synth pads, pulse hums, and low-frequency oscillations (LFO) when custom audio files are not uploaded.
  3. **Frame Analysis Loop**:
     * Extracts frequency array (`getByteFrequencyData`).
     * Calculates `bass` (0–40 Hz), `mid` (40–200 Hz), and `treble` (200–500 Hz) normalized float values (0.0 to 1.0).
     * Updates Zustand store via `useStore.getState().setAudioData(...)` efficiently without React component re-render overhead.
  4. **Controls Exported**:
     * `initAudioEngine()`: Initializes AudioContext on first user interaction.
     * `toggleAudioPlayback()`: Starts/stops ambient sound generator.
     * `setMasterVolume(level: number)`: Updates gain node.
  5. **Export**: Export named singleton or engine functions (`audioEngine`).

---

### Subagent D: Custom GLSL Shaders / Post-Processing
* **Target File**: `src/components/canvas/PostProcessing.tsx`
* **Dependencies / Imports**:
  * `react`, `@react-three/postprocessing`, `postprocessing`, `three`
  * `src/store/useStore.ts`
* **State Consumed**:
  * `isOverloaded` (`boolean`)
  * `bloomIntensity` (`number`)
  * `systemStatus` (`SystemStatus`)
* **Technical & Performance Mandates**:
  1. **Effect Pipeline**:
     * `<EffectComposer>` with high-efficiency pass configurations.
     * **Selective Bloom**: Luminance threshold ~0.2, intensity driven by `bloomIntensity` (amplified when `isOverloaded` is true).
     * **Chromatic Aberration**: Subtle optical dispersion (`offset={[0.002, 0.002]}`). Increases distortion on overloaded state.
     * **Vignette / CRT Scanlines**: Edge darkening and subtle scanline lines for high-tech terminal feel.
  2. **Performance Constraints**:
     * Single-pass or optimized dual-pass effects only. Avoid heavy multi-pass blurs.
  3. **Mount Context**:
     * Must be designed to mount directly inside R3F `<Canvas>` (parent element is canvas context).
  4. **Export**: Must export `PostProcessing` component.

---

## 3. Global Integrator Specifications (App Assembly)

* **Target File**: `src/App.tsx` and `src/main.tsx`
* **Responsibilities**:
  1. Mount `SceneCanvas` & `PostProcessing` at `z-0`.
  2. Mount CRT Scanline / Noise Overlay at `z-10`.
  3. Mount `TelemetryHUD` at `z-20`.
  4. Implement global pointer movement listener updating `mousePosition` in `useStore`.
  5. Implement global keyboard shortcuts:
     * `Space`: Toggle camera focus lock (`toggleCameraFocus`).
     * `KeyH`: Toggle HUD visibility (`toggleHudVisibility`).
     * `KeyO`: Toggle system overload simulation (`setIsOverloaded`).
