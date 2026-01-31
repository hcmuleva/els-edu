import { Route } from "react-router-dom";
import { CustomRoutes } from "react-admin";
import RegisterPage from "../pages/auth/RegisterPage";
import ContentPage from "../pages/content/ContentPage";
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
import ProfilePage from "../pages/profile/ProfilePage";

import UnauthorizedPage from "../pages/auth/UnauthorizedPage";
import RoleSelectionPage from "../pages/auth/RoleSelectionPage";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { ProtectedParentRoute } from "../components/common/ProtectedParentRoute";
import { ProtectedDefaultOrgRoute } from "../components/common/ProtectedDefaultOrgRoute";
import SelfAssessmentPage from "../pages/analytics/SelfAssessmentPage";
import AnalyticsResultsPage from "../pages/analytics/AnalyticsResultsPage";
import SkillQuizPage from "../pages/analytics/SkillQuizPage";
import MongoStudioPage from "../pages/mongo-studio/MongoStudioPage";
import AssignmentDetailsPage from "../pages/mongo-studio/AssignmentDetailsPage";
import { ClassroomPage, ClassDetailPage } from "../pages/classroom";

const AppRoutes = () => (
  <>
    {/* <ScrollToTop /> */}

    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment/status" element={<PaymentStatusPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Role Selection */}
      <Route
        path="/role-selection"
        element={
          <ProtectedRoute>
            <RoleSelectionPage />
          </ProtectedRoute>
        }
      />
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

      {/* General Protected Routes (Any logged in user) */}
      <Route
        path="/purchase-history"
        element={
          <ProtectedRoute>
            <PurchaseHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-subscriptions"
        element={
          <ProtectedRoute>
            <MySubscriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-subscriptions/:courseId"
        element={
          <ProtectedRoute>
            <CourseSubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-subscriptions/:courseId/subject/:id"
        element={
          <ProtectedRoute>
            <SubjectDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/browse-courses"
        element={
          <ProtectedRoute>
            <ProtectedDefaultOrgRoute>
              <ProtectedParentRoute>
                <BrowseCoursesPage />
              </ProtectedParentRoute>
            </ProtectedDefaultOrgRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse-courses/:courseId"
        element={
          <ProtectedRoute>
            <ProtectedDefaultOrgRoute>
              <CourseDetailPage />
            </ProtectedDefaultOrgRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/quiz/:id/play"
        element={
          <ProtectedRoute>
            <QuizPlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProtectedParentRoute>
              <ProfilePage />
            </ProtectedParentRoute>
          </ProtectedRoute>
        }
      />

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

      {/* Analytics - Results (main view, redirects to survey if no data) */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsResultsPage />
          </ProtectedRoute>
        }
      />
      {/* Analytics - Survey wizard */}
      <Route
        path="/analytics/survey"
        element={
          <ProtectedRoute>
            <SelfAssessmentPage />
          </ProtectedRoute>
        }
      />
      {/* Analytics - Skill Quiz */}
      <Route
        path="/analytics/quiz"
        element={
          <ProtectedRoute>
            <SkillQuizPage />
          </ProtectedRoute>
        }
      />
      {/* Analytics - Skill Quiz (new flow) */}
      <Route
        path="/analytics/skill-quiz"
        element={
          <ProtectedRoute>
            <SkillQuizPage />
          </ProtectedRoute>
        }
      />

      {/* MongoDB Studio - only ADMIN, SUPERADMIN, and TEACHER */}
      <Route
        path="/mongo-studio"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "TEACHER"]}>
            <MongoStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mongo-studio/assignments/:id"
        element={
          <ProtectedRoute>
            <AssignmentDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Classroom - accessible to all logged in users */}
      <Route
        path="/classroom"
        element={
          <ProtectedRoute>
            <ClassroomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classroom/:id"
        element={
          <ProtectedRoute>
            <ClassDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:id"
        element={
          <ProtectedRoute>
            <AssignmentDetailsPage />
          </ProtectedRoute>
        }
      />
    </CustomRoutes>
  </>
);

export default AppRoutes;
