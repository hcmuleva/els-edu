import React, { useState, useEffect, useMemo } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { GraduationCap, Search, RotateCcw } from "lucide-react";
import BrowseCourseCard from "../../components/courses/BrowseCourseCard";
import CourseDetailsDrawer from "../../components/courses/CourseDetailsDrawer";
import EnrollModal from "../../components/courses/EnrollModal";
import SuccessModal from "../../components/courses/SuccessModal";
import { CustomSelect } from "../../components/common/CustomSelect";
import { subscriptionService } from "../../services/subscriptionService";

const CATEGORY_OPTIONS = [
  { id: null, name: "All Categories" },
  { id: "KIDS", name: "Kids" },
  { id: "PRIMARY", name: "Primary" },
  { id: "MIDDLE", name: "Middle" },
  { id: "SCHOOL", name: "School" },
  { id: "COLLEGE", name: "College" },
  { id: "SANSKAR", name: "Sanskar" },
  { id: "PROJECT", name: "Project" },
  { id: "DIY", name: "DIY" },
  { id: "EDUCATION", name: "Education" },
];

const BrowseCoursesPage = () => {
  const dataProvider = useDataProvider();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  // State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // User subscriptions state
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Map());
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());

  // Modal/Drawer state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [enrollingSubject, setEnrollingSubject] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [enrolledItem, setEnrolledItem] = useState({
    course: null,
    subject: null,
  });

  // Fetch courses and course-pricings
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const { data: coursesData } = await dataProvider.getList("courses", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "name", order: "ASC" },
          filter: {},
          meta: {
            populate: {
              cover: {
                fields: ["url", "name"],
              },
              subjects: {
                populate: ["topics", "coverpage"],
              },
            },
          },
        });

        // Fetch course-pricings
        const { data: pricingsData } = await dataProvider.getList(
          "course-pricings",
          {
            pagination: { page: 1, perPage: 10 },
            filter: {},
            meta: {
              populate: {
                course: {
                  fields: ["documentId", "id"],
                },
                subject_pricings: {
                  populate: ["subject"],
                },
              },
            },
          }
        );

        // Create a map of course documentId -> pricing
        const pricingMap = {};
        pricingsData.forEach((pricing) => {
          if (pricing.course?.documentId) {
            pricingMap[pricing.course.documentId] = pricing;
          }
        });

        // Merge pricing info into courses
        const coursesWithPricing = coursesData.map((course) => ({
          ...course,
          coursePricing: pricingMap[course.documentId] || null,
        }));

        setCourses(coursesWithPricing);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [dataProvider]);

  // Fetch user subscriptions
  useEffect(() => {
    const fetchUserSubscriptions = async () => {
      if (!identity?.documentId) return;

      try {
        const subs = await subscriptionService.getUserSubscriptions(
          dataProvider,
          identity.documentId
        );
        setUserSubscriptions(subs);

        // Build map of courseId -> enrolled subject IDs
        const courseSubjectsMap = new Map(); // courseDocId -> Set of subjectDocIds
        const subjectIds = new Set();

        subs.forEach((sub) => {
          if (sub.course?.documentId) {
            const courseId = sub.course.documentId;
            if (!courseSubjectsMap.has(courseId)) {
              courseSubjectsMap.set(courseId, new Set());
            }
            (sub.subjects || []).forEach((s) => {
              if (s.documentId) {
                courseSubjectsMap.get(courseId).add(s.documentId);
                subjectIds.add(s.documentId);
              }
            });
          }
        });

        setEnrolledCourseIds(courseSubjectsMap); // Now a Map, not Set
        setEnrolledSubjectIds(subjectIds);
      } catch (error) {
        console.error("Error fetching user subscriptions:", error);
      }
    };

    if (!identityLoading) {
      fetchUserSubscriptions();
    }
  }, [dataProvider, identity?.documentId, identityLoading]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter((course) =>
        course.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    return filtered;
  }, [courses, searchQuery, selectedCategory]);

  // Handlers
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCourse(null);
  };

  const handleEnrollCourse = (course) => {
    setEnrollingCourse(course);
    setEnrollingSubject(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollSubject = (subject) => {
    setEnrollingSubject(subject);
    setEnrollModalOpen(true);
  };

  const handleConfirmEnroll = async () => {
    if (!identity?.documentId) return;

    try {
      setEnrolling(true);

      const course = enrollingCourse || selectedCourse;
      const org = identity.org?.documentId || null;

      if (enrollingSubject) {
        // Single subject enrollment
        await subscriptionService.createSubscription(dataProvider, {
          userDocumentId: identity.documentId,
          courseDocumentId: course.documentId,
          orgDocumentId: org,
          subscriptionType: "FREE",
          paymentStatus: "ACTIVE",
          subjectDocumentIds: [enrollingSubject.documentId],
        });
        setEnrolledItem({ course, subject: enrollingSubject });
      } else {
        // Full course enrollment
        await subscriptionService.createSubscription(dataProvider, {
          userDocumentId: identity.documentId,
          courseDocumentId: course.documentId,
          orgDocumentId: org,
          subscriptionType: "FREE",
          paymentStatus: "ACTIVE",
        });
        setEnrolledItem({ course, subject: null });
      }

      // Refresh subscriptions
      const subs = await subscriptionService.getUserSubscriptions(
        dataProvider,
        identity.documentId
      );
      setUserSubscriptions(subs);

      const courseIds = new Set();
      const subjectIds = new Set();
      subs.forEach((sub) => {
        if (sub.course?.documentId) courseIds.add(sub.course.documentId);
        (sub.subjects || []).forEach((s) => {
          if (s.documentId) subjectIds.add(s.documentId);
        });
      });
      setEnrolledCourseIds(courseIds);
      setEnrolledSubjectIds(subjectIds);

      // Close modals and show success
      setEnrollModalOpen(false);
      setDrawerOpen(false);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Enrollment error:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  return (
    <div className="p-6 flex flex-col gap-8 max-w-7xl mx-auto">
      <Title title="Browse Courses" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-800 font-heading">
          Browse Courses
        </h1>
        <p className="text-gray-500 font-medium">
          Explore courses, enroll for free, and start learning
        </p>
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="w-[180px]">
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={CATEGORY_OPTIONS}
                placeholder="All Categories"
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
        {!loading && filteredCourses.length > 0 && (
          <div className="px-6 pt-6 pb-2">
            <p className="text-sm font-semibold text-gray-500">
              Showing {filteredCourses.length} course
              {filteredCourses.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Courses Grid */}
        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-3xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                // Check if ALL subjects are enrolled
                const courseSubjectIds = (course.subjects || []).map(
                  (s) => s.documentId
                );
                const enrolledSet =
                  enrolledCourseIds.get(course.documentId) || new Set();
                const isFullyEnrolled =
                  courseSubjectIds.length > 0 &&
                  courseSubjectIds.every((id) => enrolledSet.has(id));

                return (
                  <BrowseCourseCard
                    key={course.documentId || course.id}
                    course={course}
                    coursePricing={course.coursePricing}
                    isEnrolled={isFullyEnrolled}
                    enrolledSubjectCount={enrolledSet.size}
                    totalSubjectCount={courseSubjectIds.length}
                    onEnroll={handleEnrollCourse}
                    onClick={handleCourseClick}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <GraduationCap className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                No courses found
              </h3>
              <p className="text-gray-500 font-medium">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Course Details Drawer */}
      <CourseDetailsDrawer
        course={selectedCourse}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        isEnrolled={
          selectedCourse && enrolledCourseIds.has(selectedCourse.documentId)
        }
        enrolledSubjectIds={[...enrolledSubjectIds]}
        onEnroll={handleEnrollCourse}
        onSubjectEnroll={handleEnrollSubject}
      />

      {/* Enroll Confirmation Modal */}
      <EnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onConfirm={handleConfirmEnroll}
        course={enrollingCourse || selectedCourse}
        subject={enrollingSubject}
        loading={enrolling}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        course={enrolledItem.course}
        subject={enrolledItem.subject}
      />
    </div>
  );
};

export default BrowseCoursesPage;
