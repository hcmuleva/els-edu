import React, { useState } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useCreate,
  useGetIdentity,
} from "react-admin";
import { ArrowLeft, Upload, X } from "lucide-react";
import { CustomSelect } from "../../components/common/CustomSelect";

export const CourseCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isLoading }] = useCreate();
  const { data: identity } = useGetIdentity();

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, cover: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCover = () => {
    setFormData((prev) => ({ ...prev, cover: null }));
    setCoverPreview(null);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        notify("Please enter a course name", { type: "warning" });
        return;
      }

      // Prepare payload
      // If there's a file, we usually need FormData for Strapi
      // If no file, JSON is fine. mimicking ContentEdit pattern for file upload

      const hasFile = !!formData.cover;

      const baseData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        condition: formData.condition,
        privacy: formData.privacy,
        visibility: formData.visibility,
        creator: identity?.id,
        publisher: identity?.id,
        organization: identity?.org?.id,
      };

      if (hasFile) {
        const submitData = new FormData();
        submitData.append("data", JSON.stringify(baseData));
        submitData.append("files.cover", formData.cover);

        await create("courses", {
          data: submitData,
          meta: { isFormData: true },
        });
      } else {
        await create("courses", { data: baseData });
      }

      notify("Course created successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error creating course:", error);
      notify("Error creating course. Please try again.", { type: "error" });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title="Create Course" />

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
                Create Course
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Create a comprehensive learning path
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
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Course"}
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

          {/* Cover Image Upload (Manual) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Cover Image
            </label>

            {coverPreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden group border border-border/50">
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeCover}
                    className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    <span className="font-bold text-primary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="e.g., Science, Math"
                className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Subcategory
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subcategory: e.target.value,
                  }))
                }
                placeholder="e.g., Physics, Algebra"
                className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
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
