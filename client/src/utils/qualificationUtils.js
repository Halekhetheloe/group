// Unified Qualification Utilities
const qualificationUtils = {
  // Education level hierarchy
  educationLevels: {
    'high_school': { value: 1, label: 'High School Diploma' },
    'associate': { value: 2, label: 'Associate Degree' },
    'bachelor': { value: 3, label: "Bachelor's Degree" },
    'master': { value: 4, label: "Master's Degree" },
    'phd': { value: 5, label: 'PhD' }
  },

  // Experience level hierarchy
  experienceLevels: {
    'no_experience': { value: 1, label: 'No Experience' },
    'internship': { value: 2, label: 'Internship' },
    'entry_level': { value: 3, label: 'Entry Level (0-2 years)' },
    'mid_level': { value: 4, label: 'Mid Level (2-5 years)' },
    'senior_level': { value: 5, label: 'Senior Level (5+ years)' },
    'executive': { value: 6, label: 'Executive' }
  },

  // Grade values for comparison
  gradeValues: {
    'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0, 'F': 0
  },

  /**
   * Filter jobs based on student qualifications
   */
  filterQualifiedJobs: (jobs, studentProfile) => {
    console.log('🔍 Filtering jobs based on qualifications...');
    
    if (!jobs || !Array.isArray(jobs)) {
      console.log('❌ No jobs provided or invalid format');
      return [];
    }

    if (!studentProfile || !studentProfile.qualifications) {
      console.log('❌ No student profile or qualifications found');
      return jobs; // Return all jobs if no qualifications to filter by
    }

    const studentQual = studentProfile.qualifications;
    console.log('Student qualifications:', studentQual);

    const qualifiedJobs = jobs.filter(job => {
      console.log(`\nChecking job: ${job.title}`);
      
      if (!job.requirements) {
        console.log('✅ Job has no requirements - student qualifies');
        return true;
      }

      const jobReq = job.requirements;
      let qualifies = true;
      let reasons = [];

      // 1. Check education level
      if (jobReq.educationalLevel || jobReq.educationLevel) {
        const requiredLevel = jobReq.educationalLevel || jobReq.educationLevel;
        const studentLevel = studentQual.educationLevel;
        
        const studentLevelValue = qualificationUtils.educationLevels[studentLevel]?.value || 0;
        const requiredLevelValue = qualificationUtils.educationLevels[requiredLevel]?.value || 0;
        
        if (studentLevelValue < requiredLevelValue) {
          qualifies = false;
          reasons.push(`Education level too low: ${studentLevel} < required ${requiredLevel}`);
        } else {
          reasons.push(`✅ Education level met: ${studentLevel} >= ${requiredLevel}`);
        }
      }

      // 2. Check GPA
      if (jobReq.minGPA && jobReq.minGPA > 0) {
        const studentGPA = parseFloat(studentQual.gpa) || 0;
        if (studentGPA < jobReq.minGPA) {
          qualifies = false;
          reasons.push(`GPA too low: ${studentGPA} < required ${jobReq.minGPA}`);
        } else {
          reasons.push(`✅ GPA met: ${studentGPA} >= ${jobReq.minGPA}`);
        }
      }

      // 3. Check degree type
      if (jobReq.degreeType && studentQual.degreeType) {
        if (jobReq.degreeType.toLowerCase() !== studentQual.degreeType.toLowerCase()) {
          qualifies = false;
          reasons.push(`Degree type mismatch: ${studentQual.degreeType} ≠ required ${jobReq.degreeType}`);
        } else {
          reasons.push(`✅ Degree type matches: ${studentQual.degreeType}`);
        }
      }

      // 4. Check experience level
      if (jobReq.minExperience) {
        const studentExpValue = qualificationUtils.experienceLevels[studentQual.experience]?.value || 0;
        const requiredExpValue = qualificationUtils.experienceLevels[jobReq.minExperience]?.value || 0;
        
        if (studentExpValue < requiredExpValue) {
          qualifies = false;
          reasons.push(`Experience level too low: ${studentQual.experience} < required ${jobReq.minExperience}`);
        } else {
          reasons.push(`✅ Experience level met: ${studentQual.experience} >= ${jobReq.minExperience}`);
        }
      }

      console.log(`Job ${qualifies ? '✅ QUALIFIES' : '❌ DOES NOT QUALIFY'}:`, reasons);
      return qualifies;
    });

    console.log(`✅ Found ${qualifiedJobs.length} qualified jobs out of ${jobs.length}`);
    return qualifiedJobs;
  },

  /**
   * Filter courses based on student grades
   */
  filterQualifiedCourses: (courses, studentProfile) => {
    console.log('📚 Filtering courses based on grades...');
    
    if (!courses || !Array.isArray(courses)) {
      console.log('❌ No courses provided or invalid format');
      return [];
    }

    if (!studentProfile || !studentProfile.qualifications) {
      console.log('❌ No student profile or qualifications found');
      return courses; // Return all courses if no grades to filter by
    }

    const studentGrades = studentProfile.qualifications.grades || {};
    const studentOverallGrade = studentGrades.overall || '';
    const studentSubjects = studentGrades.subjects || {};
    const studentPoints = parseInt(studentGrades.points) || 0;

    console.log(`Student: ${studentOverallGrade} overall, ${studentPoints} points, ${Object.keys(studentSubjects).length} subjects`);

    const qualifiedCourses = courses.filter(course => {
      console.log(`\nChecking course: ${course.name}`);
      console.log('Course requirements:', course.requirements);
      
      if (!course.requirements) {
        console.log('✅ Course has no requirements - student qualifies');
        return true;
      }

      const courseReq = course.requirements;
      let qualifies = true;
      let reasons = [];

      // 1. Check minimum points
      if (courseReq.minPoints && courseReq.minPoints > 0) {
        if (studentPoints < courseReq.minPoints) {
          qualifies = false;
          reasons.push(`Points too low: ${studentPoints} < required ${courseReq.minPoints}`);
        } else {
          reasons.push(`✅ Points met: ${studentPoints} >= ${courseReq.minPoints}`);
        }
      }

      // 2. Check minimum grade
      if (courseReq.minGrade) {
        const studentGradeValue = qualificationUtils.gradeValues[studentOverallGrade] || 0;
        const requiredGradeValue = qualificationUtils.gradeValues[courseReq.minGrade] || 0;
        
        if (studentGradeValue < requiredGradeValue) {
          qualifies = false;
          reasons.push(`Grade too low: ${studentOverallGrade} < required ${courseReq.minGrade}`);
        } else {
          reasons.push(`✅ Grade met: ${studentOverallGrade} >= ${courseReq.minGrade}`);
        }
      }

      // 3. Check required subjects - FIXED: Support both 'subjects' and 'requiredSubjects'
      const requiredSubjects = courseReq.subjects || courseReq.requiredSubjects;
      if (requiredSubjects && requiredSubjects.length > 0) {
        const missingSubjects = requiredSubjects.filter(subject => 
          !studentSubjects.hasOwnProperty(subject)
        );
        
        if (missingSubjects.length > 0) {
          qualifies = false;
          reasons.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
        } else {
          reasons.push(`✅ All required subjects present`);
        }
      }

      // 4. Check specific subject grades
      if (courseReq.subjectGrades) {
        for (const [subject, minGrade] of Object.entries(courseReq.subjectGrades)) {
          const studentSubjectGrade = studentSubjects[subject];
          if (!studentSubjectGrade) {
            qualifies = false;
            reasons.push(`Missing grade for required subject: ${subject}`);
          } else {
            const studentGradeValue = qualificationUtils.gradeValues[studentSubjectGrade] || 0;
            const requiredGradeValue = qualificationUtils.gradeValues[minGrade] || 0;
            
            if (studentGradeValue < requiredGradeValue) {
              qualifies = false;
              reasons.push(`Grade too low for ${subject}: ${studentSubjectGrade} < required ${minGrade}`);
            } else {
              reasons.push(`✅ ${subject} grade met: ${studentSubjectGrade} >= ${minGrade}`);
            }
          }
        }
      }

      console.log(`Course ${qualifies ? '✅ QUALIFIES' : '❌ DOES NOT QUALIFY'}:`, reasons);
      return qualifies;
    });

    console.log(`✅ Found ${qualifiedCourses.length} qualified courses out of ${courses.length}`);
    return qualifiedCourses;
  },

  /**
   * Calculate match score for a job (0-100)
   */
  calculateJobMatchScore: (job, studentProfile) => {
    if (!job.requirements || !studentProfile?.qualifications) {
      return 0;
    }

    const jobReq = job.requirements;
    const studentQual = studentProfile.qualifications;
    let score = 0;
    let totalWeight = 0;

    // Education level (30% weight)
    if (jobReq.educationalLevel || jobReq.educationLevel) {
      totalWeight += 30;
      const requiredLevel = jobReq.educationalLevel || jobReq.educationLevel;
      const studentLevel = studentQual.educationLevel;
      
      const studentLevelValue = qualificationUtils.educationLevels[studentLevel]?.value || 0;
      const requiredLevelValue = qualificationUtils.educationLevels[requiredLevel]?.value || 0;
      
      if (studentLevelValue >= requiredLevelValue) {
        score += 30;
      } else if (studentLevelValue >= requiredLevelValue - 1) {
        score += 15; // Partial credit
      }
    }

    // GPA (25% weight)
    if (jobReq.minGPA && jobReq.minGPA > 0) {
      totalWeight += 25;
      const studentGPA = parseFloat(studentQual.gpa) || 0;
      if (studentGPA >= jobReq.minGPA) {
        score += 25;
      } else if (studentGPA >= jobReq.minGPA - 0.5) {
        score += 12; // Partial credit
      }
    }

    // Experience (20% weight)
    if (jobReq.minExperience) {
      totalWeight += 20;
      const studentExpValue = qualificationUtils.experienceLevels[studentQual.experience]?.value || 0;
      const requiredExpValue = qualificationUtils.experienceLevels[jobReq.minExperience]?.value || 0;
      
      if (studentExpValue >= requiredExpValue) {
        score += 20;
      } else if (studentExpValue >= requiredExpValue - 1) {
        score += 10; // Partial credit
      }
    }

    // Degree type (15% weight)
    if (jobReq.degreeType && studentQual.degreeType) {
      totalWeight += 15;
      if (jobReq.degreeType.toLowerCase() === studentQual.degreeType.toLowerCase()) {
        score += 15;
      }
    }

    // Skills (10% weight) - Simplified version
    if (jobReq.requiredSkills && jobReq.requiredSkills.length > 0) {
      totalWeight += 10;
      const studentSkills = studentQual.skills || [];
      const matchingSkills = jobReq.requiredSkills.filter(skill => 
        studentSkills.includes(skill)
      );
      const skillMatch = (matchingSkills.length / jobReq.requiredSkills.length) * 10;
      score += skillMatch;
    }

    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 100;
  },

  /**
   * Get qualification breakdown for display
   */
  getQualificationBreakdown: (job, studentProfile) => {
    if (!job.requirements || !studentProfile?.qualifications) {
      return [];
    }

    const jobReq = job.requirements;
    const studentQual = studentProfile.qualifications;
    const breakdown = [];

    // Education level
    if (jobReq.educationalLevel || jobReq.educationLevel) {
      const requiredLevel = jobReq.educationalLevel || jobReq.educationLevel;
      const studentLevel = studentQual.educationLevel;
      
      const studentLevelValue = qualificationUtils.educationLevels[studentLevel]?.value || 0;
      const requiredLevelValue = qualificationUtils.educationLevels[requiredLevel]?.value || 0;
      
      breakdown.push({
        requirement: `Education: ${qualificationUtils.educationLevels[requiredLevel]?.label || requiredLevel}`,
        studentValue: qualificationUtils.educationLevels[studentLevel]?.label || studentLevel || 'Not specified',
        meets: studentLevelValue >= requiredLevelValue,
        type: 'education'
      });
    }

    // GPA
    if (jobReq.minGPA && jobReq.minGPA > 0) {
      const studentGPA = parseFloat(studentQual.gpa) || 0;
      breakdown.push({
        requirement: `Minimum GPA: ${jobReq.minGPA}`,
        studentValue: studentGPA > 0 ? studentGPA.toFixed(1) : 'Not specified',
        meets: studentGPA >= jobReq.minGPA,
        type: 'gpa'
      });
    }

    // Experience
    if (jobReq.minExperience) {
      const studentExpValue = qualificationUtils.experienceLevels[studentQual.experience]?.value || 0;
      const requiredExpValue = qualificationUtils.experienceLevels[jobReq.minExperience]?.value || 0;
      
      breakdown.push({
        requirement: `Experience: ${qualificationUtils.experienceLevels[jobReq.minExperience]?.label || jobReq.minExperience}`,
        studentValue: qualificationUtils.experienceLevels[studentQual.experience]?.label || studentQual.experience || 'Not specified',
        meets: studentExpValue >= requiredExpValue,
        type: 'experience'
      });
    }

    return breakdown;
  },

  /**
   * Sort jobs by match score
   */
  sortJobsByMatchScore: (jobs, studentProfile) => {
    return jobs.map(job => ({
      ...job,
      matchScore: qualificationUtils.calculateJobMatchScore(job, studentProfile)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }
};

export default qualificationUtils;