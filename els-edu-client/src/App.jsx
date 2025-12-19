import { Admin, Resource } from "react-admin";
import { compositeDataProvider } from "./data/compositeDataProvider";
import { authProvider } from "./api/authProvider";
import { theme } from "./config/theme";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import { UserList } from "./features/users/UserList";
import { UserCreate } from "./features/users/UserCreate";
import { UserEdit } from "./features/users/UserEdit";
import { QuestionList } from "./features/questions/QuestionList";
import { QuestionCreate } from "./features/questions/QuestionCreate";
import { QuestionShow } from "./features/questions/QuestionShow";
import { QuestionEdit } from "./features/questions/QuestionEdit";
import { QuizList, QuizCreate, QuizEdit, QuizShow } from "./features/quizzes";
import { CourseList } from "./features/courses/CourseList";
import { CourseCreate } from "./features/courses/CourseCreate";
import { CourseEdit } from "./features/courses/CourseEdit";
import { SubjectCreate } from "./features/subjects/SubjectCreate";
import { SubjectEdit } from "./features/subjects/SubjectEdit";
import { TopicCreate } from "./features/topics/TopicCreate";
import { TopicEdit } from "./features/topics/TopicEdit";
import { ContentCreate } from "./features/contents/ContentCreate";
import { ContentEdit } from "./features/contents/ContentEdit";
import { ContentShow } from "./features/contents/ContentShow";
import {
  InvoicesList,
  InvoiceShow,
  InvoiceCreate,
  InvoiceEdit,
} from "./features/invoices";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
  <Admin
    theme={theme}
    authProvider={authProvider}
    dataProvider={compositeDataProvider}
    layout={AppLayout}
    dashboard={Dashboard}
    loginPage={LoginPage}
  >
    {AppRoutes()}

    <Resource
      name="users"
      list={UserList}
      create={UserCreate}
      edit={UserEdit}
    />

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
    <Resource
      name="courses"
      list={CourseList}
      create={CourseCreate}
      edit={CourseEdit}
    />

    {/* Invoices */}
    <Resource
      name="invoices"
      list={InvoicesList}
      show={InvoiceShow}
      create={InvoiceCreate}
      edit={InvoiceEdit}
    />

    {/* Supporting Resources (for ReferenceInput and Creation) */}
    <Resource name="topics" create={TopicCreate} edit={TopicEdit} />
    <Resource name="subjects" create={SubjectCreate} edit={SubjectEdit} />
    <Resource
      name="contents"
      create={ContentCreate}
      edit={ContentEdit}
      show={ContentShow}
    />
    <Resource name="orgs" />
    <Resource name="pricings" />
    <Resource name="offers" />
    <Resource name="invoice-items" />
    <Resource name="invoice-payments" />
    <Resource name="usersubscriptions" />
  </Admin>
);

export default App;
