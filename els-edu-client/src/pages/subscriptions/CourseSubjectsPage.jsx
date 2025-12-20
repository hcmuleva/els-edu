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
} from "lucide-react";
import SubjectCard from "../../components/subjects/SubjectCard";
import { CustomSelect } from "../../components/common/CustomSelect";
import { subscriptionService } from "../../services/subscriptionService";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  // Fetch subscription and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!identity?.documentId || !courseId) return;

      try {
        setLoading(true);
        setError(null);

        const sub = await subscriptionService.getSubscriptionByCourse(
          dataProvider,
          identity.documentId,
          courseId
        );

        if (!sub) {
          setError("Subscription not found");
          setLoading(false);
          return;
        }

        setSubscription(sub);

        // Get subjects from subscription (populated with course subjects)
        const subjectList = sub.subjects || sub.course?.subjects || [];
        setSubjects(subjectList);
        setFilteredSubjects(subjectList);
      } catch (e) {
        console.error("Error fetching course subjects:", e);
        setError(e.message || "Failed to load course subjects");
      } finally {
        setLoading(false);
      }
    };

    if (!identityLoading) {
      fetchData();
    }
  }, [dataProvider, identity?.documentId, courseId, identityLoading]);

  // Apply filters
  useEffect(() => {
    let filtered = subjects;

    if (searchQuery) {
      filtered = filtered.filter((subject) =>
        subject.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((subject) => subject.grade === selectedGrade);
    }

    if (selectedLevel !== null) {
      filtered = filtered.filter((subject) => subject.level === selectedLevel);
    }

    setFilteredSubjects(filtered);
  }, [searchQuery, selectedGrade, selectedLevel, subjects]);

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

  if (identityLoading || loading) {
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

  if (error || !subscription) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-border/50">
          <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {error || "Course not found"}
          </h2>
          <p className="text-gray-500 mb-4">
            You may not have access to this course
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:shadow-lg transition-all"
          >
            Back to My Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const course = subscription.course;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Title title={course?.name || "Course Subjects"} />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-primary font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Subscriptions
      </button>

      {/* Course Header */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-center p-6 gap-6">
          {/* Course Cover */}
          <div className="w-full md:w-48 h-32 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
            {course?.cover?.url ? (
              <img
                src={course.cover.url}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
              <h1 className="text-2xl font-black text-gray-800">
                {course?.name}
              </h1>
              {course?.category && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                  {course.category}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> {subjects.length} Subjects
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />{" "}
                {subscription.subscription_type || "FREE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
        {/* Filters Section */}
        <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            {/* Grade Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedGrade}
                onChange={setSelectedGrade}
                options={GRADE_OPTIONS}
                placeholder="All Grades"
              />
            </div>

            {/* Level Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedLevel}
                onChange={setSelectedLevel}
                options={LEVEL_OPTIONS}
                placeholder="All Levels"
              />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {filteredSubjects.length > 0 && (
          <div className="px-6 pt-6 pb-2">
            <p className="text-sm font-semibold text-gray-500">
              Showing {filteredSubjects.length} subject
              {filteredSubjects.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="p-6 min-h-[400px]">
          {filteredSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject.documentId || subject.id}
                  subject={subject}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                No subjects found
              </h3>
              <p className="text-gray-500 font-medium">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "This course has no subjects yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSubjectsPage;
