import React, { useState, useEffect } from "react";
import {
  useNotify,
  useRedirect,
  Title,
  useGetOne,
  useUpdate,
  useGetIdentity,
  Loading,
} from "react-admin";
import { useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Eye, Edit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CustomSelect } from "../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect";

export const ContentEdit = () => {
  const { id } = useParams();
  const notify = useNotify();
  const redirect = useRedirect();
  const [update, { isLoading: isSubmitting }] = useUpdate();
  const { data: identity } = useGetIdentity();

  const { data: content, isLoading } = useGetOne("contents", {
    id,
    meta: { populate: ["topic", "subjects", "multimedia"] },
  });

  const [formData, setFormData] = useState({
    title: "",
    type: "TEXT",
    youtubeurl: "",
    description: "",
    topic: null,
    subjects: [],
    multimedia: [],
  });

  const [multimediaPreview, setMultimediaPreview] = useState([]);
  const [existingMultimedia, setExistingMultimedia] = useState([]);
  const [isPreview, setIsPreview] = useState(false);

  // Store full objects for initialData
  const [initialTopic, setInitialTopic] = useState(null);
  const [initialSubject, setInitialSubject] = useState(null);

  useEffect(() => {
    if (content) {
      // Helper to extract text from blocks
      const extractDescriptionInfo = (blocks) => {
        if (!blocks || !Array.isArray(blocks)) return "";
        return blocks
          .map((block) => {
            if (block.type === "paragraph" && block.children) {
              return block.children.map((child) => child.text).join("");
            }
            return "";
          })
          .join("\n\n");
      };

      setFormData({
        title: content.title || "",
        type: content.type || "TEXT",
        youtubeurl: content.youtubeurl || "",
        description: extractDescriptionInfo(content.json_description),
        topic: content.topic?.id || null,
        subjects:
          content.subjects?.map((s) => (typeof s === "object" ? s.id : s)) ||
          [],
        multimedia: [], // New files only
      });

      if (content.multimedia) {
        setExistingMultimedia(content.multimedia);
      }

      // Store full objects for initialData
      if (content.topic && typeof content.topic === "object") {
        setInitialTopic(content.topic);
      }
      if (content.subjects?.[0] && typeof content.subjects[0] === "object") {
        setInitialSubject(content.subjects[0]);
      }
    }
  }, [content]);

  const typeOptions = [
    { id: "YOUTUBE", name: "YouTube Video" },
    { id: "VIDEO", name: "Video File" },
    { id: "IMAGE", name: "Image" },
    { id: "MD", name: "Markdown" },
    { id: "TEXT", name: "Text" },
    { id: "DOCUMENT", name: "Document" },
    { id: "DOWNLOAD", name: "Download" },
  ];

  const handleMultimediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        multimedia: [...prev.multimedia, ...files],
      }));

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMultimediaPreview((prev) => [
            ...prev,
            {
              file,
              preview: reader.result,
              type: file.type.startsWith("image/") ? "image" : "file",
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMultimedia = (index) => {
    setFormData((prev) => ({
      ...prev,
      multimedia: prev.multimedia.filter((_, i) => i !== index),
    }));
    setMultimediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Note: We can't easily delete existing files via update without a specific API endpoint or plugin support usually
  // For now, we'll display them but resolving full file management (deleting existing) might require specific backend logic
  // or a separate plugin. Strapi standard update replaces relations but media is tricky.

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.title.trim()) {
        notify("Please enter a title", { type: "warning" });
        return;
      }

      if (!formData.topic) {
        notify("Please select a topic", { type: "warning" });
        return;
      }

      if (formData.type === "YOUTUBE" && !formData.youtubeurl.trim()) {
        notify("Please enter a YouTube URL", { type: "warning" });
        return;
      }

      // Helper to create blocks format
      const createDescriptionBlocks = (text) => {
        if (!text) return null;
        return [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: text,
              },
            ],
          },
        ];
      };

      const descriptionBlocks = createDescriptionBlocks(formData.description);

      // Determine if we need to use FormData (only if there are NEW files)
      const hasNewFiles = formData.multimedia.length > 0;

      if (hasNewFiles) {
        const submitData = new FormData();
        submitData.append(
          "data",
          JSON.stringify({
            title: formData.title,
            type: formData.type,
            youtubeurl: formData.youtubeurl || null,
            json_description: descriptionBlocks,
            topic: formData.topic,
            subjects: formData.subjects.length > 0 ? formData.subjects : null,
            // Don't send creator on update typically, or keep original? Strapi usually handles this.
          })
        );

        // Add multimedia files
        formData.multimedia.forEach((file) => {
          submitData.append(`files.multimedia`, file);
        });

        await update("contents", {
          id,
          data: submitData,
          meta: {
            isFormData: true,
          },
        });
      } else {
        // Use regular JSON
        await update("contents", {
          id,
          data: {
            title: formData.title,
            type: formData.type,
            youtubeurl: formData.youtubeurl || null,
            json_description: descriptionBlocks,
            topic: formData.topic,
            subjects: formData.subjects.length > 0 ? formData.subjects : null,
          },
        });
      }

      notify("Content updated successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error updating content:", error);
      notify("Error updating content. Please try again.", { type: "error" });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={`Edit Content: ${content?.title || ""}`} />

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
                Edit Content
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Update content details and files
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Introduction to Algebra"
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Content Type <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.type}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, type: val }))
              }
              options={typeOptions}
              placeholder="Select content type"
            />
          </div>

          {/* YouTube URL (conditional) */}
          {formData.type === "YOUTUBE" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.youtubeurl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    youtubeurl: e.target.value,
                  }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">
                Description
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsPreview(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                    !isPreview
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                    isPreview
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
              </div>
            </div>

            {isPreview ? (
              <div className="w-full px-4 py-3 rounded-xl border border-border/50 bg-gray-50 min-h-[200px] prose prose-sm max-w-none">
                {formData.description ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <span className="text-gray-400 italic">
                    Nothing to preview
                  </span>
                )}
              </div>
            ) : (
              <>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter content description..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-y font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Supports Markdown (Bold, Italic, Lists, etc.)
                </p>
              </>
            )}
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Subject <span className="text-red-500">*</span>
              </label>
              <CustomAsyncSelect
                resource="subjects"
                optionText="name"
                value={formData.subjects[0] || null}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjects: val ? [val] : [],
                    topic: null, // Clear topic when subject changes
                  }))
                }
                placeholder="Select subject first..."
                initialData={initialSubject}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Topic <span className="text-red-500">*</span>
              </label>
              <CustomAsyncSelect
                resource="topics"
                optionText="name"
                value={formData.topic}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, topic: val }))
                }
                placeholder={
                  formData.subjects[0]
                    ? "Select topic..."
                    : "Select subject first"
                }
                disabled={!formData.subjects[0]}
                filter={
                  formData.subjects[0] ? { subject: formData.subjects[0] } : {}
                }
                initialData={initialTopic}
              />
            </div>
          </div>

          {/* Multimedia Upload */}
          {formData.type !== "YOUTUBE" && formData.type !== "TEXT" && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-foreground">Files</label>

              {/* Existing Files */}
              {existingMultimedia.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Existing Files
                  </span>
                  <div className="grid grid-cols-3 gap-4">
                    {existingMultimedia.map((file, index) => (
                      <div
                        key={file.id || index}
                        className="relative group border border-border/50 rounded-lg overflow-hidden bg-gray-50"
                      >
                        {file.mime?.startsWith("image/") ? (
                          <img
                            src={`${
                              import.meta.env.VITE_API_URL?.replace(
                                "/api",
                                ""
                              ) || ""
                            }${file.url}`}
                            alt={file.name}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center">
                            <span className="text-xs text-gray-500 font-medium truncate px-2">
                              {file.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files Preview */}
              {multimediaPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                    New Files to Upload
                  </span>
                  <div className="grid grid-cols-3 gap-4">
                    {multimediaPreview.map((item, index) => (
                      <div key={index} className="relative group">
                        {item.type === "image" ? (
                          <img
                            src={item.preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-green-200 ring-2 ring-green-100"
                          />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-green-50 rounded-lg border border-green-200 ring-2 ring-green-100">
                            <span className="text-xs text-gray-500 font-medium truncate px-2">
                              {item.file.name}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMultimedia(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    <span className="font-bold text-primary">
                      Click to upload new files
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.type === "IMAGE"
                      ? "PNG, JPG, GIF"
                      : formData.type === "VIDEO"
                      ? "MP4, MOV, AVI"
                      : "Any file type"}{" "}
                    (Appends to existing)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept={
                    formData.type === "IMAGE"
                      ? "image/*"
                      : formData.type === "VIDEO"
                      ? "video/*"
                      : "*"
                  }
                  onChange={handleMultimediaChange}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
