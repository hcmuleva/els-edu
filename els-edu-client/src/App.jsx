import { Admin, Resource } from "react-admin";
import { strapiDataProvider } from "./api/dataProvider";
import { authProvider } from "./api/authProvider";
import { theme } from "./config/theme";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import { UserList } from "./features/users/UserList";
import { QuestionList } from "./features/questions/QuestionList";
import { QuestionCreate } from "./features/questions/QuestionCreate";
import { QuestionShow } from "./features/questions/QuestionShow";
import { QuestionEdit } from "./features/questions/QuestionEdit";
import { QuizList, QuizCreate, QuizEdit, QuizShow } from "./features/quizzes";
import { CourseList } from "./features/courses/CourseList";
import { CourseCreate } from "./features/courses/CourseCreate";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
  <Admin
    theme={theme}
    authProvider={authProvider}
    dataProvider={strapiDataProvider}
    layout={AppLayout}
    dashboard={Dashboard}
    loginPage={LoginPage}
  >
    {AppRoutes()}

    <Resource name="users" list={UserList} />

    {/* Educational Resources */}
    <Resource
      name="questions"
      list={QuestionList}
      create={QuestionCreate}
      show={QuestionShow}
      edit={QuestionEdit}
    />
    <Resource
      name="quizzes"
      list={QuizList}
      create={QuizCreate}
      edit={QuizEdit}
      show={QuizShow}
    />
    <Resource name="courses" list={CourseList} create={CourseCreate} />

    {/* Supporting Resources (for ReferenceInput) */}
    <Resource name="topics" />
    <Resource name="subjects" />
  </Admin>
);

export default App;
