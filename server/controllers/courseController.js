// Simplified course controller for development
export const getCourses = async (req, res) => {
  try {
    res.json({
      success: true,
      courses: [
        {
          id: 'cs-001',
          name: 'Computer Science',
          institutionId: 'nul-001',
          institutionName: 'National University of Lesotho',
          faculty: 'Information Technology',
          level: 'bachelor',
          duration: 4,
          description: 'Bachelor of Science in Computer Science',
          requirements: {
            minGrade: 'C',
            subjects: ['Mathematics', 'English', 'Science']
          },
          fees: {
            local: 15000,
            currency: 'LSL'
          },
          intake: ['January', 'September'],
          status: 'active'
        },
        {
          id: 'bit-001',
          name: 'Business Information Technology',
          institutionId: 'lim-001',
          institutionName: 'Limkokwing University',
          faculty: 'Business & IT',
          level: 'bachelor',
          duration: 3,
          description: 'Bachelor in Business Information Technology',
          requirements: {
            minGrade: 'D',
            subjects: ['Mathematics', 'English']
          },
          fees: {
            local: 18000,
            currency: 'LSL'
          },
          intake: ['January', 'May', 'September'],
          status: 'active'
        },
        {
          id: 'med-001',
          name: 'Medicine',
          institutionId: 'nul-001',
          institutionName: 'National University of Lesotho',
          faculty: 'Health Sciences',
          level: 'bachelor',
          duration: 6,
          description: 'Bachelor of Medicine and Bachelor of Surgery',
          requirements: {
            minGrade: 'B',
            subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics']
          },
          fees: {
            local: 25000,
            currency: 'LSL'
          },
          intake: ['January'],
          status: 'active'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSES_FETCH_FAILED',
      message: 'Failed to fetch courses'
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = {
      id: id,
      name: 'Computer Science',
      institutionId: 'nul-001',
      institutionName: 'National University of Lesotho',
      faculty: 'Information Technology',
      level: 'bachelor',
      duration: 4,
      description: 'Bachelor of Science in Computer Science focusing on software development, algorithms, and computer systems.',
      requirements: {
        minGrade: 'C',
        minPoints: 30,
        subjects: ['Mathematics', 'English', 'Science'],
        certificates: ['High School Diploma']
      },
      fees: {
        local: 15000,
        international: 30000,
        currency: 'LSL'
      },
      intakePeriods: ['January', 'September'],
      applicationDeadline: new Date('2024-12-31'),
      capacity: 100,
      status: 'active',
      institution: {
        id: 'nul-001',
        name: 'National University of Lesotho',
        type: 'university',
        location: 'Roma',
        contact: {
          email: 'admissions@nul.ls',
          phone: '+266 5221 4211'
        }
      },
      similarCourses: [
        {
          id: 'it-001',
          name: 'Information Technology',
          faculty: 'Information Technology',
          duration: 3
        },
        {
          id: 'se-001',
          name: 'Software Engineering',
          faculty: 'Information Technology',
          duration: 4
        }
      ]
    };

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSE_FETCH_FAILED',
      message: 'Failed to fetch course details'
    });
  }
};

export const getCourseApplications = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    res.json({
      success: true,
      applications: [
        {
          id: 'app-001',
          studentId: 'student-001',
          courseId: courseId,
          status: 'pending',
          appliedAt: new Date('2024-01-15'),
          student: {
            id: 'student-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@student.ls',
            phone: '+266 1234 5678'
          }
        }
      ],
      course: {
        id: courseId,
        name: 'Computer Science',
        faculty: 'Information Technology'
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get course applications error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATIONS_FETCH_FAILED',
      message: 'Failed to fetch course applications'
    });
  }
};

export const checkCourseEligibility = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { grades, certificates } = req.body;

    if (!grades || !certificates) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_DATA',
        message: 'Grades and certificates are required for eligibility check'
      });
    }

    const eligibility = {
      isEligible: true,
      missingRequirements: [],
      meetsRequirements: [
        'Minimum grade requirement met',
        'Required subjects completed',
        'Certificate requirements satisfied'
      ],
      suggestions: []
    };

    // Mock eligibility check
    if (grades.overall === 'F') {
      eligibility.isEligible = false;
      eligibility.missingRequirements.push('Minimum grade of C required');
      eligibility.suggestions.push('Improve your overall grades');
    }

    res.json({
      success: true,
      eligibility,
      course: {
        id: courseId,
        name: 'Computer Science',
        requirements: {
          minGrade: 'C',
          subjects: ['Mathematics', 'English', 'Science'],
          certificates: ['High School Diploma']
        }
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'ELIGIBILITY_CHECK_FAILED',
      message: 'Failed to check course eligibility'
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      id: 'course-' + Date.now(),
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
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: { id, ...req.body }
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

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      error: 'COURSE_DELETION_FAILED',
      message: 'Failed to delete course'
    });
  }
};

export const getPopularCourses = async (req, res) => {
  try {
    res.json({
      success: true,
      popularCourses: [
        {
          id: 'cs-001',
          name: 'Computer Science',
          institutionName: 'National University of Lesotho',
          faculty: 'Information Technology',
          duration: 4,
          applicationCount: 45
        },
        {
          id: 'bit-001',
          name: 'Business Information Technology',
          institutionName: 'Limkokwing University',
          faculty: 'Business & IT',
          duration: 3,
          applicationCount: 32
        },
        {
          id: 'med-001',
          name: 'Medicine',
          institutionName: 'National University of Lesotho',
          faculty: 'Health Sciences',
          duration: 6,
          applicationCount: 28
        }
      ]
    });
  } catch (error) {
    console.error('Get popular courses error:', error);
    res.status(500).json({
      success: false,
      error: 'POPULAR_COURSES_FETCH_FAILED',
      message: 'Failed to fetch popular courses'
    });
  }
};