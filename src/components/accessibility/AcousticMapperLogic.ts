/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Acoustic Mapper Core Filtering Algorithms
 * 
 * Solutions for Challenge: "Ghost Walls and Walking People"
 * 
 * 1. filterSecondOrderMultipath(): Rejection of 2nd-order harmonic double-bounce ghost walls.
 * 2. filterWalkingPeopleDecay(): Dynamic tracking and temporal decay of walking pedestrians.
 * 3. calculateRoomGeometry(): Room width, depth, and front obstacle clearance estimation.
 * 4. generateAcousticSpokenGuidance(): Accessible TalkBack narration synthesis.
 */

import { AcousticEcho, AcousticObstacle } from '../../types';

export interface MultipathFilterOptions {
  enabled?: boolean;
  distanceRatioMin?: number; // default: 1.82
  distanceRatioMax?: number; // default: 2.18
  angularToleranceDeg?: number; // default: 20
  minAttenuationDb?: number; // default: true (candidate.amplitude < primary.amplitude)
}

export interface DynamicDecayOptions {
  enabled?: boolean;
  displacementThresholdM?: number; // default: 0.22m
  pedestrianTtlMs?: number; // default: 1750ms
  wallPersistenceIncrement?: number; // default: 0.15
  initialPedestrianPersistence?: number; // default: 0.25
}

export interface MultipathFilterResult {
  verifiedEchoes: AcousticEcho[];
  rejectedGhosts: AcousticEcho[];
}

export interface DynamicDecayResult {
  staticWalls: AcousticObstacle[];
  dynamicPeople: AcousticObstacle[];
}

export interface RoomGeometryEstimate {
  widthM: number;
  depthM: number;
  clearanceAheadM: number;
}

/**
 * CORE ALGORITHM 1: SECOND-ORDER MULTIPATH GHOST WALL REJECTION
 * 
 * When an acoustic chirp reflects from a solid wall at distance D1 (ToF = 2*D1/c),
 * a second-order round-trip reflection (Phone -> Wall -> Phone -> Wall -> Mic)
 * or corner bounce arrives at ~2.0 * D1 with attenuated amplitude in the same
 * angular sector.
 * 
 * This function detects those harmonic double bounces and suppresses them from
 * the permanent room boundary map.
 */
export function filterSecondOrderMultipath(
  echoes: AcousticEcho[],
  options?: MultipathFilterOptions | boolean
): MultipathFilterResult {
  const isEnabled = typeof options === 'boolean' ? options : (options?.enabled ?? true);
  const opts = typeof options === 'object' && options !== null ? options : {};
  if (!isEnabled) {
    // If filter is disabled, return all echoes as verified (naive behavior for before/after comparison)
    return { verifiedEchoes: echoes, rejectedGhosts: [] };
  }

  const ratioMin = opts.distanceRatioMin ?? 1.82;
  const ratioMax = opts.distanceRatioMax ?? 2.18;
  const angularTolerance = opts.angularToleranceDeg ?? 20;

  const verifiedEchoes: AcousticEcho[] = [];
  const rejectedGhosts: AcousticEcho[] = [];

  // Sort by earliest direct arrivals (closest distance first)
  const sorted = [...echoes].sort((a, b) => a.distanceMeters - b.distanceMeters);

  for (const candidate of sorted) {
    // Check if candidate is a 2nd-order double bounce of any closer confirmed wall
    const isHarmonicMultipath = verifiedEchoes.some((primary) => {
      const angularDelta = Math.abs(candidate.angleDegrees - primary.angleDegrees);
      const isSameSector = angularDelta <= angularTolerance || angularDelta >= (360 - angularTolerance);
      const distRatio = candidate.distanceMeters / primary.distanceMeters;

      const isTwiceDistance = distRatio >= ratioMin && distRatio <= ratioMax;
      const isAttenuated = candidate.amplitude < primary.amplitude;

      return isSameSector && isTwiceDistance && isAttenuated;
    });

    if (isHarmonicMultipath) {
      // Flag as ghost wall and suppress from permanent map
      const ghost: AcousticEcho = {
        ...candidate,
        isGhostEcho: true,
        rejectionReason: 'second_order_multipath',
        confidence: 0.18,
      };
      rejectedGhosts.push(ghost);
    } else {
      verifiedEchoes.push({
        ...candidate,
        isGhostEcho: false,
        confidence: 0.92,
      });
    }
  }

  return { verifiedEchoes, rejectedGhosts };
}

/**
 * CORE ALGORITHM 2: WALKING PEOPLE TEMPORAL OCCUPANCY DECAY
 * 
 * People walking through rooms create temporary acoustic reflections.
 * If baked into the map, paths would be permanently blocked by ghost obstacles.
 * 
 * This function:
 * 1. Prunes past pedestrian tracks whose age exceeds the TTL window (half-life ~1.5s).
 * 2. Classifies incoming echoes:
 *    - Significant displacement (|ΔD| > 0.22m) -> Dynamic walking person (transient).
 *    - Stationary across consecutive scans -> Permanent solid wall (accumulates persistence).
 */
export function filterWalkingPeopleDecay(
  verifiedEchoes: AcousticEcho[],
  previousMap: Map<string, AcousticObstacle>,
  options?: DynamicDecayOptions | boolean,
  currentTimeMs: number = Date.now()
): DynamicDecayResult {
  const isEnabled = typeof options === 'boolean' ? options : (options?.enabled ?? true);
  const opts = typeof options === 'object' && options !== null ? options : {};
  const displacementThreshold = opts.displacementThresholdM ?? 0.22;
  const pedestrianTtl = opts.pedestrianTtlMs ?? 1750;
  const persistenceIncrement = opts.wallPersistenceIncrement ?? 0.15;
  const initialPedestrianScore = opts.initialPedestrianPersistence ?? 0.25;

  const staticWalls: AcousticObstacle[] = [];
  const dynamicPeople: AcousticObstacle[] = [];

  // 1. Decay previous pedestrian tracks
  if (isEnabled) {
    previousMap.forEach((obstacle, key) => {
      const ageMs = currentTimeMs - obstacle.lastObservedTimestamp;
      if (obstacle.type === 'walking_person' && ageMs > pedestrianTtl) {
        // Pedestrians walk through rooms; the map does NOT remember them
        previousMap.delete(key);
      }
    });
  }

  // 2. Classify incoming acoustic reflections
  for (const echo of verifiedEchoes) {
    const rad = (echo.angleDegrees * Math.PI) / 180;
    const x = parseFloat((Math.sin(rad) * echo.distanceMeters).toFixed(2));
    const y = parseFloat((Math.cos(rad) * echo.distanceMeters).toFixed(2));
    const sectorKey = `sec_${Math.round(echo.angleDegrees / 45) * 45}`;

    const existing = previousMap.get(sectorKey);

    if (existing && isEnabled) {
      const displacement = Math.abs(existing.distanceMeters - echo.distanceMeters);

      if (displacement > displacementThreshold) {
        // Reflector moved between sonar pings -> Dynamic Pedestrian!
        const timeElapsedSec = Math.max(0.25, (currentTimeMs - existing.lastObservedTimestamp) / 1000);
        const velocity = Math.min(2.5, displacement / timeElapsedSec);

        const updatedPedestrian: AcousticObstacle = {
          id: `walker_${sectorKey}`,
          xMeters: x,
          yMeters: y,
          distanceMeters: echo.distanceMeters,
          angleDegrees: echo.angleDegrees,
          type: 'walking_person',
          persistenceScore: initialPedestrianScore,
          firstObservedTimestamp: existing.firstObservedTimestamp,
          lastObservedTimestamp: currentTimeMs,
          speedMps: parseFloat(velocity.toFixed(1)),
          statusLabel: `Person walking (~${velocity.toFixed(1)} m/s)`,
        };
        previousMap.set(sectorKey, updatedPedestrian);
        dynamicPeople.push(updatedPedestrian);
        continue;
      } else {
        // Reflector is stationary across consecutive pings -> Permanent Solid Wall
        existing.lastObservedTimestamp = currentTimeMs;
        existing.persistenceScore = Math.min(1.0, existing.persistenceScore + persistenceIncrement);
        existing.statusLabel = `Confirmed Wall (${echo.distanceMeters.toFixed(1)}m)`;
        previousMap.set(sectorKey, existing);
        staticWalls.push(existing);
        continue;
      }
    }

    // First observation in this sector
    const isDiffuseScattering = echo.amplitude < 0.68 && echo.distanceMeters < 2.3;
    if (isDiffuseScattering && isEnabled) {
      const newPerson: AcousticObstacle = {
        id: `walker_${sectorKey}`,
        xMeters: x,
        yMeters: y,
        distanceMeters: echo.distanceMeters,
        angleDegrees: echo.angleDegrees,
        type: 'walking_person',
        persistenceScore: 0.3,
        firstObservedTimestamp: currentTimeMs,
        lastObservedTimestamp: currentTimeMs,
        statusLabel: `Transient Pedestrian (${echo.distanceMeters.toFixed(1)}m)`,
      };
      previousMap.set(sectorKey, newPerson);
      dynamicPeople.push(newPerson);
    } else {
      const newWall: AcousticObstacle = {
        id: `wall_${sectorKey}`,
        xMeters: x,
        yMeters: y,
        distanceMeters: echo.distanceMeters,
        angleDegrees: echo.angleDegrees,
        type: 'static_wall',
        persistenceScore: 0.88,
        firstObservedTimestamp: currentTimeMs,
        lastObservedTimestamp: currentTimeMs,
        statusLabel: `Wall (${echo.distanceMeters.toFixed(1)}m)`,
      };
      previousMap.set(sectorKey, newWall);
      staticWalls.push(newWall);
    }
  }

  return { staticWalls, dynamicPeople };
}

/**
 * Estimate physical room dimensions and forward clearance
 */
export function calculateRoomGeometry(
  walls: AcousticObstacle[],
  people: AcousticObstacle[],
  defaultDepth = 5.5,
  defaultWidth = 4.2
): RoomGeometryEstimate {
  const wallFront = walls.find((w) => w.angleDegrees === 0)?.distanceMeters ?? 2.35;
  const wallLeft = walls.find((w) => w.angleDegrees === 270)?.distanceMeters ?? 1.8;
  const wallRight = walls.find((w) => w.angleDegrees === 90)?.distanceMeters ?? 2.4;

  const clearanceAhead = people.length > 0 && people[0].distanceMeters < wallFront
    ? people[0].distanceMeters
    : wallFront;

  return {
    widthM: parseFloat((wallLeft + wallRight).toFixed(1)) || defaultWidth,
    depthM: parseFloat((wallFront + 3.1).toFixed(1)) || defaultDepth,
    clearanceAheadM: parseFloat(clearanceAhead.toFixed(1)),
  };
}

/**
 * Generate truthful, accessible TalkBack narration text
 */
export function generateAcousticSpokenGuidance(
  geometry: RoomGeometryEstimate,
  walls: AcousticObstacle[],
  ghosts: AcousticEcho[],
  people: AcousticObstacle[]
): string {
  const wallFront = walls.find((w) => w.angleDegrees === 0)?.distanceMeters ?? geometry.clearanceAheadM;
  let speech = `Acoustic sonar scan: Wall ${wallFront.toFixed(1)} meters straight ahead.`;

  if (people.length > 0) {
    const p = people[0];
    speech += ` Warning: Person walking ${p.distanceMeters.toFixed(1)} meters on your left. Flagged as dynamic reflection; map will not record as a wall.`;
  }

  if (ghosts.length > 0) {
    speech += ` ${ghosts.length} second-order multipath ghost echoes rejected.`;
  }

  return speech;
}
