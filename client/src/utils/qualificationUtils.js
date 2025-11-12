// Qualification matching utilities
export const qualificationUtils = {
  // Check if student meets all job requirements
  checkJobQualification: (job, studentProfile) => {
    if (!job.requirements || !studentProfile?.qualifications) {
      return { qualified: false, reasons: ['Missing requirements or qualifications'] }
    }

    const jobReq = job.requirements
    const studentQual = studentProfile.qualifications
    const reasons = []
    let meetsAllRequirements = true

    // 1. Check GPA requirement
    if (jobReq.minGPA && studentQual.gpa) {
      if (studentQual.gpa < jobReq.minGPA) {
        meetsAllRequirements = false
        reasons.push(`GPA too low: ${studentQual.gpa} < required ${jobReq.minGPA}`)
      }
    } else if (jobReq.minGPA && !studentQual.gpa) {
      meetsAllRequirements = false
      reasons.push('GPA requirement exists but student has no GPA recorded')
    }

    // 2. Check education level
    if (jobReq.educationLevel) {
      const educationHierarchy = {
        'high_school': 1,
        'associate': 2,
        'bachelor': 3,
        'master': 4,
        'phd': 5
      }

      const studentLevel = educationHierarchy[studentQual.educationLevel] || 0
      const requiredLevel = educationHierarchy[jobReq.educationLevel] || 0

      if (studentLevel < requiredLevel) {
        meetsAllRequirements = false
        reasons.push(`Education level too low: ${studentQual.educationLevel} < required ${jobReq.educationLevel}`)
      }
    }

    // 3. Check degree type
    if (jobReq.degreeType && studentQual.degreeType) {
      if (jobReq.degreeType.toLowerCase() !== studentQual.degreeType.toLowerCase()) {
        meetsAllRequirements = false
        reasons.push(`Degree type mismatch: ${studentQual.degreeType} ≠ required ${jobReq.degreeType}`)
      }
    } else if (jobReq.degreeType && !studentQual.degreeType) {
      meetsAllRequirements = false
      reasons.push(`Degree type required: ${jobReq.degreeType} but student has no degree type recorded`)
    }

    // 4. Check required certificates
    if (jobReq.requiredCertificates && jobReq.requiredCertificates.length > 0) {
      const missingCertificates = jobReq.requiredCertificates.filter(cert => 
        !studentQual.certificates?.includes(cert)
      )
      
      if (missingCertificates.length > 0) {
        meetsAllRequirements = false
        reasons.push(`Missing certificates: ${missingCertificates.join(', ')}`)
      }
    }

    // 5. Check required skills (at least 60% match)
    if (jobReq.requiredSkills && jobReq.requiredSkills.length > 0) {
      const studentSkills = studentQual.skills || []
      const matchingSkills = jobReq.requiredSkills.filter(skill =>
        studentSkills.includes(skill)
      )
      const skillMatchPercentage = (matchingSkills.length / jobReq.requiredSkills.length) * 100

      if (skillMatchPercentage < 60) {
        meetsAllRequirements = false
        reasons.push(`Insufficient skills: ${skillMatchPercentage.toFixed(0)}% match (need 60%)`)
      }
    }

    // 6. Check experience level
    if (jobReq.minExperience) {
      const experienceHierarchy = {
        'no_experience': 1,
        'internship': 2,
        'entry_level': 3,
        'mid_level': 4,
        'senior_level': 5,
        'executive': 6
      }

      const studentExp = experienceHierarchy[studentQual.experience] || 0
      const requiredExp = experienceHierarchy[jobReq.minExperience] || 0

      if (studentExp < requiredExp) {
        meetsAllRequirements = false
        reasons.push(`Experience level too low: ${studentQual.experience} < required ${jobReq.minExperience}`)
      }
    }

    // 7. Check required documents
    if (jobReq.requiredDocuments && jobReq.requiredDocuments.length > 0) {
      const studentDocs = studentQual.documents || {}
      const missingDocuments = jobReq.requiredDocuments.filter(doc => 
        !studentDocs[doc]
      )
      
      if (missingDocuments.length > 0) {
        meetsAllRequirements = false
        reasons.push(`Missing documents: ${missingDocuments.map(doc => 
          doc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        ).join(', ')}`)
      }
    }

    return {
      qualified: meetsAllRequirements,
      reasons: meetsAllRequirements ? ['Meets all requirements'] : reasons,
      matchScore: meetsAllRequirements ? 100 : this.calculateMatchScore(jobReq, studentQual)
    }
  },

  // Calculate match score percentage (0-100)
  calculateMatchScore: (jobRequirements, studentQualifications) => {
    let score = 0
    let totalWeight = 0
    const weights = {
      gpa: 15,
      educationLevel: 20,
      degreeType: 10,
      certificates: 15,
      skills: 20,
      experience: 15,
      documents: 5
    }

    // GPA match (if required)
    if (jobRequirements.minGPA) {
      totalWeight += weights.gpa
      if (studentQualifications.gpa && studentQualifications.gpa >= jobRequirements.minGPA) {
        score += weights.gpa
      } else if (studentQualifications.gpa) {
        // Partial credit for close GPA
        const gpaDiff = jobRequirements.minGPA - studentQualifications.gpa
        if (gpaDiff <= 0.5) {
          score += weights.gpa * 0.5
        }
      }
    }

    // Education level match
    if (jobRequirements.educationLevel) {
      totalWeight += weights.educationLevel
      const educationHierarchy = {
        'high_school': 1, 'associate': 2, 'bachelor': 3, 'master': 4, 'phd': 5
      }
      const studentLevel = educationHierarchy[studentQualifications.educationLevel] || 0
      const requiredLevel = educationHierarchy[jobRequirements.educationLevel] || 0
      
      if (studentLevel >= requiredLevel) {
        score += weights.educationLevel
      } else if (studentLevel >= requiredLevel - 1) {
        score += weights.educationLevel * 0.5
      }
    }

    // Degree type match
    if (jobRequirements.degreeType) {
      totalWeight += weights.degreeType
      if (studentQualifications.degreeType && 
          studentQualifications.degreeType.toLowerCase() === jobRequirements.degreeType.toLowerCase()) {
        score += weights.degreeType
      }
    }

    // Certificates match
    if (jobRequirements.requiredCertificates && jobRequirements.requiredCertificates.length > 0) {
      totalWeight += weights.certificates
      const studentCerts = studentQualifications.certificates || []
      const certMatch = jobRequirements.requiredCertificates.filter(cert => 
        studentCerts.includes(cert)
      ).length
      const certPercentage = certMatch / jobRequirements.requiredCertificates.length
      score += weights.certificates * certPercentage
    }

    // Skills match
    if (jobRequirements.requiredSkills && jobRequirements.requiredSkills.length > 0) {
      totalWeight += weights.skills
      const studentSkills = studentQualifications.skills || []
      const skillMatch = jobRequirements.requiredSkills.filter(skill =>
        studentSkills.includes(skill)
      ).length
      const skillPercentage = skillMatch / jobRequirements.requiredSkills.length
      score += weights.skills * skillPercentage
    }

    // Experience match
    if (jobRequirements.minExperience) {
      totalWeight += weights.experience
      const experienceHierarchy = {
        'no_experience': 1, 'internship': 2, 'entry_level': 3, 
        'mid_level': 4, 'senior_level': 5, 'executive': 6
      }
      const studentExp = experienceHierarchy[studentQualifications.experience] || 0
      const requiredExp = experienceHierarchy[jobRequirements.minExperience] || 0
      
      if (studentExp >= requiredExp) {
        score += weights.experience
      } else if (studentExp >= requiredExp - 1) {
        score += weights.experience * 0.5
      }
    }

    // Documents match
    if (jobRequirements.requiredDocuments && jobRequirements.requiredDocuments.length > 0) {
      totalWeight += weights.documents
      const studentDocs = studentQualifications.documents || {}
      const docMatch = jobRequirements.requiredDocuments.filter(doc => 
        studentDocs[doc]
      ).length
      const docPercentage = docMatch / jobRequirements.requiredDocuments.length
      score += weights.documents * docPercentage
    }

    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
  },

  // Get qualification breakdown for display
  getQualificationBreakdown: (job, studentProfile) => {
    if (!job.requirements || !studentProfile?.qualifications) {
      return []
    }

    const jobReq = job.requirements
    const studentQual = studentProfile.qualifications
    const breakdown = []

    // GPA
    if (jobReq.minGPA) {
      const meets = studentQual.gpa && studentQual.gpa >= jobReq.minGPA
      breakdown.push({
        requirement: `Minimum GPA: ${jobReq.minGPA}`,
        studentValue: studentQual.gpa || 'Not provided',
        meets,
        type: 'gpa'
      })
    }

    // Education Level
    if (jobReq.educationLevel) {
      const educationHierarchy = {
        'high_school': 1, 'associate': 2, 'bachelor': 3, 'master': 4, 'phd': 5
      }
      const studentLevel = educationHierarchy[studentQual.educationLevel] || 0
      const requiredLevel = educationHierarchy[jobReq.educationLevel] || 0
      const meets = studentLevel >= requiredLevel
      
      breakdown.push({
        requirement: `Education: ${this.formatEducationLevel(jobReq.educationLevel)}`,
        studentValue: this.formatEducationLevel(studentQual.educationLevel) || 'Not provided',
        meets,
        type: 'education'
      })
    }

    // Degree Type
    if (jobReq.degreeType) {
      const meets = studentQual.degreeType && 
                   studentQual.degreeType.toLowerCase() === jobReq.degreeType.toLowerCase()
      breakdown.push({
        requirement: `Degree in: ${jobReq.degreeType}`,
        studentValue: studentQual.degreeType || 'Not provided',
        meets,
        type: 'degree'
      })
    }

    // Certificates
    if (jobReq.requiredCertificates && jobReq.requiredCertificates.length > 0) {
      const studentCerts = studentQual.certificates || []
      const missingCerts = jobReq.requiredCertificates.filter(cert => 
        !studentCerts.includes(cert)
      )
      const meets = missingCerts.length === 0
      
      breakdown.push({
        requirement: `Certificates: ${jobReq.requiredCertificates.join(', ')}`,
        studentValue: studentCerts.length > 0 ? studentCerts.join(', ') : 'None',
        meets,
        type: 'certificates'
      })
    }

    // Skills
    if (jobReq.requiredSkills && jobReq.requiredSkills.length > 0) {
      const studentSkills = studentQual.skills || []
      const matchingSkills = jobReq.requiredSkills.filter(skill =>
        studentSkills.includes(skill)
      )
      const matchPercentage = (matchingSkills.length / jobReq.requiredSkills.length) * 100
      const meets = matchPercentage >= 60
      
      breakdown.push({
        requirement: `Skills: ${jobReq.requiredSkills.join(', ')}`,
        studentValue: `${matchingSkills.length}/${jobReq.requiredSkills.length} skills (${matchPercentage.toFixed(0)}%)`,
        meets,
        type: 'skills'
      })
    }

    // Experience
    if (jobReq.minExperience) {
      const experienceHierarchy = {
        'no_experience': 1, 'internship': 2, 'entry_level': 3, 
        'mid_level': 4, 'senior_level': 5, 'executive': 6
      }
      const studentExp = experienceHierarchy[studentQual.experience] || 0
      const requiredExp = experienceHierarchy[jobReq.minExperience] || 0
      const meets = studentExp >= requiredExp
      
      breakdown.push({
        requirement: `Experience: ${this.formatExperience(jobReq.minExperience)}`,
        studentValue: this.formatExperience(studentQual.experience) || 'Not provided',
        meets,
        type: 'experience'
      })
    }

    // Documents
    if (jobReq.requiredDocuments && jobReq.requiredDocuments.length > 0) {
      const studentDocs = studentQual.documents || {}
      const missingDocs = jobReq.requiredDocuments.filter(doc => !studentDocs[doc])
      const meets = missingDocs.length === 0
      
      breakdown.push({
        requirement: `Documents: ${jobReq.requiredDocuments.map(doc => 
          doc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        ).join(', ')}`,
        studentValue: `${jobReq.requiredDocuments.length - missingDocs.length}/${jobReq.requiredDocuments.length} documents`,
        meets,
        type: 'documents'
      })
    }

    return breakdown
  },

  // Helper function to format education level for display
  formatEducationLevel: (level) => {
    const levels = {
      'high_school': 'High School Diploma',
      'associate': 'Associate Degree',
      'bachelor': "Bachelor's Degree",
      'master': "Master's Degree",
      'phd': 'PhD'
    }
    return levels[level] || level
  },

  // Helper function to format experience for display
  formatExperience: (experience) => {
    const experiences = {
      'no_experience': 'No Experience',
      'internship': 'Internship',
      'entry_level': 'Entry Level (0-2 years)',
      'mid_level': 'Mid Level (2-5 years)',
      'senior_level': 'Senior Level (5+ years)',
      'executive': 'Executive'
    }
    return experiences[experience] || experience
  },

  // Filter jobs by qualification
  filterQualifiedJobs: (jobs, studentProfile) => {
    return jobs.filter(job => {
      const qualification = this.checkJobQualification(job, studentProfile)
      return qualification.qualified
    })
  },

  // Sort jobs by match score
  sortJobsByMatchScore: (jobs, studentProfile) => {
    return jobs.map(job => {
      const qualification = this.checkJobQualification(job, studentProfile)
      return {
        ...job,
        matchScore: qualification.matchScore,
        qualificationReasons: qualification.reasons
      }
    }).sort((a, b) => b.matchScore - a.matchScore)
  }
}

export default qualificationUtils