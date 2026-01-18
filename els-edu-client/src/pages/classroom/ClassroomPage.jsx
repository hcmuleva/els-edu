import React, { useState, useEffect, useMemo } from "react";
import {
  Title,
  useGetIdentity,
  usePermissions,
  useRedirect,
} from "react-admin";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  PlusCircle,
  Search,
  X,
  Clock,
  Users,
  Play,
  ChevronRight,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { subscribeToClassroomUpdates } from "../../services/ably";
import { GRADES_DISPLAY } from "../../utils/constants";

import classroomService from "../../services/classroomService";
import api from "../../services/api";
const TABS = ["ongoing", "upcoming"];

const ClassroomPage = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const { permissions } = usePermissions();
  const redirect = useRedirect();
  const navigate = useNavigate();
  const location = useLocation(); // Track route changes

  const [activeTab, setActiveTab] = useState("classes");
  const [searchQuery, setSearchQuery] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTeacher = ["ADMIN", "SUPERADMIN", "TEACHER"].includes(permissions);
  const userOrgDocumentId = identity?.org?.documentId;
  const userGrade = identity?.grade;

  console.log("ClassroomPage Render:", {
    identityLoading,
    userOrgDocumentId,
    userGrade,
    identity,
  });

  // Fetch data
  useEffect(() => {
    console.log("ClassroomPage useEffect triggered", {
      identityLoading,
      userOrgDocumentId,
    });

    // Only fetch if identity is loaded
    if (identityLoading) {
      console.log("Waiting for identity...");
      return;
    }

    // If no org ID (e.g. superadmin not in org), stop loading
    if (!userOrgDocumentId) {
      console.warn("No userOrgDocumentId found, aborting fetch.", identity);
      setLoading(false);
      setClassrooms([]);
      setUserAssignments([]);
      return;
    }

    const fetchData = async () => {
      console.log("Starting fetchData...");
      setLoading(true);
      setError(null);

      // Check if student has no class assigned
      if (!isTeacher && !userGrade) {
        console.warn("Student has no userGrade assigned");
        setLoading(false);
        setClassrooms([]);
        setUserAssignments([]);
        setError(
          "You have not been assigned to any class yet. Please contact your administrator.",
        );
        return;
      }

      try {
        // Fetch classrooms
        console.log("Calling classroomService.getClassrooms...");
        const classroomData = await classroomService.getClassrooms(
          userOrgDocumentId,
          !isTeacher ? userGrade : null,
          identity?.documentId,
        );
        console.log("Classroom data received:", classroomData);

        // Collect all assignmentDocumentIds from classrooms
        const allAssignmentIds = classroomData.reduce((ids, classroom) => {
          if (classroom.assignmentDocumentIds?.length > 0) {
            return [...ids, ...classroom.assignmentDocumentIds];
          }
          return ids;
        }, []);

        // Remove duplicates
        const uniqueAssignmentIds = [...new Set(allAssignmentIds)];
        console.log("All assignment IDs:", uniqueAssignmentIds);

        // Fetch assignments from Strapi
        let assignmentsData = [];
        if (uniqueAssignmentIds.length > 0) {
          try {
            const assignmentsResponse = await api.get("/assignments", {
              params: {
                "filters[documentId][$in]": uniqueAssignmentIds,
                populate: "*",
              },
            });
            console.log("Assignments response:", assignmentsResponse.data);
            assignmentsData = assignmentsResponse.data?.data || [];
            setUserAssignments(assignmentsData);
          } catch (assignmentErr) {
            console.error("Error fetching assignments:", assignmentErr);
          }
        }

        // Enrich classrooms with assignment counts based on assignmentDocumentIds
        const enrichedClassrooms = classroomData.map((classroom) => {
          const classroomAssignmentIds = classroom.assignmentDocumentIds || [];
          const assignmentCount = classroomAssignmentIds.length;

          return {
            ...classroom,
            assignmentCount,
          };
        });

        setClassrooms(enrichedClassrooms);
      } catch (err) {
        console.error("Error fetching classroom data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    userOrgDocumentId,
    userGrade,
    isTeacher,
    identity?.documentId,
    identityLoading,
    location.pathname, // Refetch when navigating to this page
  ]);

  // Refetch classrooms when switching tabs to get fresh status
  useEffect(() => {
    // Only refetch if we already have data (not initial load)
    if (classrooms.length > 0 && userOrgDocumentId) {
      classroomService
        .getClassrooms(
          userOrgDocumentId,
          !isTeacher ? userGrade : null,
          identity?.documentId,
        )
        .then((data) => {
          const enriched = data.map((classroom) => ({
            ...classroom,
            assignmentCount: classroom.assignmentDocumentIds?.length || 0,
          }));
          setClassrooms(enriched);
        })
        .catch((err) => console.error("Error refreshing classrooms:", err));
    }
  }, [activeTab]);

  // Real-time updates via Ably
  useEffect(() => {
    if (!userOrgDocumentId) return;

    const handleUpdate = (eventName, data) => {
      console.log(`[Classroom] Real-time update: ${eventName}`, data);

      // If new assignment, refresh assignments by re-fetching
      if (eventName === "new-assignment") {
        if (identity?.documentId) {
          classroomService
            .getUserAssignments(userOrgDocumentId, identity.documentId)
            .then((data) => {
              if (data) setUserAssignments(data);
            })
            .catch((err) =>
              console.error("Error refreshing assignments:", err),
            );
        }
      }
      // If classroom update, refresh classrooms
      else if (eventName === "classroom-update") {
        classroomService
          .getClassrooms(
            userOrgDocumentId,
            !isTeacher ? userGrade : null,
            identity?.documentId,
          )
          .then((data) => setClassrooms(data))
          .catch((err) => console.error("Error refreshing classrooms:", err));
      }
    };

    const unsubscribe = subscribeToClassroomUpdates(
      userOrgDocumentId,
      handleUpdate,
    );

    return () => {
      unsubscribe();
    };
  }, [userOrgDocumentId, identity?.documentId, isTeacher, userGrade]);

  // Filter classrooms based on search
  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const query = searchQuery.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query),
    );
  }, [classrooms, searchQuery]);

  // Categorize classrooms
  const { liveClasses, upcomingClasses, allClasses } = useMemo(() => {
    const now = new Date();
    // "Ongoing" shows live + completed classes (accessible classes)
    const live = filteredClassrooms.filter((c) => c.status === "live");
    const upcoming = filteredClassrooms.filter((c) => c.status === "scheduled");
    return {
      liveClasses: live,
      upcomingClasses: upcoming.slice(0, 5),
      allClasses: filteredClassrooms,
    };
  }, [filteredClassrooms]);

  // Pending assignments count
  const pendingAssignments = useMemo(() => {
    return userAssignments.filter((a) => a.status === "assigned").length;
  }, [userAssignments]);

  const handleCreateClass = () => {
    redirect("/mongo-studio?tab=classrooms&action=create");
  };

  const handleClassClick = (classroomId) => {
    redirect(`/classroom/${classroomId}`);
  };

  const tabs = [
    {
      id: "classes",
      label: "Classes",
      icon: BookOpen,
      count: allClasses.length,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: ClipboardList,
      count: userAssignments.length,
    },
    {
      id: "upcoming",
      label: "Upcoming",
      icon: Calendar,
      count: upcomingClasses.length,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-red-500 text-white";
      case "scheduled":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      case "ended":
        return "bg-gray-500 text-white";
      case "draft":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  if (identityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-0">
      <Title title="Classroom" />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 pt-safe -mx-4 -mt-2 md:-mx-8 md:-mt-6 mb-6">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-8 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-800 font-heading">
                  My Classroom
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base">
                  {isTeacher
                    ? "Manage your classes and assignments"
                    : "View classes and complete assignments"}
                </p>
              </div>
            </div>

            {isTeacher && (
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() =>
                    redirect("/mongo-studio?tab=assignments&action=create")
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors w-full md:w-auto"
                >
                  <ClipboardList className="w-5 h-5" />
                  Create Assignment
                </button>
                <button
                  onClick={handleCreateClass}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors w-full md:w-auto"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create Class
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Classes Banner */}
      {liveClasses.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-lg">LIVE NOW</span>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {liveClasses.slice(0, 3).map((classroom) => (
              <div
                key={classroom._id}
                onClick={() => handleClassClick(classroom._id)}
                className="bg-white/20 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-white/30 transition-colors"
              >
                <h3 className="font-bold text-base sm:text-lg truncate">
                  {classroom.title}
                </h3>
                <p className="text-white/80 text-sm truncate">
                  {classroom.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Join Now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-[80px] z-10 bg-gray-50/95 backdrop-blur-sm py-2 sm:static sm:bg-transparent sm:py-0">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar scroll-smooth snap-x [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm transition-all whitespace-nowrap rounded-lg snap-start ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:min-w-[320px] lg:w-[360px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Classes Tab */}
            {activeTab === "classes" && (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allClasses.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No classes found</p>
                  </div>
                ) : (
                  allClasses.map((classroom) => (
                    <div
                      key={classroom._id}
                      onClick={() => handleClassClick(classroom._id)}
                      className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group shadow-sm min-w-0"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-50 rounded-xl mb-3 overflow-hidden border border-gray-100">
                        {classroom.thumbnail ? (
                          <img
                            src={classroom.thumbnail}
                            alt={classroom.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(
                            classroom.status,
                          )}`}
                        >
                          {classroom.status}
                        </span>
                        {classroom.classTypes?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {classroom.classTypes.join(", ")}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors text-base sm:text-lg">
                        {classroom.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {classroom.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(
                            classroom.startDate || classroom.createdAt,
                          ).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {classroom.contentDocumentIds?.length || 0} Lectures
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          {classroom.assignmentCount || 0} Assignments
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userAssignments.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No assignments found</p>
                  </div>
                ) : (
                  userAssignments.map((assignment) => (
                    <div
                      key={assignment.documentId}
                      onClick={() => {
                        // Find classroom for this assignment
                        const classroom = classrooms.find((c) =>
                          c.assignmentDocumentIds?.includes(
                            assignment.documentId,
                          ),
                        );
                        if (classroom) {
                          navigate(
                            `/assignments/${assignment.documentId}?classroom=${classroom._id}`,
                          );
                        } else {
                          navigate(`/assignments/${assignment.documentId}`);
                        }
                      }}
                      className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col min-w-0 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            assignment.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {assignment.status || "Assigned"}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Due:{" "}
                            {assignment.dueDate
                              ? new Date(
                                  assignment.dueDate,
                                ).toLocaleDateString()
                              : "No due date"}
                          </span>
                        </div>
                        {assignment.maxScore && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            <span>{assignment.maxScore} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Upcoming Tab */}
            {activeTab === "upcoming" && (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingClasses.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming classes</p>
                  </div>
                ) : (
                  upcomingClasses.map((classroom) => (
                    <div
                      key={classroom._id}
                      onClick={() => handleClassClick(classroom._id)}
                      className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group min-w-0"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-50 rounded-lg mb-3 overflow-hidden border border-gray-100 relative">
                        <img
                          src={
                            classroom.thumbnail ||
                            "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400"
                          }
                          alt={classroom.title}
                          className="w-full h-full object-cover grayscale opacity-75"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                            UPCOMING
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1 group-hover:text-primary transition-colors truncate">
                          {classroom.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            {new Date(classroom.startDate).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {classroom.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassroomPage;
