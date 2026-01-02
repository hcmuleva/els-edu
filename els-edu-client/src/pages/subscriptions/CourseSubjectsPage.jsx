import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Search,
  RotateCcw,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react";
import SubjectCard from "../../components/subjects/SubjectCard";
import { CustomSelect } from "../../components/common/CustomSelect";
import { subscriptionService } from "../../services/subscriptionService";
import Pagination from "../../components/common/Pagination";

const GRADE_OPTIONS = [
  { id: null, name: "All Grades" },
  { id: "PLAYSCHOOL", name: "Playschool" },
  { id: "LKG", name: "LKG" },
  { id: "UKG", name: "UKG" },
  { id: "FIRST", name: "First" },
  { id: "SECOND", name: "Second" },
  { id: "THIRD", name: "Third" },
  { id: "FOURTH", name: "Fourth" },
  { id: "FIFTH", name: "Fifth" },
  { id: "SIXTH", name: "Sixth" },
  { id: "SEVENTH", name: "Seventh" },
  { id: "EIGHTH", name: "Eighth" },
  { id: "NINTH", name: "Ninth" },
  { id: "TENTH", name: "Tenth" },
  { id: "ELEVENTH", name: "Eleventh" },
  { id: "TWELFTH", name: "Twelfth" },
];

const LEVEL_OPTIONS = [
  { id: null, name: "All Levels" },
  { id: 1, name: "Level 1" },
  { id: 2, name: "Level 2" },
  { id: 3, name: "Level 3" },
  { id: 4, name: "Level 4" },
  { id: 5, name: "Level 5" },
];

const CourseSubjectsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  const [subscription, setSubscription] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [error, setError] = useState(null);
  const [courseCounts, setCourseCounts] = useState({
    subjectCount: 0,
    topicCount: 0,
    quizCount: 0,
  });
  const [subjectBreakdown, setSubjectBreakdown] = useState({});

  // Pagination State
  const [subjectPage, setSubjectPage] = useState(1);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const subjectsPerPage = 10;

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setSubjectPage(1); // Reset to page 1 on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch subscription and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!identity?.documentId || !courseId) return;

      try {
        if (!subscription) {
          setInitialLoading(true);
        } else {
          setIsFetching(true);
        }
        setError(null);

        // 1. Get Subscription (First time or if needed)
        // We need this to get subscription.documentId for filtering subjects
        let currentSub = subscription;
        if (!currentSub) {
          currentSub = await subscriptionService.getSubscriptionByCourse(
            dataProvider,
            identity.documentId,
            courseId
          );
          if (!currentSub) {
            setError("Subscription not found");
            setInitialLoading(false);
            setIsFetching(false);
            return;
          }
          setSubscription(currentSub);
        }

        // 2. Fetch Subjects Paginated
        const { data: subjectsData, total } = await dataProvider.getList(
          "subjects",
          {
            pagination: { page: subjectPage, perPage: subjectsPerPage },
            sort: { field: "name", order: "ASC" },
            filter: {
              "filters[usersubscriptions][documentId][$eq]":
                currentSub.documentId,
              ...(debouncedSearchQuery && {
                "filters[name][$containsi]": debouncedSearchQuery,
              }),
              ...(selectedGrade && { "filters[grade][$eq]": selectedGrade }),
              ...(selectedLevel !== null && {
                "filters[level][$eq]": selectedLevel,
              }),
            },
            meta: {
              populate: {
                coverpage: { fields: ["url"] },
                topics: { fields: ["documentId"] },
              },
            },
          }
        );

        setSubjects(subjectsData);
        setFilteredSubjects(subjectsData);
        // setTotalSubjects(total || subjectsData.length); // Fallback if total undefined
        // We will set total subjects from courseCounts to be more accurate across pagination
      } catch (e) {
        console.error("Error fetching course subjects:", e);
        setError(e.message || "Failed to load course subjects");
      } finally {
        setInitialLoading(false);
        setIsFetching(false);
      }
    };

    // Helper to fetch counts
    const fetchCounts = async () => {
      if (!courseId) return;
      try {
        const counts = await subscriptionService.getCourseCounts(courseId);
        if (counts) {
          setCourseCounts({
            subjectCount: counts.subjectCount,
            topicCount: counts.topicCount,
            quizCount: counts.quizCount,
          });
          setTotalSubjects(counts.subjectCount);
          if (counts.breakdown) {
            setSubjectBreakdown(counts.breakdown);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course counts", err);
      }
    };

    if (!identityLoading) {
      fetchData();
      fetchCounts();
    }
  }, [
    dataProvider,
    identity?.documentId,
    courseId,
    identityLoading,
    subjectPage,
    debouncedSearchQuery,
    selectedGrade,
    selectedLevel,
  ]); // Added params to dependency tracking

  // Client-side filtering removed as we moved to server-side filtering in useEffect
  // kept logic structure if needed but effectively overridden by server fetch
  useEffect(() => {
    // Just sync filteredSubjects with subjects when they change (handled by fetch)
    setFilteredSubjects(subjects);
  }, [subjects]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGrade(null);
    setSelectedLevel(null);
  };

  const handleBack = () => {
    navigate("/my-subscriptions");
  };

  const hasActiveFilters =
    searchQuery || selectedGrade || selectedLevel !== null;

  if (identityLoading || initialLoading) {
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

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
              <GraduationCap className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error || "Course not found"}
            </h2>
            <p className="text-gray-500 mb-6">
              You may not have access to this course
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-violet-600 transition-all shadow-md"
            >
              Back to My Subscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const course = subscription.course;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title={course?.name || "Course Subjects"} />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Subscriptions
          </button>

          {/* Course Info Card */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            {/* Course Cover */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl overflow-hidden flex-shrink-0">
              {course?.cover?.url ? (
                <img
                  src={course.cover.url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary-300" />
                </div>
              )}
            </div>

            {/* Course Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {course?.name}
                </h1>
                {course?.category && (
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-xs font-semibold">
                    {course.category}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-gray-500 mt-1">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                  <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                  <span>{courseCounts.subjectCount} Subjects</span>
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  <span>{courseCounts.topicCount} Topics</span>
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{courseCounts.quizCount} Quizzes</span>
                </span>
                <div className="w-px h-4 bg-gray-200 self-center hidden sm:block" />
                <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{subscription.subscription_type || "FREE"} Plan</span>
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-2 text-sm rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center">
              <div className="w-48">
                <CustomSelect
                  value={selectedGrade}
                  onChange={setSelectedGrade}
                  options={GRADE_OPTIONS}
                  placeholder="Grade"
                />
              </div>

              <div className="w-48">
                <CustomSelect
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                  options={LEVEL_OPTIONS}
                  placeholder="Level"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors border border-gray-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Results Count */}
        {filteredSubjects.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {hasActiveFilters ? filteredSubjects.length : totalSubjects}
              </span>{" "}
              subject{totalSubjects !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Subjects Grid */}
        {isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 pointer-events-none">
            {/* Show skeleton or keep verified content dimmed */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white h-48 rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.documentId || subject.id}
                subject={subject}
                courseId={courseId}
                counts={
                  subjectBreakdown[subject.documentId || subject.id] || {
                    topicCount: 0,
                    quizCount: 0,
                  }
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No subjects found
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              {hasActiveFilters
                ? "Try adjusting your search or filters"
                : "This course has no subjects yet"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalSubjects > subjectsPerPage && (
        <Pagination
          currentPage={subjectPage}
          totalPages={Math.ceil(totalSubjects / subjectsPerPage)}
          onPageChange={setSubjectPage}
        />
      )}
    </div>
  );
};

export default CourseSubjectsPage;
