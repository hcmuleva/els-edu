export const mockUserProfile = {
  name: "Priyank Sharma",
  background: "student",
  yearsOfExperience: 2,
  selfAssessment: {
    development: {
      "Programming Fundamentals": 7,
      "Data Structures & Algorithms": 5,
      "Frontend (React/HTML/CSS)": 8,
      "Backend (Node/Java/Python)": 4,
      "Databases (SQL/NoSQL)": 3,
    },
    testing: {
      "Manual Testing Basics": 6,
      "Test Case Design": 5,
      "Automation Testing": 2,
      "API Testing": 4,
      "Bug Tracking Tools": 5,
    },
    devops: {
      "Linux & Networking Basics": 4,
      "Git & Version Control": 7,
      "CI/CD Pipelines": 3,
      "Docker & Containers": 2,
      "Cloud Platforms (AWS/Azure/GCP)": 1,
    },
    "agentic-ai": {
      "AI Fundamentals & Concepts": 5,
      "LLM Integration & APIs": 4,
      "Prompt Engineering": 6,
      "Agent Architecture & Design": 3,
      "AI Tools & Frameworks": 4,
      "Ethics & Responsible AI": 5,
    },
    "mobile-app": {
      "Mobile Development Fundamentals": 6,
      "iOS Development (Swift/SwiftUI)": 3,
      "Android Development (Kotlin/Java)": 4,
      "Cross-Platform Frameworks (React Native/Flutter)": 5,
      "Mobile UI/UX Design": 5,
      "App Store Deployment": 3,
    },
  },
};

// Versioned profiles to simulate progression over time (v1 -> v4)
// v1: Only basic development skills
// v2: Development + initial DevOps
// v3: Development + Testing + DevOps
// v4: Full profile (all categories)
export const mockProfilesByVersion = {
  v1: {
    ...mockUserProfile,
    selfAssessment: {
      development: {
        "Programming Fundamentals": 4,
        "Frontend (React/HTML/CSS)": 3,
      },
      testing: {},
      devops: {},
      "agentic-ai": {},
      "mobile-app": {},
    },
  },
  v2: {
    ...mockUserProfile,
    selfAssessment: {
      development: {
        "Programming Fundamentals": 5.5,
        "Data Structures & Algorithms": 4,
        "Frontend (React/HTML/CSS)": 5,
        "Backend (Node/Java/Python)": 3,
      },
      testing: {},
      devops: {
        "Linux & Networking Basics": 4,
        "Git & Version Control": 5,
      },
      "agentic-ai": {},
      "mobile-app": {},
    },
  },
  v3: {
    ...mockUserProfile,
    selfAssessment: {
      development: mockUserProfile.selfAssessment.development,
      testing: mockUserProfile.selfAssessment.testing,
      devops: mockUserProfile.selfAssessment.devops,
      "agentic-ai": {},
      "mobile-app": {},
    },
  },
  v4: mockUserProfile,
};

// Mock trend data for Priyank over ~2 months (before and after joining ELS)
// Each entry represents an assessment snapshot
export const mockTrendData = [
  {
    id: 1,
    label: "Before ELS",
    timeframe: "T0",
    overallScore: 4.2,
    development: 4.0,
    testing: 4.3,
    devops: 4.2,
    "agentic-ai": 4.0,
    "mobile-app": 4.3,
  },
  {
    id: 2,
    label: "After 2 Weeks",
    timeframe: "T1",
    overallScore: 5.0,
    development: 5.2,
    testing: 4.8,
    devops: 4.9,
    "agentic-ai": 4.5,
    "mobile-app": 4.7,
  },
  {
    id: 3,
    label: "After 1 Month",
    timeframe: "T2",
    overallScore: 5.8,
    development: 6.0,
    testing: 5.6,
    devops: 5.7,
    "agentic-ai": 5.2,
    "mobile-app": 5.5,
  },
  {
    id: 4,
    label: "After 6 Weeks",
    timeframe: "T3",
    overallScore: 6.4,
    development: 6.7,
    testing: 6.1,
    devops: 6.3,
    "agentic-ai": 5.8,
    "mobile-app": 6.0,
  },
  {
    id: 5,
    label: "After 2 Months",
    timeframe: "T4",
    overallScore: 7.1,
    development: 7.4,
    testing: 6.8,
    devops: 7.0,
    "agentic-ai": 6.5,
    "mobile-app": 6.8,
  },
];
