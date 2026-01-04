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
import {
  subscriptionService,
  getPendingPayments,
  cancelPayment,
} from "../../services/subscriptionService";
import EnrollModal from "../../components/courses/EnrollModal";
import SuccessModal from "../../components/courses/SuccessModal";
import Pagination from "../../components/common/Pagination";

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

  // State for separate subjects list
  const [subjectsList, setSubjectsList] = useState([]);
  const [subjectPage, setSubjectPage] = useState(1);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const subjectsPerPage = 10;

  // User subscription state
  const [existingSubscription, setExistingSubscription] = useState(null);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());
  const [pendingPayment, setPendingPayment] = useState(null);

  // Fetch Pending Payments
  const fetchPending = async () => {
    if (!identity?.documentId || !courseId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const pending = await getPendingPayments(token);

      const found = pending.find((p) => {
        const item = p.invoice_items?.[0];

        // Direct course match
        const pCourseId = p.course?.documentId || item?.course?.documentId;
        if (pCourseId === courseId) return true;

        // Subject match - check if subject belongs to this course
        // We can check if subject.course matches OR if subject ID is in our course's subject list
        const pSubjectId = item?.subject?.documentId;
        if (
          pSubjectId &&
          subjectsList.some((s) => s.documentId === pSubjectId)
        ) {
          return true;
        }

        // Deep check if subject.courses populated
        const subjectCourses = item?.subject?.courses;
        if (subjectCourses && Array.isArray(subjectCourses)) {
          if (subjectCourses.some((c) => (c.documentId || c.id) === courseId)) {
            return true;
          }
        }

        return false;
      });

      setPendingPayment(found || null);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };

  useEffect(() => {
    if (identity?.documentId && course && subjectsList.length > 0) {
      fetchPending();
    }
  }, [identity?.documentId, course, subjectsList]);

  const handleResumePayment = async () => {
    if (!pendingPayment) return;
    try {
      // pendingPayment is the INVOICE object. We need the valid payment record.
      // Prioritize PENDING, fallback to FAILED/CANCELLED/Last to allow retry.
      const payments = pendingPayment.payments || [];
      const pendingPay =
        payments.find((p) => p.payment_status === "PENDING") ||
        payments.find((p) => p.payment_status === "FAILED") ||
        payments.find((p) => p.payment_status === "CANCELLED") ||
        payments[payments.length - 1];

      const orderId = pendingPay?.payment_reference;

      const token = localStorage.getItem("token");
      if (!token) return;

      if (!orderId) {
        alert("Error: No pending payment reference found.");
        return;
      }

      // Call resume endpoint
      const data = await subscriptionService.resumePayment(token, orderId);

      if (data.status === "ALREADY_PAID") {
        alert("Payment is already completed. Refreshing...");
        fetchPending();
        return;
      }

      if (data.paymentSessionId) {
        await subscriptionService.checkout(
          data.paymentSessionId,
          data.orderId || orderId
        );
      }
    } catch (error) {
      console.error("Resume payment failed:", error);
      alert("Failed to resume payment.");
    }
  };

  const handleCancelPaymentAction = async () => {
    if (
      !window.confirm("Are you sure you want to cancel this pending payment?")
    )
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await cancelPayment(token, pendingPayment.payment_reference);
      fetchPending();
    } catch (error) {
      console.error("Failed to cancel payment:", error);
      alert("Failed to cancel payment");
    }
  };

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

  // Counts state
  const [courseCounts, setCourseCounts] = useState({
    subjectCount: 0,
    topicCount: 0,
    quizCount: 0,
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch counts from API (Efficient)
        try {
          const countsData = await subscriptionService.getCourseCounts(
            courseId
          );
          if (countsData) {
            setCourseCounts(countsData?.data || countsData);
          }
        } catch (e) {
          console.error("Error fetching course counts:", e);
        }

        // Fetch course (Basic info + minimal populate)
        const { data: courseData } = await dataProvider.getOne("courses", {
          id: courseId,
          meta: {
            populate: {
              cover: { fields: ["url", "name"] },
              // We don't populate subjects deep here anymore to avoid limits
            },
          },
        });
        setCourse(courseData);

        // Fetch Subjects Separately (With Pagination)
        const { data: subjectsData, total: totalSub } =
          await dataProvider.getList("subjects", {
            pagination: { page: subjectPage, perPage: subjectsPerPage },
            sort: { field: "name", order: "ASC" },
            filter: {
              "filters[courses][documentId][$eq]": courseId,
            },
            meta: {
              populate: {
                topics: {
                  limit: -1, // Use standard limit override if supported by controller, else relies on default
                  populate: {
                    contents: { fields: ["documentId"] },
                  },
                },
                coverpage: { fields: ["url"] },
                quizzes: { fields: ["documentId"] },
              },
            },
          });
        setSubjectsList(subjectsData);
        if (totalSub !== undefined) {
          setTotalSubjects(totalSub);
        } else {
          // Fallback if provider doesn't return total
          setTotalSubjects(subjectsData.length); // Only accurate for first page
        }

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
  }, [dataProvider, courseId, subjectPage]); // Re-run when page changes

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
  const subjects = subjectsList;
  // Use API counts if available, otherwise fallback to local calculation
  const subjectCount = courseCounts.subjectCount || subjects.length;
  // Use API counts for topics
  const topicCount =
    courseCounts.topicCount ||
    subjects.reduce((t, s) => t + (s?.topics?.length || 0), 0);

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
      const token = localStorage.getItem("token");

      // Helper to check payment requirement
      // For bundle
      if (enrollingItem.isBundle) {
        if (!isBundleFree) {
          if (!coursePricing?.documentId) {
            console.error("No pricing found for course");
            return;
          }
          // Paid Bundle
          await subscriptionService.initiatePayment(token, {
            coursePricingId: coursePricing.documentId,
            type: "COURSE",
          });
          // Payment initiated, Cashfree will handle redirect.
          // We can close modal or show "Processing..."
          setEnrollModalOpen(false);
          return;
        }

        // Free Bundle Logic (Existing)
        const allSubjectIds = subjectsList.map((s) => s.documentId);

        if (existingSubscription) {
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
          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: "FREE",
            paymentStatus: "ACTIVE",
            subjectDocumentIds: allSubjectIds,
          });
        }
        setEnrolledItem({ course, subject: null });
      } else {
        // Single Subject
        const subjectId = enrollingItem.subject.documentId;
        const subjectPricing = subjectPricings[subjectId];
        const isFree =
          !subjectPricing || (subjectPricing.base_amount || 0) === 0;

        if (!isFree) {
          if (!subjectPricing?.documentId) {
            console.error("No pricing found for subject");
            return;
          }
          // Paid Subject
          await subscriptionService.initiatePayment(token, {
            subjectPricingId: subjectPricing.documentId,
            type: "SUBJECT",
          });
          setEnrollModalOpen(false);
          return;
        }

        // Free Subject Logic (Existing)
        if (existingSubscription) {
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
          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: "FREE",
            paymentStatus: "ACTIVE",
            subjectDocumentIds: [subjectId],
          });
        }
        setEnrolledItem({ course, subject: enrollingItem.subject });
      }

      // Refresh subscription (Only reachable if Free flow, otherwise redirected)
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
      // Ensure specific error handling if needed
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
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-safe">
      <Title title={course.name} />

      {/* Header Title Section */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <button
          onClick={handleBack}
          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm shrink-0 group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {course.name}
          </h1>
          {course.category && (
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${categoryColor}`}
            >
              {course.category}
            </span>
          )}
        </div>
      </div>

      {/* Main Action Section - Moved Below Header */}
      <div className="mb-10">
        {!hasFullCourse && (
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-primary-500/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">
                  Total Course Bundle
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">
                    {isBundleFree ? "FREE" : `₹${bundlePrice.toLocaleString()}`}
                  </span>
                  {individualTotal > bundlePrice && (
                    <span className="text-sm text-gray-400 line-through decoration-gray-300">
                      ₹{individualTotal.toLocaleString()}
                    </span>
                  )}
                </div>
                {savings > 0 && !isBundleFree && (
                  <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    Save {savings}% on bundle
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-[200px]">
                {/* Pending Payment Controls */}
                {pendingPayment ? (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={handleCancelPaymentAction}
                      className="flex-1 px-6 py-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResumePayment}
                      className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 transition-all animate-pulse text-sm"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Continue Payment
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleBuyBundle}
                    className={`w-full md:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                      isBundleFree
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200"
                        : "bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white shadow-primary-200"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isBundleFree ? "Enroll Now - Free" : "Buy Full Course"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {hasFullCourse && (
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900">
                You are enrolled!
              </h3>
              <p className="text-green-700">
                You have full access to all subjects in this course.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Course Info Card */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-12 shadow-sm">
        <div className="p-6 md:p-8">
          {/* Info Row: Image thumbnail + Description + Stats */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Expandable Image Thumbnail */}
            {course.cover?.url && (
              <button
                onClick={() => setImageModalOpen(true)}
                className="group relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:border-primary-200 transition-all shadow-sm flex-shrink-0"
              >
                <img
                  src={course.cover.url}
                  alt={course.name}
                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-gray-800 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
                </div>
              </button>
            )}

            {/* Info content */}
            <div className="flex-1 min-w-0 space-y-6">
              {course.description && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    About this course
                  </h3>
                  <div
                    className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600 font-medium">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  <span>{subjectCount} Subjects</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-600 font-medium">
                  <Layers className="w-4 h-4 text-primary-500" />
                  <span>{topicCount} Topics</span>
                </div>
              </div>
            </div>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalSubjects > subjectsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={subjectPage}
              totalPages={Math.ceil(totalSubjects / subjectsPerPage)}
              onPageChange={setSubjectPage}
            />
          </div>
        )}
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
