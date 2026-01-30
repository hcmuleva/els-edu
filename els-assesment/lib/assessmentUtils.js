/**
 * Calculate category score (average of skill ratings)
 */
export const calculateCategoryScore = (skills) => {
    const ratings = Object.values(skills);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };
  
  /**
   * Classify level based on score
   * 0-3: Beginner, 4-6: Intermediate, 7-10: Advanced
   */
  export const classifyLevel = (score) => {
    if (score <= 3) return "Beginner";
    if (score <= 6) return "Intermediate";
    return "Advanced";
  };
  
  /**
   * Get color for level classification
   */
  export const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-red-100 text-red-800 border-red-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Advanced":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  /**
   * Identify skill gaps (ratings <= 4)
   */
  export const identifySkillGaps = (skills) => {
    return Object.entries(skills)
      .filter(([_, rating]) => rating <= 4)
      .map(([skill, rating]) => ({ skill, rating }));
  };
  
  /**
   * Analyze user profile and generate assessment report
   */
  export const analyzeProfile = (userProfile) => {
    const { selfAssessment } = userProfile;
  
    // Calculate scores for each category
    const categoryScores = {
      development: calculateCategoryScore(selfAssessment.development),
      testing: calculateCategoryScore(selfAssessment.testing),
      devops: calculateCategoryScore(selfAssessment.devops),
    };
  
    // Classify levels
    const categoryLevels = {
      development: classifyLevel(categoryScores.development),
      testing: classifyLevel(categoryScores.testing),
      devops: classifyLevel(categoryScores.devops),
    };
  
    // Find strongest and weakest categories
    const categories = Object.entries(categoryScores);
    const strongest = categories.reduce((a, b) => (a[1] > b[1] ? a : b));
    const weakest = categories.reduce((a, b) => (a[1] < b[1] ? a : b));
  
    // Identify skill gaps
    const skillGaps = {
      development: identifySkillGaps(selfAssessment.development),
      testing: identifySkillGaps(selfAssessment.testing),
      devops: identifySkillGaps(selfAssessment.devops),
    };
  
    // Determine quiz eligibility
    const quizEligibility = {
      development: categoryScores.development >= 6,
      testing: categoryScores.testing >= 6,
      devops: categoryScores.devops >= 6,
    };
  
    const hasEligibleCategory = Object.values(quizEligibility).some(
      (eligible) => eligible
    );
    const allCategoriesBeginner = Object.values(categoryScores).every(
      (score) => score < 4
    );
  
    return {
      categoryScores,
      categoryLevels,
      strongest: {
        category: strongest[0],
        score: strongest[1],
        level: categoryLevels[strongest[0]],
      },
      weakest: {
        category: weakest[0],
        score: weakest[1],
        level: categoryLevels[weakest[0]],
      },
      skillGaps,
      quizEligibility,
      hasEligibleCategory,
      allCategoriesBeginner,
      recommendation: allCategoriesBeginner
        ? "Foundation Program"
        : hasEligibleCategory
        ? "Ready for Quiz"
        : "Foundation Program",
    };
  };
  
  /**
   * Generate learning recommendations
   */
  export const generateLearningRecommendations = (analysis) => {
    const recommendations = [];
  
    if (analysis.allCategoriesBeginner) {
      recommendations.push({
        priority: "high",
        title: "Complete Foundation Program",
        description:
          "All skill categories are below intermediate level. We recommend starting with our Foundation Program to build core competencies.",
        category: "general",
      });
    }
  
    // Development recommendations
    if (analysis.categoryScores.development >= 6 && analysis.quizEligibility.development) {
      recommendations.push({
        priority: "medium",
        title: "Take Development Quiz",
        description:
          "Your Development skills are strong! You're eligible to take our Development category quiz.",
        category: "development",
      });
    } else if (analysis.skillGaps.development.length > 0) {
      const gaps = analysis.skillGaps.development
        .map((g) => g.skill)
        .join(", ");
      recommendations.push({
        priority: "medium",
        title: "Strengthen Development Fundamentals",
        description: `Focus on: ${gaps}. These areas need improvement.`,
        category: "development",
      });
    }
  
    // Testing recommendations
    if (analysis.categoryScores.testing >= 6 && analysis.quizEligibility.testing) {
      recommendations.push({
        priority: "medium",
        title: "Take Testing Quiz",
        description:
          "Your Testing skills are solid! You're eligible to take our Testing category quiz.",
        category: "testing",
      });
    } else if (analysis.skillGaps.testing.length > 0) {
      const gaps = analysis.skillGaps.testing
        .map((g) => g.skill)
        .join(", ");
      recommendations.push({
        priority: "medium",
        title: "Improve Testing Skills",
        description: `Priority areas: ${gaps}. Consider targeted learning modules.`,
        category: "testing",
      });
    }
  
    // DevOps recommendations
    if (analysis.categoryScores.devops >= 6 && analysis.quizEligibility.devops) {
      recommendations.push({
        priority: "medium",
        title: "Take DevOps Quiz",
        description:
          "Your DevOps skills are strong! You're eligible to take our DevOps category quiz.",
        category: "devops",
      });
    } else if (analysis.skillGaps.devops.length > 0) {
      const gaps = analysis.skillGaps.devops
        .map((g) => g.skill)
        .join(", ");
      recommendations.push({
        priority: "medium",
        title: "Build DevOps Expertise",
        description: `Key areas to develop: ${gaps}. Start with Linux and Git basics.`,
        category: "devops",
      });
    }
  
    return recommendations;
  };
  
  /**
   * Generate career recommendations
   */
  export const generateCareerRecommendations = (userProfile, analysis) => {
    const recommendations = [];
  
    if (analysis.strongest.category === "development") {
      recommendations.push({
        title: "Full-Stack Developer",
        description:
          "Your strong development skills make you a great candidate for full-stack development roles.",
      });
      recommendations.push({
        title: "Frontend Engineer",
        description:
          "Consider specializing in frontend development to deepen your React expertise.",
      });
    }
  
    if (analysis.strongest.category === "testing") {
      recommendations.push({
        title: "QA Automation Engineer",
        description:
          "Your testing background positions you well for QA automation roles.",
      });
    }
  
    if (analysis.strongest.category === "devops") {
      recommendations.push({
        title: "DevOps Engineer",
        description:
          "Consider pursuing DevOps engineering roles leveraging your infrastructure knowledge.",
      });
    }
  
    // General career advice
    if (userProfile.yearsOfExperience < 2) {
      recommendations.push({
        title: "Internship Opportunities",
        description:
          "With your current experience level, seek internships to gain practical exposure.",
      });
    }
  
    return recommendations;
  };
  