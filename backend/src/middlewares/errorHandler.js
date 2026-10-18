/**
 * Centralized Error-Handling Middleware
 * 
 * Implements standard Express 4-parameter error handler signature: (err, req, res, next).
 * Formats consistent JSON error responses across all academic modules (DAA, COA, FLAT).
 * 
 * SECURITY & RELIABILITY:
 *   - Emits appropriate HTTP status codes (400-599), defaulting to 500 for unhandled exceptions.
 *   - Sanitizes error messages for 500-level errors in production to avoid leaking internal system details.
 *   - Strictly prevents stack trace leakage in production environments.
 *   - Safely guards against already-sent headers.
 *   - Produces a generic server error response for unknown or non-standard errors.
 */

import { config } from '../config/env.js';

/**
 * 404 Not Found Middleware
 * Intercepts requests that do not match any defined application routes.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Resource not found - ${req.method} ${req.originalUrl || req.url}`);
  error.status = 404;
  next(error);
}

/**
 * Express Error-Handling Middleware
 * Must maintain exactly 4 parameters to adhere to Express error-handler conventions.
 * 
 * @param {Error|any} err - The error passed by previous middleware or controllers
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next middleware
 */
export function errorHandler(err, req, res, next) {
  // If response headers have already been transmitted, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine appropriate HTTP status code
  const rawStatus = err && (err.status || err.statusCode);
  const isStatusValid = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus <= 599;
  const statusCode = isStatusValid ? rawStatus : 500;

  const currentEnv = process.env.NODE_ENV || (config && config.nodeEnv) || 'development';
  const isProduction = currentEnv === 'production';
  const isServerError = statusCode >= 500;

  // Determine safe, user-facing error message
  let safeMessage;
  if (isServerError && isProduction) {
    // In production, prevent leaking internal server details or database exceptions
    safeMessage = 'Internal Server Error. An unexpected error occurred on the server.';
  } else if (err && typeof err.message === 'string' && err.message.trim() !== '') {
    safeMessage = err.message.trim();
  } else if (typeof err === 'string' && err.trim() !== '') {
    safeMessage = err.trim();
  } else {
    safeMessage = isServerError
      ? 'An unexpected internal server error occurred.'
      : 'The requested operation could not be completed.';
  }

  // Construct structured JSON error response
  const errorResponse = {
    success: false,
    error: safeMessage,
    message: safeMessage,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url
  };

  // Only attach stack traces in non-production environments
  if (!isProduction && err && err.stack) {
    errorResponse.stack = err.stack;
  }

  return res.status(statusCode).json(errorResponse);
}

export default errorHandler;
