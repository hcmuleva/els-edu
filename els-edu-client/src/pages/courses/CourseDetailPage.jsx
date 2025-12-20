import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle,
  ShoppingCart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ZoomIn,
} from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";
import EnrollModal from "../../components/courses/EnrollModal";
import SuccessModal from "../../components/courses/SuccessModal";

const CATEGORY_COLORS = {
  KIDS: "bg-pink-100 text-pink-700",
  PRIMARY: "bg-blue-100 text-blue-700",
  MIDDLE: "bg-purple-100 text-purple-700",
  SCHOOL: "bg-indigo-100 text-indigo-700",
  COLLEGE: "bg-cyan-100 text-cyan-700",
  SANSKAR: "bg-orange-100 text-orange-700",
  PROJECT: "bg-green-100 text-green-700",
  DIY: "bg-lime-100 text-lime-700",
  EDUCATION: "bg-teal-100 text-teal-700",
};

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dataProvider = useDataProvider();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  // State
  const [course, setCourse] = useState(null);
  const [coursePricing, setCoursePricing] = useState(null);
  const [subjectPricings, setSubjectPricings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User subscription state
  const [existingSubscription, setExistingSubscription] = useState(null);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());

  // Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollingItem, setEnrollingItem] = useState({
    course: null,
    subject: null,
    isBundle: false,
  });
  const [enrolling, setEnrolling] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [enrolledItem, setEnrolledItem] = useState({
    course: null,
    subject: null,
  });

  // Topic list visibility state
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course
        const { data: courseData } = await dataProvider.getOne("courses", {
          id: courseId,
          meta: {
            populate: {
              cover: { fields: ["url", "name"] },
              subjects: {
                populate: {
                  topics: {
                    populate: {
                      contents: { fields: ["documentId"] },
                    },
                  },
                  coverpage: { fields: ["url"] },
                },
              },
            },
          },
        });
        setCourse(courseData);

        // Fetch course-pricing
        const { data: pricingsData } = await dataProvider.getList(
          "course-pricings",
          {
            pagination: { page: 1, perPage: 10 },
            filter: {},
            meta: {
              populate: {
                course: { fields: ["documentId"] },
                subject_pricings: { populate: ["subject"] },
              },
            },
          }
        );

        // Find pricing for this course
        const pricing = pricingsData.find(
          (p) => p.course?.documentId === courseId
        );
        setCoursePricing(pricing || null);

        // Build subject pricing map
        if (pricing?.subject_pricings) {
          const pricingMap = {};
          pricing.subject_pricings.forEach((sp) => {
            if (sp.subject?.documentId) {
              pricingMap[sp.subject.documentId] = sp;
            }
          });
          setSubjectPricings(pricingMap);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [dataProvider, courseId]);

  // Fetch user subscriptions
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!identity?.documentId || !courseId) return;

      try {
        const subscription = await subscriptionService.getSubscriptionByCourse(
          dataProvider,
          identity.documentId,
          courseId
        );
        setExistingSubscription(subscription);

        if (subscription) {
          const subjectIds = new Set(
            (subscription.subjects || []).map((s) => s.documentId)
          );
          setEnrolledSubjectIds(subjectIds);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    };

    if (!identityLoading) {
      fetchSubscription();
    }
  }, [dataProvider, identity?.documentId, courseId, identityLoading]);

  // Calculations
  const subjects = course?.subjects || [];
  const subjectCount = subjects.length;
  const topicCount = subjects.reduce((t, s) => t + (s?.topics?.length || 0), 0);

  const isBundleFree =
    !coursePricing ||
    (coursePricing.final_amount || coursePricing.base_amount || 0) === 0;
  const bundlePrice =
    coursePricing?.final_amount || coursePricing?.base_amount || 0;

  // Calculate total if buying subjects individually
  const individualTotal = subjects.reduce((total, subject) => {
    const pricing = subjectPricings[subject.documentId];
    return total + (pricing?.base_amount || 0);
  }, 0);

  const savings =
    individualTotal > 0 && bundlePrice > 0
      ? Math.round(((individualTotal - bundlePrice) / individualTotal) * 100)
      : 0;

  const hasFullCourse =
    existingSubscription && enrolledSubjectIds.size >= subjectCount;

  const categoryColor =
    CATEGORY_COLORS[course?.category] || "bg-gray-100 text-gray-700";

  // Handlers
  const handleBack = () => navigate(-1);

  const handleBuyBundle = () => {
    setEnrollingItem({ course, subject: null, isBundle: true });
    setEnrollModalOpen(true);
  };

  const handleBuySubject = (subject) => {
    setEnrollingItem({ course, subject, isBundle: false });
    setEnrollModalOpen(true);
  };

  const toggleTopics = (subjectId) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const handleConfirmEnroll = async () => {
    if (!identity?.documentId) return;

    try {
      setEnrolling(true);
      const org = identity.org?.documentId || null;

      if (enrollingItem.isBundle) {
        // Full course purchase - merge with existing subjects
        const allSubjectIds = subjects.map((s) => s.documentId);

        if (existingSubscription) {
          // Merge: combine existing + new subjects
          const existingIds = (existingSubscription.subjects || []).map(
            (s) => s.documentId
          );
          const mergedIds = [...new Set([...existingIds, ...allSubjectIds])];

          await subscriptionService.updateSubscriptionSubjects(
            dataProvider,
            existingSubscription.documentId,
            mergedIds
          );
        } else {
          // New subscription with all subjects
          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: isBundleFree ? "FREE" : "PAID",
            paymentStatus: "ACTIVE",
            subjectDocumentIds: allSubjectIds,
          });
        }
        setEnrolledItem({ course, subject: null });
      } else {
        // Single subject purchase
        const subjectId = enrollingItem.subject.documentId;

        if (existingSubscription) {
          // Append to existing
          const existingIds = (existingSubscription.subjects || []).map(
            (s) => s.documentId
          );
          if (!existingIds.includes(subjectId)) {
            await subscriptionService.updateSubscriptionSubjects(
              dataProvider,
              existingSubscription.documentId,
              [...existingIds, subjectId]
            );
          }
        } else {
          // New subscription with 1 subject
          const subjectPricing = subjectPricings[subjectId];
          const isFree =
            !subjectPricing || (subjectPricing.base_amount || 0) === 0;

          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: isFree ? "FREE" : "PAID",
            paymentStatus: "ACTIVE",
            subjectDocumentIds: [subjectId],
          });
        }
        setEnrolledItem({ course, subject: enrollingItem.subject });
      }

      // Refresh subscription
      const updated = await subscriptionService.getSubscriptionByCourse(
        dataProvider,
        identity.documentId,
        courseId
      );
      setExistingSubscription(updated);
      if (updated) {
        setEnrolledSubjectIds(
          new Set((updated.subjects || []).map((s) => s.documentId))
        );
      }

      setEnrollModalOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Enrollment error:", err);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center py-20">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600">Course not found</h2>
        <button onClick={handleBack} className="mt-4 text-primary font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title title={course.name} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">{course.name}</h1>
            {course.category && (
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${categoryColor}`}
              >
                {course.category}
              </span>
            )}
          </div>
        </div>

        {/* Buy Course Button */}
        {!hasFullCourse && (
          <button
            onClick={handleBuyBundle}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
              isBundleFree
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {isBundleFree
              ? "Enroll Full Course"
              : `Buy Course ₹${bundlePrice.toLocaleString()}`}
          </button>
        )}
        {hasFullCourse && (
          <span className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl font-bold">
            <CheckCircle className="w-5 h-5" />
            Full Course Enrolled
          </span>
        )}
      </div>

      {/* Course Info Card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6">
          {/* Info Row: Image thumbnail + Description + Stats */}
          <div className="flex items-start gap-4">
            {/* Expandable Image Thumbnail */}
            {course.cover?.url && (
              <button
                onClick={() => setImageModalOpen(true)}
                className="group relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors flex-shrink-0"
              >
                <img
                  src={course.cover.url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )}

            {/* Info content */}
            <div className="flex-1 min-w-0">
              {course.description && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <div
                    className="prose prose-sm max-w-none text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">{subjectCount} Subjects</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span className="font-semibold">{topicCount} Topics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Pricing Info */}
          {!hasFullCourse && coursePricing && (
            <div className="mt-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Full Course Bundle Price
                  </p>
                  <p className="text-2xl font-black text-gray-800">
                    {isBundleFree ? "FREE" : `₹${bundlePrice.toLocaleString()}`}
                  </p>
                </div>
                {savings > 0 && (
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Save {savings}%</span>
                  </div>
                )}
              </div>
              {individualTotal > bundlePrice && (
                <p className="text-xs text-gray-400 mt-2">
                  vs ₹{individualTotal.toLocaleString()} if purchased
                  individually
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subjects Section */}
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-4">
          Subjects ({subjectCount})
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Purchase individual subjects or get the full course bundle for better
          value
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const pricing = subjectPricings[subject.documentId];
            const isEnrolled = enrolledSubjectIds.has(subject.documentId);
            const isFree = !pricing || (pricing.base_amount || 0) === 0;
            const price = pricing?.base_amount || 0;
            const topicsInSubject = subject.topics?.length || 0;

            return (
              <div
                key={subject.documentId}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-primary/30 transition-colors"
              >
                {/* Subject Header */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-800">{subject.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subject.grade && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                        Grade: {subject.grade}
                      </span>
                    )}
                    {subject.level && (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                        Level: {subject.level}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                      {topicsInSubject} Topics
                    </span>
                  </div>
                </div>

                {/* See Topics Toggle */}
                {topicsInSubject > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() => toggleTopics(subject.documentId)}
                      className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                    >
                      {expandedSubjects.has(subject.documentId) ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Hide Topics
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> See All Topics
                        </>
                      )}
                    </button>

                    {expandedSubjects.has(subject.documentId) && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Topics
                        </p>
                        <ol className="space-y-1.5">
                          {(subject.topics || []).map((topic, idx) => {
                            const contentCount = topic.contents?.length || 0;
                            return (
                              <li
                                key={topic.documentId || idx}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="flex-1">
                                  {topic.name || `Topic ${idx + 1}`}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {contentCount} content
                                  {contentCount !== 1 ? "s" : ""}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-lg font-black text-gray-800">
                    {isFree ? "FREE" : `₹${price.toLocaleString()}`}
                  </p>

                  {isEnrolled ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" />
                      Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuySubject(subject)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        isFree
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-primary hover:bg-primary/90 text-white"
                      }`}
                    >
                      {isFree ? "Enroll" : "Buy"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {imageModalOpen && course.cover?.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setImageModalOpen(false)}
        >
          <button
            onClick={() => setImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={course.cover.url}
            alt={course.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modals */}
      <EnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onConfirm={handleConfirmEnroll}
        course={enrollingItem.course}
        subject={enrollingItem.isBundle ? null : enrollingItem.subject}
        loading={enrolling}
      />

      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        course={enrolledItem.course}
        subject={enrolledItem.subject}
      />
    </div>
  );
};

export default CourseDetailPage;
