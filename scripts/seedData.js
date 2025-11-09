const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data for seeding
const sampleData = {
  institutions: [
    {
      id: 'limkokwing',
      name: 'Limkokwing University of Creative Technology',
      type: 'university',
      location: 'Maseru, Lesotho',
      description: 'A leading creative university offering innovative programs in design, business, and technology.',
      contact: {
        email: 'info@limkokwing.ac.ls',
        phone: '+266 2231 3783',
        address: 'Kingsway, Maseru, Lesotho'
      },
      faculties: [
        'Faculty of Information & Communication Technology',
        'Faculty of Business & Management',
        'Faculty of Design & Innovation'
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'nul',
      name: 'National University of Lesotho',
      type: 'university',
      location: 'Roma, Lesotho',
      description: 'The premier institution of higher learning in Lesotho offering diverse academic programs.',
      contact: {
        email: 'info@nul.ls',
        phone: '+266 5221 3421',
        address: 'Roma, Maseru District, Lesotho'
      },
      faculties: [
        'Faculty of Science & Technology',
        'Faculty of Humanities',
        'Faculty of Social Sciences',
        'Faculty of Health Sciences'
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  courses: [
    {
      id: 'bit-001',
      name: 'BSc. in Information Technology',
      institutionId: 'limkokwing',
      faculty: 'Faculty of Information & Communication Technology',
      duration: '4 years',
      description: 'Comprehensive program covering software development, networking, database management, and IT project management. Prepares students for careers in technology industry.',
      requirements: {
        minGrade: 'C',
        subjects: ['Mathematics', 'English', 'Science'],
        certificates: ['LGCSE', 'Cambridge O-Level'],
        minPoints: 30
      },
      curriculum: [
        'Programming Fundamentals',
        'Web Development',
        'Database Systems',
        'Network Administration',
        'Software Engineering',
        'IT Project Management'
      ],
      intake: {
        semester: 1,
        commencement: new Date('2024-08-01'),
        deadline: new Date('2024-09-15'),
        seats: 50
      },
      fees: {
        local: 25000,
        international: 45000,
        currency: 'LSL',
        period: 'per year'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'bbit-001',
      name: 'BSc. in Business Information Technology',
      institutionId: 'limkokwing',
      faculty: 'Faculty of Information & Communication Technology',
      duration: '4 years',
      description: 'Blend of business management principles with information technology skills. Ideal for students interested in business analysis, IT management, and digital transformation.',
      requirements: {
        minGrade: 'C',
        subjects: ['Mathematics', 'English', 'Commerce/Business Studies'],
        certificates: ['LGCSE', 'Cambridge O-Level'],
        minPoints: 28
      },
      curriculum: [
        'Business Management',
        'Information Systems',
        'E-Commerce',
        'Business Analytics',
        'IT Strategy',
        'Digital Marketing'
      ],
      intake: {
        semester: 1,
        commencement: new Date('2024-08-01'),
        deadline: new Date('2024-09-15'),
        seats: 40
      },
      fees: {
        local: 25000,
        international: 45000,
        currency: 'LSL',
        period: 'per year'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'dit-001',
      name: 'Diploma in Information Technology',
      institutionId: 'limkokwing',
      faculty: 'Faculty of Information & Communication Technology',
      duration: '2 years',
      description: 'Practical IT skills training for immediate employment in the technology sector. Focus on hands-on technical skills and industry certifications.',
      requirements: {
        minGrade: 'D',
        subjects: ['Mathematics', 'English'],
        certificates: ['LGCSE', 'Cambridge O-Level'],
        minPoints: 24
      },
      curriculum: [
        'Computer Fundamentals',
        'Programming Basics',
        'Web Design',
        'Network Fundamentals',
        'IT Support',
        'Database Management'
      ],
      intake: {
        semester: 1,
        commencement: new Date('2024-08-01'),
        deadline: new Date('2024-09-15'),
        seats: 60
      },
      fees: {
        local: 18000,
        international: 32000,
        currency: 'LSL',
        period: 'per year'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  companies: [
    {
      id: 'standard-bank',
      name: 'Standard Bank Lesotho',
      industry: 'Banking & Finance',
      size: 'large',
      location: 'Maseru, Lesotho',
      description: 'Leading financial institution providing comprehensive banking services across Lesotho. Committed to digital transformation and customer service excellence.',
      contact: {
        email: 'careers@standardbank.co.ls',
        phone: '+266 2231 2000',
        website: 'https://www.standardbank.co.ls',
        address: 'Standard Bank House, Kingsway, Maseru'
      },
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'vodacom-lesotho',
      name: 'Vodacom Lesotho',
      industry: 'Telecommunications',
      size: 'large',
      location: 'Maseru, Lesotho',
      description: 'Premier telecommunications provider in Lesotho, offering mobile, fixed, and enterprise solutions. Driving digital inclusion and innovation.',
      contact: {
        email: 'hr@vodacom.co.ls',
        phone: '+266 2221 3000',
        website: 'https://www.vodacom.co.ls',
        address: 'Vodacom Park, Maseru'
      },
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesotho-bank',
      name: 'Lesotho Bank',
      industry: 'Banking & Finance',
      size: 'medium',
      location: 'Maseru, Lesotho',
      description: 'National commercial bank serving individuals and businesses across Lesotho with innovative financial solutions.',
      contact: {
        email: 'recruitment@lesothobank.co.ls',
        phone: '+266 2231 2351',
        website: 'https://www.lesothobank.co.ls',
        address: 'Lesotho Bank Centre, Maseru'
      },
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  jobs: [
    {
      id: 'software-dev-001',
      title: 'Junior Software Developer',
      companyId: 'standard-bank',
      companyName: 'Standard Bank Lesotho',
      type: 'full-time',
      location: 'Maseru, Lesotho',
      category: 'Technology',
      experienceLevel: 'entry',
      description: 'We are looking for a passionate Junior Software Developer to design, develop and maintain software solutions for our digital banking platform. You will work with modern technologies and collaborate with cross-functional teams.',
      responsibilities: [
        'Develop and maintain web applications using modern frameworks',
        'Write clean, efficient, and well-documented code',
        'Collaborate with UX/UI designers and product managers',
        'Participate in code reviews and team meetings',
        'Troubleshoot and debug applications'
      ],
      requirements: {
        education: "Bachelor's Degree in Computer Science, IT or related field",
        skills: ['JavaScript', 'Python', 'SQL', 'React', 'Node.js', 'Git'],
        experience: '0-2 years',
        certificates: [],
        softSkills: ['Problem-solving', 'Teamwork', 'Communication']
      },
      benefits: [
        'Competitive salary package',
        'Medical insurance',
        'Training and development opportunities',
        'Career growth path'
      ],
      salary: {
        min: 12000,
        max: 18000,
        currency: 'LSL',
        period: 'monthly'
      },
      applicationDeadline: new Date('2024-12-31'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'it-support-001',
      title: 'IT Support Specialist',
      companyId: 'vodacom-lesotho',
      companyName: 'Vodacom Lesotho',
      type: 'full-time',
      location: 'Maseru, Lesotho',
      category: 'Technology',
      experienceLevel: 'mid',
      description: 'Provide technical support and maintain IT systems for optimal performance. You will be responsible for ensuring smooth operation of our IT infrastructure and providing excellent support to internal users.',
      responsibilities: [
        'Provide technical support to end-users',
        'Maintain and troubleshoot hardware and software issues',
        'Manage network infrastructure and security',
        'Implement IT policies and procedures',
        'Monitor system performance and reliability'
      ],
      requirements: {
        education: "Diploma or Bachelor's Degree in IT or related field",
        skills: ['Network Administration', 'Hardware Troubleshooting', 'Windows Server', 'Linux', 'Active Directory'],
        experience: '2-4 years',
        certificates: ['CompTIA A+', 'CCNA', 'MCSA'],
        softSkills: ['Customer service', 'Problem-solving', 'Time management']
      },
      benefits: [
        'Competitive salary',
        'Communication allowance',
        'Health insurance',
        'Professional certification support'
      ],
      salary: {
        min: 15000,
        max: 22000,
        currency: 'LSL',
        period: 'monthly'
      },
      applicationDeadline: new Date('2024-11-30'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  systemConfig: {
    id: 'config',
    applicationLimits: {
      maxCoursesPerInstitution: 2,
      maxApplicationsPerStudent: 10,
      applicationCooldown: 24 // hours
    },
    admissionProcess: {
      autoAdmit: false,
      waitlistEnabled: true,
      maxWaitlistSize: 20,
      admissionDeadline: 30 // days after application deadline
    },
    jobMatching: {
      enabled: true,
      minMatchScore: 70,
      autoNotify: true,
      matchCriteria: ['education', 'skills', 'experience', 'location']
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      defaultLanguage: 'en'
    },
    academicRequirements: {
      gradingScale: {
        'A': 90,
        'B': 80,
        'C': 70,
        'D': 60,
        'E': 50,
        'F': 0
      },
      recognizedCertificates: ['LGCSE', 'Cambridge O-Level', 'Cambridge A-Level', 'IGCSE']
    },
    updatedAt: new Date()
  }
};

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminEmail = 'admin@careerconnect.ls';
    const adminPassword = 'Admin123!';
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userData = {
      id: user.uid,
      email: adminEmail,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Admin user created successfully');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('⚠️  Please change the password after first login!');
    
    return user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists');
      return null;
    } else {
      console.error('❌ Error creating admin user:', error);
      throw error;
    }
  }
}

async function seedCollection(collectionName, items) {
  try {
    console.log(`\nSeeding ${collectionName}...`);
    
    for (const item of items) {
      await setDoc(doc(db, collectionName, item.id), item);
      console.log(`✅ Added ${collectionName.slice(0, -1)}: ${item.name || item.title}`);
    }
    
    console.log(`✅ Successfully seeded ${items.length} ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error seeding ${collectionName}:`, error);
    throw error;
  }
}

async function clearCollection(collectionName) {
  try {
    console.log(`Clearing ${collectionName}...`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    querySnapshot.forEach((doc) => {
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error);
  }
}

async function seedDatabase() {
  try {
    console.log('🚀 Starting Career Guidance Platform Database Seeding...\n');
    
    // Create admin user first
    const adminId = await createAdminUser();
    
    if (adminId) {
      // Update institution and company admin IDs
      sampleData.institutions.forEach(inst => inst.adminId = adminId);
      sampleData.companies.forEach(comp => comp.adminId = adminId);
    }
    
    // Seed collections
    await seedCollection('institutions', sampleData.institutions);
    await seedCollection('courses', sampleData.courses);
    await seedCollection('companies', sampleData.companies);
    await seedCollection('jobs', sampleData.jobs);
    
    // Seed system configuration
    await setDoc(doc(db, 'system', 'config'), sampleData.systemConfig);
    console.log('✅ Added system configuration');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`   📚 Institutions: ${sampleData.institutions.length}`);
    console.log(`   🎓 Courses: ${sampleData.courses.length}`);
    console.log(`   🏢 Companies: ${sampleData.companies.length}`);
    console.log(`   💼 Jobs: ${sampleData.jobs.length}`);
    console.log(`   ⚙️  System Configuration: 1`);
    
    console.log('\n🔑 Admin Login Credentials:');
    console.log('   Email: admin@careerconnect.ls');
    console.log('   Password: Admin123!');
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    const collections = ['institutions', 'courses', 'companies', 'jobs', 'applications', 'jobApplications', 'transcripts', 'notifications'];
    
    for (const collectionName of collections) {
      await clearCollection(collectionName);
    }
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (require.main === module) {
  switch (command) {
    case 'reset':
      resetDatabase();
      break;
    case 'seed':
    default:
      seedDatabase();
      break;
  }
}

module.exports = {
  seedDatabase,
  resetDatabase,
  sampleData
};