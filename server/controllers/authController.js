import { auth, db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { emailService } from '../config/email.js';
import { generateToken, verifyToken } from '../utils/authUtils.js';
import { validateRegistration, validateLogin } from '../validators/authValidators.js';

export const register = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const { email, password, firstName, lastName, role, phone } = value;

    // Check if user already exists
    const usersRef = db.collection(collections.USERS);
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: 'User with this email already exists'
      });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false
    });

    // Create user document in Firestore
    const userData = {
      id: userRecord.uid,
      email,
      firstName,
      lastName,
      role,
      phone: phone || '',
      status: 'active',
      emailVerified: false,
      profileCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersRef.doc(userRecord.uid).set(userData);

    // Generate email verification token
    const verificationToken = generateToken(
      { userId: userRecord.uid, type: 'email_verification' },
      '1d'
    );

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await emailService.sendTemplateEmail(email, 'verifyEmail', {
      user: userData,
      link: verificationLink
    });

    // Generate auth token
    const authToken = generateToken({
      userId: userRecord.uid,
      email,
      role
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      token: authToken,
      user: {
        id: userRecord.uid,
        email,
        firstName,
        lastName,
        role,
        emailVerified: false,
        profileCompleted: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Clean up if user was created but Firestore failed
    if (error.userId) {
      try {
        await auth.deleteUser(error.userId);
      } catch (deleteError) {
        console.error('Error cleaning up user:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'REGISTRATION_FAILED',
      message: 'Failed to create user account'
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Get user by email from Firestore
    const usersRef = db.collection(collections.USERS);
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is active
    if (userData.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended'
      });
    }

    // Verify password using Firebase Auth
    // Note: In a real implementation, you'd use Firebase Auth SDK on client side
    // For server-side verification, we'll create a custom token
    const customToken = await auth.createCustomToken(userData.id);

    // Generate JWT token
    const token = generateToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role
    });

    // Update last login
    await usersRef.doc(userData.id).update({
      lastLogin: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        emailVerified: userData.emailVerified,
        profileCompleted: userData.profileCompleted
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGIN_FAILED',
      message: 'Failed to authenticate user'
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_REQUIRED',
        message: 'Verification token is required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN_TYPE',
        message: 'Invalid token type'
      });
    }

    // Update user email verification status
    const usersRef = db.collection(collections.USERS);
    await usersRef.doc(decoded.userId).update({
      emailVerified: true,
      updatedAt: new Date()
    });

    // Update Firebase Auth email verification status
    await auth.updateUser(decoded.userId, {
      emailVerified: true
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid verification token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Verification token has expired'
      });
    }

    res.status(500).json({
      success: false,
      error: 'VERIFICATION_FAILED',
      message: 'Failed to verify email'
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email is required'
      });
    }

    // Check if user exists
    const usersRef = db.collection(collections.USERS);
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      // Don't reveal whether email exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Generate password reset token
    const resetToken = generateToken(
      { userId: userData.id, type: 'password_reset' },
      '1h'
    );

    // Send password reset email
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await emailService.sendTemplateEmail(email, 'passwordReset', {
      user: userData,
      link: resetLink
    });

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: 'Failed to process password reset request'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_AND_PASSWORD_REQUIRED',
        message: 'Token and new password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN_TYPE',
        message: 'Invalid token type'
      });
    }

    // Update user password in Firebase Auth
    await auth.updateUser(decoded.userId, {
      password
    });

    // Update last password change
    const usersRef = db.collection(collections.USERS);
    await usersRef.doc(decoded.userId).update({
      lastPasswordChange: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid reset token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Reset token has expired'
      });
    }

    res.status(500).json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: 'Failed to reset password'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userDoc = await db.collection(collections.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Remove sensitive data
    const { password, ...userProfile } = userData;

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to fetch user profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    await db.collection(collections.USERS).doc(userId).update(updateData);

    // Get updated user data
    const userDoc = await db.collection(collections.USERS).doc(userId).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update user profile'
    });
  }
};

export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // We can implement server-side token blacklisting if needed
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout'
    });
  }
};