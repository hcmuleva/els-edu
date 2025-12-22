import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  FileText,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import TopicContentPlayer from "../../components/subjects/TopicContentPlayer";
import QuizCard from "../../components/quiz/QuizCard";

const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const { data: identity } = useGetIdentity();
  const topicScrollRef = useRef(null);

  const [subject, setSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topicLoading, setTopicLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("topics");
  const [topicSearchQuery, setTopicSearchQuery] = useState("");

  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [quizzesLoaded, setQuizzesLoaded] = useState(false);

  // Scroll indicators
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Fetch Subject
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await dataProvider.getOne("subjects", {
          id,
          meta: {
            populate: {
              topics: {
                fields: ["name", "description", "icon", "documentId", "id"],
              },
              contents: { fields: ["title", "documentId", "id"] },
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
        if (data.topics && data.topics.length > 0) {
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

  // Lazy Load Topic Details with smooth transition
  useEffect(() => {
    const fetchTopicDetails = async () => {
      if (!selectedTopic || selectedTopic.loaded) return;

      try {
        setTopicLoading(true);
        const topicId = selectedTopic.documentId || selectedTopic.id;
        const { data } = await dataProvider.getOne("topics", {
          id: topicId,
          meta: {
            populate: {
              contents: { populate: ["multimedia", "quizzes"] },
              quizzes: { populate: ["questions"] },
            },
          },
        });

        // Smooth update without screen jump
        setTimeout(() => {
          setSelectedTopic((prev) => ({ ...data, loaded: true }));
          setSubject((prev) => ({
            ...prev,
            topics: prev.topics.map((t) =>
              t.id === data.id ? { ...data, loaded: true } : t
            ),
          }));
          setTopicLoading(false);
        }, 300);
      } catch (err) {
        console.error("Error fetching topic details:", err);
        setTopicLoading(false);
      }
    };

    if (selectedTopic && !selectedTopic.loaded) {
      fetchTopicDetails();
    }
  }, [selectedTopic, dataProvider]);

  // Lazy Load Quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (
        quizzesLoaded ||
        quizzesLoading ||
        activeTab !== "quizzes" ||
        !subject?.id
      )
        return;

      try {
        setQuizzesLoading(true);
        const { data } = await dataProvider.getList("quizzes", {
          filter: { subject: subject.id },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "title", order: "ASC" },
          meta: {
            populate: {
              questions: { fields: ["id", "documentId"] },
            },
          },
        });
        setQuizzes(data || []);

        if (identity?.id && data?.length > 0) {
          try {
            const { data: results } = await dataProvider.getList(
              "quiz-results",
              {
                filter: { user: identity.id },
                pagination: { page: 1, perPage: 500 },
                meta: { populate: { quiz: { fields: ["id", "documentId"] } } },
              }
            );
            const attemptsByQuiz = {};
            results?.forEach((result) => {
              const quizId = result.quiz?.id || result.quiz?.documentId;
              if (quizId) {
                attemptsByQuiz[quizId] = (attemptsByQuiz[quizId] || 0) + 1;
              }
            });
            setQuizAttempts(attemptsByQuiz);
          } catch (e) {
            console.error("Error fetching quiz attempts:", e);
          }
        }

        setQuizzesLoaded(true);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setQuizzesLoaded(true);
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [
    activeTab,
    subject?.id,
    quizzesLoaded,
    quizzesLoading,
    dataProvider,
    identity?.id,
  ]);

  // Update scroll indicators
  const updateScrollIndicators = () => {
    if (topicScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = topicScrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollIndicators();
    const scrollEl = topicScrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", updateScrollIndicators);
      window.addEventListener("resize", updateScrollIndicators);
      return () => {
        scrollEl.removeEventListener("scroll", updateScrollIndicators);
        window.removeEventListener("resize", updateScrollIndicators);
      };
    }
  }, [subject?.topics]);

  const scrollTopics = (direction) => {
    if (topicScrollRef.current) {
      const scrollAmount = 200;
      topicScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleQuizStart = (quiz) => {
    const quizId = quiz.documentId || quiz.id;
    navigate(`/quiz/${quizId}/play`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/browse-subjects");
    }
  };

  // Filter topics by search
  const filteredTopics =
    subject?.topics?.filter((topic) =>
      topic.name?.toLowerCase().includes(topicSearchQuery.toLowerCase())
    ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {error || "Subject not found"}
            </h2>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-violet-600 transition-all shadow-md"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topicCount = subject.topics?.length || 0;
  const contentCount = subject.contents?.length || 0;
  const quizCount = quizzes.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title={subject.name} />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Subject Info */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Cover Image */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl overflow-hidden flex-shrink-0">
              {subject.coverpage?.url ? (
                <img
                  src={subject.coverpage.url}
                  alt={subject.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary-300" />
                </div>
              )}
            </div>

            {/* Subject Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {subject.name}
                </h1>
                {subject.grade && (
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-xs font-semibold">
                    {subject.grade.replace("_", " ")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span className="font-medium">{topicCount} Topics</span>
                </span>
                <div className="w-1 h-1 rounded-full bg-gray-200 self-center" />
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{contentCount} Content</span>
                </span>
                <div className="w-1 h-1 rounded-full bg-gray-200 self-center" />
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">{quizCount} Quizzes</span>
                </span>
              </div>

              {/* Level Indicator */}
              {subject.level && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-semibold text-gray-400">
                    LEVEL
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-1.5 rounded-full ${
                          i < subject.level
                            ? "bg-gradient-to-r from-primary-500 to-violet-500"
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
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex items-center gap-2 p-6 pb-4 border-b border-gray-100">
            {[
              { id: "topics", label: "Topic & Contents", icon: Layers },
              { id: "quizzes", label: "Quizzes", icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl text-sm transition-all ${
                    activeTab === tab.id
                      ? "bg-primary-500 text-white shadow-md shadow-primary-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            {activeTab === "topics" && (
              <div className="space-y-6">
                {topicCount > 0 ? (
                  <>
                    {/* Topic Search */}
                    <div className="relative max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search topics..."
                        value={topicSearchQuery}
                        onChange={(e) => setTopicSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-10 py-2 text-sm rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                      />
                      {topicSearchQuery && (
                        <button
                          onClick={() => setTopicSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Topic Selector with Scroll Arrows */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Select Topic ({filteredTopics.length})
                      </h3>
                      <div className="relative">
                        {/* Left Arrow */}
                        {showLeftArrow && (
                          <button
                            onClick={() => scrollTopics("left")}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                        )}

                        {/* Topics List */}
                        <div
                          ref={topicScrollRef}
                          className="flex gap-3 overflow-x-auto pb-4 px-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                          {filteredTopics.map((topic) => (
                            <button
                              key={topic.id}
                              onClick={() => setSelectedTopic(topic)}
                              className={`flex-none px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                                selectedTopic?.id === topic.id
                                  ? "bg-gradient-to-r from-primary-500 to-violet-500 text-white shadow-md shadow-primary-200"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              {topic.name}
                            </button>
                          ))}
                        </div>

                        {/* Right Arrow */}
                        {showRightArrow && (
                          <button
                            onClick={() => scrollTopics("right")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Topic Content with Skeleton Loading */}
                    {selectedTopic && (
                      <div className="transition-opacity duration-300">
                        {topicLoading ? (
                          // Skeleton Loader
                          <div className="space-y-4 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                            <div className="h-64 bg-gray-200 rounded-2xl" />
                          </div>
                        ) : (
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TopicContentPlayer
                              topic={selectedTopic}
                              onQuizStart={handleQuizStart}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
                      <Layers className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No topics available yet
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      Topics will appear here once they are added
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 rounded-2xl h-64 animate-pulse"
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
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No quizzes available yet
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      Quizzes will appear here once they are added
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailPage;
