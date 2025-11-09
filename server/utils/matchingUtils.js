import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

// Matching algorithms and utilities
export const matchingAlgorithms = {
  // Calculate job-student match score
  calculateJobMatch: (studentProfile, jobRequirements, studentTranscripts = []) => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const criteriaWeights = {
      education: 0.3,      // 30%
      skills: 0.3,         // 30%
      experience: 0.2,     // 20%
      academic: 0.2        // 20%
    };

    const matchedCriteria = [];
    const missingCriteria = [];

    // Education match
    const educationScore = calculateEducationMatch(studentProfile, jobRequirements);
    totalScore += educationScore.score * criteriaWeights.education;
    maxPossibleScore += criteriaWeights.education;
    if (educationScore.matched) matchedCriteria.push('education');
    else missingCriteria.push('education');

    // Skills match
    const skillsScore = calculateSkillsMatch(studentProfile, jobRequirements);
    totalScore += skillsScore.score * criteriaWeights.skills;
    maxPossibleScore += criteriaWeights.skills;
    if (skillsScore.matched) matchedCriteria.push('skills');
    else missingCriteria.push('skills');

    // Experience match
    const experienceScore = calculateExperienceMatch(studentProfile, jobRequirements);
    totalScore += experienceScore.score * criteriaWeights.experience;
    maxPossibleScore += criteriaWeights.experience;
    if (experienceScore.matched) matchedCriteria.push('experience');
    else missingCriteria.push('experience');

    // Academic performance match
    const academicScore = calculateAcademicMatch(studentTranscripts, jobRequirements);
    totalScore += academicScore.score * criteriaWeights.academic;
    maxPossibleScore += criteriaWeights.academic;
    if (academicScore.matched) matchedCriteria.push('academic performance');
    else missingCriteria.push('academic performance');

    // Calculate final percentage score
    const finalScore = Math.round((totalScore / maxPossibleScore) * 100);

    return {
      score: finalScore,
      matchedCriteria,
      missingCriteria,
      breakdown: {
        education: educationScore,
        skills: skillsScore,
        experience: experienceScore,
        academic: academicScore
      }
    };
  },

  // Calculate course-student eligibility
  calculateCourseEligibility: (studentGrades, courseRequirements) => {
    const eligibility = {
      isEligible: true,
      missingRequirements: [],
      meetsRequirements: [],
      suggestions: []
    };

    // Check minimum grade requirement
    if (courseRequirements.minGrade) {
      const studentGrade = studentGrades.overall || 'F';
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
      
      if (gradeOrder[studentGrade] < gradeOrder[courseRequirements.minGrade]) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Minimum grade of ${courseRequirements.minGrade} required (your grade: ${studentGrade})`);
      } else {
        eligibility.meetsRequirements.push(`Meets minimum grade requirement (${courseRequirements.minGrade})`);
      }
    }

    // Check required subjects
    if (courseRequirements.subjects && courseRequirements.subjects.length > 0) {
      const missingSubjects = courseRequirements.subjects.filter(
        subject => !studentGrades.subjects || !studentGrades.subjects[subject]
      );

      if (missingSubjects.length > 0) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements');
      }
    }

    // Check certificate requirements
    if (courseRequirements.certificates && courseRequirements.certificates.length > 0) {
      const missingCertificates = courseRequirements.certificates.filter(
        cert => !studentGrades.certificates || !studentGrades.certificates.includes(cert)
      );

      if (missingCertificates.length > 0) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Missing required certificates: ${missingCertificates.join(', ')}`);
      } else {
        eligibility.meetsRequirements.push('Meets all certificate requirements');
      }
    }

    // Check minimum points
    if (courseRequirements.minPoints) {
      const studentPoints = studentGrades.points || 0;
      if (studentPoints < courseRequirements.minPoints) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Minimum of ${courseRequirements.minPoints} points required (your points: ${studentPoints})`);
      } else {
        eligibility.meetsRequirements.push(`Meets minimum points requirement (${courseRequirements.minPoints})`);
      }
    }

    // Provide suggestions if not eligible
    if (!eligibility.isEligible) {
      eligibility.suggestions.push(
        'Consider improving your grades in the required subjects',
        'Explore alternative courses with lower requirements',
        'Contact the institution for special consideration',
        'Look for bridging programs or foundation courses'
      );
    }

    return eligibility;
  },

  // Find similar jobs based on profile
  findSimilarJobs: async (studentProfile, limit = 10) => {
    try {
      // Get all active jobs
      const jobsSnapshot = await db.collection(collections.JOBS)
        .where('status', '==', 'active')
        .get();

      const matches = [];

      for (const jobDoc of jobsSnapshot.docs) {
        const job = jobDoc.data();

        // Skip jobs that are not accepting applications
        if (!isJobAcceptingApplications(job)) {
          continue;
        }

        // Get student transcripts for academic matching
        const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
          .where('studentId', '==', studentProfile.id)
          .where('verified', '==', true)
          .get();

        const transcripts = [];
        transcriptsSnapshot.forEach(doc => {
          transcripts.push(doc.data());
        });

        // Calculate match score
        const matchResult = matchingAlgorithms.calculateJobMatch(studentProfile, job.requirements, transcripts);

        if (matchResult.score >= 50) { // Only include matches with at least 50% score
          // Get company details
          const companyDoc = await db.collection(collections.COMPANIES).doc(job.companyId).get();
          const company = companyDoc.data();

          matches.push({
            job: {
              id: jobDoc.id,
              title: job.title,
              type: job.type,
              location: job.location,
              experienceLevel: job.experienceLevel,
              description: job.description,
              requirements: job.requirements,
              salary: job.salary,
              applicationDeadline: job.applicationDeadline
            },
            company: {
              id: company.id,
              name: company.name,
              industry: company.industry,
              location: company.location
            },
            matchScore: matchResult.score,
            matchedCriteria: matchResult.matchedCriteria,
            breakdown: matchResult.breakdown
          });
        }
      }

      // Sort by match score (descending) and limit results
      return matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar jobs:', error);
      throw error;
    }
  },

  // Find qualified students for a job
  findQualifiedStudents: async (jobId, minScore = 70, limit = 20) => {
    try {
      // Get job details
      const jobDoc = await db.collection(collections.JOBS).doc(jobId).get();
      if (!jobDoc.exists) {
        throw new Error('Job not found');
      }

      const job = jobDoc.data();

      // Get all active students
      const studentsSnapshot = await db.collection(collections.USERS)
        .where('role', '==', 'student')
        .where('status', '==', 'active')
        .get();

      const qualifiedStudents = [];

      for (const studentDoc of studentsSnapshot.docs) {
        const student = studentDoc.data();

        // Get student transcripts
        const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
          .where('studentId', '==', studentDoc.id)
          .where('verified', '==', true)
          .get();

        const transcripts = [];
        transcriptsSnapshot.forEach(doc => {
          transcripts.push(doc.data());
        });

        // Calculate match score
        const matchResult = matchingAlgorithms.calculateJobMatch(student, job.requirements, transcripts);

        if (matchResult.score >= minScore) {
          qualifiedStudents.push({
            student: {
              id: studentDoc.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              phone: student.phone,
              educationLevel: student.educationLevel,
              skills: student.skills || [],
              experience: student.experience || 0
            },
            matchScore: matchResult.score,
            matchedCriteria: matchResult.matchedCriteria,
            hasTranscripts: transcripts.length > 0,
            averageGPA: calculateAverageGPA(transcripts),
            matchBreakdown: matchResult.breakdown
          });
        }
      }

      // Sort by match score (descending) and limit results
      return qualifiedStudents
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding qualified students:', error);
      throw error;
    }
  }
};

// Helper functions for matching algorithms
const calculateEducationMatch = (student, jobRequirements) => {
  const jobEducation = jobRequirements.education?.toLowerCase() || '';
  const studentEducation = student.educationLevel?.toLowerCase() || '';

  if (!jobEducation) {
    return { score: 100, matched: true, details: 'No education requirement specified' };
  }

  // Education level hierarchy
  const educationLevels = {
    'phd': 5,
    'master': 4,
    'bachelor': 3,
    'diploma': 2,
    'certificate': 1,
    'high school': 0
  };

  const jobLevel = educationLevels[jobEducation] || 0;
  const studentLevel = educationLevels[studentEducation] || 0;

  if (studentLevel >= jobLevel) {
    return { 
      score: 100, 
      matched: true, 
      details: `Meets education requirement: ${jobEducation}` 
    };
  } else {
    const score = Math.max(0, (studentLevel / jobLevel) * 100);
    return { 
      score, 
      matched: false, 
      details: `Education level below requirement: ${studentEducation} vs ${jobEducation}` 
    };
  }
};

const calculateSkillsMatch = (student, jobRequirements) => {
  const jobSkills = jobRequirements.skills || [];
  const studentSkills = student.skills || [];

  if (jobSkills.length === 0) {
    return { score: 100, matched: true, details: 'No specific skills required' };
  }

  const matchedSkills = jobSkills.filter(jobSkill =>
    studentSkills.some(studentSkill =>
      studentSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(studentSkill.toLowerCase())
    )
  );

  const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
  const isMatched = matchPercentage >= 50;

  return {
    score: matchPercentage,
    matched: isMatched,
    details: `Matched ${matchedSkills.length} of ${jobSkills.length} required skills`,
    matchedSkills,
    missingSkills: jobSkills.filter(skill => !matchedSkills.includes(skill))
  };
};

const calculateExperienceMatch = (student, jobRequirements) => {
  const jobExperience = jobRequirements.experience || '';
  const studentExperience = student.experience || 0;

  if (!jobExperience) {
    return { score: 100, matched: true, details: 'No experience requirement specified' };
  }

  // Parse experience requirement (e.g., "2-4 years" -> min 2 years)
  const yearsMatch = jobExperience.match(/\d+/g);
  const minYears = yearsMatch ? Math.min(...yearsMatch.map(Number)) : 0;

  if (studentExperience >= minYears) {
    return { 
      score: 100, 
      matched: true, 
      details: `Meets experience requirement: ${studentExperience} years` 
    };
  } else {
    const score = Math.min((studentExperience / minYears) * 100, 100);
    return { 
      score, 
      matched: false, 
      details: `Experience below requirement: ${studentExperience} years vs ${minYears} years required` 
    };
  }
};

const calculateAcademicMatch = (transcripts, jobRequirements) => {
  if (transcripts.length === 0) {
    return { 
      score: 50, 
      matched: false, 
      details: 'No verified transcripts available' 
    };
  }

  const averageGPA = calculateAverageGPA(transcripts);

  // GPA scoring scale
  if (averageGPA >= 3.5) {
    return { 
      score: 100, 
      matched: true, 
      details: `Excellent academic performance (GPA: ${averageGPA.toFixed(2)})` 
    };
  } else if (averageGPA >= 3.0) {
    return { 
      score: 80, 
      matched: true, 
      details: `Good academic performance (GPA: ${averageGPA.toFixed(2)})` 
    };
  } else if (averageGPA >= 2.5) {
    return { 
      score: 60, 
      matched: true, 
      details: `Average academic performance (GPA: ${averageGPA.toFixed(2)})` 
    };
  } else {
    return { 
      score: 40, 
      matched: false, 
      details: `Below average academic performance (GPA: ${averageGPA.toFixed(2)})` 
    };
  }
};

const calculateAverageGPA = (transcripts) => {
  if (transcripts.length === 0) return 0;

  const totalGPA = transcripts.reduce((sum, transcript) => {
    return sum + (transcript.gpa || 0);
  }, 0);

  return totalGPA / transcripts.length;
};

const isJobAcceptingApplications = (job) => {
  if (job.status !== 'active') {
    return false;
  }

  if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
    return false;
  }

  return true;
};

// Export matching utilities
export const matchingUtils = {
  calculateJobMatch: matchingAlgorithms.calculateJobMatch,
  calculateCourseEligibility: matchingAlgorithms.calculateCourseEligibility,
  findSimilarJobs: matchingAlgorithms.findSimilarJobs,
  findQualifiedStudents: matchingAlgorithms.findQualifiedStudents,
  isJobAcceptingApplications
};

export default matchingUtils;