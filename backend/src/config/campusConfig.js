/**
 * Kalvium Campus Navigator - Central Campus Configuration
 * Single Source of Truth for Mock Campus Location Metadata
 * 
 * DISCLAIMER & EDUCATIONAL CONTEXT:
 * This campus map dataset is entirely fictional and created for educational
 * computer science demonstrations (Design & Analysis of Algorithms BFS/DFS graph traversals).
 * Coordinates and distances represent an abstract 2D schematic layout for SVG canvas rendering
 * and DO NOT represent verified real-world campus coordinates or physical GIS mapping.
 */

/**
 * Normalized unique location identifiers for the mock Kalvium campus
 */
export const CAMPUS_LOCATION_IDS = Object.freeze({
  GATE: 'GATE',
  LIBRARY: 'LIBRARY',
  BLOCK_A: 'BLOCK_A',
  CAFETERIA: 'CAFETERIA',
  LAB: 'LAB',
  HOSTEL: 'HOSTEL'
});

/**
 * Primary campus location metadata registry (Single Source of Truth)
 */
export const CAMPUS_LOCATIONS = Object.freeze({
  GATE: {
    id: 'GATE',
    code: 'GATE',
    name: 'Main Campus Gate',
    shortName: 'Gate',
    category: 'Entry / Security',
    description: 'Primary security checkpoint, transit turnaround, and campus entrance.',
    schematicCoordinates: { x: 70, y: 240 },
    isEntryExit: true
  },
  LIBRARY: {
    id: 'LIBRARY',
    code: 'LIB',
    name: 'Central Knowledge Library',
    shortName: 'Library',
    category: 'Academic Support',
    description: 'Multi-floor knowledge center, digital archives, and quiet study commons.',
    schematicCoordinates: { x: 330, y: 90 },
    isEntryExit: false
  },
  BLOCK_A: {
    id: 'BLOCK_A',
    code: 'BLK_A',
    name: 'Academic Block A',
    shortName: 'Block A',
    category: 'Instructional',
    description: 'Core lecture halls, faculty offices, and academic coordination center.',
    schematicCoordinates: { x: 190, y: 150 },
    isEntryExit: false
  },
  CAFETERIA: {
    id: 'CAFETERIA',
    code: 'CAFE',
    name: 'Student Cafeteria & Lounge',
    shortName: 'Cafeteria',
    category: 'Student Amenities',
    description: 'Central dining pavilion, student lounge, and refreshment hub.',
    schematicCoordinates: { x: 210, y: 390 },
    isEntryExit: false
  },
  LAB: {
    id: 'LAB',
    code: 'LAB',
    name: 'Computing & Innovation Lab',
    shortName: 'Lab',
    category: 'Research & Computing',
    description: 'Advanced software development suites, hardware test benches, and AI lab.',
    schematicCoordinates: { x: 420, y: 220 },
    isEntryExit: false
  },
  HOSTEL: {
    id: 'HOSTEL',
    code: 'HOSTEL',
    name: 'Student Residential Hostel',
    shortName: 'Hostel',
    category: 'Residential',
    description: 'Undergraduate student residence towers, recreation hall, and study rooms.',
    schematicCoordinates: { x: 540, y: 300 },
    isEntryExit: false
  }
});

/**
 * Array of campus locations for dropdown menus, selectors, and iterations
 */
export const CAMPUS_LOCATION_LIST = Object.freeze(Object.values(CAMPUS_LOCATIONS));

/**
 * Retrieve location metadata by ID
 * @param {string} id - The landmark ID (e.g. 'GATE', 'LIBRARY', 'BLOCK_A')
 * @returns {Object|null} Location metadata object or null if not found
 */
export function getLocationById(id) {
  if (!id || typeof id !== 'string') return null;
  const normalizedId = id.trim().toUpperCase();
  return CAMPUS_LOCATIONS[normalizedId] || null;
}

/**
 * Validate if an ID exists in the central campus configuration
 * @param {string} id - The landmark ID to check
 * @returns {boolean} True if valid location ID
 */
export function isValidLocationId(id) {
  if (!id || typeof id !== 'string') return false;
  return Boolean(CAMPUS_LOCATIONS[id.trim().toUpperCase()]);
}

/**
 * Retrieve display name for a location ID
 * @param {string} id - The landmark ID
 * @param {string} [fallback='Unknown Location'] - Fallback display name
 * @returns {string} The display name
 */
export function getLocationName(id, fallback = 'Unknown Location') {
  const loc = getLocationById(id);
  return loc ? loc.name : fallback;
}

export default {
  CAMPUS_LOCATION_IDS,
  CAMPUS_LOCATIONS,
  CAMPUS_LOCATION_LIST,
  getLocationById,
  isValidLocationId,
  getLocationName
};
