import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { matchingUtils } from '../utils/matchingUtils.js';

// Institution Controller
export const getInstitutions = async (req, res) => {
  try {
    res.json({
      success: true,
      institutions: [
        {
          id: 'nul-001',
          name: 'National University of Lesotho',
          type: 'university',
          location: 'Roma',
          description: 'Premier university in Lesotho offering various programs',
          contact: {
            email: 'info@nul.ls',
            phone: '+266 5221 4211'
          },
          status: 'active'
        },
        {
          id: 'lim-001',
          name: 'Limkokwing University',
          type: 'university',
          location: 'Maseru',
          description: 'Creative technology university',
          contact: {
            email: 'info@limkokwing.ls',
            phone: '+266 2231 3737'
          },
          status: 'active'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTIONS_FETCH_FAILED',
      message: 'Failed to fetch institutions'
    });
  }
};

export const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = {
      id: id,
      name: 'Sample Institution',
      type: 'university',
      location: 'Maseru',
      description: 'Sample institution description',
      contact: {
        email: 'info@institution.ls',
        phone: '+266 5000 0000'
      },
      courses: [
        {
          id: 'course-001',
          name: 'Computer Science',
          faculty: 'Information Technology',
          duration: 4,
          description: 'Bachelor of Science in Computer Science'
        }
      ]
    };

    res.json({
      success: true,
      institution
    });
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTION_FETCH_FAILED',
      message: 'Failed to fetch institution details'
    });
  }
};

export const createInstitution = async (req, res) => {
  try {
    const institutionData = {
      ...req.body,
      id: 'inst-' + Date.now(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      institution: institutionData
    });
  } catch (error) {
    console.error('Create institution error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTION_CREATION_FAILED',
      message: 'Failed to create institution'
    });
  }
};

export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Institution updated successfully',
      institution: { id, ...req.body }
    });
  } catch (error) {
    console.error('Update institution error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTION_UPDATE_FAILED',
      message: 'Failed to update institution'
    });
  }
};

export const getInstitutionCourses = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      courses: [
        {
          id: 'course-001',
          name: 'Information Technology',
          faculty: 'ICT',
          duration: 3,
          description: 'Diploma in Information Technology',
          requirements: {
            minGrade: 'C',
            minPoints: 30,
            subjects: ['Mathematics', 'English'],
            certificates: ['High School Diploma']
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get institution courses error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSES_FETCH_FAILED',
      message: 'Failed to fetch institution courses'
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { id: institutionId } = req.params;

    const courseData = {
      ...req.body,
      id: 'course-' + Date.now(),
      institutionId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: courseData
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSE_CREATION_FAILED',
      message: 'Failed to create course'
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: { id: courseId, ...req.body }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSE_UPDATE_FAILED',
      message: 'Failed to update course'
    });
  }
};

export const getInstitutionApplications = async (req, res) => {
  try {
    const { id: institutionId } = req.params;

    res.json({
      success: true,
      applications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Get institution applications error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATIONS_FETCH_FAILED',
      message: 'Failed to fetch institution applications'
    });
  }
};

// New functions for grade-based matching
export const getCourseEligibilityStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Mock data - in real implementation, fetch from database
    const stats = {
      totalStudents: 1000,
      eligibleStudents: 450,
      eligibilityPercentage: 45,
      eligibilityBreakdown: {
        byGrade: {
          'A': 150,
          'B': 200,
          'C': 100,
          'D': 50,
          'E': 30,
          'F': 20
        },
        byPoints: {
          below: 300,
          meets: 250,
          exceeds: 200
        }
      }
    };

    res.json({
      success: true,
      stats,
      course: {
        id: courseId,
        name: 'Sample Course',
        requirements: {
          minGrade: 'C',
          minPoints: 30,
          subjects: ['Mathematics', 'English']
        }
      }
    });
  } catch (error) {
    console.error('Get course eligibility stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch course eligibility statistics'
    });
  }
};

export const getEligibleStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Mock data - in real implementation, fetch from database
    const eligibleStudents = [
      {
        id: 'student-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@student.ls',
        grades: {
          overall: 'A',
          points: 85,
          subjects: {
            'Mathematics': 'A',
            'English': 'B',
            'Science': 'A'
          }
        },
        eligibility: {
          eligible: true,
          meetsRequirements: ['Meets grade requirement (C)', 'Meets all subject requirements']
        },
        matchScore: 95
      },
      {
        id: 'student-002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@student.ls',
        grades: {
          overall: 'B',
          points: 65,
          subjects: {
            'Mathematics': 'B',
            'English': 'B',
            'Science': 'C'
          }
        },
        eligibility: {
          eligible: true,
          meetsRequirements: ['Meets grade requirement (C)', 'Meets all subject requirements']
        },
        matchScore: 88
      }
    ];

    res.json({
      success: true,
      eligibleStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: eligibleStudents.length,
        totalStudents: 450
      },
      course: {
        id: courseId,
        name: 'Sample Course'
      }
    });
  } catch (error) {
    console.error('Get eligible students error:', error);
    res.status(500).json({
      success: false,
      error: 'ELIGIBLE_STUDENTS_FETCH_FAILED',
      message: 'Failed to fetch eligible students'
    });
  }
};

export const updateCourseRequirements = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { requirements } = req.body;

    // Validate requirements
    const validationErrors = validateRequirements(requirements);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUIREMENTS',
        message: 'Invalid requirements provided',
        errors: validationErrors
      });
    }

    res.json({
      success: true,
      message: 'Course requirements updated successfully',
      course: {
        id: courseId,
        name: 'Sample Course',
        requirements
      },
      stats: {
        totalStudents: 1000,
        eligibleStudents: 450,
        eligibilityPercentage: 45
      }
    });
  } catch (error) {
    console.error('Update course requirements error:', error);
    res.status(500).json({
      success: false,
      error: 'REQUIREMENTS_UPDATE_FAILED',
      message: 'Failed to update course requirements'
    });
  }
};

// Helper function to validate requirements
const validateRequirements = (requirements) => {
  const errors = [];

  if (requirements.minGrade && !['A', 'B', 'C', 'D', 'E', 'F'].includes(requirements.minGrade)) {
    errors.push('Minimum grade must be A, B, C, D, E, or F');
  }

  if (requirements.minPoints && (requirements.minPoints < 0 || requirements.minPoints > 100)) {
    errors.push('Minimum points must be between 0 and 100');
  }

  if (requirements.subjects && !Array.isArray(requirements.subjects)) {
    errors.push('Subjects must be an array');
  }

  return errors;
};

export const getInstitutionDashboard = async (req, res) => {
  try {
    const { id: institutionId } = req.params;

    const dashboardData = {
      totalCourses: 5,
      totalApplications: 120,
      pendingApplications: 45,
      acceptedApplications: 60,
      rejectedApplications: 15,
      eligibleStudents: 450,
      popularCourses: [
        {
          id: 'course-001',
          name: 'Computer Science',
          applications: 45,
          eligibilityPercentage: 65
        },
        {
          id: 'course-002',
          name: 'Business Administration',
          applications: 32,
          eligibilityPercentage: 78
        }
      ],
      recentApplications: [
        {
          id: 'app-001',
          studentName: 'John Doe',
          courseName: 'Computer Science',
          appliedDate: new Date('2024-01-15'),
          status: 'pending'
        }
      ]
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Get institution dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'DASHBOARD_FETCH_FAILED',
      message: 'Failed to fetch institution dashboard'
    });
  }
};