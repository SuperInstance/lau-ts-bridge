/**
 * Tests for lau-ts-bridge
 * Run with: npx tsx tests/test.ts (or node after compiling)
 */

// Inline test runner (no dependencies)
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; }
  else { failed++; console.error(`FAIL: ${msg}`); }
}

function assertApprox(a: number, b: number, eps: number, msg: string) {
  assert(Math.abs(a - b) < eps, `${msg}: ${a} ≈ ${b}`);
}

// --- Import the module (inline for testing) ---
// In a real project this would be: import { ... } from '../src/index';
// For portability, we duplicate the core logic here:

function vibeToColor(vibe: number) {
  const c = Math.max(-1, Math.min(1, vibe));
  if (c < 0) {
    const t = -c;
    return { r: Math.round(140 + (60-140)*t), g: Math.round(140 + (60-140)*t), b: Math.round(140 + (200-140)*t), a: 255 };
  }
  return { r: Math.round(140 + (255-140)*c), g: Math.round(140 + (200-140)*c), b: Math.round(140 + (50-140)*c), a: 255 };
}

function vibeToMaterial(vibe: number): string {
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

function vibeToHeight(vibe: number, base: number): number {
  return base + Math.floor(vibe * 16);
}

function checkConservation(before: number[][], after: number[][]): number {
  const sb = before.flat().reduce((a, b) => a + b, 0);
  const sa = after.flat().reduce((a, b) => a + b, 0);
  return Math.abs(sb - sa);
}

function classifyIteration(result: number, prev: number, iters: number): string {
  if (result > 0.8 && prev < 0.5) return 'breakthrough';
  if (result < 0.3 && iters > 3) return 'stuck';
  if (result > prev) return 'progress';
  return 'plateau';
}

const KID_NAMES: Record<string, string> = {
  conservation: 'Balance', jepa: 'Prediction', room_lifecycle: 'Growing Rooms',
  distillation: 'Compression', vibe: 'Vibe', deadband: 'Quiet Zone',
  fibonacci_growth: 'Spiral Growth', topology: 'Shape Memory',
  signal_chain: 'Signal Path', murmur: 'Whisper Network',
};

function noise2d(seed: number, x: number, z: number): number {
  let h = seed;
  h ^= (x * 374761393) | 0;
  h ^= (z * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return ((h & 0x7fffffff) / 0x7fffffff) * 2 - 1;
}

// === Tests ===

// Color mapping
const negColor = vibeToColor(-1.0);
assert(negColor.b > negColor.r, 'negative vibe should be blue-ish');

const posColor = vibeToColor(1.0);
assert(posColor.r > posColor.b, 'positive vibe should be warm');

const neuColor = vibeToColor(0.0);
assert(neuColor.r === 140 && neuColor.g === 140, 'neutral vibe should be gray');

// Material mapping
assert(vibeToMaterial(-0.8) === 'ice', 'very negative = ice');
assert(vibeToMaterial(0.0) === 'grass', 'zero = grass');
assert(vibeToMaterial(0.6) === 'crystal', 'positive = crystal');
assert(vibeToMaterial(0.95) === 'starblock', 'very positive = starblock');
assert(vibeToMaterial(0.8) === 'glowstone', 'high positive = glowstone');

// Height mapping
assert(vibeToHeight(0.5, 32) === 40, 'vibe 0.5 at base 32 = height 40');
assert(vibeToHeight(-0.5, 32) === 24, 'vibe -0.5 at base 32 = height 24');
assert(vibeToHeight(0.0, 64) === 64, 'neutral vibe = base height');

// Conservation
const field1 = [[1, 1], [1, 1]];
const field2 = [[1, 1], [1, 1]];
assertApprox(checkConservation(field1, field2), 0, 0.001, 'identical fields conserve');

const field3 = [[1, 1], [1, 0.9]];
assert(checkConservation(field1, field3) > 0, 'different fields have error');

// Iteration classification
assert(classifyIteration(0.95, 0.2, 1) === 'breakthrough', 'high result + low prev = breakthrough');
assert(classifyIteration(0.1, 0.5, 5) === 'stuck', 'low result + many iterations = stuck');
assert(classifyIteration(0.7, 0.3, 2) === 'progress', 'improvement = progress');
assert(classifyIteration(0.5, 0.5, 3) === 'plateau', 'same level = plateau');

// Kid names
assert(KID_NAMES['conservation'] === 'Balance', 'conservation = Balance');
assert(KID_NAMES['jepa'] === 'Prediction', 'jepa = Prediction');
assert(KID_NAMES['vibe'] === 'Vibe', 'vibe = Vibe');
assert(KID_NAMES['topology'] === 'Shape Memory', 'topology = Shape Memory');

// Noise determinism
const n1 = noise2d(42, 1.0, 2.0);
const n2 = noise2d(42, 1.0, 2.0);
assert(n1 === n2, 'same seed + coords = same noise');

const n3 = noise2d(42, 2.0, 1.0);
assert(n1 !== n3, 'different coords = different noise');

// Noise range
assert(n1 >= -1 && n1 <= 1, 'noise in range [-1, 1]');

// === Results ===
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
