const axios = require('axios');

const API_URL = 'http://localhost:1337';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY1ODc1Nzk4LCJleHAiOjE3Njg0Njc3OTh9.CKhxfZasW3YYRb1CBiKtlqP2WUP8YAZLHJ4JMnUekB4';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};

const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}/api/${endpoint}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

const organizationsData = [
  {
    org_name: "TechEd Solutions Private Limited",
    contact_email: "contact@teched-solutions.com", 
    contact_phone: 9876543210,
    org_status: "ACTIVE",
    description: [
      {
        type: "paragraph",
        children: [
          {
            type: "text", 
            text: "Leading provider of technology education solutions for K-12 and higher education. Specializes in programming, data science, and emerging technologies."
          }
        ]
      }
    ]
  },
  {
    org_name: "EduCare Learning Institute",
    contact_email: "info@educare-learning.org",
    contact_phone: 9123456789,
    org_status: "ACTIVE", 
    description: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "Comprehensive educational institute focusing on foundational learning, STEM education, and skill development."
          }
        ]
      }
    ]
  }
];

const coursesData = [
  {
    name: "Full Stack Web Development Bootcamp",
    category: "Programming",
    subcategory: "Web Development", 
    description: "Comprehensive bootcamp covering frontend and backend web development with modern frameworks and tools.",
    condition: "PUBLISH",
    privacy: "PUBLIC",
    visibility: "GLOBAL",
    orgIndex: 0
  },
  {
    name: "Data Science & Machine Learning",
    category: "Data Science", 
    subcategory: "Analytics",
    description: "Complete data science program covering statistics, machine learning, and real-world project implementation.",
    condition: "PUBLISH",
    privacy: "PUBLIC", 
    visibility: "GLOBAL",
    orgIndex: 0
  },
  {
    name: "CBSE Class 10 Complete Package",
    category: "Academic",
    subcategory: "Secondary Education",
    description: "Complete CBSE Class 10 preparation with all subjects including Math, Science, Social Studies, and Languages.", 
    condition: "PUBLISH",
    privacy: "PUBLIC",
    visibility: "GLOBAL",
    orgIndex: 1
  },
  {
    name: "JEE/NEET Preparation Program",
    category: "Competitive Exams",
    subcategory: "Engineering & Medical",
    description: "Intensive preparation program for JEE Main, JEE Advanced, and NEET with expert faculty.",
    condition: "PUBLISH",
    privacy: "PUBLIC",
    visibility: "GLOBAL", 
    orgIndex: 1
  }
];

const subjectsData = [
  {
    name: "Frontend Development (React & JavaScript)",
    grade: "GRADUATION",
    courseIndex: 0
  },
  {
    name: "Backend Development (Node.js & Express)", 
    grade: "GRADUATION",
    courseIndex: 0
  },
  {
    name: "Database Design & Management",
    grade: "GRADUATION", 
    courseIndex: 0
  },
  {
    name: "Python for Data Science",
    grade: "GRADUATION",
    courseIndex: 1
  },
  {
    name: "Machine Learning Algorithms", 
    grade: "POSTGRADUATION",
    courseIndex: 1
  },
  {
    name: "Data Visualization & Analytics",
    grade: "GRADUATION",
    courseIndex: 1
  },
  {
    name: "Mathematics Class 10",
    grade: "TENTH", 
    courseIndex: 2
  },
  {
    name: "Science (Physics, Chemistry, Biology) Class 10", 
    grade: "TENTH",
    courseIndex: 2
  },
  {
    name: "Social Studies Class 10",
    grade: "TENTH",
    courseIndex: 2
  },
  {
    name: "Physics for JEE/NEET",
    grade: "TWELFTH",
    courseIndex: 3
  },
  {
    name: "Chemistry for JEE/NEET",
    grade: "TWELFTH", 
    courseIndex: 3
  },
  {
    name: "Mathematics for JEE",
    grade: "TWELFTH",
    courseIndex: 3
  }
];

async function seedBasicData() {
  console.log('🌱 Starting Basic Educational Data Seeding...');
  
  try {
    // Create Organizations
    console.log('\\n📊 Creating Organizations...');
    const createdOrgs = [];
    
    for (const orgData of organizationsData) {
      console.log(`Creating organization: ${orgData.org_name}`);
      const org = await apiCall('POST', 'orgs', { data: orgData });
      createdOrgs.push(org.data);
      console.log(`✅ Created organization ID: ${org.data.id}`);
    }
    
    // Create Courses  
    console.log('\\n📚 Creating Courses...');
    const createdCourses = [];
    
    for (const courseData of coursesData) {
      const { orgIndex, ...courseAttributes } = courseData;
      const organizationId = createdOrgs[orgIndex].id;
      
      const coursePayload = {
        ...courseAttributes,
        organization: organizationId
      };
      
      console.log(`Creating course: ${courseData.name}`);
      const course = await apiCall('POST', 'courses', { data: coursePayload });
      createdCourses.push(course.data);
      console.log(`✅ Created course ID: ${course.data.id}`);
    }
    
    // Create Subjects
    console.log('\\n📖 Creating Subjects...');
    const createdSubjects = [];
    
    for (const subjectData of subjectsData) {
      const { courseIndex, ...subjectAttributes } = subjectData;
      const courseId = createdCourses[courseIndex].id;
      
      const subjectPayload = {
        ...subjectAttributes, 
        courses: [courseId]
      };
      
      console.log(`Creating subject: ${subjectData.name}`);
      const subject = await apiCall('POST', 'subjects', { data: subjectPayload });
      createdSubjects.push(subject.data);
      console.log(`✅ Created subject ID: ${subject.data.id}`);
    }
    
    console.log('\\n🎉 Basic Educational Data Seeding Completed Successfully!');
    console.log('\\n📋 Summary:');
    console.log(`   Organizations: ${createdOrgs.length}`);
    console.log(`   Courses: ${createdCourses.length}`);
    console.log(`   Subjects: ${createdSubjects.length}`);
    
    console.log('\\n🔗 Data Relationships:');
    createdOrgs.forEach((org, index) => {
      console.log(`\\n📊 ${org.attributes.org_name}:`);
      const orgCourses = createdCourses.filter((_, courseIndex) => 
        coursesData[courseIndex].orgIndex === index
      );
      orgCourses.forEach((course) => {
        console.log(`  📚 ${course.attributes.name}`);
        const courseSubjects = createdSubjects.filter((_, subjectIndex) => 
          subjectsData[subjectIndex].courseIndex === createdCourses.findIndex(c => c.id === course.id)
        );
        courseSubjects.forEach(subject => {
          console.log(`    📖 ${subject.attributes.name}`);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedBasicData()
  .then(() => {
    console.log('\\n✨ Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });