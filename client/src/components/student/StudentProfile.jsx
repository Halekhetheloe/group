import React, { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, X, GraduationCap, Award, BookOpen, Save, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const StudentProfile = () => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    education: {
      level: '',
      institution: '',
      major: '',
      gpa: '',
      // Course qualifications
      subjects: {},
      overallGrade: '',
      points: 0
    },
    experience: '',
    profileCompleted: false
  })
  const [subjectInput, setSubjectInput] = useState({ name: '', grade: '' })

  // Education levels for job requirements
  const educationLevels = [
    { value: 'high_school', label: 'High School Diploma' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' }
  ]

  const experienceLevels = [
    { value: 'no_experience', label: 'No Experience' },
    { value: 'internship', label: 'Internship' },
    { value: 'entry_level', label: 'Entry Level (0-2 years)' },
    { value: 'mid_level', label: 'Mid Level (2-5 years)' },
    { value: 'senior_level', label: 'Senior Level (5+ years)' }
  ]

  // Common subjects
  const commonSubjects = [
    'Mathematics', 'English Language', 'Science', 'Biology', 'Physics', 'Chemistry',
    'Computer Science', 'Programming', 'Data Structures', 'Algorithms',
    'Database Management', 'Web Development', 'Networking', 'Statistics'
  ]

  // Grade options with points for course requirements
  const gradeOptions = [
    { value: 'A', label: 'A', points: 5 },
    { value: 'B', label: 'B', points: 4 },
    { value: 'C', label: 'C', points: 3 },
    { value: 'D', label: 'D', points: 2 },
    { value: 'E', label: 'E', points: 1 },
    { value: 'F', label: 'F', points: 0 }
  ]

  // Calculate total points automatically
  const calculateTotalPoints = (subjects) => {
    return Object.values(subjects).reduce((total, grade) => {
      const gradeInfo = gradeOptions.find(g => g.value === grade)
      return total + (gradeInfo?.points || 0)
    }, 0)
  }

  // NEW: Auto-calculate overall grade based on subjects
  const calculateOverallGrade = (subjects) => {
    if (!subjects || Object.keys(subjects).length === 0) return '';
    
    const gradePoints = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
    let totalPoints = 0;
    let subjectCount = 0;
    
    Object.values(subjects).forEach(grade => {
      if (grade && gradePoints[grade] !== undefined) {
        totalPoints += gradePoints[grade];
        subjectCount++;
      }
    });
    
    if (subjectCount === 0) return '';
    
    const averagePoints = totalPoints / subjectCount;
    
    // Convert back to letter grade
    if (averagePoints >= 4.5) return 'A';
    if (averagePoints >= 3.5) return 'B';
    if (averagePoints >= 2.5) return 'C';
    if (averagePoints >= 1.5) return 'D';
    return 'E';
  }

  useEffect(() => {
    fetchStudentProfile()
  }, [userData])

  // Auto-update points when subjects change
  useEffect(() => {
    const totalPoints = calculateTotalPoints(profile.education.subjects)
    setProfile(prev => ({
      ...prev,
      education: {
        ...prev.education,
        points: totalPoints
      }
    }))

    // NEW: Auto-calculate overall grade when subjects change
    if (Object.keys(profile.education.subjects).length > 0) {
      const calculatedOverallGrade = calculateOverallGrade(profile.education.subjects)
      if (calculatedOverallGrade && !profile.education.overallGrade) {
        setProfile(prev => ({
          ...prev,
          education: {
            ...prev.education,
            overallGrade: calculatedOverallGrade
          }
        }))
      }
    }
  }, [profile.education.subjects])

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
          }
        }))
      } else {
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

  // Subject functions
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

  const getGradePoints = (grade) => {
    const gradeInfo = gradeOptions.find(g => g.value === grade)
    return gradeInfo?.points || 0
  }

  const calculateProfileCompletion = () => {
    let completed = 0
    let total = 0

    // Basic info
    if (profile.displayName) completed++
    if (profile.email) completed++
    total += 2

    // Education (job requirements)
    if (profile.education.level) completed++
    if (profile.education.institution) completed++
    if (profile.education.gpa) completed++
    total += 3

    // Course requirements
    if (Object.keys(profile.education.subjects).length > 0) completed++
    if (profile.education.overallGrade) completed++ // NEW: Count overall grade
    total += 2

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
        // Job qualifications
        qualifications: {
          gpa: profile.education.gpa ? parseFloat(profile.education.gpa) : null,
          educationLevel: profile.education.level,
          experience: profile.experience,
          // Course qualifications
          grades: {
            overall: profile.education.overallGrade,
            subjects: profile.education.subjects,
            points: profile.education.points
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
                {[...Array(3)].map((_, i) => (
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
              id="jobRequirements"
              title="Job Requirements"
              icon={Award}
              isActive={activeSection === 'jobRequirements'}
            />
            <SectionButton
              id="courseRequirements"
              title="Course Requirements"
              icon={BookOpen}
              isActive={activeSection === 'courseRequirements'}
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
                  </div>
                </div>
              )}

              {/* Job Requirements */}
              {activeSection === 'jobRequirements' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Requirements</h2>
                  <p className="text-gray-600 mb-6">
                    Set your educational qualifications for job applications
                  </p>
                  
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
                        Major/Field of Study
                      </label>
                      <input
                        type="text"
                        value={profile.education.major}
                        onChange={(e) => handleEducationChange('major', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        GPA (4.0 scale) *
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
                  </div>
                </div>
              )}

              {/* Course Requirements */}
              {activeSection === 'courseRequirements' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Requirements</h2>
                  <p className="text-gray-600 mb-6">
                    Add your subject grades - points are automatically calculated
                  </p>

                  {/* NEW: Overall Grade Selection */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Overall Grade</h3>
                    <p className="text-blue-700 mb-4">
                      Set your overall grade. This is required for course eligibility.
                      {Object.keys(profile.education.subjects).length > 0 && !profile.education.overallGrade && (
                        <span className="font-medium"> We suggest: {calculateOverallGrade(profile.education.subjects)}</span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-800 mb-2">
                          Overall Grade *
                        </label>
                        <select
                          value={profile.education.overallGrade}
                          onChange={(e) => handleEducationChange('overallGrade', e.target.value)}
                          className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="">Select your overall grade</option>
                          {gradeOptions.map(grade => (
                            <option key={grade.value} value={grade.value}>
                              {grade.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const suggestedGrade = calculateOverallGrade(profile.education.subjects)
                            if (suggestedGrade) {
                              handleEducationChange('overallGrade', suggestedGrade)
                              toast.success(`Overall grade set to ${suggestedGrade}`)
                            }
                          }}
                          disabled={Object.keys(profile.education.subjects).length === 0}
                          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Use Suggested Grade
                        </button>
                      </div>
                    </div>
                    {!profile.education.overallGrade && (
                      <p className="text-red-600 text-sm mt-3 font-medium">
                        ⚠️ Overall grade is required for course eligibility
                      </p>
                    )}
                  </div>

                  {/* Points Display */}
                  {profile.education.points > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-800">Total Points: {profile.education.points}</h3>
                          <p className="text-sm text-green-600 mt-1">
                            Based on {Object.keys(profile.education.subjects).length} subject(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">
                            A=5, B=4, C=3, D=2, E=1, F=0
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Subject Form */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <select
                        value={subjectInput.name}
                        onChange={(e) => setSubjectInput(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select subject</option>
                        {commonSubjects.map(subject => (
                          <option 
                            key={subject} 
                            value={subject}
                            disabled={Object.keys(profile.education.subjects).includes(subject)}
                          >
                            {subject} {Object.keys(profile.education.subjects).includes(subject) ? '✓' : ''}
                          </option>
                        ))}
                      </select>
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
                          <option key={grade.value} value={grade.value}>
                            {grade.label} ({grade.points} points)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addSubject}
                        disabled={!subjectInput.name || !subjectInput.grade}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Add Subject
                      </button>
                    </div>
                  </div>

                  {/* Subjects List */}
                  {Object.keys(profile.education.subjects).length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Your Subjects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(profile.education.subjects).map(([subject, grade]) => {
                          const points = getGradePoints(grade)
                          return (
                            <div key={subject} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border">
                              <div>
                                <span className="font-medium text-gray-900">{subject}</span>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-sm px-2 py-1 rounded-full ${
                                    points >= 4 ? 'bg-green-100 text-green-800' :
                                    points >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    Grade: {grade}
                                  </span>
                                  <span className="text-sm text-blue-600 font-medium">
                                    {points} points
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeSubject(subject)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No subjects added yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Add subjects and grades to calculate your points
                      </p>
                    </div>
                  )}
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