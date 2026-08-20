import * as THREE from 'three';

export const DOMAIN_HUES: Record<string, number> = {
  'AI & ML': 0.50,       // Laser Cyan (#00FFFF)
  'CS': 0.916,           // Neon Hot Pink (#FF007F)
  'SYSTEMS': 0.75,       // Synapse Purple (#7928CA)
  'MATH': 0.138,         // Overclock Yellow (#FFD600)
  'PHYSICS': 0.40,       // Tritium Green (#00FF66)
  'CYBERSECURITY': 0.966,// Hazard Plasma Red (#FF0033)
  'ARCH': 0.597          // Ion Engine Blue (#0066FF)
};

export const getCategoryShade = (id: string, category: string): string => {
  const baseHue = DOMAIN_HUES[category] ?? 0.50;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // High-Tech Cyberdeck & Tactical HUD: High saturation, laser-bright luminosity
  const sat = 0.88 + ((positiveHash % 100) / 100) * 0.12;
  const light = 0.48 + (((positiveHash >> 3) % 100) / 100) * 0.16;

  const color = new THREE.Color();
  color.setHSL(baseHue, sat, light);
  return '#' + color.getHexString();
};
