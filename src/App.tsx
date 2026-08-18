import React, { useEffect } from 'react';
import SceneCanvas from './components/canvas/SceneCanvas';
import PostProcessing from './components/canvas/PostProcessing';
import TelemetryHUD from './components/hud/TelemetryHUD';
import { useStore } from './store/useStore';

export default function App() {
  const store = useStore();

  // Mouse / Pointer tracker updating global normalized telemetry coordinates
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normalizedX = (event.clientX / innerWidth) * 2 - 1;
      const normalizedY = -(event.clientY / innerHeight) * 2 + 1;

      store.setMousePosition({
        x: event.clientX,
        y: event.clientY,
        normalizedX,
        normalizedY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [store]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid triggering when focused inside input elements
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        store.toggleCameraFocus();
      } else if (event.code === 'KeyH') {
        store.toggleHudVisibility();
      } else if (event.code === 'KeyO') {
        const nextState = !store.isOverloaded;
        store.setIsOverloaded(nextState);
        store.setSystemStatus(nextState ? 'OVERLOADED' : 'OPTIMAL');
      } else if (event.code === 'KeyR') {
        store.resetState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  return (
    <div className="relative w-full h-screen bg-[#050811] overflow-hidden select-none">
      {/* Layer z-0: 3D Scene Viewport & WebGL Post Processing */}
      <div className="absolute inset-0 z-0">
        <SceneCanvas />
      </div>

      {/* Layer z-10: CRT Scanlines, Screen Vignette & Grain Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 crt-scanlines crt-vignette opacity-80" />

      {/* Layer z-20: HUD & Telemetry UI */}
      <TelemetryHUD />
    </div>
  );
}
