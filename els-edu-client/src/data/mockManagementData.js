// Mock data for management interface development
export const mockUsers = {
  students: [
    {
      id: 1,
      username: 'rajesh_student',
      email: 'rajesh@example.com',
      first_name: 'Rajesh',
      last_name: 'Ahirrao',
      mobile_number: '8976655825',
      user_role: 'STUDENT',
      user_status: 'APPROVED',
      user_experience_level: 'COLLEGE',
      gender: 'MALE',
      org: { id: 1, org_name: 'TechEd Solutions' },
      profile_photo: { url: null },
      createdAt: '2025-12-10T10:00:00Z'
    },
    {
      id: 2,
      username: 'rishi_mukati',
      email: 'rishi@example.com',
      first_name: 'Rishi',
      last_name: 'Mukati',
      mobile_number: '9999999999',
      user_role: 'STUDENT',
      user_status: 'APPROVED',
      user_experience_level: 'PROFESSIONAL',
      gender: 'MALE',
      org: null,
      profile_photo: { url: null },
      createdAt: '2025-12-12T09:00:00Z'
    },
    {
      id: 3,
      username: 'anushka_parihar',
      email: 'anushka@example.com',
      first_name: 'Anushka',
      last_name: 'Parihar',
      mobile_number: '8827809748',
      user_role: 'STUDENT',
      user_status: 'PENDING',
      user_experience_level: 'SCHOOL',
      gender: 'FEMALE',
      org: { id: 2, org_name: 'EduCare Learning' },
      profile_photo: { url: null },
      createdAt: '2025-12-12T11:00:00Z'
    }
  ],
  teachers: [
    {
      id: 4,
      username: 'john_teacher',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      mobile_number: '9876543210',
      user_role: 'TEACHER',
      user_status: 'APPROVED',
      user_experience_level: 'PROFESSIONAL',
      gender: 'MALE',
      org: { id: 1, org_name: 'TechEd Solutions' },
      profile_photo: { url: null },
      createdAt: '2025-11-20T14:00:00Z'
    },
    {
      id: 5,
      username: 'sarah_instructor',
      email: 'sarah@example.com',
      first_name: 'Sarah',
      last_name: 'Smith',
      mobile_number: '9123456789',
      user_role: 'TEACHER',
      user_status: 'APPROVED',
      user_experience_level: 'PROFESSIONAL',
      gender: 'FEMALE',
      org: { id: 2, org_name: 'EduCare Learning' },
      profile_photo: { url: null },
      createdAt: '2025-11-15T09:30:00Z'
    }
  ]
};

export const mockOrganizations = [
  {
    id: 1,
    org_name: 'TechEd Solutions Private Limited',
    contact_email: 'contact@teched-solutions.com',
    contact_phone: '9876543210',
    org_status: 'ACTIVE',
    description: 'Leading provider of technology education solutions for K-12 and higher education.',
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 2,
    org_name: 'EduCare Learning Institute',
    contact_email: 'info@educare-learning.org',
    contact_phone: '9123456789',
    org_status: 'ACTIVE',
    description: 'Comprehensive educational institute focusing on foundational learning and skill development.',
    createdAt: '2025-09-15T10:00:00Z'
  },
  {
    id: 3,
    org_name: 'Future Skills Academy',
    contact_email: 'hello@futureskills.edu',
    contact_phone: '9988776655',
    org_status: 'INACTIVE',
    description: 'Modern learning platform for digital skills and career development.',
    createdAt: '2025-08-20T12:00:00Z'
  }
];

export const mockCourses = [
  {
    id: 1,
    name: 'Full Stack Web Development Bootcamp',
    category: 'Programming',
    subcategory: 'Web Development',
    description: 'Comprehensive bootcamp covering frontend and backend web development with modern frameworks and tools.',
    condition: 'PUBLISH',
    privacy: 'PUBLIC',
    visibility: 'GLOBAL',
    organization: { id: 1, org_name: 'TechEd Solutions Private Limited' },
    createdAt: '2025-11-01T09:00:00Z'
  },
  {
    id: 2,
    name: 'Data Science & Machine Learning',
    category: 'Data Science',
    subcategory: 'Analytics',
    description: 'Complete data science program covering statistics, machine learning, and real-world projects.',
    condition: 'PUBLISH',
    privacy: 'PUBLIC',
    visibility: 'GLOBAL',
    organization: { id: 1, org_name: 'TechEd Solutions Private Limited' },
    createdAt: '2025-10-15T14:00:00Z'
  },
  {
    id: 3,
    name: 'CBSE Class 10 Complete Package',
    category: 'Academic',
    subcategory: 'Secondary Education',
    description: 'Complete CBSE Class 10 preparation with all subjects including Math, Science, Social Studies.',
    condition: 'PUBLISH',
    privacy: 'PUBLIC',
    visibility: 'GLOBAL',
    organization: { id: 2, org_name: 'EduCare Learning Institute' },
    createdAt: '2025-09-20T11:00:00Z'
  },
  {
    id: 4,
    name: 'Digital Marketing Fundamentals',
    category: 'Marketing',
    subcategory: 'Digital',
    description: 'Learn digital marketing strategies, SEO, social media marketing, and analytics.',
    condition: 'DRAFT',
    privacy: 'PRIVATE',
    visibility: 'ORGANIZATION',
    organization: { id: 3, org_name: 'Future Skills Academy' },
    createdAt: '2025-12-01T16:00:00Z'
  }
];

export const mockSubjects = [
  {
    id: 1,
    name: 'React.js Fundamentals',
    description: 'Learn React.js components, hooks, state management, and modern development patterns.',
    subject_type: 'TECHNICAL',
    status: 'ACTIVE',
    courses: [{ id: 1, name: 'Full Stack Web Development Bootcamp' }],
    createdAt: '2025-11-02T10:00:00Z'
  },
  {
    id: 2,
    name: 'Node.js Backend Development',
    description: 'Server-side JavaScript development with Express.js, databases, and API design.',
    subject_type: 'TECHNICAL',
    status: 'ACTIVE',
    courses: [{ id: 1, name: 'Full Stack Web Development Bootcamp' }],
    createdAt: '2025-11-02T11:00:00Z'
  },
  {
    id: 3,
    name: 'Python for Data Science',
    description: 'Python programming fundamentals for data analysis, pandas, numpy, and visualization.',
    subject_type: 'TECHNICAL',
    status: 'ACTIVE',
    courses: [{ id: 2, name: 'Data Science & Machine Learning' }],
    createdAt: '2025-10-16T09:00:00Z'
  },
  {
    id: 4,
    name: 'Mathematics Class 10',
    description: 'Complete CBSE Class 10 Mathematics curriculum with practice tests and solutions.',
    subject_type: 'ACADEMIC',
    status: 'ACTIVE',
    courses: [{ id: 3, name: 'CBSE Class 10 Complete Package' }],
    createdAt: '2025-09-21T08:00:00Z'
  },
  {
    id: 5,
    name: 'Science Class 10',
    description: 'Physics, Chemistry, Biology - Complete CBSE curriculum with experiments and theory.',
    subject_type: 'ACADEMIC',
    status: 'ACTIVE',
    courses: [{ id: 3, name: 'CBSE Class 10 Complete Package' }],
    createdAt: '2025-09-21T09:00:00Z'
  }
];