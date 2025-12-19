import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { Link } from "react-router-dom";
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
      window.location.href = "/els-kids/#/";
    } catch (error) {
      notify(error.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border/50 shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
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
              className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
              className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-secondary/10 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
