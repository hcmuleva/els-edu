import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { strapiDataProvider } from "./providers/strapiProvider";
import { authProvider } from "./providers/authProvider";
import { theme } from "./theme";
import MyLayout from "./layout/MyLayout";
import Dashboard from "./dashboard/Dashboard";
import MyLoginPage from "./auth/MyLoginPage";
import RegisterPage from "./auth/RegisterPage";
import { UserList } from "./users/UserList";
import MyContents from "./contents/MyContents";
import { QuestionList } from "./questions/QuestionList";
import { QuestionCreate } from "./questions/QuestionCreate";
import { QuestionShow } from "./questions/QuestionShow";
import { QuestionEdit } from "./questions/QuestionEdit";
import { QuizList } from "./quizzes/QuizList";
import { QuizCreate } from "./quizzes/QuizCreate";
import { CourseList } from "./courses/CourseList";
import { CourseCreate } from "./courses/CourseCreate";

const App = () => (
    <Admin 
        theme={theme} 
        authProvider={authProvider}
        dataProvider={strapiDataProvider}
        layout={MyLayout}
        dashboard={Dashboard}
        loginPage={MyLoginPage}
    >
        <CustomRoutes noLayout>
            <Route path="/register" element={<RegisterPage />} />
        </CustomRoutes>
        <CustomRoutes>
            <Route path="/my-contents" element={<MyContents />} />
        </CustomRoutes>
        
        <Resource name="users" list={UserList} />
        
        {/* Educational Resources */}
        <Resource 
            name="questions" 
            list={QuestionList} 
            create={QuestionCreate}
            show={QuestionShow}
            edit={QuestionEdit}
        />
        <Resource name="quizzes" list={QuizList} create={QuizCreate} />
        <Resource name="courses" list={CourseList} create={CourseCreate} />
        
        {/* Supporting Resources (for ReferenceInput) */}
        <Resource name="topics" />
    </Admin>
);

export default App;
