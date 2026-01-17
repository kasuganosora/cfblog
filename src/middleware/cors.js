/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */

export const corsMiddleware = async (request) => {
  // Get origin from request or environment
  const origin = request.headers.get('Origin') || '*';
  const corsOrigin = globalThis.CORS_ORIGIN || '*';

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Continue to next middleware
  return null;
};
