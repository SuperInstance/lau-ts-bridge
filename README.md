# lau-ts-bridge

TypeScript bridge between the PLATO backend (Rust) and the Lau game frontend (browser/engine). Converts the mono-dimensional **vibe** scalar into colors, heights, materials, and game events. Provides noise functions for procedural world generation, conservation checking, and a kid-friendly naming layer for PLATO concepts.

## What This Does

`lau-ts-bridge` is the glue between the backend simulation and the game the player sees. The core idea: the entire world state is driven by a single number — the **vibe** (ranging from -1.0 to 1.0). This library provides pure functions that deterministically map that number to:

- **Colors** (negative = blue, zero = gray, positive = gold)
- **Materials** (ice → water → stone → grass → wood → sand → crystal → glowstone → starblock)
- **Heights** (vibe × 16 blocks offset from base)
- **Game events** (weather changes, music BPM shifts)
- **World generation** via hash-based noise and fractal Brownian motion

It also includes a **conservation checker** (verify that vibe is preserved across transformations) and **iteration classification** for the tutoring system.

## Key Idea

**One number, one world.** The vibe scalar is the single source of truth for visual state. Every `vibeTo*` function is a pure, deterministic mapping — same vibe in, same output out. This makes the entire visual pipeline testable, predictable, and reproducible across Rust and TypeScript implementations (they produce identical results for the same inputs).

## Install

```bash
npm install lau-ts-bridge
# or
yarn add lau-ts-bridge
```

Or copy `src/index.ts` into your project — it has zero dependencies.

## Quick Start

```typescript
import {
  vibeToColor, vibeToHeight, vibeToMaterial,
  radialField, checkConservation,
  platoVibeToGame, kidName,
  noise2d, fbm,
} from 'lau-ts-bridge';

// Vibe → visual
const color = vibeToColor(0.7);     // { r: 220, g: 182, b: 77, a: 255 } — warm gold
const height = vibeToHeight(0.5, 32); // 40
const material = vibeToMaterial(-0.8); // 'ice'

// Generate a radial vibe field
const field = radialField(5, 1.0, 0.1);

// Check conservation
const before = [[1, 1], [1, 1]];
const after  = [[1, 1], [1, 0.9]];
const error = checkConservation(before, after); // 0.1

// Vibe → game events
const events = platoVibeToGame(0.8, 'room-42');
// → weather: sunny, music: 112 bpm upbeat

// Kid-friendly names for PLATO concepts
kidName('conservation');  // 'Balance'
kidName('jepa');          // 'Prediction'

// Procedural noise
const n = noise2d(42, 1.0, 2.0);  // deterministic, range [-1, 1]
const terrain = fbm(42, 3.5, 7.2, 4); // multi-octave noise
```

## API Reference

### Core Types

```typescript
type Vibe = number; // -1.0 to 1.0

interface Vec3 { x: number; y: number; z: number; }
interface Color { r: number; g: number; b: number; a: number; } // 0-255
```

### Vibe → Visual

| Function | Signature | Description |
|---|---|---|
| `vibeToColor` | `(vibe: Vibe) => Color` | Negative → blue, zero → gray (140,140,140), positive → gold (255,200,50) |
| `vibeToHeight` | `(vibe: Vibe, baseHeight: number) => number` | `base + floor(vibe × 16)` |
| `vibeToMaterial` | `(vibe: Vibe) => string` | One of 9 material names based on vibe range |

### Material Ranges

| Vibe Range | Material |
|---|---|
| < -0.7 | `ice` |
| -0.7 to -0.3 | `water` |
| -0.3 to -0.1 | `stone` |
| -0.1 to 0.1 | `grass` |
| 0.1 to 0.3 | `wood` |
| 0.3 to 0.5 | `sand` |
| 0.5 to 0.7 | `crystal` |
| 0.7 to 0.9 | `glowstone` |
| ≥ 0.9 | `starblock` |

### Conservation

| Function | Signature | Description |
|---|---|---|
| `checkConservation` | `(before: number[][], after: number[][]) => number` | Returns absolute difference of sums: `|Σbefore - Σafter|` |
| `radialField` | `(size, centerVibe, decay) => number[][]` | Generates a size×size radial vibe field using `vibe × e^(-dist × decay)` |

### Tutor Bridge

```typescript
type TeachingKind = 'celebration' | 'redirect' | 'connection' | 'hint'
  | 'collaborate' | 'deepen' | 'levelup' | 'patience';

type IterationOutcome = 'breakthrough' | 'progress' | 'plateau' | 'stuck';
```

| Function | Signature | Description |
|---|---|---|
| `classifyIteration` | `(result, previousLevel, iterations) => IterationOutcome` | Classifies learning progress |

Classification rules:
- `result > 0.8` and `previousLevel < 0.5` → **breakthrough**
- `result < 0.3` and `iterations > 3` → **stuck**
- `result > previousLevel` → **progress**
- otherwise → **plateau**

### PLATO Concept Names

| Function | Signature | Description |
|---|---|---|
| `kidName` | `(concept: PlatoConcept) => string` | Maps technical names to kid-friendly labels |

| PLATO Concept | Kid Name |
|---|---|
| `conservation` | Balance |
| `jepa` | Prediction |
| `room_lifecycle` | Growing Rooms |
| `distillation` | Compression |
| `vibe` | Vibe |
| `deadband` | Quiet Zone |
| `fibonacci_growth` | Spiral Growth |
| `topology` | Shape Memory |
| `signal_chain` | Signal Path |
| `murmur` | Whisper Network |

### Game Events

| Function | Signature | Description |
|---|---|---|
| `platoVibeToGame` | `(vibe: Vibe, roomId: string) => GameEvent[]` | Converts vibe to weather + music events |

Event generation:
- vibe > 0.7 → weather: `sunny`
- vibe > 0.3 → weather: `golden_hour`
- vibe < -0.5 → weather: `stormy`
- Always: music event with `bpm = round(vibe × 40 + 80)`, mood `upbeat` or `contemplative`

### Noise Functions

| Function | Signature | Description |
|---|---|---|
| `noise2d` | `(seed, x, z) => number` | Hash-based deterministic noise in [-1, 1] |
| `fbm` | `(seed, x, z, octaves) => number` | Fractal Brownian Motion — multi-octave noise |

## How It Works

### Color Mapping

The `vibeToColor` function uses linear interpolation between two fixed anchors:

- **Negative vibe**: lerp from gray (140,140,140,255) toward blue (60,60,200,255) with `t = |vibe|`
- **Positive vibe**: lerp from gray toward gold (255,200,50,255) with `t = vibe`
- **Zero vibe**: exactly gray

This means the color space is a straight line in RGBA space — no curves, no gamma, no surprises.

### Noise Implementation

`noise2d` uses integer hash mixing:

```
h = seed
h ^= (x × 374761393)
h ^= (z × 668265263)
h = imul(h ^ (h >>> 13), 1274126177)
h = h ^ (h >>> 16)
return ((h & 0x7fffffff) / 0x7fffffff) × 2 - 1
```

This is a fast, deterministic hash that produces uniform-ish distribution in [-1, 1].

### Fractal Brownian Motion

`fbm` stacks octaves of noise with halving amplitude and doubling frequency:

```
value = Σ(noise(seed + i×31, x×freq, z×freq) × amp)
        where amp starts at 1, halves each octave
        and freq starts at 1, doubles each octave
return value / maxAmplitude  (normalizes to ~[-1, 1])
```

### Conservation Checking

`checkConservation` computes `|Σ(before) - Σ(after)|`. This is a simple total-energy check — if the sum of all vibes in a field changes, something wasn't conserved. It's used to validate that transformations (like radial decay or player actions) maintain the total vibe budget.

## The Math

### Radial Field Generation

A radial vibe field centered on a point uses exponential decay:

```
vibe(x, z) = centerVibe × e^(-dist(x,z) × decay)
```

Where `dist` is the Euclidean distance from center. The `decay` parameter controls how fast the field falls off:
- `decay = 0` → flat field at `centerVibe`
- `decay = 1` → rapid falloff
- `decay = 0.1` → gentle gradient

### Iteration Classification

The tutoring system classifies learning progress with three thresholds:

```
breakthrough: result > 0.8 AND previousLevel < 0.5
stuck:        result < 0.3 AND iterations > 3
progress:     result > previousLevel
plateau:      everything else
```

These thresholds are tuned for the Lau game's difficulty curve — breakthroughs are sudden jumps from low to high performance, stuck means repeated low results, and progress is any improvement.

## Tests

**25 assertions** in `tests/test.ts` covering:

- Color mapping: negative = blue-ish, positive = warm, zero = gray (140,140,140)
- Material mapping across all 9 ranges
- Height mapping: `base + floor(vibe × 16)`
- Conservation: identical fields have zero error, different fields have positive error
- Iteration classification: all 4 outcomes
- Kid names for PLATO concepts
- Noise determinism: same inputs → same output, different inputs → different output
- Noise range: output always in [-1, 1]

Run with `npx tsx tests/test.ts`.

## License

MIT
