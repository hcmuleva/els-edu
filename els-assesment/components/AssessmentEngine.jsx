'use client';

import { useState, useEffect } from "react";
import { mockUserProfile } from "@/lib/mockData";
import {
  analyzeProfile,
  generateLearningRecommendations,
  generateCareerRecommendations,
} from "@/lib/assessmentUtils";
import CategoryScore from "./CategoryScore";
import SkillGapsDisplay from "./SkillGapsDisplay";
import QuizEligibility from "./QuizEligibility";
import RecommendationsPanel from "./RecommendationsPanel";

export function AssessmentEngine() {
  const [userProfile, setUserProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [learningRecs, setLearningRecs] = useState([]);
  const [careerRecs, setCareerRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - replace this with actual service call
    setTimeout(() => {
      setUserProfile(mockUserProfile);
      const assessmentAnalysis = analyzeProfile(mockUserProfile);
      setAnalysis(assessmentAnalysis);
      setLearningRecs(
        generateLearningRecommendations(assessmentAnalysis)
      );
      setCareerRecs(
        generateCareerRecommendations(mockUserProfile, assessmentAnalysis)
      );
      setIsLoading(false);
    }, 1000);
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ELS Assessment Engine
        </h1>
        <p className="text-gray-600 text-lg mb-4">
          Comprehensive Skills Evaluation & Learning Path
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-700">
            {userProfile.name || "User"}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">
            {userProfile.background === "student" ? "Student" : "Professional"}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">
            {userProfile.yearsOfExperience} years experience
          </span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(analysis.categoryScores).map(([category, score]) => (
            <CategoryScore
              key={category}
              category={category}
              score={score}
              level={analysis.categoryLevels[category]}
            />
          ))}
        </div>
      </div>

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
        <h3 className="text-2xl font-bold mb-4">Assessment Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {(
                (Object.values(analysis.categoryScores).reduce((a, b) => a + b) /
                  3) * 10
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
            <p className="text-3xl font-bold">3</p>
            <p className="text-blue-100 text-sm mt-1">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
