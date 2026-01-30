/**
 * Self-Assessment Questions for each category
 * Each question should be rated on a scale of 1-10
 */

export const selfAssessmentQuestions = {
  development: [
    {
      id: 'dev-1',
      skill: 'Programming Fundamentals',
      question: 'How comfortable are you with programming fundamentals (variables, loops, conditionals, functions)?',
      description: 'Rate your understanding of core programming concepts and syntax',
    },
    {
      id: 'dev-2',
      skill: 'Data Structures & Algorithms',
      question: 'How well do you understand data structures (arrays, lists, trees, graphs) and algorithms?',
      description: 'Rate your ability to solve algorithmic problems and use appropriate data structures',
    },
    {
      id: 'dev-3',
      skill: 'Frontend (React/HTML/CSS)',
      question: 'How proficient are you with frontend development using React, HTML, and CSS?',
      description: 'Rate your ability to build responsive, interactive user interfaces',
    },
    {
      id: 'dev-4',
      skill: 'Backend (Node/Java/Python)',
      question: 'How skilled are you with backend development (Node.js, Java, Python, or similar)?',
      description: 'Rate your ability to build server-side applications and APIs',
    },
    {
      id: 'dev-5',
      skill: 'Databases (SQL/NoSQL)',
      question: 'How well do you understand database design and querying (SQL, MongoDB, etc.)?',
      description: 'Rate your ability to design schemas and write efficient queries',
    },
  ],
  testing: [
    {
      id: 'test-1',
      skill: 'Manual Testing Basics',
      question: 'How familiar are you with manual testing processes and techniques?',
      description: 'Rate your understanding of test planning, execution, and reporting',
    },
    {
      id: 'test-2',
      skill: 'Test Case Design',
      question: 'How well can you design comprehensive test cases and test scenarios?',
      description: 'Rate your ability to create effective test cases covering various scenarios',
    },
    {
      id: 'test-3',
      skill: 'Automation Testing',
      question: 'How proficient are you with test automation tools and frameworks?',
      description: 'Rate your ability to write and maintain automated test scripts',
    },
    {
      id: 'test-4',
      skill: 'API Testing',
      question: 'How skilled are you at testing REST APIs and web services?',
      description: 'Rate your ability to test API endpoints, validate responses, and handle edge cases',
    },
    {
      id: 'test-5',
      skill: 'Bug Tracking Tools',
      question: 'How well do you use bug tracking and test management tools (Jira, TestRail, etc.)?',
      description: 'Rate your proficiency with documenting, tracking, and managing defects',
    },
  ],
  devops: [
    {
      id: 'devops-1',
      skill: 'Linux & Networking Basics',
      question: 'How comfortable are you with Linux command line and basic networking concepts?',
      description: 'Rate your ability to navigate Linux systems and understand network fundamentals',
    },
    {
      id: 'devops-2',
      skill: 'Git & Version Control',
      question: 'How proficient are you with Git and version control workflows?',
      description: 'Rate your ability to manage code repositories, branches, and collaborate effectively',
    },
    {
      id: 'devops-3',
      skill: 'CI/CD Pipelines',
      question: 'How well do you understand CI/CD pipelines and automation?',
      description: 'Rate your ability to set up and maintain continuous integration/deployment workflows',
    },
    {
      id: 'devops-4',
      skill: 'Docker & Containers',
      question: 'How skilled are you with Docker and containerization?',
      description: 'Rate your ability to create, manage, and deploy containerized applications',
    },
    {
      id: 'devops-5',
      skill: 'Cloud Platforms (AWS/Azure/GCP)',
      question: 'How familiar are you with cloud platforms and services?',
      description: 'Rate your understanding of cloud infrastructure, services, and deployment',
    },
  ],
  'agentic-ai': [
    {
      id: 'ai-1',
      skill: 'AI Fundamentals & Concepts',
      question: 'How well do you understand AI fundamentals, machine learning basics, and neural networks?',
      description: 'Rate your understanding of core AI/ML concepts and terminology',
    },
    {
      id: 'ai-2',
      skill: 'LLM Integration & APIs',
      question: 'How proficient are you at integrating Large Language Models (LLMs) via APIs?',
      description: 'Rate your ability to work with OpenAI, Anthropic, or similar LLM APIs',
    },
    {
      id: 'ai-3',
      skill: 'Prompt Engineering',
      question: 'How skilled are you at crafting effective prompts for AI models?',
      description: 'Rate your ability to write prompts that produce desired outputs from AI systems',
    },
    {
      id: 'ai-4',
      skill: 'Agent Architecture & Design',
      question: 'How well do you understand designing AI agents and autonomous systems?',
      description: 'Rate your ability to architect agent-based systems with reasoning and tool use',
    },
    {
      id: 'ai-5',
      skill: 'AI Tools & Frameworks',
      question: 'How familiar are you with AI development tools and frameworks (LangChain, LlamaIndex, etc.)?',
      description: 'Rate your proficiency with AI development frameworks and tooling',
    },
    {
      id: 'ai-6',
      skill: 'Ethics & Responsible AI',
      question: 'How well do you understand ethical considerations and responsible AI practices?',
      description: 'Rate your awareness of AI bias, fairness, transparency, and ethical deployment',
    },
  ],
  'mobile-app': [
    {
      id: 'mobile-1',
      skill: 'Mobile Development Fundamentals',
      question: 'How comfortable are you with mobile app development concepts and architecture?',
      description: 'Rate your understanding of mobile app lifecycle, navigation, and platform differences',
    },
    {
      id: 'mobile-2',
      skill: 'iOS Development (Swift/SwiftUI)',
      question: 'How proficient are you with iOS development using Swift or SwiftUI?',
      description: 'Rate your ability to build native iOS applications',
    },
    {
      id: 'mobile-3',
      skill: 'Android Development (Kotlin/Java)',
      question: 'How skilled are you with Android development using Kotlin or Java?',
      description: 'Rate your ability to build native Android applications',
    },
    {
      id: 'mobile-4',
      skill: 'Cross-Platform Frameworks (React Native/Flutter)',
      question: 'How well do you work with cross-platform frameworks like React Native or Flutter?',
      description: 'Rate your ability to build apps that work on both iOS and Android',
    },
    {
      id: 'mobile-5',
      skill: 'Mobile UI/UX Design',
      question: 'How proficient are you with mobile UI/UX design principles and implementation?',
      description: 'Rate your ability to create intuitive, user-friendly mobile interfaces',
    },
    {
      id: 'mobile-6',
      skill: 'App Store Deployment',
      question: 'How familiar are you with app store submission and deployment processes?',
      description: 'Rate your understanding of App Store and Play Store submission requirements',
    },
  ],
};

export const categoryDisplayNames = {
  development: 'Development',
  testing: 'Testing',
  devops: 'DevOps',
  'agentic-ai': 'Agentic AI',
  'mobile-app': 'Mobile App',
};

export const categoryIcons = {
  development: '💻',
  testing: '🧪',
  devops: '⚙️',
  'agentic-ai': '🤖',
  'mobile-app': '📱',
};

