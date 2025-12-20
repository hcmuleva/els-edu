import { useEffect, useState, useMemo } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Search, RotateCcw, Receipt } from "lucide-react";
import BrowseCourseCard from "../../components/courses/BrowseCourseCard";
import CourseDetailsDrawer from "../../components/courses/CourseDetailsDrawer";
import EnrollModal from "../../components/courses/EnrollModal";
import SuccessModal from "../../components/courses/SuccessModal";
import { CustomSelect } from "../../components/common/CustomSelect";
import {
  subscriptionService,
  cancelPayment,
  getPendingPayments,
} from "../../services/subscriptionService";

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
  const navigate = useNavigate();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  // State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Pending payments state
  const [pendingPayments, setPendingPayments] = useState({}); // Map of courseId -> paymentRecord

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

  // Fetch Pending Payments
  const fetchPending = async () => {
    if (!identity?.documentId) return;
    try {
      const token = localStorage.getItem("token"); // Need token for direct API call
      if (!token) return;

      const pending = await getPendingPayments(token);
      console.log(
        "REF_DEBUG: Fetched pending payments:",
        pending.length,
        pending
      );

      // Map pending payments by course ID
      // Assuming invoice items have course/subject link or using metadata
      const pendingMap = {};

      pending.forEach((p) => {
        // Find course ID from invoice items or metadata
        const item = p.invoice_items?.[0];
        console.log(
          "REF_DEBUG: Processing invoice:",
          p.documentId,
          "Item:",
          item
        );

        // Check for direct course link
        let courseId = p.course?.documentId || item?.course?.documentId;

        // If not found, check if subject belongs to a course
        if (courseId) {
          pendingMap[courseId] = p;
        } else if (item?.subject?.courses) {
          // Subject might belong to multiple courses
          const subjectCourses = Array.isArray(item.subject.courses)
            ? item.subject.courses
            : [item.subject.courses];

          subjectCourses.forEach((c) => {
            const cId = c.documentId || c.id;
            if (cId) pendingMap[cId] = p;
          });
        }
      });

      setPendingPayments(pendingMap);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };

  useEffect(() => {
    if (identity?.documentId) {
      fetchPending();
    }
  }, [identity?.documentId]);

  // Payment Handlers
  const handleResumePayment = async (paymentInvoice) => {
    console.log("REF_DEBUG: handleResumePayment called with:", paymentInvoice);
    try {
      // paymentInvoice is the INVOICE object. We need to find a valid payment record.
      // Prioritize PENDING, fallback to FAILED/CANCELLED/Last to allow retry.
      const payments = paymentInvoice.payments || [];
      const pendingPay =
        payments.find((p) => p.payment_status === "PENDING") ||
        payments.find((p) => p.payment_status === "FAILED") ||
        payments.find((p) => p.payment_status === "CANCELLED") ||
        payments[payments.length - 1];

      const orderId = pendingPay?.payment_reference;
      const token = localStorage.getItem("token");

      console.log("REF_DEBUG: Resume Params:", {
        orderId,
        paymentStatus: pendingPay?.payment_status,
        invoiceStatus: paymentInvoice.invoice_status,
        hasToken: !!token,
      });

      if (!token) {
        alert("Authentication error: No token found. Please login again.");
        return;
      }
      if (!orderId) {
        console.error("REF_DEBUG: Invoice has no payments?", paymentInvoice);
        alert(
          "Error: No payment reference found for this invoice. Please contact support."
        );
        return;
      }

      // Call resume endpoint to get new session or verify status
      const data = await subscriptionService.resumePayment(token, orderId);
      console.log("REF_DEBUG: Resume API Response:", data);

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
      } else {
        alert("Failed to get payment session from server.");
      }
    } catch (error) {
      console.error("Failed to resume payment:", error);
      alert(`Failed to resume payment: ${error.message}`);
    }
  };

  const handleCancelPaymentAction = async (payment) => {
    if (!window.confirm("Are you sure you want to cancel this payment?"))
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await cancelPayment(token, payment.payment_reference); // Assuming payment_reference is orderId

      // Refresh pending list
      fetchPending();

      // Also potentially refresh subscriptions if it affects anything (not usually for PENDING->CANCELLED)
    } catch (error) {
      console.error("Failed to cancel payment:", error);
      alert("Failed to cancel payment. Please try again.");
    }
  };

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
      const coursePricing = course.coursePricing;

      if (enrollingSubject) {
        // Single subject enrollment
        // Find subject pricing
        const subjectPricing = coursePricing?.subject_pricings?.find(
          (sp) => sp.subject?.documentId === enrollingSubject.documentId
        );
        const amount = subjectPricing?.amount || 0;

        if (amount > 0 && subjectPricing?.documentId) {
          // PAID Subject
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Authentication required");

          await subscriptionService.initiatePayment(token, {
            coursePricingId: coursePricing.documentId,
            subjectPricingId: subjectPricing.documentId,
            type: "SUBJECT",
          });
          // initiatePayment redirects, so we can stop here
          return;
        } else {
          // FREE Subject
          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: "FREE",
            paymentStatus: "ACTIVE",
            subjectDocumentIds: [enrollingSubject.documentId],
          });
          setEnrolledItem({ course, subject: enrollingSubject });
        }
      } else {
        // Full course enrollment
        const amount =
          coursePricing?.final_amount || coursePricing?.base_amount || 0;

        if (amount > 0 && coursePricing?.documentId) {
          // PAID Course
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Authentication required");

          await subscriptionService.initiatePayment(token, {
            coursePricingId: coursePricing.documentId,
            type: "COURSE_BUNDLE",
          });
          // initiatePayment redirects
          return;
        } else {
          // FREE Course
          await subscriptionService.createSubscription(dataProvider, {
            userDocumentId: identity.documentId,
            courseDocumentId: course.documentId,
            orgDocumentId: org,
            subscriptionType: "FREE",
            paymentStatus: "ACTIVE",
          });
          setEnrolledItem({ course, subject: null });
        }
      }

      // Refresh subscriptions
      const subs = await subscriptionService.getUserSubscriptions(
        dataProvider,
        identity.documentId
      );
      setUserSubscriptions(subs);

      const courseSubjectsMap = new Map();
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
      setEnrolledCourseIds(courseSubjectsMap);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-800 font-heading">
            Browse Courses
          </h1>
          <p className="text-gray-500 font-medium">
            Explore courses, enroll for free, and start learning
          </p>
        </div>
        <button
          onClick={() => navigate("/purchase-history")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
        >
          <Receipt className="w-4 h-4" />
          Purchase History
        </button>
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
                    pendingPayment={pendingPayments[course.documentId]}
                    onEnroll={handleEnrollCourse}
                    onResumePayment={handleResumePayment}
                    onCancelPayment={handleCancelPaymentAction}
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
