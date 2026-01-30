import { useState, useEffect } from "react";
import { mockUserProfile, mockTrendData, mockProfilesByVersion } from "../lib/mockData";
import {
  analyzeProfile,
  generateLearningRecommendations,
  generateCareerRecommendations,
} from "../lib/assessmentUtils";
import { generateCategoryDrillDown } from "../lib/drillDownUtils";
import { useSelfAssessment } from "../contexts/SelfAssessmentContext";
import CategoryScore from "./CategoryScore";
import TrendAnalysis from "./TrendAnalysis";
import CategoryDrillDown from "./CategoryDrillDown";
import SkillGapsDisplay from "./SkillGapsDisplay";
import QuizEligibility from "./QuizEligibility";
import RecommendationsPanel from "./RecommendationsPanel";

export function AssessmentEngine() {
  const { selfAssessmentResults } = useSelfAssessment();
  const [userProfile, setUserProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [learningRecs, setLearningRecs] = useState([]);
  const [careerRecs, setCareerRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [reportVersion, setReportVersion] = useState("v4"); // default to latest

  useEffect(() => {
    // Simulate API call - replace this with actual service call
    setIsLoading(true);

    setTimeout(() => {
      // Prioritize version selection - use mock data for v1-v4
      // Use self-assessment results only when "current" is selected
      let profile;
      if (reportVersion === "current" && selfAssessmentResults) {
        // Use self-assessment results when "current" is selected
        profile = selfAssessmentResults;
      } else if (mockProfilesByVersion[reportVersion]) {
        // Use versioned mock data when version is selected (v1-v4)
        profile = mockProfilesByVersion[reportVersion];
      } else if (selfAssessmentResults) {
        // Use self-assessment results as fallback if no version matches
        profile = selfAssessmentResults;
      } else {
        // Default to v4 mock data
        profile = mockUserProfile;
      }

      setUserProfile(profile);
      const assessmentAnalysis = analyzeProfile(profile);
      setAnalysis(assessmentAnalysis);
      setLearningRecs(generateLearningRecommendations(assessmentAnalysis));
      setCareerRecs(generateCareerRecommendations(profile, assessmentAnalysis));

      setIsLoading(false);
    }, 500);
  }, [reportVersion, selfAssessmentResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Analyzing your skills...
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile || !analysis) {
    return <div className="text-center py-12 text-red-600">Error loading assessment data</div>;
  }

  const handleCategoryClick = (category) => {
    const categoryScore = analysis.categoryScores[category];
    const categoryLevel = analysis.categoryLevels[category];
    const drillDown = generateCategoryDrillDown(
      userProfile,
      category,
      categoryScore,
      categoryLevel
    );
    setSelectedCategory(category);
    setDrillDownData(drillDown);
  };

  const handleCloseDrillDown = () => {
    setSelectedCategory(null);
    setDrillDownData(null);
  };

  return (
    <>
      {/* Drill-Down Modal */}
      {drillDownData && (
        <CategoryDrillDown
          drillDownData={drillDownData}
          onClose={handleCloseDrillDown}
          userProfile={userProfile}
        />
      )}
      
      <div className="max-w-6xl mx-auto space-y-8">

      {/* Professional Header with Company Branding */}
      <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-blue-600">
        {/* Company Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Emeelan Logo" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Emeelan</h2>
              <p className="text-sm text-gray-500">Experiential Learning System</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Assessment Report</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Report Title */}
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ELS Assessment Engine
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive Skills Evaluation & Learning Path
          </p>
        </div>

        {/* User Information */}
        <div className="flex items-center gap-4 text-sm bg-gray-50 rounded-lg p-4">
          <div className="flex-1">
            <span className="font-semibold text-gray-700">
              {userProfile.name || "User"}
            </span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-gray-600">
              {userProfile.background === "student" ? "Student" : "Professional"}
            </span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-gray-600">
              {userProfile.yearsOfExperience} years experience
            </span>
          </div>
        </div>

        {/* Report version selector */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">
            Report version:
          </span>
          {["v1", "v2", "v3", "v4"].map((v) => (
            <button
              key={v}
              onClick={() => setReportVersion(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                reportVersion === v
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
          {selfAssessmentResults && (
            <button
              onClick={() => setReportVersion("current")}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                reportVersion === "current"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Current
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Badge */}
      <div
        className={`rounded-lg p-6 text-center ${
          analysis.recommendation === "Foundation Program"
            ? "bg-blue-50 border-2 border-blue-300"
            : "bg-green-50 border-2 border-green-300"
        }`}
      >
        <h2 className="text-2xl font-bold mb-2">
          {analysis.recommendation === "Foundation Program"
            ? "📚 Foundation Program Recommended"
            : "✅ Ready for Assessment Quizzes"}
        </h2>
        <p className="text-gray-700">
          {analysis.recommendation === "Foundation Program"
            ? "Build strong foundational knowledge before pursuing specializations."
            : "You have demonstrated sufficient proficiency to begin assessment quizzes."}
        </p>
      </div>

      {/* Category Scores */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Category Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(analysis.categoryScores).map(([category, score]) => (
            <CategoryScore
              key={category}
              category={category}
              score={score}
              level={analysis.categoryLevels[category]}
              onClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>
      </div>

      {/* Trend Analysis over time */}
      <TrendAnalysis trendData={mockTrendData} />

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <h3 className="text-xl font-bold text-green-700 mb-2">
            💪 Strongest Category
          </h3>
          <p className="text-gray-600 capitalize">
            <span className="font-semibold text-lg text-green-700">
              {analysis.strongest.category}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Score: {analysis.strongest.score.toFixed(1)}/10 •{" "}
            {analysis.strongest.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
          <h3 className="text-xl font-bold text-orange-700 mb-2">
            📈 Needs Improvement
          </h3>
          <p className="text-gray-600 capitalize">
            <span className="font-semibold text-lg text-orange-700">
              {analysis.weakest.category}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Score: {analysis.weakest.score.toFixed(1)}/10 •{" "}
            {analysis.weakest.level}
          </p>
        </div>
      </div>

      {/* Skill Gaps */}
      <SkillGapsDisplay skillGaps={analysis.skillGaps} />

      {/* Quiz Eligibility */}
      <QuizEligibility
        quizEligibility={analysis.quizEligibility}
        categoryScores={analysis.categoryScores}
      />

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationsPanel
          title="📚 Learning Recommendations"
          recommendations={learningRecs}
          type="learning"
        />
        <RecommendationsPanel
          title="🎯 Career Path Suggestions"
          recommendations={careerRecs}
          type="career"
        />
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Assessment Summary</h3>
          <div className="flex items-center gap-2 opacity-90">
            <img 
              src="/logo.png" 
              alt="Emeelan Logo" 
              className="h-8 w-auto object-contain bg-white/10 p-1 rounded"
            />
            <span className="text-sm font-semibold">Emeelan</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {(
                (Object.values(analysis.categoryScores).reduce((a, b) => a + b) /
                  Object.keys(analysis.categoryScores).length) * 10
              ).toFixed(0)}
              %
            </p>
            <p className="text-blue-100 text-sm mt-1">Overall Proficiency</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {Object.values(analysis.quizEligibility).filter(Boolean).length}
            </p>
            <p className="text-blue-100 text-sm mt-1">
              Quiz{" "}
              {Object.values(analysis.quizEligibility).filter(Boolean).length ===
              1
                ? "Available"
                : "Options"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {Object.values(analysis.skillGaps).flat().length}
            </p>
            <p className="text-blue-100 text-sm mt-1">Skill Gaps Found</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{Object.keys(analysis.categoryScores).length}</p>
            <p className="text-blue-100 text-sm mt-1">Categories</p>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Emeelan Logo" 
              className="h-8 w-auto object-contain opacity-80"
            />
            <div>
              <p className="text-sm font-semibold text-gray-700">Emeelan</p>
              <p className="text-xs text-gray-500">Experiential Learning System</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Confidential Assessment Report</p>
            <p className="mt-1">Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

