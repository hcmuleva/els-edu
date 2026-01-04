import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";

/**
 * Unauthorized Page
 * Displayed when a user tries to access a protected route without permission
 * or when an unauthenticated user tries to access a restricted page.
 */
const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 flex flex-col items-center justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to view this page or your session has
          expired. Please log in or return home.
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary-200"
          >
            Log In
          </Link>
          <Link
            to="/"
            className="block w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
