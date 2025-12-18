import React, { useState } from "react";
import { useNotify, useRedirect, Title, useCreate } from "react-admin";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "../../lib/utils";

const roleChoices = [
  { id: "STUDENT", name: "Student", icon: GraduationCap },
  { id: "TEACHER", name: "Teacher", icon: Users },
  { id: "PARENT", name: "Parent", icon: Users },
  { id: "MARKETING", name: "Marketing", icon: Users },
  { id: "ADMIN", name: "Admin", icon: Shield },
  { id: "SUPERADMIN", name: "Super Admin", icon: Shield },
];

export const UserCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isLoading }] = useCreate();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = storedUser?.user_role || "STUDENT";

  const getAvailableRoles = () => {
    if (currentUserRole === "SUPERADMIN") return roleChoices;
    if (currentUserRole === "ADMIN") {
      return roleChoices.filter(
        (r) => r.id !== "ADMIN" && r.id !== "SUPERADMIN"
      );
    }
    if (currentUserRole === "TEACHER") {
      return roleChoices.filter((r) => r.id === "STUDENT");
    }
    return roleChoices.filter((r) => r.id === "STUDENT"); // Default fallback
  };

  const availableRoles = getAvailableRoles();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    user_experience_level: "",
    user_role: availableRoles[0]?.id || "STUDENT",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (
        !formData.username ||
        !formData.email ||
        !formData.password ||
        !formData.user_role
      ) {
        notify("Please fill in all required fields", { type: "warning" });
        return;
      }

      const DEFAULT_ROLE_ID = 1;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const orgId =
        storedUser?.org?.id ||
        storedUser?.org ||
        storedUser?.organization?.id ||
        storedUser?.organization;

      const payload = {
        ...formData,
        ...(orgId && { org: orgId }),
        role: DEFAULT_ROLE_ID,
        confirmed: true, // Auto-confirm on creation by admin
      };

      await create("users", { data: payload });

      notify("User created successfully!", { type: "success" });
      setTimeout(() => {
        redirect("/manage");
      }, 500);
    } catch (error) {
      console.error("Error creating user:", error);
      notify(error.message || "Error creating user. Please try again.", {
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Title title="Add New User | ELS Kids" />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => redirect("/manage")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
              title="Back to Manage"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Add New User
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                Create a new account for your workspace
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => redirect("/manage")}
              className="px-5 py-2 rounded-xl border border-border/60 font-bold hover:bg-gray-50 transition-all text-xs uppercase tracking-tight"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-create-form"
              disabled={isLoading}
              className="px-6 py-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-tight disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm space-y-4">
              <div className="p-3 rounded-2xl bg-primary/10 w-fit">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Quick Setup</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add members to your organization. They will be automatically
                confirmed and ready to log in.
              </p>
              <div className="pt-4 border-t border-border/40 space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Auto-confirmed access
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Role-based permissions
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="lg:col-span-2">
            <form
              id="user-create-form"
              onSubmit={handleSave}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-8 border border-border/50 shadow-sm space-y-8">
                {/* Account Details */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-border" />
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="e.g. johndoe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </section>

                {/* Profile Information */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-border" />
                    Profile Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="20"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
                        Grade / Experience Level
                      </label>
                      <select
                        name="user_experience_level"
                        value={formData.user_experience_level}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="">Select level</option>
                        <option value="SCHOOL">School</option>
                        <option value="COLLEGE">College</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="LKG">LKG</option>
                        <option value="UKG">UKG</option>
                        <option value="FIRST">1st Grade</option>
                        <option value="SECOND">2nd Grade</option>
                        <option value="THIRD">3rd Grade</option>
                        {/* Higher grades can be added here */}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Role Assignment */}
                <section className="space-y-4 font-bold uppercase tracking-tight">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-border" />
                    Assign Role *
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableRoles.map((role) => {
                      const Icon = role.icon;
                      const active = formData.user_role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              user_role: role.id,
                            }))
                          }
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                            active
                              ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                              : "bg-gray-50 border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              active ? "text-white" : "text-muted-foreground"
                            )}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {role.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
