import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Title, useGetIdentity } from "react-admin";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Play,
  Check,
  Clock,
  ChevronRight,
  FileText,
  Video,
  Loader2,
  PlayCircle,
  CheckCircle,
  List,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import classroomService from "../../services/classroomService";
import api from "../../services/api";

const ClassDetailPage = () => {
  const { id: classroomId } = useParams();
  const { data: identity } = useGetIdentity();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [contents, setContents] = useState([]);
  const [progress, setProgress] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("lectures");
  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);

  const userOrgDocumentId = identity?.org?.documentId;

  // Fetch classroom and content details
  useEffect(() => {
    if (!classroomId || !userOrgDocumentId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch classroom
        const classroomData = await classroomService.getClassroom(classroomId);

        // Strapi v5 often wraps single item response in { data: { ... } }
        // Our service returns response.data. If response.data has .data inside (which service does not unwrap for single item get currently),
        // we need to be careful.
        // Looking at service code: return response.data;
        // So here classroomData is the full response object { data: { ... }, meta: {} }
        const classroomObj = classroomData.data;

        setClassroom(classroomObj);

        // Validate org access
        if (classroomObj?.orgDocumentId !== userOrgDocumentId) {
          throw new Error("Access denied - different organization");
        }

        // Fetch content details from Strapi
        if (classroomObj?.contentDocumentIds?.length > 0) {
          const contentIds = classroomObj.contentDocumentIds;
          const contentPromises = contentIds.map((docId) =>
            classroomService.getContent(docId)
          );

          const contentResults = await Promise.all(contentPromises);
          // getContent returns the item object directly or null
          const orderedContents = contentResults.filter(Boolean);
          setContents(orderedContents);
        }

        // Fetch or create progress
        const progressList = await classroomService.getClassProgress(
          classroomId,
          identity?.documentId
        );

        if (progressList.length > 0) {
          setProgress(progressList[0]);
        } else {
          // Create progress record on first access
          const newProgressRes = await classroomService.createClassProgress({
            orgDocumentId: userOrgDocumentId,
            userDocumentId: identity?.documentId,
            classroomId: classroomId,
            progress: {
              completedContentIds: [],
              progressPercentage: 0,
              lastAccessedAt: new Date().toISOString(),
            },
          });
          // mongo-studio returns { data: savedObj }
          if (newProgressRes?.data) {
            setProgress(newProgressRes.data);
          }
        }

        // Fetch assignments from Strapi based on assignmentDocumentIds in classroom
        if (classroomObj?.assignmentDocumentIds?.length > 0) {
          const assignmentIds = classroomObj.assignmentDocumentIds;
          console.log("Fetching assignments for IDs:", assignmentIds);

          // Fetch assignments by documentId
          const assignmentsResponse = await api.get("/assignments", {
            params: {
              "filters[documentId][$in]": assignmentIds,
              populate: "*",
            },
          });

          console.log("Classroom assignments:", assignmentsResponse.data?.data);
          setAssignments(assignmentsResponse.data?.data || []);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error fetching class details:", err);
        setError(err.message || "Failed to load class details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId, userOrgDocumentId, identity?.documentId]);

  // Get active content
  const activeContent = useMemo(() => {
    return contents[activeContentIndex] || null;
  }, [contents, activeContentIndex]);

  // Check if content is completed
  const isContentCompleted = useCallback(
    (contentId) => {
      return (
        progress?.progress?.completedContentIds?.includes(contentId) || false
      );
    },
    [progress]
  );

  // Mark content as completed
  const markContentCompleted = async (contentDocId) => {
    if (!progress || isContentCompleted(contentDocId)) return;

    try {
      const completedIds = [
        ...(progress.progress?.completedContentIds || []),
        contentDocId,
      ];
      const progressPercentage = Math.round(
        (completedIds.length / contents.length) * 100
      );

      const updateData = {
        progress: {
          ...progress.progress,
          completedContentIds: completedIds,
          progressPercentage,
          lastAccessedContentId: contentDocId,
          lastAccessedAt: new Date().toISOString(),
        },
      };

      await classroomService.updateClassProgress(progress._id, updateData); // Use _id for update

      setProgress((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          completedContentIds: completedIds,
          progressPercentage,
          lastAccessedContentId: contentDocId,
        },
      }));
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  // Render media player
  const renderMediaPlayer = () => {
    if (!activeContent) {
      return (
        <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">No content selected</p>
        </div>
      );
    }

    const contentType = activeContent.type;
    const youtubeUrl = activeContent.youtubeurl;
    const multimedia = activeContent.multimedia;

    // YouTube embed
    if (contentType === "YOUTUBE" && youtubeUrl) {
      const videoId = youtubeUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      )?.[1];

      return (
        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
            title={activeContent.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Video file
    if (contentType === "VIDEO" && multimedia?.[0]?.url) {
      return (
        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
          <video
            src={multimedia[0].url}
            controls
            className="w-full h-full"
            onEnded={() => markContentCompleted(activeContent.documentId)}
          />
        </div>
      );
    }

    // Document/Image placeholder
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold">{activeContent.title}</p>
          <p className="text-sm text-gray-400">{contentType} Content</p>
          {multimedia?.[0]?.url && (
            <a
              href={multimedia[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-4 py-2 bg-primary rounded-lg hover:bg-primary/80"
            >
              View Content
            </a>
          )}
        </div>
      </div>
    );
  };

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!contents.length) return 0;
    const completed = progress?.progress?.completedContentIds?.length || 0;
    return Math.round((completed / contents.length) * 100);
  }, [contents, progress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate("/classroom")}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Back to Classroom
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={classroom?.title || "Class Detail"} />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate("/classroom")}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Classroom</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {classroom?.status === "scheduled" ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center p-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500 animate-pulse">
              <Clock className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2 font-heading">
              Class Scheduled
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
              This class hasn't started yet. Content will be available when the
              class goes live.
            </p>

            <div className="inline-flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
              <Calendar className="text-primary w-6 h-6" />
              <div className="text-left">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                  Starts On
                </p>
                <p className="text-gray-900 font-bold text-lg">
                  {classroom.startDate
                    ? new Date(classroom.startDate).toLocaleString()
                    : "Coming Soon"}
                </p>
              </div>
            </div>

            {classroom.description && (
              <div className="mt-12 max-w-2xl mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-100/50">
                <h3 className="font-bold text-gray-800 mb-2">About this Class</h3>
                <p className="text-gray-600 leading-relaxed">
                  {classroom.description}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              {renderMediaPlayer()}

              {/* Content Info */}
              {activeContent && (
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {activeContent.title}
                      </h2>
                      <p className="text-gray-500 text-sm mt-1">
                        Lecture {activeContentIndex + 1} of {contents.length}
                      </p>
                    </div>
                    {!isContentCompleted(activeContent.documentId) && (
                      <button
                        onClick={() =>
                          markContentCompleted(activeContent.documentId)
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                    {isContentCompleted(activeContent.documentId) && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Expandable Description */}
                  {activeContent.description && (
                    <div className="mt-4 border-t pt-4">
                      <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-sm font-bold text-gray-700">
                          Description
                        </span>
                        {showDescription ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {showDescription && (
                        <div className="mt-3 text-sm text-gray-600 leading-relaxed animate-in slide-in-from-top-2">
                          {activeContent.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Class Description */}
              {classroom?.description && (
                <div className="bg-white rounded-xl p-4 border">
                  <h3 className="font-bold text-gray-800 mb-2">
                    About this Class
                  </h3>
                  <p className="text-gray-600">{classroom.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar - Lecture List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border sticky top-20">
                {/* Progress Bar */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">
                      {classroom?.title}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("lectures")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm ${
                      activeTab === "lectures"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Lectures
                  </button>
                  <button
                    onClick={() => setActiveTab("quizzes")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm ${
                      activeTab === "quizzes"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Quizzes
                  </button>
                </div>

                {/* Content List */}
                <div className="max-h-[400px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {activeTab === "lectures" && (
                    <div className="p-2">
                      {contents.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">
                          No lectures yet
                        </p>
                      ) : (
                        contents.map((content, index) => {
                          const isActive = index === activeContentIndex;
                          const isCompleted = isContentCompleted(
                            content.documentId
                          );

                          return (
                            <button
                              key={content.documentId}
                              onClick={() => setActiveContentIndex(index)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isCompleted
                                    ? "bg-green-500 text-white"
                                    : isActive
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <span className="text-xs font-bold">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium text-sm truncate ${
                                    isActive ? "text-primary" : ""
                                  }`}
                                >
                                  {content.title}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  {content.type === "YOUTUBE" ||
                                  content.type === "VIDEO" ? (
                                    <Video className="w-3 h-3" />
                                  ) : (
                                    <FileText className="w-3 h-3" />
                                  )}
                                  {content.type}
                                </p>
                              </div>
                              {isActive && (
                                <PlayCircle className="w-5 h-5 text-primary" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {activeTab === "quizzes" && (
                    <div className="p-4 max-h-[400px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {classroom?.quizIds?.length > 0 ? (
                        <p className="text-gray-500">
                          {classroom.quizIds.length} quiz(es) available
                        </p>
                      ) : (
                        <p className="text-center py-8 text-gray-500">
                          No quizzes for this class
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Assignments Section - Below Tabs */}
                {assignments.length > 0 && (
                  <div className="mt-4 border-t pt-4 pb-2">
                    <h3 className="px-4 pb-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Class Assignments ({assignments.length})
                    </h3>
                    <div className="px-2 space-y-2 max-h-[300px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.documentId}
                          onClick={() =>
                            navigate(
                              `/assignments/${assignment.documentId}?classroom=${classroomId}`
                            )
                          }
                          className="p-3 pb-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">
                                {assignment.title}
                              </p>
                              {assignment.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {assignment.description}
                                </p>
                              )}
                              {assignment.dueDate && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {assignment.maxScore && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Max Score</p>
                                <p className="text-sm font-bold text-primary">
                                  {assignment.maxScore}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetailPage;
```
