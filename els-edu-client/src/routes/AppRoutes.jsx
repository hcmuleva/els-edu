import { Route } from "react-router-dom";
import { CustomRoutes } from "react-admin";
import RegisterPage from "../pages/auth/RegisterPage";
import ContentPage from "../pages/content/ContentPage";
import BrowseSubjectsPage from "../pages/subjects/BrowseSubjectsPage";
import SubjectDetailPage from "../pages/subjects/SubjectDetailPage";
import QuizPlayer from "../pages/quiz/QuizPlayer";
import ProgressPage from "../pages/progress/ProgressPage";

const AppRoutes = () => (
  <>
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
    <CustomRoutes>
      <Route path="/my-contents" element={<ContentPage />} />
      <Route path="/browse-subjects" element={<BrowseSubjectsPage />} />
      <Route path="/browse-subjects/:id" element={<SubjectDetailPage />} />
      <Route path="/quiz/:id/play" element={<QuizPlayer />} />
      <Route path="/progress" element={<ProgressPage />} />
    </CustomRoutes>
  </>
);

export default AppRoutes;
