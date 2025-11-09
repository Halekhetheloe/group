import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import NotificationService from './notificationService.js';

class MatchingService {
  constructor() {
    this.notificationService = NotificationService;
  }

  // Find job matches for a student
  async findJobMatchesForStudent(studentId, options = {}) {
    try {
      const { minMatchScore = 70, limit = 10 } = options;

      // Get student details
      const studentDoc = await db.collection(collections.USERS).doc(studentId).get();
      if (!studentDoc.exists) {
        throw new Error('Student not found');
      }

      const student = studentDoc.data();

      // Get student transcripts
      const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
        .where('studentId', '==', studentId)
        .where('verified', '==', true)
        .get();

      const transcripts = [];
      transcriptsSnapshot.forEach(doc => {
        transcripts.push(doc.data());
      });

      // Get active jobs
      const jobsSnapshot = await db.collection(collections.JOBS)
        .where('status', '==', 'active')
        .get();

      const matches = [];

      for (const jobDoc of jobsSnapshot.docs) {
        const job = jobDoc.data();

        // Check if job is still accepting applications
        if (!this.isJobAcceptingApplications(job)) {
          continue;
        }

        // Calculate match score
        const matchScore = this.calculateJobMatchScore(student, transcripts, job);

        if (matchScore >= minMatchScore) {
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
            matchScore,
            matchedCriteria: this.getMatchedCriteria(student, transcripts, job)
          });
        }
      }

      // Sort by match score (descending) and limit results
      return matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding job matches for student:', error);
      throw error;
    }
  }

  // Find qualified students for a job
  async findQualifiedStudentsForJob(jobId, options = {}) {
    try {
      const { minMatchScore = 70, limit = 20 } = options;

      // Get job details
      const jobDoc = await db.collection(collections.JOBS).doc(jobId).get();
      if (!jobDoc.exists) {
        throw new Error('Job not found');
      }

      const job = jobDoc.data();

      // Get all students with verified transcripts
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
        const matchScore = this.calculateJobMatchScore(student, transcripts, job);

        if (matchScore >= minMatchScore) {
          qualifiedStudents.push({
            student: {
              id: studentDoc.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              phone: student.phone
            },
            matchScore,
            matchedCriteria: this.getMatchedCriteria(student, transcripts, job),
            hasTranscripts: transcripts.length > 0,
            averageGPA: this.calculateAverageGPA(transcripts)
          });
        }
      }

      // Sort by match score (descending) and limit results
      return qualifiedStudents
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding qualified students for job:', error);
      throw error;
    }
  }

  // Calculate job match score
  calculateJobMatchScore(student, transcripts, job) {
    let score = 0;
    const criteria = [];

    // Education match (30%)
    const educationMatch = this.checkEducationMatch(student, job);
    score += educationMatch.score * 0.3;
    if (educationMatch.matched) criteria.push('education');

    // Skills match (30%)
    const skillsMatch = this.checkSkillsMatch(student, job);
    score += skillsMatch.score * 0.3;
    if (skillsMatch.matched) criteria.push('skills');

    // Experience match (20%)
    const experienceMatch = this.checkExperienceMatch(student, job);
    score += experienceMatch.score * 0.2;
    if (experienceMatch.matched) criteria.push('experience');

    // Academic performance (20%)
    const academicMatch = this.checkAcademicPerformance(transcripts, job);
    score += academicMatch.score * 0.2;
    if (academicMatch.matched) criteria.push('academic performance');

    return {
      score: Math.round(score * 100) / 100,
      criteria
    };
  }

  // Check education match
  checkEducationMatch(student, job) {
    // This is a simplified implementation
    // In a real system, you'd parse education requirements more carefully
    const jobEducation = job.requirements?.education?.toLowerCase() || '';
    const studentEducation = student.educationLevel || '';

    if (!jobEducation) {
      return { score: 100, matched: true };
    }

    // Simple keyword matching for education
    const educationLevels = ['phd', 'master', 'bachelor', 'diploma', 'certificate', 'high school'];
    let matchScore = 0;

    for (const level of educationLevels) {
      if (jobEducation.includes(level) && studentEducation.toLowerCase().includes(level)) {
        matchScore = 100;
        break;
      }
    }

    return {
      score: matchScore,
      matched: matchScore > 0
    };
  }

  // Check skills match
  checkSkillsMatch(student, job) {
    const jobSkills = job.requirements?.skills || [];
    const studentSkills = student.skills || [];

    if (jobSkills.length === 0) {
      return { score: 100, matched: true };
    }

    const matchedSkills = jobSkills.filter(skill => 
      studentSkills.some(studentSkill => 
        studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(studentSkill.toLowerCase())
      )
    );

    const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;

    return {
      score: matchPercentage,
      matched: matchPercentage >= 50
    };
  }

  // Check experience match
  checkExperienceMatch(student, job) {
    const jobExperience = job.requirements?.experience || '';
    const studentExperience = student.experience || 0;

    if (!jobExperience) {
      return { score: 100, matched: true };
    }

    // Parse experience requirement (e.g., "2-4 years" -> min 2 years)
    const yearsMatch = jobExperience.match(/\d+/g);
    const minYears = yearsMatch ? Math.min(...yearsMatch.map(Number)) : 0;

    const matchScore = studentExperience >= minYears ? 100 : (studentExperience / minYears) * 100;

    return {
      score: Math.min(matchScore, 100),
      matched: studentExperience >= minYears
    };
  }

  // Check academic performance
  checkAcademicPerformance(transcripts, job) {
    if (transcripts.length === 0) {
      return { score: 50, matched: false }; // Base score for no transcripts
    }

    const averageGPA = this.calculateAverageGPA(transcripts);

    if (averageGPA >= 3.5) {
      return { score: 100, matched: true };
    } else if (averageGPA >= 3.0) {
      return { score: 80, matched: true };
    } else if (averageGPA >= 2.5) {
      return { score: 60, matched: true };
    } else {
      return { score: 40, matched: false };
    }
  }

  // Calculate average GPA from transcripts
  calculateAverageGPA(transcripts) {
    if (transcripts.length === 0) return 0;

    const totalGPA = transcripts.reduce((sum, transcript) => {
      return sum + (transcript.gpa || 0);
    }, 0);

    return totalGPA / transcripts.length;
  }

  // Get matched criteria
  getMatchedCriteria(student, transcripts, job) {
    const criteria = [];

    const educationMatch = this.checkEducationMatch(student, job);
    if (educationMatch.matched) criteria.push('Education');

    const skillsMatch = this.checkSkillsMatch(student, job);
    if (skillsMatch.matched) criteria.push('Skills');

    const experienceMatch = this.checkExperienceMatch(student, job);
    if (experienceMatch.matched) criteria.push('Experience');

    const academicMatch = this.checkAcademicPerformance(transcripts, job);
    if (academicMatch.matched) criteria.push('Academic Performance');

    return criteria;
  }

  // Check if job is accepting applications
  isJobAcceptingApplications(job) {
    if (job.status !== 'active') {
      return false;
    }

    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return false;
    }

    return true;
  }

  // Auto-match and notify students for new jobs
  async autoMatchAndNotifyForJob(jobId) {
    try {
      const qualifiedStudents = await this.findQualifiedStudentsForJob(jobId, {
        minMatchScore: 70,
        limit: 50
      });

      const notificationPromises = qualifiedStudents.map(student => 
        this.notificationService.sendJobMatchNotification(
          student.student.id,
          jobId,
          student.matchScore
        ).catch(error => {
          console.error(`Failed to send notification to student ${student.student.id}:`, error);
          return null;
        })
      );

      const results = await Promise.allSettled(notificationPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      return {
        totalStudents: qualifiedStudents.length,
        notified: successful,
        failed,
        qualifiedStudents: qualifiedStudents.map(s => ({
          id: s.student.id,
          name: `${s.student.firstName} ${s.student.lastName}`,
          matchScore: s.matchScore
        }))
      };
    } catch (error) {
      console.error('Error in auto-match and notify:', error);
      throw error;
    }
  }

  // Get matching statistics
  async getMatchingStats() {
    try {
      const jobsSnapshot = await db.collection(collections.JOBS)
        .where('status', '==', 'active')
        .get();

      const studentsSnapshot = await db.collection(collections.USERS)
        .where('role', '==', 'student')
        .where('status', '==', 'active')
        .get();

      const stats = {
        totalActiveJobs: jobsSnapshot.size,
        totalActiveStudents: studentsSnapshot.size,
        averageMatchesPerJob: 0,
        topMatchingCriteria: {}
      };

      // Calculate average matches (simplified)
      let totalMatches = 0;
      for (const jobDoc of jobsSnapshot.docs) {
        const job = jobDoc.data();
        const matches = await this.findQualifiedStudentsForJob(jobDoc.id, { limit: 100 });
        totalMatches += matches.length;
      }

      stats.averageMatchesPerJob = jobsSnapshot.size > 0 ? totalMatches / jobsSnapshot.size : 0;

      return stats;
    } catch (error) {
      console.error('Error getting matching stats:', error);
      throw error;
    }
  }
}

export default new MatchingService();