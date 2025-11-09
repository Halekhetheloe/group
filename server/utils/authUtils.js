import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT token generation and verification
export const generateToken = (payload, expiresIn = '7d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Password hashing and verification
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Token types and utilities
export const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset'
};

export const generateEmailVerificationToken = (userId) => {
  return generateToken(
    { userId, type: tokenTypes.EMAIL_VERIFICATION },
    '1d' // 24 hours
  );
};

export const generatePasswordResetToken = (userId) => {
  return generateToken(
    { userId, type: tokenTypes.PASSWORD_RESET },
    '1h' // 1 hour
  );
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const errors = [];

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  if (!requirements.hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  const strengthScore = Object.values(requirements).filter(Boolean).length;
  let strengthLevel = 'weak';

  if (strengthScore >= 4) strengthLevel = 'strong';
  else if (strengthScore >= 3) strengthLevel = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength: strengthLevel,
    score: strengthScore
  };
};

// Session management
export const generateSessionId = () => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Role-based access utilities
export const hasPermission = (userRole, requiredPermissions) => {
  const rolePermissions = {
    student: ['view_profile', 'apply_courses', 'upload_transcripts', 'apply_jobs'],
    institution: ['manage_courses', 'review_applications', 'manage_admissions', 'view_institution_data'],
    company: ['post_jobs', 'view_applicants', 'manage_jobs', 'view_company_data'],
    admin: ['manage_users', 'manage_institutions', 'manage_companies', 'view_system_reports', 'system_config']
  };

  const userPermissions = rolePermissions[userRole] || [];
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const canAccessResource = (userRole, resourceOwnerId, userId) => {
  // Users can always access their own resources
  if (resourceOwnerId === userId) {
    return true;
  }

  // Admins can access all resources
  if (userRole === 'admin') {
    return true;
  }

  // Institution admins can access their institution's resources
  if (userRole === 'institution') {
    return resourceOwnerId === userId; // Institution ID matches user ID
  }

  // Company admins can access their company's resources
  if (userRole === 'company') {
    return resourceOwnerId === userId; // Company ID matches user ID
  }

  return false;
};

// Token refresh utilities
export const shouldRefreshToken = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    const now = Date.now() / 1000;
    const timeUntilExpiry = decoded.exp - now;
    
    // Refresh if token expires in less than 30 minutes
    return timeUntilExpiry < 1800;
  } catch (error) {
    return false;
  }
};

// Security utilities
export const generateSecureRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Export all utilities
export default {
  generateToken,
  verifyToken,
  decodeToken,
  hashPassword,
  verifyPassword,
  tokenTypes,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  validatePasswordStrength,
  generateSessionId,
  hasPermission,
  canAccessResource,
  shouldRefreshToken,
  generateSecureRandomString,
  sanitizeUserInput
};