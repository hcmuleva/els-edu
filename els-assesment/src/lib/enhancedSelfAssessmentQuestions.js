/**
 * Enhanced Self-Assessment Questions Structure
 * Categories -> Skill Types -> Options (with ratings 1-10)
 */

export const enhancedSelfAssessmentQuestions = {
  development: [
    {
      id: 'dev-languages',
      skillType: 'Programming Languages',
      description: 'Rate your proficiency in each programming language',
      options: [
        { id: 'js', name: 'JavaScript', question: 'How proficient are you with JavaScript?' },
        { id: 'python', name: 'Python', question: 'How proficient are you with Python?' },
        { id: 'java', name: 'Java', question: 'How proficient are you with Java?' },
        { id: 'dotnet', name: '.NET (C#)', question: 'How proficient are you with .NET and C#?' },
        { id: 'cpp', name: 'C++', question: 'How proficient are you with C++?' },
        { id: 'go', name: 'Go', question: 'How proficient are you with Go?' },
        { id: 'rust', name: 'Rust', question: 'How proficient are you with Rust?' },
        { id: 'php', name: 'PHP', question: 'How proficient are you with PHP?' },
      ],
      aggregateTo: 'Programming Fundamentals',
    },
    {
      id: 'dev-frontend',
      skillType: 'Frontend Technologies',
      description: 'Rate your skills in frontend development technologies',
      options: [
        { id: 'react', name: 'React', question: 'How proficient are you with React?' },
        { id: 'vue', name: 'Vue.js', question: 'How proficient are you with Vue.js?' },
        { id: 'angular', name: 'Angular', question: 'How proficient are you with Angular?' },
        { id: 'html', name: 'HTML/CSS', question: 'How proficient are you with HTML and CSS?' },
        { id: 'typescript', name: 'TypeScript', question: 'How proficient are you with TypeScript?' },
        { id: 'nextjs', name: 'Next.js', question: 'How proficient are you with Next.js?' },
        { id: 'svelte', name: 'Svelte', question: 'How proficient are you with Svelte?' },
      ],
      aggregateTo: 'Frontend (React/HTML/CSS)',
    },
    {
      id: 'dev-backend',
      skillType: 'Backend Technologies',
      description: 'Rate your skills in backend development',
      options: [
        { id: 'nodejs', name: 'Node.js', question: 'How proficient are you with Node.js?' },
        { id: 'express', name: 'Express.js', question: 'How proficient are you with Express.js?' },
        { id: 'spring', name: 'Spring Framework', question: 'How proficient are you with Spring Framework?' },
        { id: 'django', name: 'Django', question: 'How proficient are you with Django?' },
        { id: 'flask', name: 'Flask', question: 'How proficient are you with Flask?' },
        { id: 'fastapi', name: 'FastAPI', question: 'How proficient are you with FastAPI?' },
        { id: 'nestjs', name: 'NestJS', question: 'How proficient are you with NestJS?' },
      ],
      aggregateTo: 'Backend (Node/Java/Python)',
    },
    {
      id: 'dev-databases',
      skillType: 'Databases',
      description: 'Rate your skills with different database technologies',
      options: [
        { id: 'postgresql', name: 'PostgreSQL', question: 'How proficient are you with PostgreSQL?', type: 'SQL' },
        { id: 'mysql', name: 'MySQL', question: 'How proficient are you with MySQL?', type: 'SQL' },
        { id: 'sqlserver', name: 'SQL Server', question: 'How proficient are you with SQL Server?', type: 'SQL' },
        { id: 'oracle', name: 'Oracle', question: 'How proficient are you with Oracle Database?', type: 'SQL' },
        { id: 'mongodb', name: 'MongoDB', question: 'How proficient are you with MongoDB?', type: 'NoSQL' },
        { id: 'redis', name: 'Redis', question: 'How proficient are you with Redis?', type: 'NoSQL' },
        { id: 'cassandra', name: 'Cassandra', question: 'How proficient are you with Cassandra?', type: 'NoSQL' },
        { id: 'elasticsearch', name: 'Elasticsearch', question: 'How proficient are you with Elasticsearch?', type: 'NoSQL' },
      ],
      aggregateTo: 'Databases (SQL/NoSQL)',
    },
    {
      id: 'dev-dsa',
      skillType: 'Data Structures & Algorithms',
      description: 'Rate your understanding of data structures and algorithms',
      options: [
        { id: 'arrays', name: 'Arrays & Lists', question: 'How well do you understand arrays and lists?' },
        { id: 'trees', name: 'Trees & Graphs', question: 'How well do you understand trees and graphs?' },
        { id: 'sorting', name: 'Sorting Algorithms', question: 'How well do you understand sorting algorithms?' },
        { id: 'searching', name: 'Search Algorithms', question: 'How well do you understand search algorithms?' },
        { id: 'dynamic', name: 'Dynamic Programming', question: 'How well do you understand dynamic programming?' },
        { id: 'complexity', name: 'Time/Space Complexity', question: 'How well do you understand time and space complexity?' },
      ],
      aggregateTo: 'Data Structures & Algorithms',
    },
  ],
  testing: [
    {
      id: 'test-manual',
      skillType: 'Manual Testing',
      description: 'Rate your skills in manual testing',
      options: [
        { id: 'test-planning', name: 'Test Planning', question: 'How well can you create test plans?' },
        { id: 'test-cases', name: 'Test Case Design', question: 'How well can you design test cases?' },
        { id: 'test-execution', name: 'Test Execution', question: 'How proficient are you at executing tests?' },
        { id: 'bug-reporting', name: 'Bug Reporting', question: 'How well can you report and document bugs?' },
        { id: 'exploratory', name: 'Exploratory Testing', question: 'How skilled are you at exploratory testing?' },
      ],
      aggregateTo: 'Manual Testing Basics',
    },
    {
      id: 'test-automation',
      skillType: 'Test Automation Tools',
      description: 'Rate your skills with test automation frameworks',
      options: [
        { id: 'selenium', name: 'Selenium', question: 'How proficient are you with Selenium?' },
        { id: 'cypress', name: 'Cypress', question: 'How proficient are you with Cypress?' },
        { id: 'playwright', name: 'Playwright', question: 'How proficient are you with Playwright?' },
        { id: 'jest', name: 'Jest', question: 'How proficient are you with Jest?' },
        { id: 'junit', name: 'JUnit', question: 'How proficient are you with JUnit?' },
        { id: 'pytest', name: 'pytest', question: 'How proficient are you with pytest?' },
      ],
      aggregateTo: 'Automation Testing',
    },
    {
      id: 'test-api',
      skillType: 'API Testing',
      description: 'Rate your skills in API testing',
      options: [
        { id: 'postman', name: 'Postman', question: 'How proficient are you with Postman?' },
        { id: 'rest-assured', name: 'REST Assured', question: 'How proficient are you with REST Assured?' },
        { id: 'newman', name: 'Newman', question: 'How proficient are you with Newman?' },
        { id: 'soapui', name: 'SoapUI', question: 'How proficient are you with SoapUI?' },
        { id: 'insomnia', name: 'Insomnia', question: 'How proficient are you with Insomnia?' },
      ],
      aggregateTo: 'API Testing',
    },
    {
      id: 'test-tools',
      skillType: 'Testing Tools & Platforms',
      description: 'Rate your familiarity with testing tools and platforms',
      options: [
        { id: 'jira', name: 'Jira', question: 'How well do you use Jira for test management?' },
        { id: 'testrail', name: 'TestRail', question: 'How well do you use TestRail?' },
        { id: 'zephyr', name: 'Zephyr', question: 'How well do you use Zephyr?' },
        { id: 'bugzilla', name: 'Bugzilla', question: 'How well do you use Bugzilla?' },
      ],
      aggregateTo: 'Bug Tracking Tools',
    },
    {
      id: 'test-design',
      skillType: 'Test Design Techniques',
      description: 'Rate your understanding of test design techniques',
      options: [
        { id: 'boundary', name: 'Boundary Value Analysis', question: 'How well do you apply boundary value analysis?' },
        { id: 'equivalence', name: 'Equivalence Partitioning', question: 'How well do you apply equivalence partitioning?' },
        { id: 'decision', name: 'Decision Table Testing', question: 'How well do you use decision tables?' },
        { id: 'state', name: 'State Transition Testing', question: 'How well do you apply state transition testing?' },
      ],
      aggregateTo: 'Test Case Design',
    },
  ],
  devops: [
    {
      id: 'devops-linux',
      skillType: 'Linux & Operating Systems',
      description: 'Rate your skills with Linux and operating systems',
      options: [
        { id: 'linux-basics', name: 'Linux Basics', question: 'How comfortable are you with Linux command line?' },
        { id: 'bash', name: 'Bash Scripting', question: 'How proficient are you with Bash scripting?' },
        { id: 'system-admin', name: 'System Administration', question: 'How skilled are you at system administration?' },
        { id: 'networking', name: 'Networking', question: 'How well do you understand networking concepts?' },
      ],
      aggregateTo: 'Linux & Networking Basics',
    },
    {
      id: 'devops-git',
      skillType: 'Version Control',
      description: 'Rate your skills with version control systems',
      options: [
        { id: 'git-basics', name: 'Git Basics', question: 'How proficient are you with basic Git commands?' },
        { id: 'git-advanced', name: 'Advanced Git', question: 'How skilled are you with advanced Git features?' },
        { id: 'github', name: 'GitHub', question: 'How well do you use GitHub?' },
        { id: 'gitlab', name: 'GitLab', question: 'How well do you use GitLab?' },
        { id: 'bitbucket', name: 'Bitbucket', question: 'How well do you use Bitbucket?' },
        { id: 'branching', name: 'Branching Strategies', question: 'How well do you understand branching strategies?' },
      ],
      aggregateTo: 'Git & Version Control',
    },
    {
      id: 'devops-cicd',
      skillType: 'CI/CD Tools',
      description: 'Rate your skills with CI/CD tools and pipelines',
      options: [
        { id: 'jenkins', name: 'Jenkins', question: 'How proficient are you with Jenkins?' },
        { id: 'gitlab-ci', name: 'GitLab CI', question: 'How proficient are you with GitLab CI?' },
        { id: 'github-actions', name: 'GitHub Actions', question: 'How proficient are you with GitHub Actions?' },
        { id: 'circleci', name: 'CircleCI', question: 'How proficient are you with CircleCI?' },
        { id: 'travis', name: 'Travis CI', question: 'How proficient are you with Travis CI?' },
      ],
      aggregateTo: 'CI/CD Pipelines',
    },
    {
      id: 'devops-containers',
      skillType: 'Containerization',
      description: 'Rate your skills with containerization technologies',
      options: [
        { id: 'docker', name: 'Docker', question: 'How proficient are you with Docker?' },
        { id: 'kubernetes', name: 'Kubernetes', question: 'How proficient are you with Kubernetes?' },
        { id: 'docker-compose', name: 'Docker Compose', question: 'How proficient are you with Docker Compose?' },
        { id: 'helm', name: 'Helm', question: 'How proficient are you with Helm?' },
      ],
      aggregateTo: 'Docker & Containers',
    },
    {
      id: 'devops-cloud',
      skillType: 'Cloud Platforms',
      description: 'Rate your skills with cloud platforms',
      options: [
        { id: 'aws', name: 'AWS', question: 'How proficient are you with AWS?' },
        { id: 'azure', name: 'Azure', question: 'How proficient are you with Azure?' },
        { id: 'gcp', name: 'Google Cloud Platform', question: 'How proficient are you with GCP?' },
        { id: 'terraform', name: 'Terraform', question: 'How proficient are you with Terraform?' },
        { id: 'ansible', name: 'Ansible', question: 'How proficient are you with Ansible?' },
      ],
      aggregateTo: 'Cloud Platforms (AWS/Azure/GCP)',
    },
  ],
  'agentic-ai': [
    {
      id: 'ai-fundamentals',
      skillType: 'AI Fundamentals',
      description: 'Rate your understanding of AI fundamentals',
      options: [
        { id: 'ml-basics', name: 'Machine Learning Basics', question: 'How well do you understand ML fundamentals?' },
        { id: 'neural-networks', name: 'Neural Networks', question: 'How well do you understand neural networks?' },
        { id: 'nlp', name: 'Natural Language Processing', question: 'How well do you understand NLP?' },
        { id: 'computer-vision', name: 'Computer Vision', question: 'How well do you understand computer vision?' },
      ],
      aggregateTo: 'AI Fundamentals & Concepts',
    },
    {
      id: 'ai-llm',
      skillType: 'LLM Integration',
      description: 'Rate your skills with Large Language Models',
      options: [
        { id: 'openai', name: 'OpenAI API', question: 'How proficient are you with OpenAI API?' },
        { id: 'anthropic', name: 'Anthropic Claude', question: 'How proficient are you with Anthropic Claude?' },
        { id: 'langchain', name: 'LangChain', question: 'How proficient are you with LangChain?' },
        { id: 'llamaindex', name: 'LlamaIndex', question: 'How proficient are you with LlamaIndex?' },
        { id: 'huggingface', name: 'Hugging Face', question: 'How proficient are you with Hugging Face?' },
      ],
      aggregateTo: 'LLM Integration & APIs',
    },
    {
      id: 'ai-prompting',
      skillType: 'Prompt Engineering',
      description: 'Rate your skills in prompt engineering',
      options: [
        { id: 'prompt-design', name: 'Prompt Design', question: 'How skilled are you at designing prompts?' },
        { id: 'few-shot', name: 'Few-Shot Learning', question: 'How well do you use few-shot prompting?' },
        { id: 'chain-of-thought', name: 'Chain of Thought', question: 'How well do you apply chain of thought prompting?' },
        { id: 'prompt-optimization', name: 'Prompt Optimization', question: 'How skilled are you at optimizing prompts?' },
      ],
      aggregateTo: 'Prompt Engineering',
    },
    {
      id: 'ai-agents',
      skillType: 'AI Agents',
      description: 'Rate your skills in building AI agents',
      options: [
        { id: 'agent-design', name: 'Agent Architecture', question: 'How well do you design agent architectures?' },
        { id: 'tool-use', name: 'Tool Use & Function Calling', question: 'How well do you implement tool use in agents?' },
        { id: 'reasoning', name: 'Reasoning & Planning', question: 'How well do you implement reasoning in agents?' },
        { id: 'multi-agent', name: 'Multi-Agent Systems', question: 'How well do you work with multi-agent systems?' },
      ],
      aggregateTo: 'Agent Architecture & Design',
    },
    {
      id: 'ai-tools',
      skillType: 'AI Tools & Frameworks',
      description: 'Rate your familiarity with AI development tools',
      options: [
        { id: 'pytorch', name: 'PyTorch', question: 'How proficient are you with PyTorch?' },
        { id: 'tensorflow', name: 'TensorFlow', question: 'How proficient are you with TensorFlow?' },
        { id: 'transformers', name: 'Transformers Library', question: 'How proficient are you with Transformers?' },
        { id: 'vector-db', name: 'Vector Databases', question: 'How well do you work with vector databases?' },
      ],
      aggregateTo: 'AI Tools & Frameworks',
    },
    {
      id: 'ai-ethics',
      skillType: 'AI Ethics & Responsibility',
      description: 'Rate your understanding of AI ethics',
      options: [
        { id: 'bias', name: 'Bias & Fairness', question: 'How well do you understand AI bias and fairness?' },
        { id: 'privacy', name: 'Privacy & Security', question: 'How well do you understand AI privacy concerns?' },
        { id: 'transparency', name: 'Transparency', question: 'How well do you understand AI transparency?' },
        { id: 'responsible-ai', name: 'Responsible AI Practices', question: 'How well do you apply responsible AI practices?' },
      ],
      aggregateTo: 'Ethics & Responsible AI',
    },
  ],
  'mobile-app': [
    {
      id: 'mobile-fundamentals',
      skillType: 'Mobile Development Fundamentals',
      description: 'Rate your understanding of mobile development basics',
      options: [
        { id: 'mobile-architecture', name: 'Mobile Architecture', question: 'How well do you understand mobile app architecture?' },
        { id: 'lifecycle', name: 'App Lifecycle', question: 'How well do you understand app lifecycle management?' },
        { id: 'navigation', name: 'Navigation Patterns', question: 'How well do you understand mobile navigation patterns?' },
        { id: 'state-management', name: 'State Management', question: 'How well do you understand mobile state management?' },
      ],
      aggregateTo: 'Mobile Development Fundamentals',
    },
    {
      id: 'mobile-ios',
      skillType: 'iOS Development',
      description: 'Rate your skills with iOS development',
      options: [
        { id: 'swift', name: 'Swift', question: 'How proficient are you with Swift?' },
        { id: 'swiftui', name: 'SwiftUI', question: 'How proficient are you with SwiftUI?' },
        { id: 'uikit', name: 'UIKit', question: 'How proficient are you with UIKit?' },
        { id: 'ios-apis', name: 'iOS APIs', question: 'How well do you work with iOS APIs?' },
      ],
      aggregateTo: 'iOS Development (Swift/SwiftUI)',
    },
    {
      id: 'mobile-android',
      skillType: 'Android Development',
      description: 'Rate your skills with Android development',
      options: [
        { id: 'kotlin', name: 'Kotlin', question: 'How proficient are you with Kotlin?' },
        { id: 'java-android', name: 'Java (Android)', question: 'How proficient are you with Java for Android?' },
        { id: 'android-sdk', name: 'Android SDK', question: 'How well do you work with Android SDK?' },
        { id: 'jetpack', name: 'Jetpack Components', question: 'How well do you use Jetpack components?' },
      ],
      aggregateTo: 'Android Development (Kotlin/Java)',
    },
    {
      id: 'mobile-cross',
      skillType: 'Cross-Platform Frameworks',
      description: 'Rate your skills with cross-platform frameworks',
      options: [
        { id: 'react-native', name: 'React Native', question: 'How proficient are you with React Native?' },
        { id: 'flutter', name: 'Flutter', question: 'How proficient are you with Flutter?' },
        { id: 'xamarin', name: 'Xamarin', question: 'How proficient are you with Xamarin?' },
        { id: 'ionic', name: 'Ionic', question: 'How proficient are you with Ionic?' },
      ],
      aggregateTo: 'Cross-Platform Frameworks (React Native/Flutter)',
    },
    {
      id: 'mobile-ui',
      skillType: 'Mobile UI/UX',
      description: 'Rate your skills in mobile UI/UX design',
      options: [
        { id: 'ui-design', name: 'UI Design Principles', question: 'How well do you understand mobile UI design principles?' },
        { id: 'responsive', name: 'Responsive Design', question: 'How well do you create responsive mobile layouts?' },
        { id: 'accessibility', name: 'Accessibility', question: 'How well do you implement mobile accessibility?' },
        { id: 'animations', name: 'Animations', question: 'How skilled are you at creating mobile animations?' },
      ],
      aggregateTo: 'Mobile UI/UX Design',
    },
    {
      id: 'mobile-deployment',
      skillType: 'App Store Deployment',
      description: 'Rate your skills with app store deployment',
      options: [
        { id: 'app-store', name: 'App Store (iOS)', question: 'How well do you deploy to Apple App Store?' },
        { id: 'play-store', name: 'Play Store (Android)', question: 'How well do you deploy to Google Play Store?' },
        { id: 'app-signing', name: 'App Signing', question: 'How well do you handle app signing?' },
        { id: 'store-guidelines', name: 'Store Guidelines', question: 'How well do you understand store guidelines?' },
      ],
      aggregateTo: 'App Store Deployment',
    },
  ],
};

/**
 * Aggregate detailed ratings to expected format
 * Takes the detailed ratings and averages them by skill type
 */
export function aggregateSelfAssessment(detailedRatings) {
  const aggregated = {
    development: {},
    testing: {},
    devops: {},
    'agentic-ai': {},
    'mobile-app': {},
  };

  // Process each category
  Object.entries(enhancedSelfAssessmentQuestions).forEach(([category, skillTypes]) => {
    skillTypes.forEach((skillType) => {
      const ratings = [];
      
      // Collect all ratings for this skill type
      skillType.options.forEach((option) => {
        const ratingKey = `${category}-${skillType.id}-${option.id}`;
        if (detailedRatings[ratingKey] !== undefined) {
          ratings.push(detailedRatings[ratingKey]);
        }
      });

      // Calculate average if we have ratings
      if (ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        aggregated[category][skillType.aggregateTo] = Math.round(average * 10) / 10; // Round to 1 decimal
      }
    });
  });

  return aggregated;
}

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

