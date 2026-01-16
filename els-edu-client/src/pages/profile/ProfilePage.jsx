import React, { useState, useEffect, useRef } from "react";
import {
  Title,
  useGetIdentity,
  useDataProvider,
  useNotify,
  useAuthProvider,
  usePermissions,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Award,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Camera,
  Phone,
  LogOut,
  ChevronDown,
  Check,
  Repeat,
  Users,
} from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";
import { refreshUser } from "../../api/authProvider";
import { uploadFile } from "../../services/user";
import { mapClassFromBackend } from "../../config/constants";
import ParentalLockModal from "../../components/auth/ParentalLockModal";

const ProfilePage = () => {
  const { identity, refetch } = useGetIdentity();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const navigate = useNavigate();
  const authProvider = useAuthProvider();
  const { permissions } = usePermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState("down"); // 'up' or 'down'
  const roleButtonRef = useRef(null);

  // Parse assigned_roles from JSON field
  const parseAssignedRoles = (assignedRoles) => {
    if (!assignedRoles) return [];

    try {
      let parsed =
        typeof assignedRoles === "string"
          ? JSON.parse(assignedRoles)
          : assignedRoles;

      if (Array.isArray(parsed)) {
        if (
          parsed.length > 0 &&
          typeof parsed[0] === "object" &&
          parsed[0].role
        ) {
          return parsed.map((r) => r.role);
        }
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          return parsed;
        }
      }

      return [];
    } catch (e) {
      console.error("Error parsing assigned_roles:", e);
      return [];
    }
  };

  // Get available roles for switching
  const assignedRolesArray = parseAssignedRoles(identity?.assigned_roles);
  const availableRoles = [...assignedRolesArray];
  if (permissions && !availableRoles.includes(permissions)) {
    availableRoles.push(permissions);
  }
  if (identity?.user_role && !availableRoles.includes(identity.user_role)) {
    availableRoles.push(identity.user_role);
  }
  const uniqueRoles = [...new Set(availableRoles)];

  // Handle role switch
  const handleRoleSwitch = async (newRole) => {
    if (newRole === permissions) {
      setRoleDropdownOpen(false);
      return;
    }
    try {
      await authProvider.switchRole(newRole);
      notify("Role switched successfully. Reloading...", { type: "success" });
      setRoleDropdownOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error(error);
      notify(error.message || "Error switching role", { type: "error" });
    }
  };

  // Handle logout
  const confirmAndLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    try {
      await authProvider.logout();
    } catch (error) {
      notify("Error logging out", { type: "error" });
    }
  };

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    dob: "",
    gender: "",
    age: "",
  });

  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    totalQuizAttempts: 0,
    averageScore: 0,
    totalTimeSpent: 0,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteLock, setShowDeleteLock] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (identity) {
      setFormData({
        first_name: identity.first_name || "",
        last_name: identity.last_name || "",
        email: identity.email || "",
        mobile_number: identity.mobile_number || "",
        dob: identity.dob ? identity.dob.split("T")[0] : "",
        gender: identity.gender?.toLowerCase() || "",
        age: identity.age || "",
      });

      // Set profile picture preview
      if (identity.profile_picture?.url) {
        setImagePreview(identity.profile_picture.url);
      }
    }
  }, [identity]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!identity?.id) return;

      try {
        const { data: subs } = await dataProvider.getList("usersubscriptions", {
          filter: { user: identity.id },
          pagination: { page: 1, perPage: 1000 },
        });

        const { data: results } = await dataProvider.getList("quiz-results", {
          filter: { user: identity.id },
          pagination: { page: 1, perPage: 1000 },
        });

        const averageScore =
          results.length > 0
            ? Math.round(
                results.reduce((sum, r) => sum + r.percentage, 0) /
                  results.length
              )
            : 0;

        const totalTime = results.reduce(
          (sum, r) => sum + (r.timeTaken || 0),
          0
        );

        setStats({
          totalSubscriptions: subs.length || 0,
          totalQuizAttempts: results.length || 0,
          averageScore,
          totalTimeSpent: Math.round(totalTime / 60),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [identity, dataProvider]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        notify("Please select an image file", { type: "error" });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        notify("Image size should be less than 5MB", { type: "error" });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async () => {
    if (!selectedFile) return null;

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append("files", selectedFile);

      // Upload using service
      const uploadedFiles = await uploadFile(formData);
      return uploadedFiles[0];
    } catch (error) {
      console.error("Error uploading image:", error);
      notify("Failed to upload image", { type: "error" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!identity?.id) return;

    try {
      setLoading(true);

      // Upload profile picture if selected
      let uploadedImage = null;
      if (selectedFile) {
        uploadedImage = await uploadProfilePicture();
        if (!uploadedImage) {
          setLoading(false);
          return;
        }
      }

      // Calculate age from DOB if provided
      let calculatedAge = formData.age;
      if (formData.dob) {
        const birthDate = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        calculatedAge = age;
      }

      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile_number
          ? parseInt(formData.mobile_number)
          : null,
        dob: formData.dob || null,
        gender: formData.gender ? formData.gender.toUpperCase() : null,
        age: calculatedAge ? parseInt(calculatedAge) : null,
      };

      // Add profile picture if uploaded
      if (uploadedImage) {
        updateData.profile_picture = uploadedImage.id;

        // Update preview immediately with the new URL to reflect change
        const serverUrl = uploadedImage.url.startsWith("http")
          ? uploadedImage.url
          : `${import.meta.env.VITE_API_URL || "http://localhost:1337"}${
              uploadedImage.url
            }`;
        setImagePreview(serverUrl);
      }

      // Send flat payload, not wrapped in data
      await dataProvider.update("users", {
        id: identity.id,
        data: updateData,
      });

      // Refresh user data from API + update local storage + update react-admin identity state
      await refreshUser();
      await refetch();

      notify("Profile updated successfully", { type: "success" });
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      notify("Failed to update profile", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: identity.first_name || "",
      last_name: identity.last_name || "",
      email: identity.email || "",
      mobile_number: identity.mobile_number || "",
      dob: identity.dob ? identity.dob.split("T")[0] : "",
      gender: identity.gender?.toLowerCase() || "",
      age: identity.age || "",
    });
    setIsEditing(false);
    setSelectedFile(null);
    setImagePreview(identity.profile_picture?.url || null);
  };

  if (!identity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const displayName =
    identity.first_name && identity.last_name
      ? `${identity.first_name} ${identity.last_name}`
      : identity.username;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-white to-violet-50/20">
      <Title title="My Profile" />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 -mx-4 -mt-2 md:-mx-8 md:-mt-6 mb-4">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-8 md:py-6 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              My Profile
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all text-sm flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-4 pb-20 space-y-4 w-full">
        <div className="bg-white md:rounded-2xl border-y md:border border-gray-100 p-4 shadow-sm">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {(identity.first_name || identity.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              {isEditing && (
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500">@{identity.username}</p>
              {identity.email && (
                <p className="text-xs text-gray-400 mt-1">{identity.email}</p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="Enter first name"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {identity.first_name || "Not set"}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="Enter last name"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {identity.last_name || "Not set"}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="Enter email"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {identity.email || "Not set"}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mobile Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_number: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="Enter mobile number"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {identity.mobile_number || "Not set"}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Date of Birth
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {identity.dob
                    ? new Date(identity.dob).toLocaleDateString()
                    : "Not set"}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Gender
              </label>
              {isEditing ? (
                <CustomSelect
                  value={formData.gender}
                  onChange={(val) => setFormData({ ...formData, gender: val })}
                  options={[
                    { id: "male", name: "Male" },
                    { id: "female", name: "Female" },
                  ]}
                  placeholder="Select Gender"
                />
              ) : (
                <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">
                  {identity.gender?.toLowerCase() || "Not set"}
                </div>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Age
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 py rounded-lg">
                {identity.age || "Not set"}
              </div>
            </div>

            {/* Class Standard (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Class Standard{" "}
                <span className="text-xs font-normal text-gray-400">
                  (Locked)
                </span>
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-between">
                <span>
                  {identity.class_standard
                    ? mapClassFromBackend(identity.class_standard)
                    : "Not set"}
                </span>
                <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                  Read Only
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={loading || uploading}
                className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-violet-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading || uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {uploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading || uploading}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          {/* Account Actions */}
          {/* Account Actions */}
          {!isEditing && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 px-1">
                Account & Settings
              </h3>

              <div className="space-y-6">
                {/* Identity Management Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Switch Profile (Kid/Parent) */}
                  {identity?.control_type === "PARENT" && (
                    <button
                      onClick={() => {
                        localStorage.removeItem("current_role");
                        navigate("/role-selection");
                      }}
                      className="group relative w-full px-6 py-5 bg-indigo-50/50 hover:bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 text-indigo-900 rounded-2xl font-bold transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base">Switch Profile</div>
                        <div className="text-xs text-indigo-400 font-medium opacity-75">
                          Parent / Student View
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Current Role Display */}
                  <div className="w-full px-6 py-5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Current Role
                      </div>
                      <div className="text-base font-black text-gray-900 capitalize">
                        {permissions || identity?.user_role || "Guest"}
                      </div>
                    </div>
                  </div>

                  {/* Role Switcher Button */}
                  {uniqueRoles.length > 1 && (
                    <div className="relative">
                      <button
                        ref={roleButtonRef}
                        onClick={() => {
                          if (!roleDropdownOpen && roleButtonRef.current) {
                            const rect =
                              roleButtonRef.current.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const estimatedDropdownHeight =
                              uniqueRoles.length * 50 + 60;
                            setDropdownDirection(
                              spaceBelow < estimatedDropdownHeight
                                ? "up"
                                : "down"
                            );
                          }
                          setRoleDropdownOpen(!roleDropdownOpen);
                        }}
                        className="group w-full px-6 py-5 bg-violet-50/50 hover:bg-violet-50 border-2 border-violet-100 hover:border-violet-200 text-violet-900 rounded-2xl font-bold transition-all text-left flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                          </div>
                          <span>Switch Account Role</span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-violet-400 transition-transform ${
                            roleDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {roleDropdownOpen && (
                        <div
                          className={`absolute left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden ${
                            dropdownDirection === "up"
                              ? "bottom-full mb-2"
                              : "top-full mt-2"
                          }`}
                        >
                          <div className="p-2">
                            <p className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                              Available Roles
                            </p>
                            {uniqueRoles.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleSwitch(role)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between gap-2 transition-all my-1 ${
                                  role === permissions
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <span>{role}</span>
                                {role === permissions && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* View Progress Button */}
                  <button
                    onClick={() => navigate("/progress")}
                    className="group px-6 py-4 bg-gradient-to-r from-primary-500 to-violet-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary-500/20 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    View My Progress
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={() => confirmAndLogout()}
                    className="px-6 py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-50 hover:border-red-100 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>

                  {/* Delete Account */}
                  {(!identity?.control_type ||
                    identity.control_type === "PARENT") && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-4 bg-transparent border-2 border-gray-100 text-gray-400 rounded-2xl font-semibold hover:bg-gray-50 hover:text-gray-600 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      Delete Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Warning */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Account?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                If you delete your account,{" "}
                <strong>you cannot recover it</strong>. All your purchases,
                subscriptions, and progress will be permanently lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setShowDeleteLock(true);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification for Deletion */}
      <ParentalLockModal
        isOpen={showDeleteLock}
        onClose={() => setShowDeleteLock(false)}
        correctPin={identity?.parental_lock_code}
        onSuccess={async () => {
          setShowDeleteLock(false);
          try {
            await dataProvider.delete("users", {
              id: identity.id,
              previousData: identity,
            });
            // Logout after delete
            authProvider.logout();
          } catch (error) {
            console.error("Delete failed", error);
            notify("Failed to delete account. Please try again.", {
              type: "error",
            });
          }
        }}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sign Out?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
