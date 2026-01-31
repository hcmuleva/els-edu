import React, { useState, useEffect, useCallback } from "react";
import { Title, useGetIdentity, useNotify } from "react-admin";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Brain, AlertCircle } from "lucide-react";
import * as analyticsService from "../../services/analyticsService";
import mongoService from "../../services/mongoService";
import ProfessionalQuizPlayer from "../../components/quiz/ProfessionalQuizPlayer";

const QUIZ_TIME_LIMIT = 30 * 60; // 30 minutes in seconds
const QUESTIONS_PER_SKILL = 5; // Number of questions per skill

const SkillQuizPage = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();

  // Get survey data from navigation state
  const surveyData = location.state?.surveyData;
  const surveyId = location.state?.surveyId;

  // States
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [skillTopicMap, setSkillTopicMap] = useState({});
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check for existing skill quiz on mount
  useEffect(() => {
    const checkExisting = async () => {
      if (!identity?.documentId) return;
      try {
        const quizzes = await mongoService.getUserQuizzes({
          userDocumentId: identity.documentId,
        });

        const skillQuiz = quizzes.find((q) => q.type === "SKILL" || !q.type);

        if (skillQuiz) {
          notify("You have already completed the assessment.", {
            type: "info",
          });
          navigate("/analytics", { replace: true });
        }
      } catch (error) {
        console.error("Error checking existing quiz:", error);
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExisting();
  }, [identity, navigate, notify]);

  // Fetch quiz questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!surveyData?.skills?.length) {
        notify("No survey data found. Please complete self-assessment first.", {
          type: "warning",
        });
        navigate("/analytics/survey");
        return;
      }

      if (checkingExisting) return;

      setLoading(true);
      try {
        const skillNames = surveyData.skills.map((s) => s.skillName);
        const topicsData = await analyticsService.getQuizTopics(skillNames);
        const { skills: skillsWithTopics, topics } = topicsData || {};

        if (!topics || topics.length === 0) {
          notify("No topics found for selected skills.", { type: "info" });
          setQuestions([]);
          setLoading(false);
          return;
        }

        // Build skill-topic map
        const stMap = {};
        skillsWithTopics?.forEach((skill) => {
          skill.topicDocumentIds?.forEach((topicId) => {
            stMap[topicId] = skill.name;
          });
        });
        setSkillTopicMap(stMap);

        // Calculate average skill level from self-ratings
        const avgLevel = Math.round(
          surveyData.skills.reduce((sum, s) => sum + (s.selfRating || 3), 0) /
            surveyData.skills.length,
        );

        // Get questions for topics with adaptive level
        const topicIds = topics.map((t) => t.documentId);
        const questionsData = await analyticsService.getQuizQuestions(
          topicIds,
          QUESTIONS_PER_SKILL,
          avgLevel,
        );

        const shuffled = (questionsData?.questions || []).sort(
          () => Math.random() - 0.5,
        );
        setQuestions(shuffled);
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
        notify("Failed to load quiz questions", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [surveyData, navigate, notify, checkingExisting]);

  // Handle quiz submission
  const handleQuizSubmit = useCallback(
    async (result) => {
      const { answerData, score } = result;

      // Calculate skill breakdown
      const skillStats = {};
      answerData.forEach((ans) => {
        const skill = ans.skillName;
        if (!skillStats[skill]) {
          skillStats[skill] = {
            skillName: skill,
            correctAnswers: 0,
            questionsAttempted: 0,
          };
        }
        skillStats[skill].questionsAttempted++;
        if (ans.isCorrect) skillStats[skill].correctAnswers++;
      });

      const skillResults = Object.values(skillStats).map((s) => {
        const p =
          s.questionsAttempted > 0
            ? Math.round((s.correctAnswers / s.questionsAttempted) * 100)
            : 0;
        let level = 1;
        if (p >= 80) level = 5;
        else if (p >= 60) level = 4;
        else if (p >= 40) level = 3;
        else if (p >= 20) level = 2;

        return {
          ...s,
          percentage: p,
          actualLevel: level,
        };
      });

      const resultPayload = {
        userDocumentId: identity?.documentId,
        type: "SKILL",
        surveyId,
        company: surveyData?.company,
        role: surveyData?.role,
        domain: surveyData?.domain,
        surveyType: surveyData?.surveyType,
        questionDetails: answerData,
        totalQuestions: score.total,
        totalCorrect: score.correct,
        overallPercentage: score.percentage,
        skillResults,
      };

      const savedResult = await mongoService.createUserQuiz(resultPayload);
      notify("Quiz completed!", { type: "success" });

      return {
        ...savedResult,
        summary: {
          totalQuestions: score.total,
          totalCorrect: score.correct,
          overallPercentage: score.percentage,
          skillResults,
        },
      };
    },
    [identity, surveyId, surveyData, notify],
  );

  // Handle exit
  const handleExit = () => {
    navigate("/analytics");
  };

  // Loading state
  if (loading || checkingExisting) {
    return (
      <div className="-mx-4 -my-2 md:-mx-8 md:-my-6">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-lg font-medium">Loading skill quiz...</p>
            <p className="text-sm text-gray-400 mt-2">
              Preparing {surveyData?.skills?.length || 0} skills
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="-mx-4 -my-2 md:-mx-8 md:-my-6">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Questions Available
            </h2>
            <p className="text-gray-600 mb-6">
              No questions found for your selected skills. Please ensure topics
              have questions linked.
            </p>
            <button
              onClick={() => navigate("/analytics")}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Back to Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render quiz player
  return (
    <div className="-mx-4 -my-2 md:-mx-8 md:-my-6">
      <Title title="Skill Assessment Quiz" />
      <ProfessionalQuizPlayer
        questions={questions}
        timeLimit={QUIZ_TIME_LIMIT}
        onSubmit={handleQuizSubmit}
        onExit={handleExit}
        skillTopicMap={skillTopicMap}
        surveyData={surveyData}
        quizTitle="Skill Assessment Quiz"
      />
    </div>
  );
};

export default SkillQuizPage;
