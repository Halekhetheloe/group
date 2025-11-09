import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration - CORRECT IMPORTS BASED ON YOUR FILES
import adminApp, { db, auth, storage } from './config/firebase-admin.js';
import dbConfig, { collections, dbHelpers } from './config/database.js';
import emailService, { transporter, emailTemplates } from './config/email.js';

// Import middleware
import { errorHandler } from './middleware/errorMiddleware.js';
import { authenticateToken, optionalAuth } from './middleware/authMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CareerGuidanceServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.env = process.env.NODE_ENV || 'development';
    this.isFirebaseConnected = false;

    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeServices() {
    try {
      console.log('🚀 Initializing Career Guidance Platform Server...');

      // Check if Firebase services are properly initialized
      const isMockFirebase = adminApp?.name?.includes('[Mock]') || adminApp?.name?.includes('[Error]');
      
      if (adminApp && db && auth && !isMockFirebase) {
        this.isFirebaseConnected = true;
        console.log('✅ Firebase Admin SDK initialized');
        console.log('✅ Firestore database connected');
        console.log('✅ Firebase Auth configured');
        console.log('✅ Firebase Storage configured');
        
        // Test Firestore connection
        try {
          await db.collection(collections.SYSTEM).doc('health').get();
          console.log('✅ Firestore connection verified');
        } catch (error) {
          console.warn('⚠️  Firestore connection test failed:', error.message);
          this.isFirebaseConnected = false;
        }
      } else {
        console.warn('⚠️  Firebase not configured - running in development mode');
        console.warn('⚠️  Some features may not work without Firebase credentials');
        this.isFirebaseConnected = false;
      }

      // Email service is already configured in email.js
      // Just verify it's working
      if (transporter && emailService) {
        console.log('✅ Email service configured');
        
        // Test email configuration (optional - might fail if no SMTP credentials)
        try {
          await new Promise((resolve, reject) => {
            transporter.verify((error, success) => {
              if (error) {
                console.warn('⚠️  Email service verification failed:', error.message);
                resolve(); // Don't fail the server if email is not configured
              } else {
                console.log('✅ Email service verified and ready');
                resolve();
              }
            });
          });
        } catch (error) {
          console.warn('⚠️  Email service test skipped or failed');
        }
      } else {
        console.warn('⚠️  Email service not properly configured');
      }

      console.log('🎉 Server initialization completed');
      if (!this.isFirebaseConnected) {
        console.log('💡 Tip: Set Firebase environment variables to enable full functionality');
      }

    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      // Don't exit - allow server to run in limited mode
      console.log('⚠️  Continuing with limited functionality...');
      this.isFirebaseConnected = false;
    }
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://firestore.googleapis.com", "https://firebasestorage.googleapis.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (this.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400 // Only log errors in production
      }));
    }

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    this.app.use('/docs', express.static(path.join(__dirname, '../docs')));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.env,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          firebase: this.isFirebaseConnected,
          firestore: this.isFirebaseConnected,
          auth: this.isFirebaseConnected,
          storage: this.isFirebaseConnected,
          email: !!transporter
        },
        collections: Object.keys(collections),
        emailTemplates: Object.keys(emailTemplates)
      });
    });

    // API information endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Career Guidance Platform API',
        version: '1.0.0',
        description: 'Backend API for Career Guidance and Employment Integration Platform',
        environment: this.env,
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          institutions: '/api/v1/institutions',
          courses: '/api/v1/courses',
          applications: '/api/v1/applications',
          jobs: '/api/v1/jobs',
          transcripts: '/api/v1/transcripts',
          admin: '/api/v1/admin'
        },
        documentation: '/docs'
      });
    });

    console.log('✅ Middleware initialized');
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', authenticateToken, userRoutes);
    this.app.use('/api/v1/institutions', optionalAuth, institutionRoutes);
    this.app.use('/api/v1/courses', optionalAuth, courseRoutes);
    this.app.use('/api/v1/applications', authenticateToken, applicationRoutes);
    this.app.use('/api/v1/jobs', optionalAuth, jobRoutes);
    this.app.use('/api/v1/transcripts', authenticateToken, transcriptRoutes);
    this.app.use('/api/v1/admin', authenticateToken, adminRoutes);

    // Serve API documentation
    this.app.get('/api/docs', (req, res) => {
      res.sendFile(path.join(__dirname, '../docs/API_DOCS.md'));
    });

    // Catch all handler for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        suggestion: 'Check the API documentation at /api for available endpoints'
      });
    });

    console.log('✅ Routes initialized');
  }

  initializeErrorHandling() {
    // Error handling middleware (should be last)
    this.app.use(errorHandler);

    // Global unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Close server & exit process
      this.server?.close(() => {
        process.exit(1);
      });
    });

    // Global uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    console.log('✅ Error handling initialized');
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎓 CAREER GUIDANCE PLATFORM SERVER');
      console.log('='.repeat(60));
      console.log(`📍 Environment: ${this.env}`);
      console.log(`🚀 Server running on port: ${this.port}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`📚 API Version: ${process.env.API_VERSION || 'v1'}`);
      console.log(`🔗 Health check: http://localhost:${this.port}/health`);
      console.log(`📖 API Info: http://localhost:${this.port}/api`);
      console.log(`🔥 Firebase: ${this.isFirebaseConnected ? 'Connected' : 'Not configured'}`);
      console.log(`📧 Email Service: ${transporter ? 'Configured' : 'Not configured'}`);
      console.log(`🗄️  Database: Firestore with ${Object.keys(collections).length} collections`);
      console.log(`📧 Email Templates: ${Object.keys(emailTemplates).length} available`);
      console.log('='.repeat(60) + '\n');

      // Log important configuration
      if (this.env === 'development') {
        console.log('🔧 Development Mode Configuration:');
        console.log(`   - CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
        console.log(`   - Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests/15min`);
        console.log(`   - File Upload: ${process.env.MAX_FILE_SIZE || '10MB'} max`);
        console.log(`   - Database Collections: ${Object.keys(collections).join(', ')}`);
        console.log(`   - Email Templates: ${Object.keys(emailTemplates).join(', ')}`);
        
        if (!this.isFirebaseConnected) {
          console.log('');
          console.log('💡 Firebase Setup Instructions:');
          console.log('   1. Go to Firebase Console: https://console.firebase.google.com/');
          console.log('   2. Create a new project or select existing one');
          console.log('   3. Go to Project Settings > Service Accounts');
          console.log('   4. Generate new private key and set environment variables:');
          console.log('      - FIREBASE_PROJECT_ID');
          console.log('      - FIREBASE_PRIVATE_KEY');
          console.log('      - FIREBASE_CLIENT_EMAIL');
          console.log('');
        }
      }
    });

    return this.server;
  }

  async shutdown() {
    console.log('\n🛑 Shutting down server gracefully...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.log('❌ Forcing server shutdown');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }
}

// Create and start server instance
const server = new CareerGuidanceServer();

// Start the server
server.start();

// Graceful shutdown handlers
process.on('SIGINT', () => server.shutdown());
process.on('SIGTERM', () => server.shutdown());

export default server;