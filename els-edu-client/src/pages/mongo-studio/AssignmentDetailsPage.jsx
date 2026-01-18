import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useNotify, useGetIdentity, Title } from "react-admin";
import {
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Upload,
  X,
  File,
  Image,
  Video,
  Trash2,
} from "lucide-react";
import mongoService from "../../services/mongoService";
import api from "../../services/api";
import { uploadFile } from "../../services/user";
import { useClass } from "../../contexts/ClassContext";

const AssignmentDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get("classroom"); // Get classroomId from URL query
  const navigate = useNavigate();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const { userClass } = useClass();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]); // Support multiple files
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignmentAndSubmission = async () => {
      try {
        setLoading(true);

        // 1. Fetch Assignment Details from Strapi using documentId from URL
        const assignmentData = await mongoService.getAssignmentById(id);
        setAssignment(assignmentData.data);

        // 2. Check MongoDB for existing submission for this user and assignment
        if (identity?.documentId) {
          const submissionsResponse = await api.get(
            "/mongo-studio/userAssignments",
            {
              params: {
                userDocumentId: identity.documentId,
                assignmentDocumentId: id,
                orgDocumentId: identity.org?.documentId,
              },
            }
          );

          const submissions = submissionsResponse.data?.data || [];
          if (submissions.length > 0) {
            setSubmission(submissions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        notify("Failed to load assignment details", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (id && identity) {
      fetchAssignmentAndSubmission();
    }
  }, [id, identity, notify]);

  // Handle file selection - multiple files
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload each file to Strapi
      const uploadedMedias = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("files", file);
        const uploadedFiles = await uploadFile(formData);
        if (uploadedFiles && uploadedFiles[0]) {
          uploadedMedias.push(uploadedFiles[0]);
        }
      }

      setMediaFiles((prev) => [...prev, ...uploadedMedias]);
      notify(`${uploadedMedias.length} file(s) uploaded successfully`, {
        type: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      notify("Failed to upload files", { type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Remove a specific uploaded file
  const handleRemoveFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on mime type
  const getFileIcon = (mime) => {
    if (mime?.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (mime?.startsWith("video/")) return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      notify("Please upload at least one file to submit", { type: "warning" });
      return;
    }

    try {
      setSubmitting(true);

      // Create submission data for MongoDB
      const submissionData = {
        userDocumentId: identity.documentId,
        assignmentDocumentId: id,
        orgDocumentId: identity.org?.documentId,
        classroomId: classroomId || null, // MongoDB classroom ID if available
        classStandard: assignment.classStandards?.[0] || userClass,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        // Store full media objects array
        medias: mediaFiles.map((media) => ({
          id: media.id,
          name: media.name,
          url: media.url,
          mime: media.mime,
          size: media.size,
        })),
      };

      if (submission?._id) {
        // Update existing submission
        await api.put(
          `/mongo-studio/userAssignments/${submission._id}`,
          submissionData
        );
      } else {
        // Create new submission
        await api.post("/mongo-studio/userAssignments", submissionData);
      }

      notify("Assignment submitted successfully!", { type: "success" });

      // Refresh to show submission state
      window.location.reload();
    } catch (error) {
      console.error("Submission error:", error);
      notify("Failed to submit assignment", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">
          Assignment not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { title, description, instructions_text, dueDate, classStandards } =
    assignment;
  const isSubmitted = submission?.status === "submitted";
  const isLate = dueDate && new Date(dueDate) < new Date() && !isSubmitted;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 pb-20">
      <Title title={`Assignment: ${title}`} />

      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            if (classroomId) {
              navigate(`/classroom/${classroomId}`);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
        >
          <div className="p-2 bg-white rounded-full border border-gray-200 group-hover:border-primary group-hover:text-primary transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          <span className="font-medium">Back to Classroom</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Assignment Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden h-full">
              <div className="relative z-10">
                {/* Header Section */}
                <div className="mb-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {classStandards?.map((cls, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100"
                      >
                        {cls}
                      </span>
                    ))}
                    {isSubmitted && (
                      <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-green-100">
                        <CheckCircle size={14} /> Submitted
                      </span>
                    )}
                    {isLate && (
                      <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-red-100">
                        <AlertCircle size={14} /> Overdue
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                    {title}
                  </h1>

                  {dueDate && (
                    <div className="inline-flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-primary" />
                        <span className="font-medium text-gray-700">
                          {new Date(dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        <span className="font-medium text-gray-700">
                          {new Date(dueDate).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-10 space-y-10">
                  {description && (
                    <div className="prose prose-lg max-w-none text-gray-600">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="text-primary" /> Description
                      </h3>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}

                  {instructions_text && (
                    <div className="prose prose-lg max-w-none text-gray-600">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <LinkIcon className="text-primary" /> Instructions
                      </h3>
                      <div
                        className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-100"
                        dangerouslySetInnerHTML={{ __html: instructions_text }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Submission Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                <Upload className="w-6 h-6 text-primary" />
                Submit Assignment
              </h2>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500 border border-green-100">
                    <CheckCircle size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Good Job!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Submitted on{" "}
                    <span className="font-semibold text-gray-900">
                      {submission.submittedAt &&
                        new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </p>

                  {/* Show submitted files */}
                  {submission.medias && submission.medias.length > 0 && (
                    <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-left">
                        Submitted Files
                      </p>
                      <div className="space-y-2">
                        {submission.medias.map((media, idx) => (
                          <a
                            key={idx}
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group"
                          >
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-primary transition-colors">
                              {getFileIcon(media.mime)}
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate flex-1 text-left">
                              {media.name}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <div className="text-blue-500 mt-0.5">
                      <FileText size={18} />
                    </div>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Upload your assignment files here. You can attach multiple
                      images, documents, or videos.
                    </p>
                  </div>

                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center w-full h-full"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                        <Upload size={28} />
                      </div>
                      <p className="text-gray-900 font-bold mb-1">
                        {uploading ? "Uploading..." : "Click to upload"}
                      </p>
                      <p className="text-sm text-gray-400">
                        Maximize file size 50MB
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {mediaFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Files to submit ({mediaFiles.length})
                      </p>
                      {mediaFiles.map((media, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2"
                        >
                          <div className="text-gray-500">
                            {getFileIcon(media.mime)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 truncate flex-1">
                            {media.name}
                          </span>
                          <button
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || mediaFiles.length === 0}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Confirm Submission{" "}
                        <ArrowLeft className="rotate-180" size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailsPage;
