export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.userId : 'unauthenticated'
  });

  // Default error response
  let errorResponse = {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  };

  let statusCode = 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: err.details || err.message
    };
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: err.message || 'Resource not found'
    };
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse = {
      success: false,
      error: 'UNAUTHORIZED',
      message: err.message || 'Authentication required'
    };
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse = {
      success: false,
      error: 'FORBIDDEN',
      message: err.message || 'Insufficient permissions'
    };
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorResponse = {
      success: false,
      error: 'CONFLICT',
      message: err.message || 'Resource conflict occurred'
    };
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds the allowed limit'
    };
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: 'UNEXPECTED_FILE',
      message: 'Unexpected file field'
    };
  } else if (err.code === 'FirebaseError') {
    // Handle Firebase specific errors
    switch (err.code) {
      case 'permission-denied':
        statusCode = 403;
        errorResponse = {
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied'
        };
        break;
      case 'not-found':
        statusCode = 404;
        errorResponse = {
          success: false,
          error: 'NOT_FOUND',
          message: 'Resource not found'
        };
        break;
      case 'already-exists':
        statusCode = 409;
        errorResponse = {
          success: false,
          error: 'CONFLICT',
          message: 'Resource already exists'
        };
        break;
      default:
        statusCode = 500;
        errorResponse = {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed'
        };
    }
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} not found`
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict occurred') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.userId : 'unauthenticated'
    };

    // Log differently based on status code
    if (res.statusCode >= 400) {
      console.error('HTTP Request Error:', logEntry);
    } else {
      console.log('HTTP Request:', logEntry);
    }
  });

  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// CORS middleware
export const corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://careerconnect.ls'];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};