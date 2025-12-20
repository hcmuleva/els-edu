import { mockUsers, mockOrganizations, mockCourses, mockSubjects } from '../data/mockManagementData';

// Simulate API delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock pagination helper
const paginate = (array, page, pageSize) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: array.slice(start, end),
    meta: {
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pageCount: Math.ceil(array.length / pageSize),
        total: array.length,
      }
    }
  };
};

// Filter helper
const filterData = (array, search, fields = ['name', 'email', 'username']) => {
  if (!search) return array;
  return array.filter(item =>
    fields.some(field =>
      item[field]?.toLowerCase().includes(search.toLowerCase())
    )
  );
};

export const managementApi = {
  // User management
  getUsersByRole: async (role, page = 1, pageSize = 25, search = '') => {
    await delay(300); // Simulate API delay

    const roleKey = role.toLowerCase() + 's'; // student -> students
    const users = mockUsers[roleKey] || [];
    const filteredUsers = filterData(users, search, ['username', 'email', 'first_name', 'last_name']);

    return paginate(filteredUsers, page, pageSize);
  },

  createEnhancedUser: async (userData) => {
    await delay(500);

    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      profile_photo: { url: null }
    };

    // Add to appropriate mock array
    const roleKey = userData.user_role.toLowerCase() + 's';
    if (mockUsers[roleKey]) {
      mockUsers[roleKey].unshift(newUser);
    }

    return { data: newUser };
  },

  updateUserStatus: async (userId, status) => {
    await delay(200);

    // Find and update user in mock data
    Object.keys(mockUsers).forEach(roleKey => {
      const userIndex = mockUsers[roleKey].findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        mockUsers[roleKey][userIndex].user_status = status;
      }
    });

    return { data: { success: true } };
  },

  // Organization management
  getOrganizations: async (page = 1, pageSize = 25, search = '') => {
    await delay(300);

    const filteredOrgs = filterData(mockOrganizations, search, ['org_name', 'contact_email']);
    return paginate(filteredOrgs, page, pageSize);
  },

  createOrganization: async (orgData) => {
    await delay(500);

    const newOrg = {
      id: Date.now(),
      ...orgData,
      createdAt: new Date().toISOString()
    };

    mockOrganizations.unshift(newOrg);
    return { data: newOrg };
  },

  updateOrganization: async (orgId, orgData) => {
    await delay(300);

    const orgIndex = mockOrganizations.findIndex(org => org.id === orgId);
    if (orgIndex !== -1) {
      mockOrganizations[orgIndex] = { ...mockOrganizations[orgIndex], ...orgData };
      return { data: mockOrganizations[orgIndex] };
    }
    throw new Error('Organization not found');
  },

  deleteOrganization: async (orgId) => {
    await delay(300);

    const orgIndex = mockOrganizations.findIndex(org => org.id === orgId);
    if (orgIndex !== -1) {
      mockOrganizations.splice(orgIndex, 1);
      return { data: { success: true } };
    }
    throw new Error('Organization not found');
  },

  // Course management
  getCourses: async (page = 1, pageSize = 25, search = '') => {
    await delay(300);

    const filteredCourses = filterData(mockCourses, search, ['name', 'category', 'description']);
    return paginate(filteredCourses, page, pageSize);
  },

  createCourse: async (courseData) => {
    await delay(500);

    const newCourse = {
      id: Date.now(),
      ...courseData,
      createdAt: new Date().toISOString()
    };

    mockCourses.unshift(newCourse);
    return { data: newCourse };
  },

  updateCourse: async (courseId, courseData) => {
    await delay(300);

    const courseIndex = mockCourses.findIndex(course => course.id === courseId);
    if (courseIndex !== -1) {
      mockCourses[courseIndex] = { ...mockCourses[courseIndex], ...courseData };
      return { data: mockCourses[courseIndex] };
    }
    throw new Error('Course not found');
  },

  deleteCourse: async (courseId) => {
    await delay(300);

    const courseIndex = mockCourses.findIndex(course => course.id === courseId);
    if (courseIndex !== -1) {
      mockCourses.splice(courseIndex, 1);
      return { data: { success: true } };
    }
    throw new Error('Course not found');
  },

  // Subject management
  getSubjects: async (page = 1, pageSize = 25, search = '') => {
    await delay(300);

    const filteredSubjects = filterData(mockSubjects, search, ['name', 'description']);
    return paginate(filteredSubjects, page, pageSize);
  },

  createSubject: async (subjectData) => {
    await delay(500);

    const newSubject = {
      id: Date.now(),
      ...subjectData,
      createdAt: new Date().toISOString()
    };

    mockSubjects.unshift(newSubject);
    return { data: newSubject };
  },

  updateSubject: async (subjectId, subjectData) => {
    await delay(300);

    const subjectIndex = mockSubjects.findIndex(subject => subject.id === subjectId);
    if (subjectIndex !== -1) {
      mockSubjects[subjectIndex] = { ...mockSubjects[subjectIndex], ...subjectData };
      return { data: mockSubjects[subjectIndex] };
    }
    throw new Error('Subject not found');
  },

  deleteSubject: async (subjectId) => {
    await delay(300);

    const subjectIndex = mockSubjects.findIndex(subject => subject.id === subjectId);
    if (subjectIndex !== -1) {
      mockSubjects.splice(subjectIndex, 1);
      return { data: { success: true } };
    }
    throw new Error('Subject not found');
  },

  // Helper methods
  uploadFile: async (file) => {
    await delay(1000);

    // Mock file upload - return a mock file object
    return {
      id: Date.now(),
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type
    };
  },
};