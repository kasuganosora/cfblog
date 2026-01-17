/**
 * Error Handler Middleware
 * Global error handling for the application
 */

export const errorHandler = async (request, error) => {
  console.error('Error:', error);

  // Handle specific error types
  if (error instanceof Error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.ENVIRONMENT === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default error response
  return new Response(JSON.stringify({
    success: false,
    message: 'Internal Server Error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
};
