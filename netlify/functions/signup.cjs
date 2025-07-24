// Netlify Function: /api/signup (or /.netlify/functions/signup)
// Handles user registration: creates a new user and returns a JWT and user data.

const { signUp, generateToken } = require('./lib/auth-server.cjs');

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateInput = (email, password, name) => {
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  return errors;
};

// Response helpers
const createResponse = (statusCode, body, additionalHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...additionalHeaders
  },
  body: JSON.stringify(body)
});

const createErrorResponse = (statusCode, message, details = null) => {
  const body = {
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV !== 'production') {
    body.details = details;
  }

  return createResponse(statusCode, body);
};

// Custom error classes for better error handling
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Error {
  constructor(message, validationErrors = []) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

exports.handler = async function(event, context) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'OK' });
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  // Parse and validate request body
  let requestBody;
  try {
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }
    requestBody = JSON.parse(event.body);
  } catch (e) {
    if (e instanceof ValidationError) {
      return createErrorResponse(400, e.message);
    }
    return createErrorResponse(400, 'Invalid JSON in request body');
  }

  // Extract and validate input
  const { email, password, name } = requestBody;

  const validationErrors = validateInput(email, password, name);
  if (validationErrors.length > 0) {
    return createErrorResponse(400, 'Validation failed', validationErrors);
  }

  try {
    // Create new user using the signUp function
    const user = await signUp(email, password, name);

    if (!user) {
      return createErrorResponse(500, 'User creation failed');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Sanitize user data before sending
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    };

    return createResponse(201, {
      message: 'User created successfully',
      token,
      user: sanitizedUser
    });

  } catch (error) {
    // Log error for debugging (ensure no sensitive data in logs)
    console.error('[Netlify Function /signup] Error:', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    if (error.message.includes('duplicate key value violates unique constraint')) {
        return createErrorResponse(409, 'User with this email or name already exists.');
    }

    // Handle specific error types
    if (error instanceof ValidationError) {
      return createErrorResponse(400, error.message, error.validationErrors);
    }

    // Generic server error for unknown issues
    return createErrorResponse(500, 'An internal server error occurred');
  }
};
