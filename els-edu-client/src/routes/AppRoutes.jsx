import { Route } from "react-router-dom";
import { CustomRoutes } from "react-admin";
import RegisterPage from "../pages/auth/RegisterPage";
import ContentPage from "../pages/content/ContentPage";
import BrowseSubjectsPage from "../pages/subjects/BrowseSubjectsPage";
import BrowseCoursesPage from "../pages/courses/BrowseCoursesPage";
import CourseDetailPage from "../pages/courses/CourseDetailPage";
import SubjectDetailPage from "../pages/subjects/SubjectDetailPage";
import QuizPlayer from "../pages/quiz/QuizPlayer";
import ProgressPage from "../pages/progress/ProgressPage";
import ManagePage from "../pages/manage/ManagePage";
import SuperAdminOrgsPage from "../pages/admin/SuperAdminOrgsPage";
import OrgManagePage from "../pages/admin/OrgManagePage";
import MySubscriptionsPage from "../pages/subscriptions/MySubscriptionsPage";
import CourseSubjectsPage from "../pages/subscriptions/CourseSubjectsPage";

import PaymentStatusPage from "../pages/payment/PaymentStatusPage";

import PurchaseHistoryPage from "../pages/payment/PurchaseHistoryPage";

import { ProtectedRoute } from "../components/common/ProtectedRoute";

const AppRoutes = () => (
  <>
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment/status" element={<PaymentStatusPage />} />
    </CustomRoutes>
    <CustomRoutes>
      {/* My Studio - protected for TEACHER, ADMIN, SUPERADMIN */}
      <Route
        path="/my-contents"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN", "SUPERADMIN"]}>
            <ContentPage />
          </ProtectedRoute>
        }
      />
      <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
      <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
      <Route
        path="/my-subscriptions/:courseId"
        element={<CourseSubjectsPage />}
      />
      <Route path="/browse-courses" element={<BrowseCoursesPage />} />
      <Route path="/browse-courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/browse-subjects" element={<BrowseSubjectsPage />} />
      <Route path="/browse-subjects/:id" element={<SubjectDetailPage />} />
      <Route path="/quiz/:id/play" element={<QuizPlayer />} />
      <Route path="/progress" element={<ProgressPage />} />
      {/* Manage page - only SUPERADMIN */}
      <Route
        path="/manage"
        element={
          <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
            <ManagePage />
          </ProtectedRoute>
        }
      />
      {/* All Orgs - only SUPERADMIN */}
      <Route
        path="/admin/orgs"
        element={
          <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
            <SuperAdminOrgsPage />
          </ProtectedRoute>
        }
      />
      {/* Org Management - ADMIN and SUPERADMIN (ADMIN restricted to their org in component) */}
      <Route
        path="/admin/org/:documentId"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}>
            <OrgManagePage />
          </ProtectedRoute>
        }
      />
    </CustomRoutes>
  </>
);

export default AppRoutes;
