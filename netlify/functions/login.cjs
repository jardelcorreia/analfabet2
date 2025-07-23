// Netlify Function: /api/login (or /.netlify/functions/login)
// Handles user login: validates credentials and returns a JWT and user data.

const { signIn, generateToken } = require('./lib/auth-server.cjs');

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateInput = (identifier, password) => {
  const errors = [];

  if (!identifier || typeof identifier !== 'string') {
    errors.push('Identifier is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 1) {
    errors.push('Password cannot be empty');
  }

  return errors;
};

// Rate limiting (simple in-memory implementation)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (ip) => {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;

  if (attempts.count >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_TIME) {
      return true;
    } else {
      // Reset after lockout period
      loginAttempts.delete(ip);
      return false;
    }
  }
  return false;
};

const recordLoginAttempt = (ip, success) => {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
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

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
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

  const clientIP = event.headers['x-forwarded-for'] ||
                   event.headers['x-real-ip'] ||
                   event.requestContext?.identity?.sourceIp ||
                   'unknown';

  // Check rate limiting
  if (isRateLimited(clientIP)) {
    return createErrorResponse(429, 'Too many login attempts. Please try again later.');
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
  const identifier = requestBody.identifier?.trim();
  const password = requestBody.password;

  const validationErrors = validateInput(identifier, password);
  if (validationErrors.length > 0) {
    return createErrorResponse(400, 'Validation failed', validationErrors);
  }

  try {
    // Validate credentials using the signIn function
    const user = await signIn(identifier, password);

    if (!user) {
      recordLoginAttempt(clientIP, false);
      return createErrorResponse(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Record successful login
    recordLoginAttempt(clientIP, true);

    // Sanitize user data before sending
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      ...(user.avatar && { avatar: user.avatar }),
      ...(user.role && { role: user.role }),
      ...(user.last_login && { last_login: user.last_login })
    };

    return createResponse(200, {
      message: 'Login successful',
      token,
      user: sanitizedUser
    });

  } catch (error) {
    // Log error for debugging (ensure no sensitive data in logs)
    console.error('[Netlify Function /login] Error:', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      clientIP
    });

    // Record failed attempt
    recordLoginAttempt(clientIP, false);

    // Handle specific error types
    if (error instanceof AuthenticationError) {
      return createErrorResponse(401, 'Authentication failed');
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(400, error.message, error.validationErrors);
    }

    if (error instanceof RateLimitError) {
      return createErrorResponse(429, error.message);
    }

    // Handle known error messages
    if (error.message === 'JWT secret is not configured on the server.') {
      return createErrorResponse(500, 'Server configuration error');
    }

    if (error.message === 'User creation failed to return valid user data from database (server-side).') {
      return createErrorResponse(500, 'Server error during user processing');
    }

    // Database connection errors
    if (error.message?.includes('database') || error.message?.includes('connection')) {
      return createErrorResponse(503, 'Service temporarily unavailable');
    }

    // Generic server error for unknown issues
    return createErrorResponse(500, 'An internal server error occurred');
  }
};
