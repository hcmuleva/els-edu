import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import {
  addUserToDefaultOrg,
  updateUserData,
  DEFAULT_ORG_NAME,
} from "../../services/org";
import { refreshUser } from "../../api/authProvider";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const login = useLogin();
  const notify = useNotify();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      notify("Passwords do not match", { type: "warning" });
      return;
    }

    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

    try {
      // Step 1: Register the user (this must be a direct API call since we're not authenticated yet)
      const response = await fetch(`${apiUrl}/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Registration failed");
      }

      const data = await response.json();
      const token = data.jwt;
      const user = data.user;

      // Store auth data immediately so dataProvider can use it for authenticated requests
      localStorage.setItem("auth", JSON.stringify(data));
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userDocumentId", user.documentId);

      // Step 2: Assign user to default org (Edu Org) using dataProvider
      try {
        await addUserToDefaultOrg(user.id);
        console.log(`User assigned to default org: ${DEFAULT_ORG_NAME}`);
      } catch (orgError) {
        console.warn("Failed to assign user to default org:", orgError);
        // Continue even if org assignment fails - user can be assigned later
      }

      // Step 3: Set default user_role and assigned_roles using dataProvider
      try {
        await updateUserData(user.id, {
          user_role: "STUDENT",
          assigned_roles: [{ role: "STUDENT" }],
        });
        console.log("User default role set to STUDENT");
      } catch (roleError) {
        console.warn("Failed to set default role:", roleError);
      }

      // Step 4: Refresh user data to get all populated fields
      try {
        const refreshedUser = await refreshUser();
        localStorage.setItem("user", JSON.stringify(refreshedUser));
      } catch (refreshError) {
        // Fallback: store basic user data
        console.warn("Failed to refresh user data:", refreshError);
        localStorage.setItem("user", JSON.stringify(user));
      }

      notify("Registration successful! Welcome.", { type: "success" });
      // Redirect to dashboard with base path (hash routing for React Admin)
      const basePath = import.meta.env.BASE_URL || "./";
      window.location.href = `${basePath}#/`;
    } catch (error) {
      notify(error.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center bg-background px-4 py-8 md:py-0 overflow-y-auto">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border/50 shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/50 overflow-hidden flex items-center justify-center p-2 mx-auto mb-4">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 mt-4">
            ELS Edu
          </h1>
          <h2 className="text-3xl font-black text-foreground font-heading mb-2">
            Create Account
          </h2>
          <p className="text-muted-foreground">
            Join the learning adventure today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary/5 border border-border/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
              placeholder="Pick a username"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary/5 border border-border/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl bg-secondary/5 border border-border/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl bg-secondary/5 border border-border/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-5 h-5 rounded-lg border-border/50 bg-secondary/10 text-primary focus:ring-primary focus:ring-offset-background transition-all cursor-pointer"
            />
            <label
              htmlFor="acceptTerms"
              className="text-sm text-muted-foreground leading-tight cursor-pointer select-none"
            >
              I agree to the{" "}
              <a
                href="https://emeelan.com/els-edu/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Terms and Conditions
              </a>
            </label>
          </div>

          {!acceptTerms && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider mb-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertCircle size={12} className="stroke-[3]" />
              Need to accept terms to register
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-bold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
