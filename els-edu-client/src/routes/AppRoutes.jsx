import { Route } from "react-router-dom";
import { CustomRoutes } from "react-admin";
import RegisterPage from "../pages/auth/RegisterPage";
import ContentPage from "../pages/content/ContentPage";

const AppRoutes = () => (
    <>
        <CustomRoutes noLayout>
            <Route path="/register" element={<RegisterPage />} />
        </CustomRoutes>
        <CustomRoutes>
            <Route path="/my-contents" element={<ContentPage />} />
        </CustomRoutes>
    </>
);

export default AppRoutes;
