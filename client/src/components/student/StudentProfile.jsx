import React, { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, X, Upload, GraduationCap, Award, BookOpen, Save, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const StudentProfile = () => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    education: {
      level: '',
      institution: '',
      major: '',
      graduationYear: '',
      gpa: '',
      degreeType: '',
      // Course-specific grades
      subjects: {},
      overallGrade: '',
      points: 0
    },
    certificates: [],
    skills: [],
    documents: {
      transcript: false,
      diploma: false,
      certificate: false,
      portfolio: false,
      recommendation_letter: false,
      cover_letter: false
    },
    experience: '',
    profileCompleted: false
  })
  const [currentCertificate, setCurrentCertificate] = useState('')
  const [currentSkill, setCurrentSkill] = useState('')
  const [subjectInput, setSubjectInput] = useState({ name: '', grade: '' })

  // Predefined options for better UX
  const educationLevels = [
    { value: 'high_school', label: 'High School Diploma' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' }
  ]

  const degreeTypes = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Medicine',
    'Law',
    'Arts',
    'Sciences',
    'Education',
    'Other'
  ]

  const experienceLevels = [
    { value: 'no_experience', label: 'No Experience' },
    { value: 'internship', label: 'Internship' },
    { value: 'entry_level', label: 'Entry Level (0-2 years)' },
    { value: 'mid_level', label: 'Mid Level (2-5 years)' },
    { value: 'senior_level', label: 'Senior Level (5+ years)' }
  ]

  const commonCertificates = [
    'AWS Certified Solutions Architect',
    'Google Cloud Certified',
    'Microsoft Certified: Azure Fundamentals',
    'PMP (Project Management Professional)',
    'CompTIA A+',
    'CompTIA Security+',
    'Cisco CCNA',
    'Certified Ethical Hacker (CEH)',
    'Six Sigma Green Belt',
    'Scrum Master Certified',
    'IELTS Academic',
    'TOEFL iBT',
    'First Aid Certified',
    'CPR Certified'
  ]

  const commonSkills = [
    'JavaScript',
    'Python',
    'Java',
    'React',
    'Node.js',
    'SQL',
    'HTML/CSS',
    'TypeScript',
    'Git',
    'Docker',
    'AWS',
    'Azure',
    'Project Management',
    'Communication',
    'Problem Solving',
    'Team Leadership',
    'Data Analysis',
    'Machine Learning',
    'UI/UX Design',
    'Agile Methodology'
  ]

  const gradeOptions = ['A', 'B', 'C', 'D', 'E', 'F']

  useEffect(() => {
    fetchStudentProfile()
  }, [userData])

  const fetchStudentProfile = async () => {
    try {
      if (!userData) return

      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      if (studentDoc.exists()) {
        const studentData = studentDoc.data()
        setProfile(prev => ({
          ...prev,
          ...studentData,
          education: {
            ...prev.education,
            ...(studentData.education || {})
          },
          documents: {
            ...prev.documents,
            ...(studentData.documents || {})
          },
          certificates: studentData.certificates || [],
          skills: studentData.skills || []
        }))
      } else {
        // Initialize with user data
        setProfile(prev => ({
          ...prev,
          displayName: userData.displayName || '',
          email: userData.email || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEducationChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      education: {
        ...prev.education,
        [field]: value
      }
    }))
  }

  const handleDocumentChange = (document, hasDocument) => {
    setProfile(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [document]: hasDocument
      }
    }))
  }

  // Certificate functions with dropdown
  const addCertificate = (certificate = null) => {
    const certToAdd = certificate || currentCertificate.trim()
    if (certToAdd && !profile.certificates.includes(certToAdd)) {
      setProfile(prev => ({
        ...prev,
        certificates: [...prev.certificates, certToAdd]
      }))
      setCurrentCertificate('')
    }
  }

  const removeCertificate = (certificate) => {
    setProfile(prev => ({
      ...prev,
      certificates: prev.certificates.filter(c => c !== certificate)
    }))
  }

  // Skills functions with dropdown
  const addSkill = (skill = null) => {
    const skillToAdd = skill || currentSkill.trim()
    if (skillToAdd && !profile.skills.includes(skillToAdd)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skillToAdd]
      }))
      setCurrentSkill('')
    }
  }

  const removeSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  // Subject/Grades functions
  const addSubject = () => {
    if (subjectInput.name.trim() && subjectInput.grade) {
      setProfile(prev => ({
        ...prev,
        education: {
          ...prev.education,
          subjects: {
            ...prev.education.subjects,
            [subjectInput.name.trim()]: subjectInput.grade
          }
        }
      }))
      setSubjectInput({ name: '', grade: '' })
    }
  }

  const removeSubject = (subjectName) => {
    setProfile(prev => ({
      ...prev,
      education: {
        ...prev.education,
        subjects: Object.fromEntries(
          Object.entries(prev.education.subjects).filter(([name]) => name !== subjectName)
        )
      }
    }))
  }

  const calculateProfileCompletion = () => {
    let completed = 0
    let total = 0

    // Basic info
    if (profile.displayName) completed++
    if (profile.email) completed++
    total += 2

    // Education
    const education = profile.education
    if (education.level) completed++
    if (education.institution) completed++
    if (education.major) completed++
    if (education.gpa) completed++
    if (education.overallGrade) completed++
    total += 5

    // Skills & certificates
    if (profile.skills.length > 0) completed++
    if (profile.certificates.length > 0) completed++
    total += 2

    // Experience
    if (profile.experience) completed++
    total += 1

    return Math.round((completed / total) * 100)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      if (!userData) {
        toast.error('You must be logged in to save your profile')
        return
      }

      const profileData = {
        ...profile,
        updatedAt: new Date(),
        profileCompleted: calculateProfileCompletion() >= 70,
        qualifications: {
          gpa: profile.education.gpa ? parseFloat(profile.education.gpa) : null,
          educationLevel: profile.education.level,
          degreeType: profile.education.major,
          certificates: profile.certificates,
          skills: profile.skills,
          experience: profile.experience,
          documents: profile.documents,
          // Course qualifications
          grades: {
            overall: profile.education.overallGrade,
            subjects: profile.education.subjects,
            points: profile.education.points || 0
          }
        }
      }

      await setDoc(doc(db, 'students', userData.uid), profileData, { merge: true })
      
      const completion = calculateProfileCompletion()
      toast.success(`Profile saved! ${completion}% complete`)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const completionPercentage = calculateProfileCompletion()

  const SectionButton = ({ id, title, icon: Icon, isActive }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`flex items-center space-x-3 px-6 py-4 w-full text-left rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
      <span className="font-medium">{title}</span>
      {isActive ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
              <p className="text-gray-600 mt-2">
                Complete your profile to qualify for courses and jobs
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-48 bg-white rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-gray-700 min-w-12">
                  {completionPercentage}%
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {completionPercentage >= 70 ? '🎉 Profile Complete!' : 'Complete for better opportunities'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {completionPercentage < 70 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-orange-500 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">
                  Complete Your Profile
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  Finish setting up your profile to see courses and jobs that match your qualifications. 
                  You need at least 70% completion.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-3">
            <SectionButton
              id="basic"
              title="Basic Info"
              icon={FileText}
              isActive={activeSection === 'basic'}
            />
            <SectionButton
              id="education"
              title="Education & Grades"
              icon={GraduationCap}
              isActive={activeSection === 'education'}
            />
            <SectionButton
              id="certificates"
              title="Certificates"
              icon={Award}
              isActive={activeSection === 'certificates'}
            />
            <SectionButton
              id="skills"
              title="Skills"
              icon={BookOpen}
              isActive={activeSection === 'skills'}
            />
            <SectionButton
              id="documents"
              title="Documents"
              icon={CheckCircle}
              isActive={activeSection === 'documents'}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={profile.displayName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="+266 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        name="experience"
                        value={profile.experience}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select experience level</option>
                        {experienceLevels.map(exp => (
                          <option key={exp.value} value={exp.value}>
                            {exp.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={profile.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Tell us about yourself, your career goals, and what you're looking for..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Education & Grades */}
              {activeSection === 'education' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Education & Grades</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Education Level *
                      </label>
                      <select
                        value={profile.education.level}
                        onChange={(e) => handleEducationChange('level', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select education level</option>
                        {educationLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={profile.education.institution}
                        onChange={(e) => handleEducationChange('institution', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., National University of Lesotho"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Major/Field of Study *
                      </label>
                      <select
                        value={profile.education.major}
                        onChange={(e) => handleEducationChange('major', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select your major</option>
                        {degreeTypes.map(degree => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        value={profile.education.graduationYear}
                        onChange={(e) => handleEducationChange('graduationYear', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 2024"
                        min="1900"
                        max="2030"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        GPA (4.0 scale)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="4.0"
                        value={profile.education.gpa}
                        onChange={(e) => handleEducationChange('gpa', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 3.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Overall Grade
                      </label>
                      <select
                        value={profile.education.overallGrade}
                        onChange={(e) => handleEducationChange('overallGrade', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select overall grade</option>
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>
                            Grade {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject Grades */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Grades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                        <input
                          type="text"
                          value={subjectInput.name}
                          onChange={(e) => setSubjectInput(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                        <select
                          value={subjectInput.grade}
                          onChange={(e) => setSubjectInput(prev => ({ ...prev, grade: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select grade</option>
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={addSubject}
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Add Subject
                        </button>
                      </div>
                    </div>

                    {/* Display Subjects */}
                    {Object.keys(profile.education.subjects).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Your Subjects</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(profile.education.subjects).map(([subject, grade]) => (
                            <div key={subject} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border">
                              <div>
                                <span className="font-medium text-gray-900">{subject}</span>
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                  Grade: {grade}
                                </span>
                              </div>
                              <button
                                onClick={() => removeSubject(subject)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {activeSection === 'certificates' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Certificates & Licenses</h2>
                  
                  {/* Certificate Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Add Certificate
                    </label>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={currentCertificate}
                        onChange={(e) => setCurrentCertificate(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Type or select a certificate..."
                        list="certificateOptions"
                      />
                      <datalist id="certificateOptions">
                        {commonCertificates.map(cert => (
                          <option key={cert} value={cert} />
                        ))}
                      </datalist>
                      <button
                        onClick={() => addCertificate()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Quick add common certificates:</p>
                      <div className="flex flex-wrap gap-2">
                        {commonCertificates.slice(0, 6).map(cert => (
                          <button
                            key={cert}
                            onClick={() => addCertificate(cert)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors duration-200"
                          >
                            + {cert.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Certificate List */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Certificates</h3>
                    {profile.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.certificates.map((certificate, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center">
                              <Award className="h-5 w-5 text-blue-500 mr-3" />
                              <span className="font-medium text-gray-900">{certificate}</span>
                            </div>
                            <button
                              onClick={() => removeCertificate(certificate)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No certificates added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add certificates to enhance your profile</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
                  
                  {/* Skill Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Add Skill
                    </label>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Type or select a skill..."
                        list="skillOptions"
                      />
                      <datalist id="skillOptions">
                        {commonSkills.map(skill => (
                          <option key={skill} value={skill} />
                        ))}
                      </datalist>
                      <button
                        onClick={() => addSkill()}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </button>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Quick add common skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {commonSkills.slice(0, 8).map(skill => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors duration-200"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skill List */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills</h3>
                    {profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {profile.skills.map((skill, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200"
                          >
                            <span className="font-medium text-gray-900 mr-2">{skill}</span>
                            <button
                              onClick={() => removeSkill(skill)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No skills added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add skills to show what you can do</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              {activeSection === 'documents' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Documents</h2>
                  <p className="text-gray-600 mb-6">
                    Select which documents you have available for course and job applications
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(profile.documents).map(([doc, hasDoc]) => (
                      <label 
                        key={doc} 
                        className={`flex items-center space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          hasDoc 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          hasDoc 
                            ? 'bg-green-500 border-green-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {hasDoc && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={hasDoc}
                          onChange={(e) => handleDocumentChange(doc, e.target.checked)}
                          className="hidden"
                        />
                        <div className="flex-1">
                          <span className={`font-medium capitalize ${
                            hasDoc ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {doc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          {hasDoc && (
                            <p className="text-sm text-green-600 mt-1">✓ Available for applications</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-8 mt-8 border-t border-gray-200">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile