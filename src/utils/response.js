/**
 * Response Helpers
 * Utility functions for creating consistent API responses
 * Compatible with Cloudflare Workers runtime (no process.env)
 */

// ---------------------------------------------------------------------------
// Environment configuration
// Cloudflare Workers pass env bindings via the fetch handler, not process.env.
// Call setEnv(env) or setDevelopment(bool) once at startup to configure.
// ---------------------------------------------------------------------------

let _isDev = false;

/** Configure via the Workers env binding (reads env.ENVIRONMENT) */
export const setEnv = (env) => {
  _isDev = env?.ENVIRONMENT === 'development';
};

/** Manually toggle development mode */
export const setDevelopment = (isDev) => {
  _isDev = isDev;
};

/** Check whether development mode is active */
export const isDevelopment = () => _isDev;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sanitise an error message for client-facing responses.
 * In production, 5xx messages are replaced with a generic placeholder so
 * internal details (e.g. "Database not available") are never leaked.
 */
const sanitizeMessage = (message, status) => {
  if (_isDev) return message;
  return status >= 500 ? 'Internal server error' : message;
};

// ---------------------------------------------------------------------------
// Response helpers – all return native Response objects
// ---------------------------------------------------------------------------

/**
 * Success response
 */
export const successResponse = (data = null, message = 'Success', status = 200) =>
  new Response(JSON.stringify({
    success: true,
    message,
    data
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

/**
 * Error response
 * - `message` is sanitised for 5xx status codes in production.
 * - `error` detail is only included in development mode.
 */
export const errorResponse = (message = 'Error', status = 400, error = null) =>
  new Response(JSON.stringify({
    success: false,
    message: sanitizeMessage(message, status),
    error: _isDev ? error : undefined
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

/**
 * Pagination response
 */
export const paginatedResponse = (data, pagination, message = 'Success') =>
  successResponse({ ...data, pagination }, message);

/**
 * Not found response
 */
export const notFoundResponse = (message = 'Resource not found') =>
  errorResponse(message, 404);

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (message = 'Unauthorized') =>
  errorResponse(message, 401);

/**
 * Forbidden response
 */
export const forbiddenResponse = (message = 'Forbidden') =>
  errorResponse(message, 403);

/**
 * Validation error response
 */
export const validationErrorResponse = (errors) =>
  errorResponse('Validation failed', 400, errors);

/**
 * Server error response
 * In production the message is ALWAYS the generic "Internal server error"
 * regardless of what the caller passes, preventing internal details from
 * leaking.  The optional `error` detail is only included in development.
 */
export const serverErrorResponse = (message = 'Internal server error', error = null) =>
  new Response(JSON.stringify({
    success: false,
    message: _isDev ? message : 'Internal server error',
    error: _isDev ? error : undefined
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });