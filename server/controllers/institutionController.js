import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { validateInstitution, validateCourse } from '../validators/institutionValidators.js';

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
    const { error, value } = validateInstitution(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const institutionData = {
      ...value,
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

    const { error, value } = validateInstitution(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const updateData = {
      ...value,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Institution updated successfully',
      institution: { id, ...updateData }
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
            subjects: ['Mathematics', 'English']
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

    const { error, value } = validateCourse(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const courseData = {
      ...value,
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

    const { error, value } = validateCourse(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: { id: courseId, ...value }
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