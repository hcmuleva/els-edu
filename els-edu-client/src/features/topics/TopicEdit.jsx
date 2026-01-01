import React, { useState, useEffect } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useUpdate,
  useGetOne,
  useGetIdentity,
} from "react-admin";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CustomAsyncMultiSelect } from "../../components/common/CustomAsyncMultiSelect";

export const TopicEdit = () => {
  const { id } = useParams();
  const notify = useNotify();
  const redirect = useRedirect();
  const [update, { isLoading }] = useUpdate();
  const { data: identity } = useGetIdentity();
  const { data: topic, isPending } = useGetOne(
    "topics",
    { id },
    {
      meta: { populate: ["subjects"] },
    }
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    subjects: [],
  });

  // Store full subject objects for initialData
  const [initialSubjects, setInitialSubjects] = useState([]);

  // Load existing data when topic is fetched
  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name || "",
        description: topic.description || "",
        icon: topic.icon || "",
        subjects: topic.subjects?.map((s) => s.documentId || s.id || s) || [],
      });

      // Store the full subject objects for initialData
      if (topic.subjects && Array.isArray(topic.subjects)) {
        const subjectObjects = topic.subjects.filter(
          (s) => typeof s === "object" && (s.documentId || s.id)
        );
        setInitialSubjects(subjectObjects);
      }
    }
  }, [topic]);

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        notify("Please enter a topic name", { type: "warning" });
        return;
      }

      if (!formData.subjects || formData.subjects.length === 0) {
        notify("Please select at least one subject", { type: "warning" });
        return;
      }

      const topicData = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        subjects: formData.subjects,
      };

      await update("topics", { id, data: topicData });

      notify("Topic updated successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error updating topic:", error);
      notify("Error updating topic. Please try again.", { type: "error" });
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading topic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={`Edit ${topic?.name || "Topic"}`} />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to My Contents"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Edit Topic
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Update topic details
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
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-6">
          {/* Topic Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Topic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Algebra, Photosynthesis, Grammar"
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
              autoFocus
            />
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <CustomAsyncMultiSelect
              label="Subjects *"
              resource="subjects"
              optionText="name"
              value={formData.subjects}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, subjects: val }))
              }
              placeholder="Select subjects..."
              initialData={initialSubjects}
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
              placeholder="Brief description of this topic..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Icon (Emoji)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder="📚"
                maxLength={2}
                className="w-20 px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-center text-2xl"
              />
              <div className="flex gap-2 flex-wrap">
                {[
                  "📚",
                  "📖",
                  "✏️",
                  "🧮",
                  "🔬",
                  "🎨",
                  "🎵",
                  "⚽",
                  "🌍",
                  "💡",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: emoji }))
                    }
                    className="w-10 h-10 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
