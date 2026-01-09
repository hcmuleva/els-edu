import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const MyLoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const notify = useNotify();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: identifier, password }).catch(() =>
      notify("Invalid username or password")
    );
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
            Welcome Back!
          </h2>
          <p className="text-muted-foreground">
            Sign in to continue your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Username or Email
            </label>
            <input
              name="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary/5 border border-border/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
              placeholder="Enter your username"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Create Account
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              By signing in, you agree to our{" "}
              <a
                href="https://emeelan.com/els-edu/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Terms and Conditions
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyLoginPage;
