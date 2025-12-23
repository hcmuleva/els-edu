import React, { useState, useEffect } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useUpdate,
  useGetOne,
  Loading,
} from "react-admin";
import { ArrowLeft, Upload, X } from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";
import { ImageUpload } from "../../components/common/ImageUpload";
import { useParams } from "react-router-dom";
import { uploadFile } from "../../services/user";

export const CourseEdit = () => {
  const { id } = useParams();
  const notify = useNotify();
  const redirect = useRedirect();
  const [update, { isLoading: isUpdating }] = useUpdate();

  const { data: course, isLoading } = useGetOne("courses", { id });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    condition: "DRAFT",
    privacy: "PRIVATE",
    visibility: "GLOBAL",
    cover: null,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || "",
        description: course.description || "",
        category: course.category || "",
        subcategory: course.subcategory || "",
        condition: course.condition || "DRAFT",
        privacy: course.privacy || "PRIVATE",
        visibility: course.visibility || "GLOBAL",
        cover: null,
      });
      if (course.cover?.url) {
        setCoverPreview(course.cover.url);
      }
    }
  }, [course]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        notify("Please select an image file", { type: "error" });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        notify("Image size should be less than 10MB", { type: "error" });
        return;
      }

      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, cover: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCover = () => {
    setSelectedFile(null);
    setFormData((prev) => ({ ...prev, cover: null }));
    setCoverPreview(course?.cover?.url || null);
  };

  const uploadCoverImage = async () => {
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
    try {
      if (!formData.name.trim()) {
        notify("Please enter a course name", { type: "warning" });
        return;
      }

      // Upload cover image if selected
      let coverId = null;
      if (selectedFile) {
        coverId = await uploadCoverImage();
        if (!coverId) {
          return; // Error already notified in uploadCoverImage
        }
      }

      const baseData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        condition: formData.condition,
        privacy: formData.privacy,
        visibility: formData.visibility,
      };

      // Add cover if uploaded
      if (coverId) {
        baseData.cover = coverId;
      }

      await update("courses", { id, data: baseData, previousData: course });

      notify("Course updated successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error updating course:", error);
      notify("Error updating course. Please try again.", { type: "error" });
    }
  };

  const conditionOptions = [
    { id: "DRAFT", name: "Draft" },
    { id: "REVIEW", name: "In Review" },
    { id: "REJECT", name: "Rejected" },
    { id: "APPROVED", name: "Approved" },
    { id: "PUBLISH", name: "Published" },
    { id: "RETIRED", name: "Retired" },
  ];

  const privacyOptions = [
    { id: "PUBLIC", name: "Public" },
    { id: "PRIVATE", name: "Private" },
    { id: "ORG", name: "Organization" },
    { id: "OPEN", name: "Open" },
  ];

  const visibilityOptions = [
    { id: "GLOBAL", name: "Global" },
    { id: "ORG", name: "Organization" },
    { id: "OTHER", name: "Other" },
  ];

  const categoryOptions = [
    { id: "", name: "Select Category" },
    { id: "KIDS", name: "Kids" },
    { id: "PRIMARY", name: "Primary" },
    { id: "MIDDLE", name: "Middle" },
    { id: "SCHOOL", name: "School" },
    { id: "COLLEGE", name: "College" },
    { id: "OLDAGE", name: "Old Age" },
    { id: "SANSKAR", name: "Sanskar" },
    { id: "COMPETION", name: "Competition" },
    { id: "PROJECT", name: "Project" },
    { id: "DIY", name: "DIY" },
    { id: "EDUCATION", name: "Education" },
  ];

  const subcategoryOptions = [
    { id: "", name: "Select Subcategory" },
    { id: "CREATIVITY", name: "Creativity" },
    { id: "COMPETION", name: "Competition" },
    { id: "ACADEMIC", name: "Academic" },
    { id: "ELECTROICS", name: "Electronics" },
    { id: "SOFTWARE", name: "Software" },
    { id: "DHARM", name: "Dharm" },
    { id: "SIKSHA", name: "Siksha" },
    { id: "GYAN", name: "Gyan" },
    { id: "SOCH", name: "Soch" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title="Edit Course" />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to My Studio"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Edit Course
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Update course information
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="px-5 py-2 rounded-lg border border-border/50 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating || uploading}
              className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-6">
          {/* Course Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Advanced Mathematics, Science 101"
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Detailed description of the course..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-y"
            />
          </div>

          {/* Cover Image Upload */}
          <ImageUpload
            value={formData.cover}
            onChange={(file) => {
              // Validate file type
              if (!file.type.startsWith("image/")) {
                notify("Please select an image file", { type: "error" });
                return;
              }

              // Validate file size (10MB max)
              if (file.size > 10 * 1024 * 1024) {
                notify("Image size should be less than 10MB", { type: "error" });
                return;
              }

              setSelectedFile(file);
              setFormData((prev) => ({ ...prev, cover: file }));
              const reader = new FileReader();
              reader.onloadend = () => setCoverPreview(reader.result);
              reader.readAsDataURL(file);
            }}
            onRemove={removeCover}
            preview={coverPreview}
            label="Cover Image"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Category
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, category: val }))
                }
                options={categoryOptions}
                placeholder="Select category..."
              />
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Subcategory
              </label>
              <CustomSelect
                value={formData.subcategory}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, subcategory: val }))
                }
                options={subcategoryOptions}
                placeholder="Select subcategory..."
              />
            </div>

            {/* Condition / Status */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Status
              </label>
              <CustomSelect
                value={formData.condition}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, condition: val }))
                }
                options={conditionOptions}
                placeholder="Select status..."
                color="blue"
              />
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Privacy
              </label>
              <CustomSelect
                value={formData.privacy}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, privacy: val }))
                }
                options={privacyOptions}
                placeholder="Select privacy..."
              />
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Visibility
              </label>
              <CustomSelect
                value={formData.visibility}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, visibility: val }))
                }
                options={visibilityOptions}
                placeholder="Select visibility..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
