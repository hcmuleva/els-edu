/**
 * Generate detailed drill-down analysis for a specific category
 */
export const generateCategoryDrillDown = (userProfile, category, categoryScore, categoryLevel) => {
  const categorySkills = userProfile.selfAssessment[category];
  const categoryNameMap = {
    'development': 'Development',
    'testing': 'Testing',
    'devops': 'DevOps',
    'agentic-ai': 'Agentic AI',
    'mobile-app': 'Mobile App'
  };
  const categoryName = categoryNameMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  
  // Map skills to standardized names based on category
  const skillMapping = getSkillMapping(category, categorySkills);
  
  // Calculate individual skill ratings
  const skillBreakdown = skillMapping.map(({ skill, originalSkill }) => {
    const rating = categorySkills[originalSkill] || 0;
    const status = getSkillStatus(rating);
    const remarks = getSkillRemarks(category, skill, rating);
    
    return {
      skill,
      rating,
      status,
      remarks
    };
  });
  
  // Calculate strengths (skills >= 6)
  const strengths = skillBreakdown
    .filter(s => s.rating >= 6)
    .map(s => s.skill.toLowerCase());
  
  // Calculate gaps (skills <= 4)
  const gaps = skillBreakdown
    .filter(s => s.rating <= 4)
    .map(s => s.skill.toLowerCase());
  
  // Quiz eligibility
  const eligible = categoryScore >= 6;
  const recommendedLevel = categoryLevel;
  const focusAreas = gaps.slice(0, 3);
  
  // Generate summary
  const summary = generateSummary(category, categoryScore, categoryLevel, skillBreakdown);
  
  // Generate recommendations
  const recommendations = generateRecommendations(category, skillBreakdown, gaps);
  
  return {
    category: categoryName,
    overview: {
      score: categoryScore,
      level: categoryLevel,
      summary
    },
    skillBreakdown,
    charts: {
      barChart: {
        labels: skillBreakdown.map(s => s.skill),
        values: skillBreakdown.map(s => s.rating)
      }
    },
    strengths,
    gaps,
    quizEligibility: {
      eligible,
      recommendedLevel,
      focusAreas
    },
    recommendations
  };
};

/**
 * Map category-specific skills to standardized names
 */
function getSkillMapping(category, categorySkills) {
  const skillKeys = Object.keys(categorySkills);
  
  if (category === 'development') {
    return [
      { skill: 'Programming Fundamentals', originalSkill: 'Programming Fundamentals' },
      { skill: 'Data Structures & Algorithms', originalSkill: 'Data Structures & Algorithms' },
      { skill: 'Frontend Development', originalSkill: 'Frontend (React/HTML/CSS)' },
      { skill: 'Backend Development', originalSkill: 'Backend (Node/Java/Python)' },
      { skill: 'Database Knowledge', originalSkill: 'Databases (SQL/NoSQL)' }
    ].filter(m => categorySkills[m.originalSkill] !== undefined)
     .map(m => ({ skill: m.skill, originalSkill: m.originalSkill }));
  }
  
  if (category === 'testing') {
    return [
      { skill: 'Manual Testing Fundamentals', originalSkill: 'Manual Testing Basics' },
      { skill: 'Test Case Design', originalSkill: 'Test Case Design' },
      { skill: 'Automation Tools', originalSkill: 'Automation Testing' },
      { skill: 'API Testing', originalSkill: 'API Testing' },
      { skill: 'Bug Tracking & Reporting', originalSkill: 'Bug Tracking Tools' }
    ].filter(m => categorySkills[m.originalSkill] !== undefined)
     .map(m => ({ skill: m.skill, originalSkill: m.originalSkill }));
  }
  
  if (category === 'devops') {
    return [
      { skill: 'Linux & OS Basics', originalSkill: 'Linux & Networking Basics' },
      { skill: 'Git & Version Control', originalSkill: 'Git & Version Control' },
      { skill: 'CI/CD Pipelines', originalSkill: 'CI/CD Pipelines' },
      { skill: 'Docker & Containers', originalSkill: 'Docker & Containers' },
      { skill: 'Cloud Platforms', originalSkill: 'Cloud Platforms (AWS/Azure/GCP)' }
    ].filter(m => categorySkills[m.originalSkill] !== undefined)
     .map(m => ({ skill: m.skill, originalSkill: m.originalSkill }));
  }
  
  if (category === 'agentic-ai') {
    return [
      { skill: 'AI Fundamentals & Concepts', originalSkill: 'AI Fundamentals & Concepts' },
      { skill: 'LLM Integration & APIs', originalSkill: 'LLM Integration & APIs' },
      { skill: 'Prompt Engineering', originalSkill: 'Prompt Engineering' },
      { skill: 'Agent Architecture & Design', originalSkill: 'Agent Architecture & Design' },
      { skill: 'AI Tools & Frameworks', originalSkill: 'AI Tools & Frameworks' },
      { skill: 'Ethics & Responsible AI', originalSkill: 'Ethics & Responsible AI' }
    ].filter(m => categorySkills[m.originalSkill] !== undefined)
     .map(m => ({ skill: m.skill, originalSkill: m.originalSkill }));
  }
  
  if (category === 'mobile-app') {
    return [
      { skill: 'Mobile Development Fundamentals', originalSkill: 'Mobile Development Fundamentals' },
      { skill: 'iOS Development', originalSkill: 'iOS Development (Swift/SwiftUI)' },
      { skill: 'Android Development', originalSkill: 'Android Development (Kotlin/Java)' },
      { skill: 'Cross-Platform Frameworks', originalSkill: 'Cross-Platform Frameworks (React Native/Flutter)' },
      { skill: 'Mobile UI/UX Design', originalSkill: 'Mobile UI/UX Design' },
      { skill: 'App Store Deployment', originalSkill: 'App Store Deployment' }
    ].filter(m => categorySkills[m.originalSkill] !== undefined)
     .map(m => ({ skill: m.skill, originalSkill: m.originalSkill }));
  }
  
  // Fallback: use original skill names
  return skillKeys.map(skill => ({ skill, originalSkill: skill }));
}

/**
 * Get skill status based on rating
 */
function getSkillStatus(rating) {
  if (rating >= 7) return 'Excellent';
  if (rating >= 6) return 'Good';
  if (rating >= 5) return 'Average';
  if (rating >= 4) return 'Needs Improvement';
  return 'Weak';
}

/**
 * Get skill-specific remarks
 */
function getSkillRemarks(category, skill, rating) {
  const remarks = {
    development: {
      'Programming Fundamentals': {
        9: 'Expert-level programming skills with deep understanding',
        8: 'Excellent programming fundamentals across multiple languages',
        7: 'Strong grasp of core programming concepts and best practices',
        6: 'Comfortable with syntax, control structures, and basic algorithms',
        5: 'Basic understanding of programming concepts, needs more practice',
        4: 'Limited exposure to programming fundamentals, requires foundational learning',
        3: 'Needs significant improvement in core programming skills',
        2: 'Minimal programming knowledge'
      },
      'Data Structures & Algorithms': {
        9: 'Expert-level DSA knowledge with complex problem-solving',
        8: 'Excellent understanding of data structures and algorithms',
        7: 'Strong DSA skills, can solve medium complexity problems',
        6: 'Good grasp of common data structures and algorithms',
        5: 'Basic DSA knowledge, understands arrays, lists, and basic algorithms',
        4: 'Limited DSA exposure, needs practice with problem-solving',
        3: 'Minimal DSA knowledge, requires foundational learning',
        2: 'Very limited DSA understanding'
      },
      'Frontend Development': {
        9: 'Expert-level frontend skills with modern frameworks',
        8: 'Excellent familiarity with React, HTML, CSS, and modern tools',
        7: 'Strong frontend development skills, comfortable with React ecosystem',
        6: 'Good understanding of frontend technologies and responsive design',
        5: 'Basic frontend knowledge, familiar with HTML/CSS basics',
        4: 'Limited frontend experience, needs hands-on React practice',
        3: 'Minimal frontend exposure',
        2: 'Very limited frontend knowledge'
      },
      'Backend Development': {
        9: 'Expert-level backend development across multiple languages',
        8: 'Excellent backend skills with Node.js, Java, or Python',
        7: 'Strong backend understanding, can build RESTful APIs',
        6: 'Good backend knowledge, comfortable with server-side development',
        5: 'Basic backend understanding, familiar with server concepts',
        4: 'Limited backend experience, needs hands-on practice with Node.js or Python',
        3: 'Minimal backend exposure, requires foundational learning',
        2: 'Very limited backend knowledge'
      },
      'Database Knowledge': {
        9: 'Expert-level database skills across SQL and NoSQL',
        8: 'Excellent database knowledge with optimization skills',
        7: 'Strong database understanding, can design schemas effectively',
        6: 'Good database knowledge, comfortable with SQL queries',
        5: 'Basic database concepts understood, can write simple queries',
        4: 'Limited database knowledge, needs practice with SQL',
        3: 'Limited database knowledge, needs foundational learning',
        2: 'Minimal database exposure',
        1: 'Very limited database understanding'
      }
    },
    testing: {
      'Manual Testing Fundamentals': {
        8: 'Expert-level manual testing skills with comprehensive test coverage',
        7: 'Strong understanding of manual testing principles and methodologies',
        6: 'Solid understanding of manual testing principles and can execute test cases effectively',
        5: 'Basic manual testing knowledge, understands test execution basics',
        4: 'Needs more hands-on experience with manual testing scenarios',
        3: 'Limited manual testing exposure, requires foundational training'
      },
      'Test Case Design': {
        8: 'Excellent test case design skills with comprehensive coverage',
        7: 'Strong ability to design effective test cases',
        6: 'Good test case design skills, can create structured test scenarios',
        5: 'Basic test case design knowledge, needs practice with edge cases',
        4: 'Limited test case design experience, requires methodology training',
        3: 'Minimal test case design knowledge'
      },
      'Automation Tools': {
        8: 'Expert-level automation skills with multiple tools',
        7: 'Strong automation testing capabilities',
        6: 'Good understanding of automation frameworks',
        5: 'Basic awareness of automation tools and concepts',
        4: 'Limited automation experience, needs hands-on practice',
        3: 'Minimal automation knowledge',
        2: 'Minimal automation experience, requires comprehensive training',
        1: 'No automation experience, needs foundational learning'
      },
      'API Testing': {
        8: 'Expert-level API testing with advanced tools and techniques',
        7: 'Strong API testing skills across multiple protocols',
        6: 'Good API testing knowledge, can test REST APIs effectively',
        5: 'Basic API testing understanding',
        4: 'Basic API testing knowledge, needs practice with tools like Postman',
        3: 'Limited API testing exposure',
        2: 'Minimal API testing knowledge'
      },
      'Bug Tracking & Reporting': {
        8: 'Excellent bug tracking and reporting skills',
        7: 'Strong ability to track and report bugs effectively',
        6: 'Good bug tracking skills, understands defect lifecycle',
        5: 'Basic bug tracking knowledge, familiar with common tools',
        4: 'Limited bug tracking experience',
        3: 'Minimal bug tracking knowledge'
      }
    },
    devops: {
      'Linux & OS Basics': {
        8: 'Expert-level Linux administration skills',
        7: 'Strong Linux command-line proficiency',
        6: 'Good Linux fundamentals, comfortable with common commands',
        5: 'Basic Linux knowledge, understands file system and permissions',
        4: 'Basic Linux & OS awareness, needs more command-line practice',
        3: 'Limited Linux exposure, requires foundational learning',
        2: 'Minimal Linux knowledge'
      },
      'Git & Version Control': {
        9: 'Expert-level Git mastery with advanced workflows',
        8: 'Excellent Git skills with branching strategies',
        7: 'Strong Git workflow understanding, comfortable with complex operations',
        6: 'Comfortable with basic Git operations, understands branching',
        5: 'Basic Git knowledge, can commit and push changes',
        4: 'Limited Git experience, needs practice with workflows',
        3: 'Minimal Git knowledge'
      },
      'CI/CD Pipelines': {
        8: 'Expert-level CI/CD implementation skills',
        7: 'Strong CI/CD pipeline design and maintenance',
        6: 'Good understanding of CI/CD concepts and tools',
        5: 'Basic CI/CD awareness, understands pipeline concepts',
        4: 'Limited CI/CD knowledge, needs hands-on practice',
        3: 'Limited CI/CD knowledge, needs learning and practice',
        2: 'Minimal CI/CD exposure',
        1: 'No CI/CD experience'
      },
      'Docker & Containers': {
        8: 'Expert-level containerization skills',
        7: 'Strong Docker and container orchestration knowledge',
        6: 'Good Docker understanding, can create and manage containers',
        5: 'Basic container concepts, understands Docker basics',
        4: 'Limited Docker knowledge, needs hands-on practice',
        3: 'Minimal Docker exposure',
        2: 'Minimal Docker experience, requires comprehensive training',
        1: 'No Docker knowledge'
      },
      'Cloud Platforms': {
        8: 'Expert-level cloud platform expertise',
        7: 'Strong multi-cloud platform knowledge',
        6: 'Good cloud fundamentals, familiar with major services',
        5: 'Basic cloud awareness, understands core concepts',
        4: 'Basic cloud awareness, needs exploration of AWS/Azure/GCP',
        3: 'Limited cloud knowledge',
        2: 'Minimal cloud exposure',
        1: 'Very limited cloud knowledge, needs foundational learning'
      }
    },
    'agentic-ai': {
      'AI Fundamentals & Concepts': {
        8: 'Expert-level AI knowledge with deep understanding',
        7: 'Strong grasp of AI fundamentals and machine learning concepts',
        6: 'Good understanding of AI basics and core concepts',
        5: 'Basic AI knowledge, understands fundamental concepts',
        4: 'Limited AI exposure, needs foundational learning',
        3: 'Minimal AI knowledge'
      },
      'LLM Integration & APIs': {
        8: 'Expert-level LLM integration across multiple platforms',
        7: 'Strong LLM API integration skills',
        6: 'Good understanding of LLM APIs and integration',
        5: 'Basic LLM API knowledge',
        4: 'Limited LLM integration experience, needs practice with OpenAI/Anthropic APIs',
        3: 'Minimal LLM integration knowledge'
      },
      'Prompt Engineering': {
        8: 'Expert-level prompt engineering with advanced techniques',
        7: 'Strong prompt engineering skills',
        6: 'Good prompt engineering knowledge, can create effective prompts',
        5: 'Basic prompt engineering understanding',
        4: 'Limited prompt engineering experience',
        3: 'Minimal prompt engineering knowledge'
      },
      'Agent Architecture & Design': {
        8: 'Expert-level agent architecture design',
        7: 'Strong agent design and architecture skills',
        6: 'Good understanding of agent patterns and design',
        5: 'Basic agent architecture knowledge',
        4: 'Limited agent design experience',
        3: 'Minimal agent architecture knowledge, needs foundational learning',
        2: 'Very limited agent design understanding'
      },
      'AI Tools & Frameworks': {
        8: 'Expert-level proficiency with multiple AI frameworks',
        7: 'Strong knowledge of AI tools and frameworks',
        6: 'Good familiarity with AI development tools',
        5: 'Basic AI tools knowledge',
        4: 'Limited AI tools exposure, needs exploration of LangChain, AutoGPT, etc.',
        3: 'Minimal AI tools knowledge'
      },
      'Ethics & Responsible AI': {
        8: 'Expert-level understanding of AI ethics and responsible practices',
        7: 'Strong knowledge of AI ethics principles',
        6: 'Good understanding of responsible AI practices',
        5: 'Basic AI ethics awareness',
        4: 'Limited ethics knowledge, needs learning on bias and fairness',
        3: 'Minimal ethics understanding'
      }
    },
    'mobile-app': {
      'Mobile Development Fundamentals': {
        8: 'Expert-level mobile development skills',
        7: 'Strong mobile development fundamentals',
        6: 'Good mobile development knowledge, understands core concepts',
        5: 'Basic mobile development understanding',
        4: 'Limited mobile development experience',
        3: 'Minimal mobile development knowledge'
      },
      'iOS Development': {
        8: 'Expert-level iOS development with Swift/SwiftUI',
        7: 'Strong iOS development skills',
        6: 'Good iOS development knowledge',
        5: 'Basic iOS understanding',
        4: 'Limited iOS experience, needs Swift/SwiftUI practice',
        3: 'Minimal iOS development knowledge',
        2: 'Very limited iOS exposure'
      },
      'Android Development': {
        8: 'Expert-level Android development with Kotlin/Java',
        7: 'Strong Android development skills',
        6: 'Good Android development knowledge',
        5: 'Basic Android understanding',
        4: 'Limited Android experience, needs Kotlin/Java practice',
        3: 'Minimal Android development knowledge',
        2: 'Very limited Android exposure'
      },
      'Cross-Platform Frameworks': {
        8: 'Expert-level cross-platform development',
        7: 'Strong React Native/Flutter skills',
        6: 'Good cross-platform framework knowledge',
        5: 'Basic React Native/Flutter understanding',
        4: 'Limited cross-platform experience, needs framework practice',
        3: 'Minimal cross-platform knowledge'
      },
      'Mobile UI/UX Design': {
        8: 'Expert-level mobile UI/UX design skills',
        7: 'Strong mobile design capabilities',
        6: 'Good mobile UI/UX understanding',
        5: 'Basic mobile design knowledge',
        4: 'Limited mobile design experience',
        3: 'Minimal mobile design knowledge'
      },
      'App Store Deployment': {
        8: 'Expert-level app store deployment and management',
        7: 'Strong app store deployment skills',
        6: 'Good understanding of app store processes',
        5: 'Basic app store knowledge',
        4: 'Limited deployment experience',
        3: 'Limited app store deployment knowledge, needs learning on submission process',
        2: 'Minimal deployment knowledge'
      }
    }
  };
  
  const categoryRemarks = remarks[category]?.[skill];
  if (categoryRemarks && categoryRemarks[rating]) {
    return categoryRemarks[rating];
  }
  
  // Generic remarks
  if (rating >= 7) return 'Strong competency in this area';
  if (rating >= 6) return 'Good understanding, can work independently';
  if (rating >= 5) return 'Basic knowledge, needs more practice';
  if (rating >= 4) return 'Limited exposure, requires learning';
  return 'Needs significant improvement';
}

/**
 * Generate category summary
 */
function generateSummary(category, score, level, skillBreakdown) {
  const avgRating = skillBreakdown.reduce((sum, s) => sum + s.rating, 0) / skillBreakdown.length;
  const strongSkills = skillBreakdown.filter(s => s.rating >= 6).length;
  const weakSkills = skillBreakdown.filter(s => s.rating <= 4).length;
  
  if (category === 'development') {
    return `Priyank shows ${level.toLowerCase()} hands-on exposure in core development concepts with ${strongSkills > 0 ? 'strengths' : 'gaps'} in ${strongSkills > 0 ? 'programming fundamentals' : 'testing and integration practices'}.`;
  }
  
  if (category === 'testing') {
    const strongArea = strongSkills > 0 
      ? skillBreakdown.find(s => s.rating >= 6)?.skill.toLowerCase() || 'manual testing'
      : null;
    const weakArea = weakSkills > 0
      ? skillBreakdown.find(s => s.rating <= 4)?.skill.toLowerCase() || 'automation and API testing'
      : 'automation and API testing';
    
    return `Priyank demonstrates ${level.toLowerCase()} testing knowledge with ${strongSkills > 0 ? `solid understanding of ${strongArea}` : `limited exposure to ${weakArea}`}. ${weakSkills > 0 ? `Focus areas for improvement include ${weakArea}.` : ''}`;
  }
  
  if (category === 'devops') {
    const strongArea = strongSkills > 0 
      ? skillBreakdown.find(s => s.rating >= 6)?.skill.toLowerCase() || 'version control'
      : null;
    const weakArea = weakSkills > 0
      ? skillBreakdown.find(s => s.rating <= 4)?.skill.toLowerCase() || 'CI/CD and cloud platforms'
      : 'CI/CD and cloud platforms';
    
    return `Priyank has ${level.toLowerCase()} DevOps exposure with ${strongSkills > 0 ? `good knowledge in ${strongArea}` : `limited understanding of ${weakArea}`}. ${weakSkills > 0 ? `Key areas needing development: ${weakArea}.` : ''}`;
  }
  
  if (category === 'agentic-ai') {
    const strongArea = strongSkills > 0 
      ? skillBreakdown.find(s => s.rating >= 6)?.skill.toLowerCase() || 'prompt engineering'
      : null;
    const weakArea = weakSkills > 0
      ? skillBreakdown.find(s => s.rating <= 4)?.skill.toLowerCase() || 'agent architecture'
      : 'agent architecture';
    
    return `Priyank demonstrates ${level.toLowerCase()} agentic AI knowledge with ${strongSkills > 0 ? `strengths in ${strongArea}` : `gaps in ${weakArea}`}. ${weakSkills > 0 ? `Focus areas: ${weakArea}.` : ''}`;
  }
  
  if (category === 'mobile-app') {
    const strongArea = strongSkills > 0 
      ? skillBreakdown.find(s => s.rating >= 6)?.skill.toLowerCase() || 'mobile fundamentals'
      : null;
    const weakArea = weakSkills > 0
      ? skillBreakdown.find(s => s.rating <= 4)?.skill.toLowerCase() || 'platform-specific development'
      : 'platform-specific development';
    
    return `Priyank shows ${level.toLowerCase()} mobile app development skills with ${strongSkills > 0 ? `good understanding of ${strongArea}` : `limited exposure to ${weakArea}`}. ${weakSkills > 0 ? `Areas for improvement: ${weakArea}.` : ''}`;
  }
  
  return `Overall ${level.toLowerCase()} competency in ${category} with room for improvement.`;
}

/**
 * Generate learning recommendations
 */
function generateRecommendations(category, skillBreakdown, gaps) {
  const learningActions = [];
  const weakSkills = skillBreakdown.filter(s => s.rating <= 4);
  
  if (category === 'development') {
    if (weakSkills.some(s => s.skill.includes('Testing'))) {
      learningActions.push('Introduce unit tests using Jest');
    }
    if (weakSkills.some(s => s.skill.includes('Backend'))) {
      learningActions.push('Hands-on backend project with Node.js or Python');
    }
    if (weakSkills.some(s => s.skill.includes('Database'))) {
      learningActions.push('Practice SQL queries and NoSQL basics');
    }
    learningActions.push('Practice Git branching strategies');
    learningActions.push('Build a full-stack React + API project');
  }
  
  if (category === 'testing') {
    if (weakSkills.some(s => s.skill.includes('Automation'))) {
      learningActions.push('Learn Selenium or Cypress for automation testing');
    }
    if (weakSkills.some(s => s.skill.includes('API'))) {
      learningActions.push('Practice API testing with Postman and REST Assured');
    }
    if (weakSkills.some(s => s.skill.includes('Test Case'))) {
      learningActions.push('Learn test case design methodologies (Equivalence Partitioning, Boundary Value Analysis)');
    }
    if (weakSkills.some(s => s.skill.includes('Manual'))) {
      learningActions.push('Practice manual testing scenarios and test execution');
    }
    learningActions.push('Understand CI integration for automated tests');
    learningActions.push('Learn bug tracking tools (Jira, Bugzilla)');
    if (learningActions.length < 4) {
      learningActions.push('Practice test data management and environment setup');
    }
  }
  
  if (category === 'devops') {
    if (weakSkills.some(s => s.skill.includes('Linux'))) {
      learningActions.push('Practice Linux command line and shell scripting');
    }
    if (weakSkills.some(s => s.skill.includes('Docker'))) {
      learningActions.push('Hands-on Docker containerization practice (Dockerfile, docker-compose)');
    }
    if (weakSkills.some(s => s.skill.includes('CI/CD'))) {
      learningActions.push('Set up CI/CD pipeline with GitHub Actions or Jenkins');
    }
    if (weakSkills.some(s => s.skill.includes('Cloud'))) {
      learningActions.push('Explore AWS/Azure/GCP fundamentals and core services');
    }
    if (weakSkills.some(s => s.skill.includes('Git'))) {
      learningActions.push('Master Git workflows (branching, merging, rebasing)');
    }
    if (learningActions.length < 4) {
      learningActions.push('Learn infrastructure as code (Terraform basics)');
      learningActions.push('Practice monitoring and logging tools (Prometheus, Grafana)');
    }
  }
  
  if (category === 'agentic-ai') {
    if (weakSkills.some(s => s.skill.includes('LLM'))) {
      learningActions.push('Practice LLM API integration with OpenAI and Anthropic');
    }
    if (weakSkills.some(s => s.skill.includes('Prompt'))) {
      learningActions.push('Master prompt engineering techniques and best practices');
    }
    if (weakSkills.some(s => s.skill.includes('Agent Architecture'))) {
      learningActions.push('Learn agent architecture patterns and design principles');
    }
    if (weakSkills.some(s => s.skill.includes('Tools'))) {
      learningActions.push('Explore AI frameworks like LangChain, AutoGPT, and CrewAI');
    }
    if (weakSkills.some(s => s.skill.includes('Ethics'))) {
      learningActions.push('Study AI ethics, bias mitigation, and responsible AI practices');
    }
    if (learningActions.length < 4) {
      learningActions.push('Build a practical AI agent project');
      learningActions.push('Practice with vector databases and RAG patterns');
    }
  }
  
  if (category === 'mobile-app') {
    if (weakSkills.some(s => s.skill.includes('iOS'))) {
      learningActions.push('Learn iOS development with Swift and SwiftUI');
    }
    if (weakSkills.some(s => s.skill.includes('Android'))) {
      learningActions.push('Practice Android development with Kotlin/Java');
    }
    if (weakSkills.some(s => s.skill.includes('Cross-Platform'))) {
      learningActions.push('Master React Native or Flutter for cross-platform development');
    }
    if (weakSkills.some(s => s.skill.includes('Deployment'))) {
      learningActions.push('Learn app store deployment process (iOS App Store & Google Play)');
    }
    if (weakSkills.some(s => s.skill.includes('UI/UX'))) {
      learningActions.push('Study mobile UI/UX design principles and patterns');
    }
    if (learningActions.length < 4) {
      learningActions.push('Build a complete mobile app from scratch');
      learningActions.push('Practice mobile app testing and debugging');
    }
  }
  
  const categoryDisplayName = category === 'agentic-ai' ? 'Agentic AI' : 
                              category === 'mobile-app' ? 'Mobile App' :
                              category.charAt(0).toUpperCase() + category.slice(1);
  
  const elsPath = `${categoryDisplayName} – ${skillBreakdown[0]?.status || 'Intermediate'} Track`;
  const expectedOutcome = `Industry-ready ${category === 'development' ? 'developer' : category === 'testing' ? 'QA professional' : category === 'devops' ? 'DevOps engineer' : category === 'agentic-ai' ? 'AI engineer' : 'mobile developer'} with ${category === 'development' ? 'test-aware coding habits' : category === 'testing' ? 'comprehensive testing skills' : category === 'devops' ? 'DevOps best practices' : category === 'agentic-ai' ? 'AI agent development expertise' : 'mobile app development skills'}`;
  
  return {
    learningActions: learningActions.slice(0, 4),
    elsPath,
    expectedOutcome
  };
}

