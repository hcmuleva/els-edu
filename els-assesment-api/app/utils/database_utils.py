"""
Database utility functions for collection management
"""
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Self-assessment questions data - same as in init.py
ENHANCED_SELF_ASSESSMENT_QUESTIONS = {
    "development": [
        {
            "id": "dev-languages",
            "skillType": "Programming Languages",
            "description": "Rate your proficiency in each programming language",
            "options": [
                {"id": "js", "name": "JavaScript", "question": "How proficient are you with JavaScript?"},
                {"id": "python", "name": "Python", "question": "How proficient are you with Python?"},
                {"id": "java", "name": "Java", "question": "How proficient are you with Java?"},
                {"id": "dotnet", "name": ".NET (C#)", "question": "How proficient are you with .NET and C#?"},
                {"id": "cpp", "name": "C++", "question": "How proficient are you with C++?"},
                {"id": "go", "name": "Go", "question": "How proficient are you with Go?"},
                {"id": "rust", "name": "Rust", "question": "How proficient are you with Rust?"},
                {"id": "php", "name": "PHP", "question": "How proficient are you with PHP?"},
            ],
            "aggregateTo": "Programming Fundamentals",
        },
        {
            "id": "dev-frontend",
            "skillType": "Frontend Technologies",
            "description": "Rate your skills in frontend development technologies",
            "options": [
                {"id": "react", "name": "React", "question": "How proficient are you with React?"},
                {"id": "vue", "name": "Vue.js", "question": "How proficient are you with Vue.js?"},
                {"id": "angular", "name": "Angular", "question": "How proficient are you with Angular?"},
                {"id": "html", "name": "HTML/CSS", "question": "How proficient are you with HTML and CSS?"},
                {"id": "typescript", "name": "TypeScript", "question": "How proficient are you with TypeScript?"},
                {"id": "nextjs", "name": "Next.js", "question": "How proficient are you with Next.js?"},
                {"id": "svelte", "name": "Svelte", "question": "How proficient are you with Svelte?"},
            ],
            "aggregateTo": "Frontend (React/HTML/CSS)",
        },
        {
            "id": "dev-backend",
            "skillType": "Backend Technologies",
            "description": "Rate your skills in backend development",
            "options": [
                {"id": "nodejs", "name": "Node.js", "question": "How proficient are you with Node.js?"},
                {"id": "express", "name": "Express.js", "question": "How proficient are you with Express.js?"},
                {"id": "spring", "name": "Spring Framework", "question": "How proficient are you with Spring Framework?"},
                {"id": "django", "name": "Django", "question": "How proficient are you with Django?"},
                {"id": "flask", "name": "Flask", "question": "How proficient are you with Flask?"},
                {"id": "fastapi", "name": "FastAPI", "question": "How proficient are you with FastAPI?"},
                {"id": "nestjs", "name": "NestJS", "question": "How proficient are you with NestJS?"},
            ],
            "aggregateTo": "Backend (Node/Java/Python)",
        },
        {
            "id": "dev-databases",
            "skillType": "Databases",
            "description": "Rate your skills with different database technologies",
            "options": [
                {"id": "postgresql", "name": "PostgreSQL", "question": "How proficient are you with PostgreSQL?", "type": "SQL"},
                {"id": "mysql", "name": "MySQL", "question": "How proficient are you with MySQL?", "type": "SQL"},
                {"id": "sqlserver", "name": "SQL Server", "question": "How proficient are you with SQL Server?", "type": "SQL"},
                {"id": "oracle", "name": "Oracle", "question": "How proficient are you with Oracle Database?", "type": "SQL"},
                {"id": "mongodb", "name": "MongoDB", "question": "How proficient are you with MongoDB?", "type": "NoSQL"},
                {"id": "redis", "name": "Redis", "question": "How proficient are you with Redis?", "type": "NoSQL"},
                {"id": "cassandra", "name": "Cassandra", "question": "How proficient are you with Cassandra?", "type": "NoSQL"},
                {"id": "elasticsearch", "name": "Elasticsearch", "question": "How proficient are you with Elasticsearch?", "type": "NoSQL"},
            ],
            "aggregateTo": "Databases (SQL/NoSQL)",
        },
        {
            "id": "dev-dsa",
            "skillType": "Data Structures & Algorithms",
            "description": "Rate your understanding of data structures and algorithms",
            "options": [
                {"id": "arrays", "name": "Arrays & Lists", "question": "How well do you understand arrays and lists?"},
                {"id": "trees", "name": "Trees & Graphs", "question": "How well do you understand trees and graphs?"},
                {"id": "sorting", "name": "Sorting Algorithms", "question": "How well do you understand sorting algorithms?"},
                {"id": "searching", "name": "Search Algorithms", "question": "How well do you understand search algorithms?"},
                {"id": "dynamic", "name": "Dynamic Programming", "question": "How well do you understand dynamic programming?"},
                {"id": "complexity", "name": "Time/Space Complexity", "question": "How well do you understand time and space complexity?"},
            ],
            "aggregateTo": "Data Structures & Algorithms",
        },
    ],
    "testing": [
        {
            "id": "test-manual",
            "skillType": "Manual Testing",
            "description": "Rate your skills in manual testing",
            "options": [
                {"id": "test-planning", "name": "Test Planning", "question": "How well can you create test plans?"},
                {"id": "test-cases", "name": "Test Case Design", "question": "How well can you design test cases?"},
                {"id": "test-execution", "name": "Test Execution", "question": "How proficient are you at executing tests?"},
                {"id": "bug-reporting", "name": "Bug Reporting", "question": "How well can you report and document bugs?"},
                {"id": "exploratory", "name": "Exploratory Testing", "question": "How skilled are you at exploratory testing?"},
            ],
            "aggregateTo": "Manual Testing Basics",
        },
        {
            "id": "test-automation",
            "skillType": "Test Automation Tools",
            "description": "Rate your skills with test automation frameworks",
            "options": [
                {"id": "selenium", "name": "Selenium", "question": "How proficient are you with Selenium?"},
                {"id": "cypress", "name": "Cypress", "question": "How proficient are you with Cypress?"},
                {"id": "playwright", "name": "Playwright", "question": "How proficient are you with Playwright?"},
                {"id": "jest", "name": "Jest", "question": "How proficient are you with Jest?"},
                {"id": "junit", "name": "JUnit", "question": "How proficient are you with JUnit?"},
                {"id": "pytest", "name": "pytest", "question": "How proficient are you with pytest?"},
            ],
            "aggregateTo": "Automation Testing",
        },
        {
            "id": "test-api",
            "skillType": "API Testing",
            "description": "Rate your skills in API testing",
            "options": [
                {"id": "postman", "name": "Postman", "question": "How proficient are you with Postman?"},
                {"id": "rest-assured", "name": "REST Assured", "question": "How proficient are you with REST Assured?"},
                {"id": "newman", "name": "Newman", "question": "How proficient are you with Newman?"},
                {"id": "soapui", "name": "SoapUI", "question": "How proficient are you with SoapUI?"},
                {"id": "insomnia", "name": "Insomnia", "question": "How proficient are you with Insomnia?"},
            ],
            "aggregateTo": "API Testing",
        },
        {
            "id": "test-tools",
            "skillType": "Testing Tools & Platforms",
            "description": "Rate your familiarity with testing tools and platforms",
            "options": [
                {"id": "jira", "name": "Jira", "question": "How well do you use Jira for test management?"},
                {"id": "testrail", "name": "TestRail", "question": "How well do you use TestRail?"},
                {"id": "zephyr", "name": "Zephyr", "question": "How well do you use Zephyr?"},
                {"id": "bugzilla", "name": "Bugzilla", "question": "How well do you use Bugzilla?"},
            ],
            "aggregateTo": "Bug Tracking Tools",
        },
        {
            "id": "test-design",
            "skillType": "Test Design Techniques",
            "description": "Rate your understanding of test design techniques",
            "options": [
                {"id": "boundary", "name": "Boundary Value Analysis", "question": "How well do you apply boundary value analysis?"},
                {"id": "equivalence", "name": "Equivalence Partitioning", "question": "How well do you apply equivalence partitioning?"},
                {"id": "decision", "name": "Decision Table Testing", "question": "How well do you use decision tables?"},
                {"id": "state", "name": "State Transition Testing", "question": "How well do you apply state transition testing?"},
            ],
            "aggregateTo": "Test Case Design",
        },
    ],
    "devops": [
        {
            "id": "devops-linux",
            "skillType": "Linux & Operating Systems",
            "description": "Rate your skills with Linux and operating systems",
            "options": [
                {"id": "linux-basics", "name": "Linux Basics", "question": "How comfortable are you with Linux command line?"},
                {"id": "bash", "name": "Bash Scripting", "question": "How proficient are you with Bash scripting?"},
                {"id": "system-admin", "name": "System Administration", "question": "How skilled are you at system administration?"},
                {"id": "networking", "name": "Networking", "question": "How well do you understand networking concepts?"},
            ],
            "aggregateTo": "Linux & Networking Basics",
        },
        {
            "id": "devops-git",
            "skillType": "Version Control",
            "description": "Rate your skills with version control systems",
            "options": [
                {"id": "git-basics", "name": "Git Basics", "question": "How proficient are you with basic Git commands?"},
                {"id": "git-advanced", "name": "Advanced Git", "question": "How skilled are you with advanced Git features?"},
                {"id": "github", "name": "GitHub", "question": "How well do you use GitHub?"},
                {"id": "gitlab", "name": "GitLab", "question": "How well do you use GitLab?"},
                {"id": "bitbucket", "name": "Bitbucket", "question": "How well do you use Bitbucket?"},
                {"id": "branching", "name": "Branching Strategies", "question": "How well do you understand branching strategies?"},
            ],
            "aggregateTo": "Git & Version Control",
        },
        {
            "id": "devops-cicd",
            "skillType": "CI/CD Tools",
            "description": "Rate your skills with CI/CD tools and pipelines",
            "options": [
                {"id": "jenkins", "name": "Jenkins", "question": "How proficient are you with Jenkins?"},
                {"id": "gitlab-ci", "name": "GitLab CI", "question": "How proficient are you with GitLab CI?"},
                {"id": "github-actions", "name": "GitHub Actions", "question": "How proficient are you with GitHub Actions?"},
                {"id": "circleci", "name": "CircleCI", "question": "How proficient are you with CircleCI?"},
                {"id": "travis", "name": "Travis CI", "question": "How proficient are you with Travis CI?"},
            ],
            "aggregateTo": "CI/CD Pipelines",
        },
        {
            "id": "devops-containers",
            "skillType": "Containerization",
            "description": "Rate your skills with containerization technologies",
            "options": [
                {"id": "docker", "name": "Docker", "question": "How proficient are you with Docker?"},
                {"id": "kubernetes", "name": "Kubernetes", "question": "How proficient are you with Kubernetes?"},
                {"id": "docker-compose", "name": "Docker Compose", "question": "How proficient are you with Docker Compose?"},
                {"id": "helm", "name": "Helm", "question": "How proficient are you with Helm?"},
            ],
            "aggregateTo": "Docker & Containers",
        },
        {
            "id": "devops-cloud",
            "skillType": "Cloud Platforms",
            "description": "Rate your skills with cloud platforms",
            "options": [
                {"id": "aws", "name": "AWS", "question": "How proficient are you with AWS?"},
                {"id": "azure", "name": "Azure", "question": "How proficient are you with Azure?"},
                {"id": "gcp", "name": "Google Cloud Platform", "question": "How proficient are you with GCP?"},
                {"id": "terraform", "name": "Terraform", "question": "How proficient are you with Terraform?"},
                {"id": "ansible", "name": "Ansible", "question": "How proficient are you with Ansible?"},
            ],
            "aggregateTo": "Cloud Platforms (AWS/Azure/GCP)",
        },
    ],
    "agentic-ai": [
        {
            "id": "ai-fundamentals",
            "skillType": "AI Fundamentals",
            "description": "Rate your understanding of AI fundamentals",
            "options": [
                {"id": "ml-basics", "name": "Machine Learning Basics", "question": "How well do you understand ML fundamentals?"},
                {"id": "neural-networks", "name": "Neural Networks", "question": "How well do you understand neural networks?"},
                {"id": "nlp", "name": "Natural Language Processing", "question": "How well do you understand NLP?"},
                {"id": "computer-vision", "name": "Computer Vision", "question": "How well do you understand computer vision?"},
            ],
            "aggregateTo": "AI Fundamentals & Concepts",
        },
        {
            "id": "ai-llm",
            "skillType": "LLM Integration",
            "description": "Rate your skills with Large Language Models",
            "options": [
                {"id": "openai", "name": "OpenAI API", "question": "How proficient are you with OpenAI API?"},
                {"id": "anthropic", "name": "Anthropic Claude", "question": "How proficient are you with Anthropic Claude?"},
                {"id": "langchain", "name": "LangChain", "question": "How proficient are you with LangChain?"},
                {"id": "llamaindex", "name": "LlamaIndex", "question": "How proficient are you with LlamaIndex?"},
                {"id": "huggingface", "name": "Hugging Face", "question": "How proficient are you with Hugging Face?"},
            ],
            "aggregateTo": "LLM Integration & APIs",
        },
        {
            "id": "ai-prompting",
            "skillType": "Prompt Engineering",
            "description": "Rate your skills in prompt engineering",
            "options": [
                {"id": "prompt-design", "name": "Prompt Design", "question": "How skilled are you at designing prompts?"},
                {"id": "few-shot", "name": "Few-Shot Learning", "question": "How well do you use few-shot prompting?"},
                {"id": "chain-of-thought", "name": "Chain of Thought", "question": "How well do you apply chain of thought prompting?"},
                {"id": "prompt-optimization", "name": "Prompt Optimization", "question": "How skilled are you at optimizing prompts?"},
            ],
            "aggregateTo": "Prompt Engineering",
        },
        {
            "id": "ai-agents",
            "skillType": "AI Agents",
            "description": "Rate your skills in building AI agents",
            "options": [
                {"id": "agent-design", "name": "Agent Architecture", "question": "How well do you design agent architectures?"},
                {"id": "tool-use", "name": "Tool Use & Function Calling", "question": "How well do you implement tool use in agents?"},
                {"id": "reasoning", "name": "Reasoning & Planning", "question": "How well do you implement reasoning in agents?"},
                {"id": "multi-agent", "name": "Multi-Agent Systems", "question": "How well do you work with multi-agent systems?"},
            ],
            "aggregateTo": "Agent Architecture & Design",
        },
        {
            "id": "ai-tools",
            "skillType": "AI Tools & Frameworks",
            "description": "Rate your familiarity with AI development tools",
            "options": [
                {"id": "pytorch", "name": "PyTorch", "question": "How proficient are you with PyTorch?"},
                {"id": "tensorflow", "name": "TensorFlow", "question": "How proficient are you with TensorFlow?"},
                {"id": "transformers", "name": "Transformers Library", "question": "How proficient are you with Transformers?"},
                {"id": "vector-db", "name": "Vector Databases", "question": "How well do you work with vector databases?"},
            ],
            "aggregateTo": "AI Tools & Frameworks",
        },
        {
            "id": "ai-ethics",
            "skillType": "AI Ethics & Responsibility",
            "description": "Rate your understanding of AI ethics",
            "options": [
                {"id": "bias", "name": "Bias & Fairness", "question": "How well do you understand AI bias and fairness?"},
                {"id": "privacy", "name": "Privacy & Security", "question": "How well do you understand AI privacy concerns?"},
                {"id": "transparency", "name": "Transparency", "question": "How well do you understand AI transparency?"},
                {"id": "responsible-ai", "name": "Responsible AI Practices", "question": "How well do you apply responsible AI practices?"},
            ],
            "aggregateTo": "Ethics & Responsible AI",
        },
    ],
    "mobile-app": [
        {
            "id": "mobile-fundamentals",
            "skillType": "Mobile Development Fundamentals",
            "description": "Rate your understanding of mobile development basics",
            "options": [
                {"id": "mobile-architecture", "name": "Mobile Architecture", "question": "How well do you understand mobile app architecture?"},
                {"id": "lifecycle", "name": "App Lifecycle", "question": "How well do you understand app lifecycle management?"},
                {"id": "navigation", "name": "Navigation Patterns", "question": "How well do you understand mobile navigation patterns?"},
                {"id": "state-management", "name": "State Management", "question": "How well do you understand mobile state management?"},
            ],
            "aggregateTo": "Mobile Development Fundamentals",
        },
        {
            "id": "mobile-ios",
            "skillType": "iOS Development",
            "description": "Rate your skills with iOS development",
            "options": [
                {"id": "swift", "name": "Swift", "question": "How proficient are you with Swift?"},
                {"id": "swiftui", "name": "SwiftUI", "question": "How proficient are you with SwiftUI?"},
                {"id": "uikit", "name": "UIKit", "question": "How proficient are you with UIKit?"},
                {"id": "ios-apis", "name": "iOS APIs", "question": "How well do you work with iOS APIs?"},
            ],
            "aggregateTo": "iOS Development (Swift/SwiftUI)",
        },
        {
            "id": "mobile-android",
            "skillType": "Android Development",
            "description": "Rate your skills with Android development",
            "options": [
                {"id": "kotlin", "name": "Kotlin", "question": "How proficient are you with Kotlin?"},
                {"id": "java-android", "name": "Java (Android)", "question": "How proficient are you with Java for Android?"},
                {"id": "android-sdk", "name": "Android SDK", "question": "How well do you work with Android SDK?"},
                {"id": "jetpack", "name": "Jetpack Components", "question": "How well do you use Jetpack components?"},
            ],
            "aggregateTo": "Android Development (Kotlin/Java)",
        },
        {
            "id": "mobile-cross",
            "skillType": "Cross-Platform Frameworks",
            "description": "Rate your skills with cross-platform frameworks",
            "options": [
                {"id": "react-native", "name": "React Native", "question": "How proficient are you with React Native?"},
                {"id": "flutter", "name": "Flutter", "question": "How proficient are you with Flutter?"},
                {"id": "xamarin", "name": "Xamarin", "question": "How proficient are you with Xamarin?"},
                {"id": "ionic", "name": "Ionic", "question": "How proficient are you with Ionic?"},
            ],
            "aggregateTo": "Cross-Platform Frameworks (React Native/Flutter)",
        },
        {
            "id": "mobile-ui",
            "skillType": "Mobile UI/UX",
            "description": "Rate your skills in mobile UI/UX design",
            "options": [
                {"id": "ui-design", "name": "UI Design Principles", "question": "How well do you understand mobile UI design principles?"},
                {"id": "responsive", "name": "Responsive Design", "question": "How well do you create responsive mobile layouts?"},
                {"id": "accessibility", "name": "Accessibility", "question": "How well do you implement mobile accessibility?"},
                {"id": "animations", "name": "Animations", "question": "How skilled are you at creating mobile animations?"},
            ],
            "aggregateTo": "Mobile UI/UX Design",
        },
        {
            "id": "mobile-deployment",
            "skillType": "App Store Deployment",
            "description": "Rate your skills with app store deployment",
            "options": [
                {"id": "app-store", "name": "App Store (iOS)", "question": "How well do you deploy to Apple App Store?"},
                {"id": "play-store", "name": "Play Store (Android)", "question": "How well do you deploy to Google Play Store?"},
                {"id": "app-signing", "name": "App Signing", "question": "How well do you handle app signing?"},
                {"id": "store-guidelines", "name": "Store Guidelines", "question": "How well do you understand store guidelines?"},
            ],
            "aggregateTo": "App Store Deployment",
        },
    ],
}


async def ensure_self_assessments_collection(db):
    """
    Ensure self-assessments collection exists and is initialized with questions.
    This is called automatically when needed.
    """
    try:
        # Check if collection exists and has data
        count = await db.self_assessments.count_documents({})
        
        if count == 0:
            # Collection exists but is empty, or doesn't exist (MongoDB creates on first insert)
            logger.info("Initializing self-assessments collection...")
            
            inserted_count = 0
            for category, skill_types in ENHANCED_SELF_ASSESSMENT_QUESTIONS.items():
                # Check if category already exists
                existing = await db.self_assessments.find_one({"category": category})
                if existing:
                    continue
                
                # Create assessment document
                assessment_doc = {
                    "category": category,
                    "skillTypes": skill_types,
                    "version": "1.0.0",
                    "created_at": datetime.utcnow(),
                }
                
                # Insert into database
                await db.self_assessments.insert_one(assessment_doc)
                inserted_count += 1
                logger.info(f"Auto-initialized self-assessment for category: {category}")
            
            if inserted_count > 0:
                logger.info(f"Auto-initialized {inserted_count} self-assessment categories")
        
        return True
    except Exception as e:
        logger.error(f"Error ensuring self-assessments collection: {e}")
        return False


# Quiz questions data for initialization
QUIZ_QUESTIONS = {
    "development": {
        "Programming Languages": [
            {
                "question": "What is the output of `console.log(typeof null)` in JavaScript?",
                "options": [
                    {"id": "opt1", "text": "null", "isCorrect": False},
                    {"id": "opt2", "text": "object", "isCorrect": True},
                    {"id": "opt3", "text": "undefined", "isCorrect": False},
                    {"id": "opt4", "text": "boolean", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "In JavaScript, `typeof null` returns 'object'. This is a known quirk/bug in JavaScript.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["JavaScript", "Type System"]
            },
            {
                "question": "Which Python data structure is unordered and contains unique elements?",
                "options": [
                    {"id": "opt1", "text": "List", "isCorrect": False},
                    {"id": "opt2", "text": "Tuple", "isCorrect": False},
                    {"id": "opt3", "text": "Set", "isCorrect": True},
                    {"id": "opt4", "text": "Dictionary", "isCorrect": False},
                ],
                "correctAnswer": "opt3",
                "explanation": "A set in Python is an unordered collection of unique elements.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Python", "Data Structures"]
            },
            {
                "question": "What is the time complexity of accessing an element in a HashMap in Java?",
                "options": [
                    {"id": "opt1", "text": "O(1)", "isCorrect": True},
                    {"id": "opt2", "text": "O(log n)", "isCorrect": False},
                    {"id": "opt3", "text": "O(n)", "isCorrect": False},
                    {"id": "opt4", "text": "O(n log n)", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "HashMap provides O(1) average time complexity for get and put operations.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["Java", "Data Structures", "Time Complexity"]
            },
        ],
        "Frontend Technologies": [
            {
                "question": "What is the purpose of React's `useEffect` hook?",
                "options": [
                    {"id": "opt1", "text": "To manage component state", "isCorrect": False},
                    {"id": "opt2", "text": "To perform side effects in functional components", "isCorrect": True},
                    {"id": "opt3", "text": "To create reusable components", "isCorrect": False},
                    {"id": "opt4", "text": "To handle form submissions", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "useEffect hook allows you to perform side effects like data fetching, subscriptions, or manually changing the DOM in React components.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["React", "Hooks"]
            },
            {
                "question": "What does CSS stand for?",
                "options": [
                    {"id": "opt1", "text": "Computer Style Sheets", "isCorrect": False},
                    {"id": "opt2", "text": "Cascading Style Sheets", "isCorrect": True},
                    {"id": "opt3", "text": "Creative Style System", "isCorrect": False},
                    {"id": "opt4", "text": "Colorful Style Sheets", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "CSS stands for Cascading Style Sheets, used for styling HTML elements.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["CSS", "Web Development"]
            },
        ],
        "Backend Technologies": [
            {
                "question": "What is the default port number for Express.js server?",
                "options": [
                    {"id": "opt1", "text": "3000", "isCorrect": True},
                    {"id": "opt2", "text": "8080", "isCorrect": False},
                    {"id": "opt3", "text": "5000", "isCorrect": False},
                    {"id": "opt4", "text": "8000", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "While Express.js doesn't have a default port, port 3000 is commonly used in development.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Node.js", "Express.js"]
            },
            {
                "question": "Which HTTP method is typically used for creating new resources in RESTful APIs?",
                "options": [
                    {"id": "opt1", "text": "GET", "isCorrect": False},
                    {"id": "opt2", "text": "POST", "isCorrect": True},
                    {"id": "opt3", "text": "PUT", "isCorrect": False},
                    {"id": "opt4", "text": "DELETE", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "POST is used to create new resources in RESTful API design.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["REST API", "HTTP"]
            },
        ],
        "Databases": [
            {
                "question": "What is the primary key in a relational database?",
                "options": [
                    {"id": "opt1", "text": "A key that can be null", "isCorrect": False},
                    {"id": "opt2", "text": "A unique identifier for each row in a table", "isCorrect": True},
                    {"id": "opt3", "text": "A foreign key from another table", "isCorrect": False},
                    {"id": "opt4", "text": "A key used for sorting", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "A primary key is a unique identifier that uniquely identifies each row in a table.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["SQL", "Database Design"]
            },
            {
                "question": "Which MongoDB operation is used to insert a single document?",
                "options": [
                    {"id": "opt1", "text": "insertMany()", "isCorrect": False},
                    {"id": "opt2", "text": "insertOne()", "isCorrect": True},
                    {"id": "opt3", "text": "add()", "isCorrect": False},
                    {"id": "opt4", "text": "create()", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "insertOne() is used to insert a single document into a MongoDB collection.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["MongoDB", "NoSQL"]
            },
        ],
        "Data Structures & Algorithms": [
            {
                "question": "What is the time complexity of binary search?",
                "options": [
                    {"id": "opt1", "text": "O(1)", "isCorrect": False},
                    {"id": "opt2", "text": "O(log n)", "isCorrect": True},
                    {"id": "opt3", "text": "O(n)", "isCorrect": False},
                    {"id": "opt4", "text": "O(n²)", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Binary search has O(log n) time complexity as it eliminates half of the search space in each iteration.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["Algorithms", "Search", "Time Complexity"]
            },
        ],
    },
    "testing": {
        "Manual Testing": [
            {
                "question": "What is the purpose of a test case?",
                "options": [
                    {"id": "opt1", "text": "To document bugs", "isCorrect": False},
                    {"id": "opt2", "text": "To verify that a specific functionality works as expected", "isCorrect": True},
                    {"id": "opt3", "text": "To write code", "isCorrect": False},
                    {"id": "opt4", "text": "To deploy applications", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "A test case is a set of conditions used to verify that a specific functionality works as expected.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Test Cases", "Manual Testing"]
            },
        ],
        "Test Automation Tools": [
            {
                "question": "Which tool is primarily used for web browser automation?",
                "options": [
                    {"id": "opt1", "text": "Selenium", "isCorrect": True},
                    {"id": "opt2", "text": "JUnit", "isCorrect": False},
                    {"id": "opt3", "text": "Postman", "isCorrect": False},
                    {"id": "opt4", "text": "Git", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "Selenium is a popular tool for automating web browser interactions.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Selenium", "Automation"]
            },
        ],
        "API Testing": [
            {
                "question": "What HTTP status code indicates a successful GET request?",
                "options": [
                    {"id": "opt1", "text": "200", "isCorrect": True},
                    {"id": "opt2", "text": "404", "isCorrect": False},
                    {"id": "opt3", "text": "500", "isCorrect": False},
                    {"id": "opt4", "text": "301", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "HTTP status code 200 indicates a successful request.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["API Testing", "HTTP"]
            },
        ],
    },
    "devops": {
        "Linux & Operating Systems": [
            {
                "question": "Which command is used to list files in Linux?",
                "options": [
                    {"id": "opt1", "text": "dir", "isCorrect": False},
                    {"id": "opt2", "text": "ls", "isCorrect": True},
                    {"id": "opt3", "text": "list", "isCorrect": False},
                    {"id": "opt4", "text": "show", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "The 'ls' command is used to list files and directories in Linux.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Linux", "Command Line"]
            },
        ],
        "Version Control": [
            {
                "question": "What does 'git commit' do?",
                "options": [
                    {"id": "opt1", "text": "Downloads code from remote", "isCorrect": False},
                    {"id": "opt2", "text": "Saves changes to the local repository", "isCorrect": True},
                    {"id": "opt3", "text": "Creates a new branch", "isCorrect": False},
                    {"id": "opt4", "text": "Merges branches", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "git commit saves your staged changes to the local Git repository.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Git", "Version Control"]
            },
        ],
        "CI/CD Tools": [
            {
                "question": "What does CI/CD stand for?",
                "options": [
                    {"id": "opt1", "text": "Continuous Integration / Continuous Deployment", "isCorrect": True},
                    {"id": "opt2", "text": "Code Integration / Code Deployment", "isCorrect": False},
                    {"id": "opt3", "text": "Central Integration / Central Deployment", "isCorrect": False},
                    {"id": "opt4", "text": "Complete Integration / Complete Deployment", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "CI/CD stands for Continuous Integration and Continuous Deployment/Delivery.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["CI/CD", "DevOps"]
            },
        ],
        "Containerization": [
            {
                "question": "What is Docker?",
                "options": [
                    {"id": "opt1", "text": "A programming language", "isCorrect": False},
                    {"id": "opt2", "text": "A containerization platform", "isCorrect": True},
                    {"id": "opt3", "text": "A database", "isCorrect": False},
                    {"id": "opt4", "text": "A web framework", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Docker is a platform for developing, shipping, and running applications in containers.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Docker", "Containers"]
            },
        ],
        "Cloud Platforms": [
            {
                "question": "Which service is AWS's object storage service?",
                "options": [
                    {"id": "opt1", "text": "EC2", "isCorrect": False},
                    {"id": "opt2", "text": "S3", "isCorrect": True},
                    {"id": "opt3", "text": "Lambda", "isCorrect": False},
                    {"id": "opt4", "text": "RDS", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Amazon S3 (Simple Storage Service) is AWS's object storage service.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["AWS", "Cloud"]
            },
        ],
    },
    "agentic-ai": {
        "AI Fundamentals": [
            {
                "question": "What is Machine Learning?",
                "options": [
                    {"id": "opt1", "text": "A type of database", "isCorrect": False},
                    {"id": "opt2", "text": "A method of data analysis that automates analytical model building", "isCorrect": True},
                    {"id": "opt3", "text": "A programming language", "isCorrect": False},
                    {"id": "opt4", "text": "A web framework", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Machine Learning is a method of data analysis that automates analytical model building using algorithms that iteratively learn from data.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Machine Learning", "AI Fundamentals"]
            },
        ],
        "LLM Integration": [
            {
                "question": "What does LLM stand for?",
                "options": [
                    {"id": "opt1", "text": "Large Language Model", "isCorrect": True},
                    {"id": "opt2", "text": "Long Learning Method", "isCorrect": False},
                    {"id": "opt3", "text": "Linear Language Machine", "isCorrect": False},
                    {"id": "opt4", "text": "Local Language Module", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "LLM stands for Large Language Model, which are AI models trained on vast amounts of text data.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["LLM", "AI"]
            },
        ],
        "Prompt Engineering": [
            {
                "question": "What is prompt engineering?",
                "options": [
                    {"id": "opt1", "text": "Writing code", "isCorrect": False},
                    {"id": "opt2", "text": "The practice of designing effective prompts for AI models", "isCorrect": True},
                    {"id": "opt3", "text": "Database design", "isCorrect": False},
                    {"id": "opt4", "text": "Network configuration", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Prompt engineering is the practice of designing and optimizing prompts to get desired outputs from AI models.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["Prompt Engineering", "AI"]
            },
        ],
        "AI Agents": [
            {
                "question": "What is an AI agent?",
                "options": [
                    {"id": "opt1", "text": "A database", "isCorrect": False},
                    {"id": "opt2", "text": "An autonomous system that can perceive, reason, and act", "isCorrect": True},
                    {"id": "opt3", "text": "A web server", "isCorrect": False},
                    {"id": "opt4", "text": "A programming language", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "An AI agent is an autonomous system that can perceive its environment, reason about it, and take actions to achieve goals.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["AI Agents", "Autonomous Systems"]
            },
        ],
    },
    "mobile-app": {
        "Mobile Development Fundamentals": [
            {
                "question": "What is the main difference between iOS and Android development?",
                "options": [
                    {"id": "opt1", "text": "iOS uses Java, Android uses Swift", "isCorrect": False},
                    {"id": "opt2", "text": "iOS uses Swift/Objective-C, Android uses Java/Kotlin", "isCorrect": True},
                    {"id": "opt3", "text": "No difference", "isCorrect": False},
                    {"id": "opt4", "text": "iOS uses Python, Android uses JavaScript", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "iOS development primarily uses Swift or Objective-C, while Android development uses Java or Kotlin.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Mobile Development", "iOS", "Android"]
            },
        ],
        "iOS Development": [
            {
                "question": "What is SwiftUI?",
                "options": [
                    {"id": "opt1", "text": "A database", "isCorrect": False},
                    {"id": "opt2", "text": "Apple's declarative UI framework", "isCorrect": True},
                    {"id": "opt3", "text": "A programming language", "isCorrect": False},
                    {"id": "opt4", "text": "A testing framework", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "SwiftUI is Apple's modern, declarative UI framework for building user interfaces across all Apple platforms.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["iOS", "SwiftUI"]
            },
        ],
        "Android Development": [
            {
                "question": "What is the primary language for modern Android development?",
                "options": [
                    {"id": "opt1", "text": "Java", "isCorrect": False},
                    {"id": "opt2", "text": "Kotlin", "isCorrect": True},
                    {"id": "opt3", "text": "Python", "isCorrect": False},
                    {"id": "opt4", "text": "JavaScript", "isCorrect": False},
                ],
                "correctAnswer": "opt2",
                "explanation": "Kotlin is now the preferred language for Android development, officially supported by Google.",
                "difficulty": "Beginner",
                "points": 1,
                "tags": ["Android", "Kotlin"]
            },
        ],
        "Cross-Platform Frameworks": [
            {
                "question": "Which framework allows you to write code once and deploy to both iOS and Android?",
                "options": [
                    {"id": "opt1", "text": "React Native", "isCorrect": True},
                    {"id": "opt2", "text": "Only native development", "isCorrect": False},
                    {"id": "opt3", "text": "HTML only", "isCorrect": False},
                    {"id": "opt4", "text": "Python", "isCorrect": False},
                ],
                "correctAnswer": "opt1",
                "explanation": "React Native is a cross-platform framework that allows you to build mobile apps for both iOS and Android using JavaScript/React.",
                "difficulty": "Intermediate",
                "points": 2,
                "tags": ["React Native", "Cross-Platform"]
            },
        ],
    },
}


async def ensure_quiz_questions_collection(db):
    """
    Ensure quiz_questions collection exists and is populated with initial questions.
    """
    try:
        # Check if collection has any questions
        count = await db.quiz_questions.count_documents({})
        
        if count == 0:
            # Collection exists but is empty, or doesn't exist (MongoDB creates on first insert)
            logger.info("Initializing quiz_questions collection...")
            
            inserted_count = 0
            for category, skill_types in QUIZ_QUESTIONS.items():
                try:
                    for skill_type, questions in skill_types.items():
                        for question_data in questions:
                            # Check if question already exists
                            existing = await db.quiz_questions.find_one({
                                "category": category,
                                "skillType": skill_type,
                                "question": question_data["question"]
                            })
                            
                            if existing:
                                continue
                            
                            # Create question document
                            question_doc = {
                                "category": category,
                                "skillType": skill_type,
                                "question": question_data["question"],
                                "options": question_data["options"],
                                "correctAnswer": question_data["correctAnswer"],
                                "explanation": question_data.get("explanation"),
                                "difficulty": question_data["difficulty"],
                                "points": question_data.get("points", 1),
                                "tags": question_data.get("tags", []),
                                "created_at": datetime.utcnow(),
                            }
                            
                            await db.quiz_questions.insert_one(question_doc)
                            inserted_count += 1
                            logger.info(f"Auto-initialized quiz question for {category} - {skill_type}")
                except Exception as e:
                    logger.error(f"Error inserting questions for {category}: {e}")
            
            if inserted_count > 0:
                logger.info(f"Auto-initialized {inserted_count} quiz questions")
        
        return True
    except Exception as e:
        logger.error(f"Error ensuring quiz_questions collection: {e}")
        return False


async def ensure_collections_exist(db):
    """
    Ensure all required collections exist in the database.
    MongoDB creates collections automatically on first insert, but we can
    ensure they're ready by creating indexes or checking existence.
    """
    try:
        # Ensure self_assessments collection
        await ensure_self_assessments_collection(db)
        
        # Ensure quiz_questions collection
        await ensure_quiz_questions_collection(db)
        
        # Ensure self_assessment_results collection exists (will be created on first insert)
        # We can create an index to ensure it exists
        await db.self_assessment_results.create_index("user_id")
        await db.self_assessment_results.create_index("created_at")
        
        # Ensure users collection has indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("created_at")
        
        # Ensure quiz_questions collection has indexes
        await db.quiz_questions.create_index("category")
        await db.quiz_questions.create_index("skillType")
        await db.quiz_questions.create_index("difficulty")
        await db.quiz_questions.create_index([("category", 1), ("skillType", 1)])
        
        # Ensure quiz_sessions collection has indexes
        await db.quiz_sessions.create_index("user_id")
        await db.quiz_sessions.create_index("category")
        await db.quiz_sessions.create_index("created_at")
        await db.quiz_sessions.create_index([("user_id", 1), ("category", 1)])
        
        logger.info("All collections verified/initialized")
        return True
    except Exception as e:
        logger.warning(f"Error ensuring collections: {e}")
        # Don't fail - collections will be created on first use
        return False

