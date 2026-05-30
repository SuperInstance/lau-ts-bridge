/**
 * Lau Bridge TypeScript — connects PLATO backend to Lau game frontend.
 * 
 * This is the polyglot bridge. Rust does the heavy lifting,
 * TypeScript talks to the browser and the game engine.
 * 
 * The vibe is ONE number. Everything follows.
 */

// === Core Types ===

/** The mono-dimensional vibe scalar. Everything follows from this. */
export type Vibe = number; // -1.0 to 1.0

/** A point in the game world */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A packed RGBA color (matches Rust's PackedColor) */
export interface Color {
  r: number; // 0-255
  g: number;
  b: number;
  a: number;
}

// === Vibe → Visual ===

/** Map a vibe scalar to a color */
export function vibeToColor(vibe: Vibe): Color {
  const clamped = Math.max(-1, Math.min(1, vibe));
  if (clamped < 0) {
    const t = -clamped;
    return lerpColor({ r: 140, g: 140, b: 140, a: 255 }, { r: 60, g: 60, b: 200, a: 255 }, t);
  }
  return lerpColor({ r: 140, g: 140, b: 140, a: 255 }, { r: 255, g: 200, b: 50, a: 255 }, clamped);
}

/** Map a vibe scalar to height offset */
export function vibeToHeight(vibe: Vibe, baseHeight: number): number {
  return baseHeight + Math.floor(vibe * 16);
}

/** Map a vibe scalar to a material name */
export function vibeToMaterial(vibe: Vibe): string {
  if (vibe < -0.7) return 'ice';
  if (vibe < -0.3) return 'water';
  if (vibe < -0.1) return 'stone';
  if (vibe < 0.1) return 'grass';
  if (vibe < 0.3) return 'wood';
  if (vibe < 0.5) return 'sand';
  if (vibe < 0.7) return 'crystal';
  if (vibe < 0.9) return 'glowstone';
  return 'starblock';
}

function lerpColor(a: Color, b: Color, t: number): Color {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: Math.round(a.a + (b.a - a.a) * t),
  };
}

// === Conservation ===

/** Check conservation across a vibe field */
export function checkConservation(before: number[][], after: number[][]): number {
  const sumBefore = before.flat().reduce((a, b) => a + b, 0);
  const sumAfter = after.flat().reduce((a, b) => a + b, 0);
  return Math.abs(sumBefore - sumAfter);
}

/** Generate a radial vibe field */
export function radialField(size: number, centerVibe: number, decay: number): number[][] {
  const half = (size - 1) / 2;
  return Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, z) => {
      const dx = x - half;
      const dz = z - half;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return centerVibe * Math.exp(-dist * decay);
    })
  );
}

// === Tutor Bridge ===

export type TeachingKind =
  | 'celebration' | 'redirect' | 'connection' | 'hint'
  | 'collaborate' | 'deepen' | 'levelup' | 'patience';

export interface TeachingMoment {
  tick: number;
  topic: string;
  kind: TeachingKind;
  message: string;
  difficulty: number;
}

export type IterationOutcome = 'breakthrough' | 'progress' | 'plateau' | 'stuck';

/** Classify an iteration result */
export function classifyIteration(
  result: number,
  previousLevel: number,
  iterations: number
): IterationOutcome {
  if (result > 0.8 && previousLevel < 0.5) return 'breakthrough';
  if (result < 0.3 && iterations > 3) return 'stuck';
  if (result > previousLevel) return 'progress';
  return 'plateau';
}

// === Game Event Bridge ===

export type PlatoConcept =
  | 'conservation' | 'jepa' | 'room_lifecycle' | 'distillation'
  | 'vibe' | 'deadband' | 'fibonacci_growth' | 'topology'
  | 'signal_chain' | 'murmur';

const KID_NAMES: Record<PlatoConcept, string> = {
  conservation: 'Balance',
  jepa: 'Prediction',
  room_lifecycle: 'Growing Rooms',
  distillation: 'Compression',
  vibe: 'Vibe',
  deadband: 'Quiet Zone',
  fibonacci_growth: 'Spiral Growth',
  topology: 'Shape Memory',
  signal_chain: 'Signal Path',
  murmur: 'Whisper Network',
};

export function kidName(concept: PlatoConcept): string {
  return KID_NAMES[concept];
}

export interface GameEvent {
  type: 'weather_changed' | 'structure_built' | 'quest_progress'
    | 'pet_evolved' | 'achievement_unlocked' | 'music_changed';
  data: Record<string, unknown>;
}

/** Translate a PLATO vibe change to game events */
export function platoVibeToGame(vibe: Vibe, roomId: string): GameEvent[] {
  const events: GameEvent[] = [];
  
  // Weather follows vibe
  if (vibe > 0.7) {
    events.push({ type: 'weather_changed', data: { room: roomId, to: 'sunny' } });
  } else if (vibe < -0.5) {
    events.push({ type: 'weather_changed', data: { room: roomId, to: 'stormy' } });
  } else if (vibe > 0.3) {
    events.push({ type: 'weather_changed', data: { room: roomId, to: 'golden_hour' } });
  }
  
  // Music follows vibe
  const bpm = Math.round(vibe * 40 + 80);
  events.push({ type: 'music_changed', data: { room: roomId, bpm, mood: vibe > 0 ? 'upbeat' : 'contemplative' } });
  
  return events;
}

// === Voxel Chunk (matches Rust WorldGenerator) ===

export interface Chunk {
  x: number;
  z: number;
  heights: number[][];    // 16x16
  biomes: string[][];      // 16x16
}

export interface WorldConfig {
  seed: number;
  chunkRadius: number;
  seaLevel: number;
  biomeScale: number;
}

/** Simple hash-based noise (matches Rust implementation) */
export function noise2d(seed: number, x: number, z: number): number {
  let h = seed;
  h ^= (x * 374761393) | 0;
  h ^= (z * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return ((h & 0x7fffffff) / 0x7fffffff) * 2 - 1;
}

/** Fractal Brownian motion */
export function fbm(seed: number, x: number, z: number, octaves: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2d(seed + i * 31, x * frequency, z * frequency) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxAmp;
}
