/**
 * Formatting Utilities for Kalvium Campus Simulator
 * Pure helper functions for presentation-layer text and date transformations.
 * Free of React components, API calls, and business/algorithm logic.
 */

/**
 * Returns a safe display string for nullable or empty values.
 * 
 * @param {any} value - Input value to inspect
 * @param {string} [fallback='—'] - Default fallback string
 * @returns {string} Sanitized string or fallback
 */
export function safeDisplay(value, fallback = '—') {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }
  if (Array.isArray(value) && value.length === 0) {
    return fallback;
  }
  return String(value);
}

/**
 * Formats request and DFA status codes into human-readable labels.
 * 
 * @param {string} status - Raw status string (e.g. 'Q4_REGISTRAR_SEALED', 'IN_REVIEW', 'APPROVED')
 * @returns {string} Formatted, human-friendly status label
 */
export function formatStatusLabel(status) {
  if (!status || typeof status !== 'string') {
    return 'Unknown';
  }

  const normalized = status.trim().toUpperCase();

  const STATUS_MAP = {
    'Q0_DRAFT': 'Draft',
    'Q1_SUBMITTED': 'Submitted',
    'Q2_ADVISOR_VERIFIED': 'Advisor Verified',
    'Q3_HOD_APPROVED': 'HOD Approved',
    'Q4_REGISTRAR_SEALED': 'Registrar Sealed',
    'Q_REJECTED': 'Rejected',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'IN_REVIEW': 'In Review',
    'PENDING': 'Pending Review',
    'PENDING_HOD': 'Pending HOD Approval',
    'SUCCESS': 'Success',
    'REJECTED_CREDIT_LIMIT': 'Rejected (Credit Overload)',
    'INVALID_TRANSITION': 'Invalid Transition'
  };

  if (STATUS_MAP[normalized]) {
    return STATUS_MAP[normalized];
  }

  // Fallback: convert SNAKE_CASE or camelCase to Capitalized Words
  return normalized
    .replace(/^Q[0-9_]+/, '') // Strip DFA state prefix if present
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase()) || status;
}

/**
 * Formats an ISO date string, timestamp, or Date object into a readable date and time.
 * Handles missing, null, or invalid dates gracefully.
 * 
 * @param {string|number|Date} dateInput - The date input to format
 * @param {Intl.DateTimeFormatOptions} [customOptions] - Optional Intl formatting options
 * @returns {string} Formatted date string or fallback '—'
 */
export function formatTimestamp(dateInput, customOptions = {}) {
  if (!dateInput) {
    return '—';
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  try {
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...customOptions }).format(date);
  } catch (err) {
    return date.toLocaleString();
  }
}

/**
 * Formats a distance in meters into human-readable metric units.
 * 
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string (e.g. '150 m' or '1.2 km')
 */
export function formatDistance(meters) {
  if (typeof meters !== 'number' || isNaN(meters)) {
    return '—';
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
