import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  FileText,
  PlayCircle,
} from "lucide-react";
import TopicAccordion from "../../components/subjects/TopicAccordion";
import TopicContentPlayer from "../../components/subjects/TopicContentPlayer";
import QuizCard from "../../components/quiz/QuizCard";

const SubjectDetailPage = () => {
  const { id } = useParams(); // This could be documentId or id
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const { data: identity } = useGetIdentity();

  const [subject, setSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("topics");

  // Separate quizzes state for lazy loading
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState({}); // Map of quizId -> attempts used
  const [quizzesLoaded, setQuizzesLoaded] = useState(false);

  // Fetch Subject Metadata Only (Optimization - no quizzes)
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch Subject with light population - NO QUIZZES
        const { data } = await dataProvider.getOne("subjects", {
          id,
          meta: {
            populate: {
              topics: {
                fields: ["name", "description", "icon", "documentId", "id"],
              },
              contents: {
                fields: ["title", "documentId", "id"], // Fetch for count display
              },
              coverpage: {
                fields: [
                  "url",
                  "alternativeText",
                  "name",
                  "caption",
                  "documentId",
                  "id",
                ],
              },
            },
          },
        });
        setSubject(data);

        // Default to first topic if available
        if (data.topics && data.topics.length > 0) {
          // Temporarily set partial topic, the effect below will fetch full details
          setSelectedTopic(data.topics[0]);
        }
      } catch (error) {
        console.error("Error fetching subject:", error);
        setError(error.message || "Failed to load subject");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id, dataProvider]);

  // Lazy Load Selected Topic Details
  useEffect(() => {
    const fetchTopicDetails = async () => {
      if (!selectedTopic || selectedTopic.loaded) return; // Skip if already loaded

      try {
        const topicId = selectedTopic.documentId || selectedTopic.id;
        const { data } = await dataProvider.getOne("topics", {
          id: topicId,
          meta: {
            populate: {
              contents: {
                populate: ["multimedia", "quizzes"], // Get content-specific quizzes
              },
              quizzes: {
                populate: ["questions"], // Get topic-level quizzes
              },
            },
          },
        });

        // Update the selected topic with full data and mark as loaded
        setSelectedTopic((prev) => ({ ...data, loaded: true }));

        // Also update the subject state to cache this data (optional but good for switching back)
        setSubject((prev) => ({
          ...prev,
          topics: prev.topics.map((t) =>
            t.id === data.id ? { ...data, loaded: true } : t
          ),
        }));
      } catch (err) {
        console.error("Error fetching topic details:", err);
      }
    };

    if (selectedTopic && !selectedTopic.loaded) {
      fetchTopicDetails();
    }
  }, [selectedTopic, dataProvider]);

  // Lazy Load Quizzes when tab is clicked
  useEffect(() => {
    const fetchQuizzes = async () => {
      // Need subject to be loaded to get numeric id for filter
      if (
        quizzesLoaded ||
        quizzesLoading ||
        activeTab !== "quizzes" ||
        !subject?.id
      )
        return;

      try {
        setQuizzesLoading(true);
        // Filter quizzes by subject using NUMERIC id (not documentId)
        const { data } = await dataProvider.getList("quizzes", {
          filter: { subject: subject.id }, // Use numeric id
          pagination: { page: 1, perPage: 100 },
          sort: { field: "title", order: "ASC" },
          meta: {
            populate: {
              questions: {
                fields: ["id", "documentId"], // Only IDs for count
              },
            },
          },
        });
        console.log("Quizzes fetched:", data);
        setQuizzes(data || []);

        // Fetch user's quiz attempts for these quizzes
        if (identity?.id && data?.length > 0) {
          try {
            const { data: results } = await dataProvider.getList(
              "quiz-results",
              {
                filter: { user: identity.id },
                pagination: { page: 1, perPage: 500 },
                meta: {
                  populate: { quiz: { fields: ["id", "documentId"] } },
                },
              }
            );
            // Count attempts per quiz
            const attemptsByQuiz = {};
            results?.forEach((result) => {
              const quizId = result.quiz?.id || result.quiz?.documentId;
              if (quizId) {
                attemptsByQuiz[quizId] = (attemptsByQuiz[quizId] || 0) + 1;
              }
            });
            setQuizAttempts(attemptsByQuiz);
            console.log("Quiz attempts:", attemptsByQuiz);
          } catch (e) {
            console.error("Error fetching quiz attempts:", e);
          }
        }

        setQuizzesLoaded(true);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setQuizzesLoaded(true); // Prevent infinite retry
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [activeTab, subject?.id, quizzesLoaded, quizzesLoading, dataProvider]);

  const handleQuizStart = (quiz) => {
    const quizId = quiz.documentId || quiz.id;
    navigate(`/quiz/${quizId}/play`);
  };

  const handleBack = () => {
    // Use browser history to go back to previous page
    // This allows returning to either /browse-subjects or /my-subscriptions
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/browse-subjects");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-3xl" />
          <div className="h-96 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-border/50">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {error || "Subject not found"}
          </h2>
          <button
            onClick={handleBack}
            className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const topicCount = subject.topics?.length || 0;
  const contentCount = subject.contents?.length || 0;
  const quizCount = quizzes.length; // Use lazy loaded quizzes

  return (
    <div className="p-6 space-y-6">
      <Title title={subject.name} />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-primary font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Subject Header (Compact) */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-center p-6 gap-6">
          {/* Cover Image - Smaller */}
          <div className="w-full md:w-48 h-32 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
            {subject.coverpage?.url ? (
              <img
                src={subject.coverpage.url}
                alt={subject.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Subject Info - Compact */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
              <h1 className="text-2xl font-black text-gray-800">
                {subject.name}
              </h1>
              {subject.grade && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                  {subject.grade.replace("_", " ")}
                </span>
              )}
            </div>

            {/* Stats - Horizontal */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> {topicCount} Topics
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {contentCount} Content
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> {quizCount} Quizzes
              </span>
            </div>

            {/* Level Indicator - Mini */}
            {subject.level && (
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Level
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-1.5 rounded-full ${
                        i < subject.level
                          ? "bg-gradient-to-r from-primary to-secondary"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 p-6 pb-4 border-b border-border/50">
          {[
            { id: "topics", label: "Topic & Contents", icon: Layers },
            { id: "quizzes", label: "Quizzes", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-bold rounded-xl text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-50 text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px]">
          {activeTab === "topics" && (
            <div className="space-y-8">
              {topicCount > 0 ? (
                <>
                  {/* Topic Selector */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-gray-400" />
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                        Select Topic
                      </h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {subject.topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`flex-none px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                            selectedTopic?.id === topic.id
                              ? "bg-gray-900 text-white shadow-lg scale-105"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Content Player */}
                  {selectedTopic && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <TopicContentPlayer
                        topic={selectedTopic}
                        onQuizStart={handleQuizStart}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No topics available yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "quizzes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzesLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-3xl h-48 animate-pulse"
                  />
                ))
              ) : quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.documentId || quiz.id}
                    quiz={quiz}
                    questionCount={quiz.questions?.length || 0}
                    attemptsUsed={
                      quizAttempts[quiz.id] ||
                      quizAttempts[quiz.documentId] ||
                      0
                    }
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No quizzes available yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailPage;
