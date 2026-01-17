/**
 * Response Helpers
 * Utility functions for creating consistent API responses
 */

/**
 * Success response
 */
export const successResponse = (data = null, message = 'Success', status = 200) => {
  return {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message,
      data
    })
  };
};

/**
 * Error response
 */
export const errorResponse = (message = 'Error', status = 400, error = null) => {
  return {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: false,
      message,
      error: process.env.ENVIRONMENT === 'development' ? error : undefined
    })
  };
};

/**
 * Pagination response
 */
export const paginatedResponse = (data, pagination, message = 'Success') => {
  return successResponse(
    {
      ...data,
      pagination
    },
    message
  );
};

/**
 * Not found response
 */
export const notFoundResponse = (message = 'Resource not found') => {
  return errorResponse(message, 404);
};

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (message = 'Unauthorized') => {
  return errorResponse(message, 401);
};

/**
 * Forbidden response
 */
export const forbiddenResponse = (message = 'Forbidden') => {
  return errorResponse(message, 403);
};

/**
 * Validation error response
 */
export const validationErrorResponse = (errors) => {
  return errorResponse('Validation failed', 400, errors);
};

/**
 * Server error response
 */
export const serverErrorResponse = (message = 'Internal server error', error = null) => {
  return errorResponse(message, 500, error);
};
