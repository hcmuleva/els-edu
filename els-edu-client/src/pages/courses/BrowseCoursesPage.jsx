import { useEffect, useState, useMemo } from "react";
import { Title, useDataProvider, useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  X,
  Receipt,
  Sparkles,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import BrowseCourseCard from "../../components/courses/BrowseCourseCard";
// import CourseDetailsDrawer from "../../components/courses/CourseDetailsDrawer"; // Removed
import EnrollModal from "../../components/courses/EnrollModal";
import SuccessModal from "../../components/courses/SuccessModal";
import { CustomSelect } from "../../components/common/CustomSelect";
import {
  subscriptionService,
  cancelPayment,
  getPendingPayments,
} from "../../services/subscriptionService";
import Pagination from "../../components/common/Pagination";

const CATEGORY_OPTIONS = [
  { id: null, name: "All Categories" },
  { id: "KIDS", name: "Kids" },
  { id: "PRIMARY", name: "Primary" },
  { id: "MIDDLE", name: "Middle" },
  { id: "SCHOOL", name: "School" },
  { id: "COLLEGE", name: "College" },
  { id: "OLDAGE", name: "Old Age" },
  { id: "SANSKAR", name: "Sanskar" },
  { id: "COMPETION", name: "Competition" },
  { id: "PROJECT", name: "Project" },
  { id: "DIY", name: "DIY" },
  { id: "EDUCATION", name: "Education" },
];

const SUBCATEGORY_OPTIONS = [
  { id: null, name: "All Subcategories" },
  { id: "CREATIVITY", name: "Creativity" },
  { id: "COMPETION", name: "Competition" },
  { id: "ACADEMIC", name: "Academic" },
  { id: "ELECTROICS", name: "Electronics" },
  { id: "SOFTWARE", name: "Software" },
  { id: "DHARM", name: "Dharm" },
  { id: "SIKSHA", name: "Siksha" },
  { id: "GYAN", name: "Gyan" },
  { id: "SOCH", name: "Soch" },
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
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 9; // Grid friendly (3x3)

  // Pending payments state
  const [pendingPayments, setPendingPayments] = useState({});

  // User subscriptions state
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Map());
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());

  // Modal/Drawer state
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

        const filter = {};
        if (searchQuery) {
          filter.name = { $containsi: searchQuery };
        }
        if (selectedCategory) {
          filter.category = selectedCategory;
        }
        if (selectedSubcategory) {
          filter.subcategory = selectedSubcategory;
        }

        const { data: coursesData, total: totalCount } =
          await dataProvider.getList("courses", {
            pagination: { page, perPage: PER_PAGE },
            sort: { field: "name", order: "ASC" },
            filter: filter, // Using server-side filtering
            meta: {
              populate: {
                cover: { fields: ["url", "name"] },
                subjects: { populate: ["topics", "coverpage"] },
              },
            },
          });

        setTotal(totalCount);

        const { data: pricingsData } = await dataProvider.getList(
          "course-pricings",
          {
            pagination: { page: 1, perPage: 100 }, // Fetch enough pricings
            filter: {},
            meta: {
              populate: {
                course: { fields: ["documentId", "id"] },
                subject_pricings: { populate: ["subject"] },
              },
            },
          }
        );

        const pricingMap = {};
        pricingsData.forEach((pricing) => {
          if (pricing.course?.documentId) {
            pricingMap[pricing.course.documentId] = pricing;
          }
        });

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
  }, [dataProvider, page, searchQuery, selectedCategory, selectedSubcategory]);

  // Fetch user subscriptions
  useEffect(() => {
    const fetchUserSubscriptions = async () => {
      if (!identity?.documentId) return;

      try {
        const { data: subs } = await subscriptionService.getUserSubscriptions(
          dataProvider,
          identity.documentId,
          { page: 1, perPage: 1000 } // Fetch all potentially active subs
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
      const token = localStorage.getItem("token");
      if (!token) return;

      const pending = await getPendingPayments(token);

      const pendingMap = {};
      pending.forEach((p) => {
        const item = p.invoice_items?.[0];
        let courseId = p.course?.documentId || item?.course?.documentId;

        if (courseId) {
          pendingMap[courseId] = p;
        } else if (item?.subject?.courses) {
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
    try {
      const payments = paymentInvoice.payments || [];
      const pendingPay =
        payments.find((p) => p.payment_status === "PENDING") ||
        payments.find((p) => p.payment_status === "FAILED") ||
        payments.find((p) => p.payment_status === "CANCELLED") ||
        payments[payments.length - 1];

      const orderId = pendingPay?.payment_reference;
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication error: No token found. Please login again.");
        return;
      }
      if (!orderId) {
        alert("Error: No payment reference found. Please contact support.");
        return;
      }

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

      await cancelPayment(token, payment.payment_reference);
      fetchPending();
    } catch (error) {
      console.error("Failed to cancel payment:", error);
      alert("Failed to cancel payment. Please try again.");
    }
  };

  // Handlers
  const handleCourseClick = (course) => {
    // Navigate directly to detail page
    navigate(`/browse-courses/${course.documentId}`);
  };

  const handleEnrollCourse = (course) => {
    setEnrollingCourse(course);
    setEnrollingSubject(null);
    setEnrollModalOpen(true);
  };

  const handleConfirmEnroll = async () => {
    if (!identity?.documentId) return;

    try {
      setEnrolling(true);

      const course = enrollingCourse; // Enrolling from card directly uses enrollingCourse
      const org = identity.org?.documentId || null;
      const coursePricing = course.coursePricing;

      if (enrollingSubject) {
        // ... (Subject enrollment logic if needed, but primarily course enrollment from browse page)
        // Keeping this structure if reused, but simplify if possible
      } else {
        const amount =
          coursePricing?.final_amount || coursePricing?.base_amount || 0;

        if (amount > 0 && coursePricing?.documentId) {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Authentication required");

          await subscriptionService.initiatePayment(token, {
            coursePricingId: coursePricing.documentId,
            type: "COURSE_BUNDLE",
          });
          return;
        } else {
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
      const { data: subs } = await subscriptionService.getUserSubscriptions(
        dataProvider,
        identity.documentId,
        { page: 1, perPage: 1000 }
      );
      setUserSubscriptions(subs);

      // Update maps
      const courseSubjectsMap = new Map();
      const subjectIds = new Set();
      subs.forEach((sub) => {
        if (sub.course?.documentId) {
          // ... same map logic
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

      setEnrollModalOpen(false);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Enrollment error:", error);
    } finally {
      setEnrolling(false);
    }
  };

  // Filter change handlers
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1); // Reset to page 1
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setPage(1);
  };

  const handleSubcategoryChange = (val) => {
    setSelectedSubcategory(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title="Browse Courses" />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 -mx-4 -mt-4 md:-mx-6 md:-mt-6 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          {/* Top row with title and purchase history */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Browse Courses
                </h1>
                <p className="text-sm text-gray-500">
                  Find your next learning adventure
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/purchase-history")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors border border-gray-200"
            >
              <Receipt className="w-4 h-4" />
              Purchase History
            </button>
          </div>

          {/* Search and Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar - Left */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-12 py-2 text-sm rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Filters - Right */}
            <div className="flex gap-3 items-center">
              {/* Category Filter */}
              <div className="w-48">
                <CustomSelect
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  options={CATEGORY_OPTIONS}
                  placeholder="Category"
                />
              </div>

              {/* Subcategory Filter */}
              <div className="w-48">
                <CustomSelect
                  value={selectedSubcategory}
                  onChange={handleSubcategoryChange}
                  options={SUBCATEGORY_OPTIONS}
                  placeholder="Subcategory"
                />
              </div>

              {/* Reset/Clear Button */}
              {(searchQuery || selectedCategory || selectedSubcategory) && (
                <button
                  onClick={() => {
                    handleSearchChange("");
                    handleCategoryChange(null);
                    handleSubcategoryChange(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors border border-gray-200"
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
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10 pb-20">
        {/* Results Count */}
        {!loading && courses.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{total}</span>{" "}
              course{total !== 1 ? "s" : ""} available
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-10 bg-gray-100 rounded-xl flex-1 animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-xl flex-1 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {courses.map((course) => {
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

            {/* Pagination Component */}
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 max-w-sm">
              Try adjusting your search or explore different categories
            </p>
            {(searchQuery || selectedCategory || selectedSubcategory) && (
              <button
                onClick={() => {
                  handleSearchChange("");
                  handleCategoryChange(null);
                  handleSubcategoryChange(null);
                }}
                className="mt-6 px-6 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enroll Confirmation Modal */}
      <EnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        onConfirm={handleConfirmEnroll}
        course={enrollingCourse}
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
