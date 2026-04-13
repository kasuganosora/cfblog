/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */

export const corsMiddleware = async (request) => {
  const corsOrigin = globalThis.CORS_ORIGIN || '*';

  // Determine if we're using a specific (non-wildcard) origin
  const isSpecificOrigin = corsOrigin !== '*';

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        ...(isSpecificOrigin && { 'Vary': 'Origin' })
      }
    });
  }

  // Continue to next middleware (attach Vary: Origin for non-preflight too)
  if (isSpecificOrigin) {
    request._corsVary = true;
  }

  return null;
};
