import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { storageService } from '../config/storage.js';

export const uploadTranscript = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only students can upload transcripts'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'FILE_REQUIRED',
        message: 'Transcript file is required'
      });
    }

    const { institutionId, degree, graduationYear, gpa, courses } = req.body;

    if (!institutionId || !degree || !graduationYear) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Institution, degree, and graduation year are required'
      });
    }

    // Check if institution exists
    const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'INSTITUTION_NOT_FOUND',
        message: 'Institution not found'
      });
    }

    // Upload transcript file
    const uploadResult = await storageService.uploadTranscript(studentId, req.file);

    // Create transcript record
    const transcriptId = db.collection(collections.TRANSCRIPTS).doc().id;
    
    const transcriptData = {
      id: transcriptId,
      studentId,
      institutionId,
      institutionName: institutionDoc.data().name,
      degree,
      graduationYear: parseInt(graduationYear),
      gpa: gpa ? parseFloat(gpa) : null,
      courses: courses ? JSON.parse(courses) : [],
      fileUrl: uploadResult.url,
      filePath: uploadResult.path,
      verified: false,
      uploadedAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(collections.TRANSCRIPTS).doc(transcriptId).set(transcriptData);

    // Update student profile to indicate transcript uploaded
    await db.collection(collections.USERS).doc(studentId).update({
      hasTranscripts: true,
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Transcript uploaded successfully',
      transcript: transcriptData
    });

  } catch (error) {
    console.error('Upload transcript error:', error);
    
    if (error.message.includes('validation failed')) {
      return res.status(400).json({
        success: false,
        error: 'FILE_VALIDATION_FAILED',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'TRANSCRIPT_UPLOAD_FAILED',
      message: 'Failed to upload transcript'
    });
  }
};

export const getStudentTranscripts = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // For students, only allow viewing their own transcripts
    // For companies/institutions, check permissions in middleware
    let query = db.collection(collections.TRANSCRIPTS);

    if (req.user.role === 'student') {
      query = query.where('studentId', '==', studentId);
    } else if (req.user.role === 'company') {
      // Companies can only view transcripts of students who applied to their jobs
      const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
        .where('companyId', '==', req.user.userId)
        .where('studentId', '==', studentId)
        .get();

      if (jobApplicationsSnapshot.empty) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Not authorized to view this student\'s transcripts'
        });
      }
    }

    const { page = 1, limit = 10 } = req.query;

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('uploadedAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const transcripts = [];
    snapshot.forEach(doc => {
      const transcriptData = doc.data();
      transcripts.push({
        id: doc.id,
        ...transcriptData
      });
    });

    res.json({
      success: true,
      transcripts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transcripts error:', error);
    res.status(500).json({
      success: false,
      error: 'TRANSCRIPTS_FETCH_FAILED',
      message: 'Failed to fetch transcripts'
    });
  }
};

export const getTranscriptById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const transcriptDoc = await db.collection(collections.TRANSCRIPTS).doc(id).get();
    
    if (!transcriptDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'TRANSCRIPT_NOT_FOUND',
        message: 'Transcript not found'
      });
    }

    const transcriptData = transcriptDoc.data();

    // Check permissions
    if (userRole === 'student' && transcriptData.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to view this transcript'
      });
    }

    if (userRole === 'company') {
      // Check if student applied to company's jobs
      const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
        .where('companyId', '==', userId)
        .where('studentId', '==', transcriptData.studentId)
        .get();

      if (jobApplicationsSnapshot.empty) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Not authorized to view this transcript'
        });
      }
    }

    if (userRole === 'institution' && transcriptData.institutionId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to view this transcript'
      });
    }

    // Get student details (for companies/institutions)
    let studentData = null;
    if (userRole !== 'student') {
      const studentDoc = await db.collection(collections.USERS).doc(transcriptData.studentId).get();
      studentData = studentDoc.data();
    }

    const transcript = {
      id: transcriptDoc.id,
      ...transcriptData
    };

    if (studentData) {
      transcript.student = {
        id: studentData.id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email
      };
    }

    res.json({
      success: true,
      transcript
    });

  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({
      success: false,
      error: 'TRANSCRIPT_FETCH_FAILED',
      message: 'Failed to fetch transcript details'
    });
  }
};

export const verifyTranscript = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can verify transcripts
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can verify transcripts'
      });
    }

    const transcriptDoc = await db.collection(collections.TRANSCRIPTS).doc(id).get();
    
    if (!transcriptDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'TRANSCRIPT_NOT_FOUND',
        message: 'Transcript not found'
      });
    }

    await db.collection(collections.TRANSCRIPTS).doc(id).update({
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: req.user.userId,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Transcript verified successfully'
    });

  } catch (error) {
    console.error('Verify transcript error:', error);
    res.status(500).json({
      success: false,
      error: 'TRANSCRIPT_VERIFICATION_FAILED',
      message: 'Failed to verify transcript'
    });
  }
};

export const deleteTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const transcriptDoc = await db.collection(collections.TRANSCRIPTS).doc(id).get();
    
    if (!transcriptDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'TRANSCRIPT_NOT_FOUND',
        message: 'Transcript not found'
      });
    }

    const transcriptData = transcriptDoc.data();

    // Check permissions (student can delete their own, admin can delete any)
    if (userRole === 'student' && transcriptData.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to delete this transcript'
      });
    }

    if (userRole !== 'admin' && userRole !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to delete transcripts'
      });
    }

    // Delete file from storage
    await storageService.deleteFile(transcriptData.filePath);

    // Delete transcript record
    await db.collection(collections.TRANSCRIPTS).doc(id).delete();

    // Check if student has any other transcripts
    const otherTranscriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
      .where('studentId', '==', transcriptData.studentId)
      .get();

    if (otherTranscriptsSnapshot.empty) {
      // Update student profile
      await db.collection(collections.USERS).doc(transcriptData.studentId).update({
        hasTranscripts: false,
        updatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Transcript deleted successfully'
    });

  } catch (error) {
    console.error('Delete transcript error:', error);
    res.status(500).json({
      success: false,
      error: 'TRANSCRIPT_DELETION_FAILED',
      message: 'Failed to delete transcript'
    });
  }
};

export const getTranscriptStats = async (req, res) => {
  try {
    const studentId = req.user.userId;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only students can view transcript statistics'
      });
    }

    const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
      .where('studentId', '==', studentId)
      .get();

    const stats = {
      totalTranscripts: transcriptsSnapshot.size,
      verifiedTranscripts: 0,
      averageGPA: 0,
      institutions: [],
      degrees: []
    };

    let totalGPA = 0;
    let gpaCount = 0;

    transcriptsSnapshot.forEach(doc => {
      const transcriptData = doc.data();
      
      if (transcriptData.verified) {
        stats.verifiedTranscripts++;
      }

      if (transcriptData.gpa) {
        totalGPA += transcriptData.gpa;
        gpaCount++;
      }

      if (transcriptData.institutionName && !stats.institutions.includes(transcriptData.institutionName)) {
        stats.institutions.push(transcriptData.institutionName);
      }

      if (transcriptData.degree && !stats.degrees.includes(transcriptData.degree)) {
        stats.degrees.push(transcriptData.degree);
      }
    });

    if (gpaCount > 0) {
      stats.averageGPA = totalGPA / gpaCount;
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get transcript stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch transcript statistics'
    });
  }
};