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
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect";

export const ContentCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isLoading }] = useCreate();
  const { data: identity } = useGetIdentity();

  const [formData, setFormData] = useState({
    title: "",
    type: "TEXT",
    youtubeurl: "",
    json_description: null,
    description: "",
    topic: null,
    subjects: [],
    multimedia: [],
  });

  const [multimediaPreview, setMultimediaPreview] = useState([]);

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

      // Determine if we need to use FormData (only if there are files)
      const hasFiles = formData.multimedia.length > 0;

      if (hasFiles) {
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
            creator: identity?.id,
            publishedAt: new Date(),
          })
        );

        // Add multimedia files
        formData.multimedia.forEach((file) => {
          submitData.append(`files.multimedia`, file);
        });

        await create("contents", {
          data: submitData,
          meta: {
            isFormData: true,
          },
        });
      } else {
        // Use regular JSON for text/youtube content
        await create("contents", {
          data: {
            title: formData.title,
            type: formData.type,
            youtubeurl: formData.youtubeurl || null,
            json_description: descriptionBlocks,
            topic: formData.topic,
            subjects: formData.subjects.length > 0 ? formData.subjects : null,
            creator: identity?.id,
          },
        });
      }
      notify("Content created successfully!", { type: "success" });

      setTimeout(() => {
        redirect("/my-contents");
      }, 500);
    } catch (error) {
      console.error("Error creating content:", error);
      notify("Error creating content. Please try again.", { type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title="Create Content" />

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
                Create Content
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Add educational content like videos, images, or documents
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
              {isLoading ? "Saving..." : "Save Content"}
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
              autoFocus
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
              placeholder="Enter content description..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
            />
          </div>

          {/* Topic & Subjects */}
          <div className="grid grid-cols-2 gap-6">
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
                placeholder="Select topic..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Subjects (Optional)
              </label>
              <CustomAsyncSelect
                resource="subjects"
                optionText="name"
                value={formData.subjects[0] || null}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjects: val ? [val] : [],
                  }))
                }
                placeholder="Select subject..."
                allowEmpty
              />
            </div>
          </div>

          {/* Multimedia Upload */}
          {formData.type !== "YOUTUBE" && formData.type !== "TEXT" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Upload Files
              </label>

              {/* Preview */}
              {multimediaPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {multimediaPreview.map((item, index) => (
                    <div key={index} className="relative group">
                      {item.type === "image" ? (
                        <img
                          src={item.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border/50"
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-border/50">
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
              )}

              {/* Upload Area */}
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    <span className="font-bold text-primary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.type === "IMAGE"
                      ? "PNG, JPG, GIF"
                      : formData.type === "VIDEO"
                      ? "MP4, MOV, AVI"
                      : "Any file type"}{" "}
                    up to 50MB
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
