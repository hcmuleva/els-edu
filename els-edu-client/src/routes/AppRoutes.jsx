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

const AppRoutes = () => (
  <>
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
    <CustomRoutes>
      <Route path="/my-contents" element={<ContentPage />} />
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
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/admin/orgs" element={<SuperAdminOrgsPage />} />
      <Route path="/admin/org/:documentId" element={<OrgManagePage />} />
    </CustomRoutes>
  </>
);

export default AppRoutes;
