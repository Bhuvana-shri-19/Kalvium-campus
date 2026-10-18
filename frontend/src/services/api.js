/**
 * Reusable REST API Client for Kalvium Campus Navigator & Request Processing Simulator
 * 
 * Uses the Fetch API to communicate with the Express backend.
 * Base URL is configured via import.meta.env.VITE_API_BASE_URL.
 * Local development fallback: http://localhost:5000/api
 */

// Documented local development fallback URL
export const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

/**
 * Normalizes an API path by ensuring consistent slash prefixing.
 * @param {string} endpoint - API endpoint path (e.g. '/navigation/landmarks' or 'navigation/landmarks')
 * @returns {string} Normalized full URL
 */
function buildUrl(endpoint) {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Core HTTP request handler
 * 
 * @param {string} endpoint - Relative API route
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<any>} Parsed JSON response payload
 * @throws {Error} Detailed error containing status code and server error details
 */
export async function request(endpoint, options = {}) {
  const url = buildUrl(endpoint);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    const error = new Error(
      `Network connection failed while calling [${config.method || 'GET'} ${url}]: ${networkError.message}. Ensure the backend server is running on ${API_BASE_URL}.`
    );
    error.isNetworkError = true;
    error.originalError = networkError;
    throw error;
  }

  let responseData;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch (parseError) {
      responseData = null;
    }
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (responseData && typeof responseData === 'object' && (responseData.error || responseData.message)) ||
      (typeof responseData === 'string' && responseData.trim().length > 0 && responseData) ||
      `HTTP error ${response.status}: ${response.statusText}`;

    const apiError = new Error(errorMessage);
    apiError.status = response.status;
    apiError.statusText = response.statusText;
    apiError.responseData = responseData;
    throw apiError;
  }

  return responseData;
}

/**
 * Reusable GET helper
 * 
 * @param {string} endpoint - Relative endpoint path
 * @param {Object} [customHeaders={}] - Optional request headers
 * @returns {Promise<any>} Parsed JSON response
 */
export async function get(endpoint, customHeaders = {}) {
  return request(endpoint, {
    method: 'GET',
    headers: customHeaders
  });
}

/**
 * Reusable POST helper
 * 
 * @param {string} endpoint - Relative endpoint path
 * @param {any} [body={}] - Request payload to be serialized as JSON
 * @param {Object} [customHeaders={}] - Optional request headers
 * @returns {Promise<any>} Parsed JSON response
 */
export async function post(endpoint, body = {}, customHeaders = {}) {
  return request(endpoint, {
    method: 'POST',
    body,
    headers: customHeaders
  });
}

export default {
  API_BASE_URL,
  request,
  get,
  post
};
