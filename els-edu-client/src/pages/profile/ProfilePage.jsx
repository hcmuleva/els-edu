import React, { useState, useEffect } from "react";
import { Title, useGetIdentity, useDataProvider, useNotify } from "react-admin";
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
  Clock,
  Camera,
  Phone,
} from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";
import { refreshUser } from "../../api/authProvider";
import { uploadFile } from "../../services/user";

const ProfilePage = () => {
  const { identity, refetch } = useGetIdentity();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
      return uploadedFiles[0]?.id;
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
      let profilePictureId = null;
      if (selectedFile) {
        profilePictureId = await uploadProfilePicture();
        if (!profilePictureId) {
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
      if (profilePictureId) {
        updateData.profile_picture = profilePictureId;
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
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-4 py-4 max-w-4xl mx-auto">
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
      <div className="px-4 py-4 pb-20 space-y-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
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

          {/* Stats - Integrated */}
          {!isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Learning Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-blue-600">
                    {stats.totalSubscriptions}
                  </p>
                  <p className="text-xs text-blue-700 font-medium">Courses</p>
                </div>

                <div className="text-center p-3 rounded-xl bg-violet-50">
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-violet-600">
                    {stats.totalQuizAttempts}
                  </p>
                  <p className="text-xs text-violet-700 font-medium">Quizzes</p>
                </div>

                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600">
                    {stats.averageScore}%
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    Avg Score
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-orange-50">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-orange-600">
                    {stats.totalTimeSpent}m
                  </p>
                  <p className="text-xs text-orange-700 font-medium">
                    Time Spent
                  </p>
                </div>
              </div>

              {/* View Progress Button */}
              <button
                onClick={() => navigate("/progress")}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-primary-500 to-violet-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-violet-600 transition-all text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Trophy className="w-4 h-4" />
                View My Progress
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
