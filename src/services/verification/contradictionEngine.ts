// REUNIFY Spatiotemporal Contradiction Engine
// Evaluates travel feasibility, duplicate identifier clashes, and records conflicts.
// Strict rule: DO NOT invent distances for unknown locations.
// Same wristband ID by itself is NOT a contradiction.
// Requires: same identifier + different locations + time difference + physically infeasible movement.

import { SourceRecord, Contradiction } from '../../types';

// Maximum plausible transit speed (km/h) in disaster terrain.
// This is a prototype heuristic, not a universal physical threshold.
export const MAX_PLAUSIBLE_SPEED_KMH = 60.0;

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  madurai: { lat: 9.9252, lng: 78.1198 },
  theni: { lat: 10.0104, lng: 77.4768 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  cuddalore: { lat: 11.748, lng: 79.7714 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  salem: { lat: 11.6643, lng: 78.146 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  thanjavur: { lat: 10.787, lng: 79.1378 },
};

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function calculateDistanceKm(districtA?: string, districtB?: string): number | null {
  if (!districtA || !districtB) return null;
  const normA = districtA.toLowerCase().trim();
  const normB = districtB.toLowerCase().trim();

  if (normA === normB) return 5.0; // Within same municipal bounds

  // Hardcoded verified road distances for key scenario corridors
  if ((normA === 'madurai' && normB === 'theni') || (normA === 'theni' && normB === 'madurai')) {
    return 75.2;
  }
  if ((normA === 'madurai' && normB === 'dindigul') || (normA === 'dindigul' && normB === 'madurai')) {
    return 66.0;
  }
  if ((normA === 'madurai' && normB === 'trichy') || (normA === 'trichy' && normB === 'madurai') || (normA === 'madurai' && normB === 'tiruchirappalli') || (normA === 'tiruchirappalli' && normB === 'madurai')) {
    return 135.0;
  }

  const coordA = DISTRICT_COORDINATES[normA];
  const coordB = DISTRICT_COORDINATES[normB];

  if (coordA && coordB) {
    return Math.round(getHaversineDistanceKm(coordA.lat, coordA.lng, coordB.lat, coordB.lng) * 1.25 * 10) / 10;
  }

  // DO NOT INVENT DISTANCE: If location coordinates unknown, return null.
  return null;
}

export function detectContradictionBetweenRecords(
  recA: SourceRecord,
  recB: SourceRecord
): Contradiction | null {
  if (recA.id === recB.id || recA.external_id === recB.external_id) {
    return null;
  }

  const timeA = new Date(recA.recorded_at).getTime();
  const timeB = new Date(recB.recorded_at).getTime();
  if (isNaN(timeA) || isNaN(timeB)) return null;

  const distanceKm = calculateDistanceKm(recA.district, recB.district);
  if (distanceKm === null) {
    // Insufficient geographic data: do not invent a contradiction
    return null;
  }

  const timeDiffMinutes = Math.abs(timeA - timeB) / (60 * 1000);
  const hours = Math.max(timeDiffMinutes / 60, 0.0167);
  const requiredSpeedKmh = Math.round((distanceKm / hours) * 10) / 10;

  // Check 1: Shared Unique Identifier
  const tagA = (recA.wristband_tag || '').trim().toLowerCase();
  const tagB = (recB.wristband_tag || '').trim().toLowerCase();
  const hasSharedTag = Boolean(tagA && tagB && tagA === tagB);

  // Same wristband ID by itself is NOT a contradiction.
  // Contradiction requires: same identifier + different locations + time difference + physically infeasible movement
  const isSpeedImpossible = distanceKm > 10 && requiredSpeedKmh > MAX_PLAUSIBLE_SPEED_KMH;

  if (hasSharedTag && isSpeedImpossible) {
    const formattedTimeA = new Date(recA.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedTimeB = new Date(recB.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: `contra-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      title: `Spatiotemporal Feasibility Contradiction (Tag: ${recA.wristband_tag})`,
      sourceA: {
        name: recA.source_name,
        location: `${recA.location_name} (${recA.district})`,
        time: formattedTimeA,
        external_id: recA.external_id,
      },
      sourceB: {
        name: recB.source_name,
        location: `${recB.location_name} (${recB.district})`,
        time: formattedTimeB,
        external_id: recB.external_id,
      },
      distance_km: distanceKm,
      time_diff_minutes: Math.round(timeDiffMinutes),
      required_speed_kmh: requiredSpeedKmh,
      speed_threshold_kmh: MAX_PLAUSIBLE_SPEED_KMH,
      severity: requiredSpeedKmh > 100 ? 'high' : 'medium',
      possible_explanations: [
        'Data-entry error: Intake timestamp was logged after transfer rather than actual arrival time.',
        'Identifier misread: Wristband barcode or series was misread or duplicate batch issued.',
        'Two different people sharing/misusing the identifier: Tag was reissued or worn by another admittee.',
      ],
      requires_human_review: true,
    };
  }

  return null;
}
