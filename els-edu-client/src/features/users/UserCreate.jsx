import React, { useState, useEffect } from "react";
import { useNotify, useRedirect, Title, useDataProvider } from "react-admin";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  GraduationCap,
  Users,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "../../lib/utils";

// All available roles in the system
const allRoleChoices = [
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
  const dataProvider = useDataProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Get current user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = storedUser?.user_role || "STUDENT";
  const currentUserOrg = storedUser?.org;
  // Use numeric id for current user's org (for ADMIN auto-assign)
  const currentUserOrgId = currentUserOrg?.id || null;
  // Also get documentId for SUPERADMIN org selection
  const currentUserOrgDocumentId = currentUserOrg?.documentId || null;

  // Only ADMIN and SUPERADMIN can create users
  const canCreateUsers =
    currentUserRole === "SUPERADMIN" || currentUserRole === "ADMIN";

  // Determine if current user can select org (only SUPERADMIN)
  const canSelectOrg = currentUserRole === "SUPERADMIN";

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUserRole === "SUPERADMIN") return allRoleChoices;
    if (currentUserRole === "ADMIN") {
      return allRoleChoices.filter(
        (r) => r.id !== "ADMIN" && r.id !== "SUPERADMIN"
      );
    }
    // Others shouldn't reach here, but fallback to empty
    return [];
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
    assigned_roles: [{ role: availableRoles[0]?.id || "STUDENT" }],
    org: canSelectOrg ? "" : currentUserOrgDocumentId, // Auto-set org documentId for non-superadmin
  });

  // Redirect if user doesn't have permission to create users
  useEffect(() => {
    if (!canCreateUsers) {
      notify(
        "You don't have permission to create users. Only Admins and Super Admins can create users.",
        { type: "error" }
      );
      redirect("/manage");
    }
  }, [canCreateUsers, notify, redirect]);

  // Fetch orgs for SUPERADMIN
  useEffect(() => {
    if (canSelectOrg) {
      setLoadingOrgs(true);
      dataProvider
        .getList("orgs", {
          pagination: { page: 1, perPage: 100 },
          sort: { field: "org_name", order: "ASC" },
          filter: {},
        })
        .then(({ data }) => {
          setOrgs(data || []);
        })
        .catch((err) => {
          console.error("Error fetching orgs:", err);
          setOrgs([]);
        })
        .finally(() => {
          setLoadingOrgs(false);
        });
    }
  }, [canSelectOrg, dataProvider]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      user_role: roleId,
      // Also update assigned_roles to include the selected role
      assigned_roles: [{ role: roleId }],
    }));
  };

  const toggleAssignedRole = (roleId) => {
    setFormData((prev) => {
      const existing = prev.assigned_roles || [];
      const hasRole = existing.some((r) => r.role === roleId);

      if (hasRole) {
        // Remove role (but keep at least one)
        const filtered = existing.filter((r) => r.role !== roleId);
        return {
          ...prev,
          assigned_roles:
            filtered.length > 0 ? filtered : [{ role: prev.user_role }],
        };
      } else {
        // Add role
        return {
          ...prev,
          assigned_roles: [...existing, { role: roleId }],
        };
      }
    });
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

      if (canSelectOrg && !formData.org) {
        notify("Please select an organization", { type: "warning" });
        return;
      }

      setIsLoading(true);

      // Step 1: Create user with basic fields only (Strapi v5 limitation)
      // The /users endpoint only accepts username, email, password, role, confirmed
      const createPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 1, // Strapi users-permissions "Authenticated" role
        confirmed: true,
      };

      // Use dataProvider.create to get the response data properly
      console.log("Creating user with payload:", createPayload);
      const createResult = await dataProvider.create("users", {
        data: createPayload,
      });
      console.log("User create result:", createResult);

      // Get the created user's numeric id - Strapi v5 uses numeric id for user CUD operations
      const userId = createResult?.data?.id;

      if (!userId) {
        // User was created but we couldn't get the id for update
        console.warn(
          "Could not extract user id from create response:",
          createResult
        );
        notify("User created successfully!", { type: "success" });
        setTimeout(() => redirect("/manage"), 500);
        return;
      }

      console.log("Updating user with id:", userId);

      // Step 2: Update user with additional fields using direct fetch (Strapi expects flat payload, not wrapped in data:{})
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:1337/api";
        const token = localStorage.getItem("token");

        // For org relation, determine numeric id
        let orgId = null;
        if (canSelectOrg && formData.org) {
          // SUPERADMIN selected an org by documentId - fetch numeric id
          try {
            const orgResult = await dataProvider.getList("orgs", {
              filter: { documentId: formData.org },
              pagination: { page: 1, perPage: 1 },
              sort: { field: "id", order: "ASC" },
            });
            orgId = orgResult?.data?.[0]?.id || null;
            console.log("Selected org numeric id:", orgId);
          } catch (orgError) {
            console.warn("Failed to fetch org numeric id:", orgError);
          }
        } else {
          // Non-SUPERADMIN (ADMIN) - use their org's numeric id directly
          orgId = currentUserOrgId;
          console.log("Using current user org id:", orgId);
        }

        const updatePayload = {
          gender: formData.gender || null,
          age: formData.age ? parseInt(formData.age) : null,
          user_experience_level: formData.user_experience_level || null,
          user_role: formData.user_role,
          assigned_roles: formData.assigned_roles,
          org: orgId, // Use numeric id for org relation
        };

        console.log("Update payload:", updatePayload);

        const updateResponse = await fetch(`${apiUrl}/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          console.error("Update response error:", errorData);
          throw new Error(errorData?.error?.message || "Failed to update user");
        }

        const updateResult = await updateResponse.json();
        console.log("User update result:", updateResult);
        notify("User created successfully!", { type: "success" });
      } catch (updateError) {
        console.error("Failed to update user:", updateError);
        // User was created but update failed - still show success with warning
        notify(
          "User created, but some details couldn't be updated. Please edit the user to complete setup.",
          { type: "warning" }
        );
      }

      setTimeout(() => {
        redirect("/manage");
      }, 500);
    } catch (error) {
      console.error("Error creating user:", error);
      notify(error.message || "Error creating user. Please try again.", {
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Title title="Add New User | ELS Kids" />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a new account for your workspace
                {!canSelectOrg && currentUserOrg?.org_name && (
                  <span className="ml-2 text-primary font-semibold">
                    • {currentUserOrg.org_name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => redirect("/manage")}
              className="px-5 py-2.5 rounded-xl border border-border/60 font-bold hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-create-form"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info Cards */}
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
                {canSelectOrg && (
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Org selection enabled
                  </div>
                )}
              </div>
            </div>

            {/* Permission Info */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
                Your Permissions
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                {currentUserRole === "SUPERADMIN" && (
                  <>You can assign any role and select any organization.</>
                )}
                {currentUserRole === "ADMIN" && (
                  <>
                    You can assign all roles except Admin and Super Admin. Users
                    will be added to your organization.
                  </>
                )}
                {currentUserRole === "TEACHER" && (
                  <>
                    You can only create Student accounts in your organization.
                  </>
                )}
              </p>
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
                {/* Organization Selection - SUPERADMIN only */}
                {canSelectOrg && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Select Organization *
                    </h3>
                    <select
                      name="org"
                      value={formData.org}
                      onChange={handleChange}
                      required
                      disabled={loadingOrgs}
                      className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                    >
                      <option value="">
                        {loadingOrgs
                          ? "Loading organizations..."
                          : "Select an organization"}
                      </option>
                      {orgs.map((org) => (
                        <option
                          key={org.documentId || org.id}
                          value={org.documentId}
                        >
                          {org.org_name || org.name}
                        </option>
                      ))}
                    </select>
                  </section>
                )}

                {/* Account Details */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="e.g. johndoe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </section>

                {/* Profile Information */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Profile Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min="1"
                        max="120"
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="Enter age"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Experience Level
                      </label>
                      <select
                        name="user_experience_level"
                        value={formData.user_experience_level}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="">Select level</option>
                        <option value="SCHOOL">School</option>
                        <option value="COLLEGE">College</option>
                        <option value="PROFESSIONAL">Professional</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Primary Role Assignment */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Primary Role *
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select the main role for this user. This determines their
                    default permissions.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableRoles.map((role) => {
                      const Icon = role.icon;
                      const active = formData.user_role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleRoleChange(role.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
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
                          <span className="text-xs font-bold">{role.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Additional Assigned Roles - For SUPERADMIN/ADMIN only */}
                {(currentUserRole === "SUPERADMIN" ||
                  currentUserRole === "ADMIN") && (
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Additional Roles (Optional)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign additional roles to enable role switching. The
                      primary role is always included.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableRoles.map((role) => {
                        const isAssigned = formData.assigned_roles?.some(
                          (r) => r.role === role.id
                        );
                        const isPrimary = formData.user_role === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() =>
                              !isPrimary && toggleAssignedRole(role.id)
                            }
                            disabled={isPrimary}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                              isAssigned
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-gray-50 border-border/60 text-muted-foreground hover:border-primary/40",
                              isPrimary && "opacity-70 cursor-not-allowed"
                            )}
                          >
                            {isAssigned && <Check className="w-3 h-3" />}
                            {role.name}
                            {isPrimary && (
                              <span className="text-[10px] opacity-60">
                                (Primary)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
