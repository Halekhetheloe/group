// Simplified validation middleware without express-validator dependency
export const handleValidationErrors = (req, res, next) => {
  // Simple validation - we'll implement proper validation later
  const errors = {};
  
  // Check required fields for common endpoints
  if (req.method === 'POST') {
    if (req.path.includes('/auth/register') || req.path.includes('/auth/login')) {
      if (!req.body.email) errors.email = 'Email is required';
      if (!req.body.password) errors.password = 'Password is required';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const sanitizeInput = (req, res, next) => {
  // Recursively sanitize request body, query, and params
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            // Basic sanitization - trim and remove excessive whitespace
            obj[key] = obj[key].trim().replace(/\s+/g, ' ');
            
            // Remove potentially dangerous characters for specific fields
            if (key.includes('email')) {
              obj[key] = obj[key].toLowerCase();
            }
            
            if (key.includes('phone')) {
              obj[key] = obj[key].replace(/[^\d+]/g, '');
            }
          } else if (typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate page number
  if (page < 1) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PAGE',
      message: 'Page number must be greater than 0'
    });
  }

  // Validate limit
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_LIMIT',
      message: 'Limit must be between 1 and 100'
    });
  }

  // Set validated values
  req.query.page = page;
  req.query.limit = limit;

  next();
};

export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Invalid date format. Use ISO format (YYYY-MM-DD)'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_RANGE',
        message: 'Start date cannot be after end date'
      });
    }

    // Set validated dates
    req.query.startDate = start;
    req.query.endDate = end;
  }

  next();
};

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID_REQUIRED',
        message: `${paramName} is required`
      });
    }

    // Basic ID validation (Firestore IDs are 20 characters)
    if (typeof id !== 'string' || id.length < 1 || id.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

export const validateSearchQuery = (req, res, next) => {
  const { search } = req.query;

  if (search && typeof search === 'string') {
    // Limit search query length
    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'SEARCH_QUERY_TOO_LONG',
        message: 'Search query must be 100 characters or less'
      });
    }

    // Basic search query sanitization
    req.query.search = search.trim().slice(0, 100);
  }

  next();
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  // At least 6 characters for now (we'll make it stronger later)
  return password && password.length >= 6;
};

// Export as default validation middleware
export const validationMiddleware = [sanitizeInput, handleValidationErrors];

export default validationMiddleware;