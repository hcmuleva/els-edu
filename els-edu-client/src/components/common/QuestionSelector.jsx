import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useInfiniteGetList,
  useGetIdentity,
  useSidebarState,
} from "react-admin";
import {
  X,
  Search,
  Check,
  RotateCcw,
  User,
  Globe,
  BookOpen,
} from "lucide-react";
import { CustomAsyncSelect } from "./CustomAsyncSelect";
import { CustomSelect } from "./CustomSelect";

export const QuestionSelector = ({
  open,
  onClose,
  onSelectQuestions,
  selectedIds = [],
}) => {
  const { data: identity } = useGetIdentity();
  const [sidebarOpen] = useSidebarState();

  const [localSelected, setLocalSelected] = useState(selectedIds);
  const [viewMode, setViewMode] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "all",
    questionType: "all",
    subject: null,
    topic: null,
  });

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false); // Guard to prevent multiple simultaneous fetches

  // Build filter object for the query
  const queryFilter = useMemo(() => {
    const filter = {};
    // Use 'q' for search - dataProvider handles it correctly for localized fields
    if (searchTerm) filter.q = searchTerm;
    if (filters.difficulty !== "all") filter.difficulty = filters.difficulty;
    if (filters.questionType !== "all")
      filter.questionType = filters.questionType;
    // Filter by subject documentId if selected
    if (filters.subject) filter["subjects.documentId[$in]"] = [filters.subject];
    // Filter by topic documentId if selected
    if (filters.topic) filter["topics.documentId[$in]"] = [filters.topic];
    if (viewMode === "my" && identity?.id) filter.creator = identity.id;
    return filter;
  }, [searchTerm, filters, viewMode, identity?.id]);

  // Use React Admin's useInfiniteGetList hook for infinite scrolling
  const {
    data,
    total,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteGetList(
    "questions",
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "createdAt", order: "DESC" },
      filter: queryFilter,
    },
    {
      enabled: open, // Only fetch when modal is open
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Update fetch guard when fetching state changes
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Flatten pages into a single array of questions
  const questions = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const resetFilters = () => {
    setFilters({
      difficulty: "all",
      questionType: "all",
      subject: null,
      topic: null,
    });
    setSearchTerm("");
    setLocalSelected([]); // Also reset selected questions
  };

  // Reset scroll position when filters change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchTerm, filters, viewMode]);

  // Infinite scroll observer - fetch next page when sentinel is visible
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      // Guard: Only fetch if intersecting, has more pages, and not already fetching
      if (target.isIntersecting && hasNextPage && !isFetchingRef.current) {
        isFetchingRef.current = true; // Set guard immediately
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !open) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      root: scrollContainerRef.current, // Observe within the scroll container
    });
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, open]);

  const handleToggle = (id) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedQuestions = questions.filter((q) =>
      localSelected.includes(q.id)
    );
    onSelectQuestions(selectedQuestions);
    onClose();
  };

  const getCorrectAnswer = (question) => {
    if (!question.options || !Array.isArray(question.options)) return null;
    const correct = question.options.filter((opt) => opt.isCorrect);
    if (correct.length === 0) return null;

    const text = correct[0].option || correct[0].text || "";
    if (correct.length > 1) return `${text} (+${correct.length - 1})`;
    return text;
  };

  if (!open) return null;

  const sidebarWidthClass = sidebarOpen ? "left-64" : "left-20";

  return (
    <div
      className={`fixed inset-y-0 right-0 z-[50] flex items-center justify-center p-6 duration-300 transition-all ${sidebarWidthClass}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-white/20 relative z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-white z-10 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Select Questions
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Add questions to your quiz{" "}
                {total > 0 && (
                  <span className="text-primary font-bold">
                    • {total} found
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-fit mb-6">
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "all"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" />
              All Questions
            </button>
            <button
              onClick={() => setViewMode("my")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "my"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              My Questions
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50/50 focus:bg-white h-[42px]"
              />
            </div>
            <div className="col-span-2">
              <CustomAsyncSelect
                resource="subjects"
                optionText="name"
                value={filters.subject}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, subject: val }))
                }
                placeholder="Filter by Subject"
                className="w-full"
                allowEmpty
              />
            </div>
            <div className="col-span-2">
              <CustomAsyncSelect
                resource="topics"
                optionText="name"
                value={filters.topic}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, topic: val }))
                }
                placeholder="Filter by Topic"
                className="w-full"
                allowEmpty
              />
            </div>
            <div className="col-span-2">
              <CustomSelect
                value={filters.difficulty}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, difficulty: val }))
                }
                options={[
                  { id: "all", name: "Any Difficulty" },
                  { id: "easy", name: "Easy" },
                  { id: "medium", name: "Medium" },
                  { id: "hard", name: "Hard" },
                ]}
                placeholder="Difficulty"
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <CustomSelect
                value={filters.questionType}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, questionType: val }))
                }
                options={[
                  { id: "all", name: "Any Type" },
                  { id: "SC", name: "Single Choice" },
                  { id: "MCQ", name: "Multiple Choice" },
                  { id: "TF", name: "True/False" },
                ]}
                placeholder="Type"
                className="w-full"
              />
            </div>
            <div className="col-span-1">
              <button
                onClick={resetFilters}
                title="Reset Filters"
                className="w-full h-[42px] flex items-center justify-center rounded-xl border border-border/50 hover:bg-gray-50 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50/50 p-6"
        >
          {isPending && questions.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {/* Skeleton loading cards */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-3/4" />
                        <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                      </div>
                      <div className="flex gap-3">
                        <div className="h-6 w-16 bg-gray-100 rounded-md" />
                        <div className="h-6 w-20 bg-gray-100 rounded-md" />
                        <div className="h-6 w-24 bg-gray-100 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-bold">No questions found</p>
              <p className="text-sm">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => {
                const isSelected = localSelected.includes(question.id);
                const correctAnswer = getCorrectAnswer(question);

                return (
                  <div
                    key={question.id}
                    onClick={() => handleToggle(question.id)}
                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white ${
                      isSelected
                        ? "border-primary shadow-sm shadow-primary/10"
                        : "border-transparent hover:border-primary/30 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-gray-200 group-hover:border-primary/50"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="font-bold text-foreground line-clamp-2 text-base">
                            {question.questionText || "Untitled Question"}
                          </p>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                              question.difficulty === "easy"
                                ? "bg-green-100 text-green-700"
                                : question.difficulty === "hard"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {question.difficulty || "Medium"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {question.questionType || "SC"}
                          </span>

                          {question.points && (
                            <span className="font-medium text-gray-600">
                              {question.points} pts
                            </span>
                          )}

                          {question.topics && question.topics.length > 0 && (
                            <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                              <BookOpen className="w-3 h-3 text-purple-500" />
                              <span
                                className="truncate max-w-[150px]"
                                title={question.topics
                                  .map((t) => t.name)
                                  .join(", ")}
                              >
                                {question.topics[0].name}
                                {question.topics.length > 1 &&
                                  ` +${question.topics.length - 1}`}
                              </span>
                            </span>
                          )}

                          {question.creator?.username && (
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[100px] text-xs">
                                {question.creator.username}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />

              {/* Loading indicator */}
              {isFetchingNextPage && (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce" />
                  </div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Loading more questions...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasNextPage && questions.length > 0 && (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                  — End of list —
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-white flex items-center justify-between z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {localSelected.length}
            </span>
            questions selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border-2 border-border/50 font-bold text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelected.length === 0}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Add Selected Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
