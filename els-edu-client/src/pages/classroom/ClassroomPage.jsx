import React, { useState, useEffect, useMemo } from "react";
import {
  Title,
  useGetIdentity,
  usePermissions,
  useRedirect,
} from "react-admin";
import { useNavigate } from "react-router-dom";
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

import classroomService from "../../services/classroomService";
import api from "../../services/api";

const CLASS_STANDARDS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

const ClassroomPage = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const { permissions } = usePermissions();
  const redirect = useRedirect();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("classes");
  const [searchQuery, setSearchQuery] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTeacher = ["ADMIN", "SUPERADMIN", "TEACHER"].includes(permissions);
  const userOrgDocumentId = identity?.org?.documentId;
  const userClassStandard = identity?.classStandard;

  console.log("ClassroomPage Render:", {
    identityLoading,
    userOrgDocumentId,
    userClassStandard,
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
      if (!isTeacher && !userClassStandard) {
        console.warn("Student has no classStandard assigned");
        setLoading(false);
        setClassrooms([]);
        setUserAssignments([]);
        setError(
          "You have not been assigned to any class yet. Please contact your administrator."
        );
        return;
      }

      try {
        // Fetch classrooms
        console.log("Calling classroomService.getClassrooms...");
        const classroomData = await classroomService.getClassrooms(
          userOrgDocumentId,
          !isTeacher ? userClassStandard : null
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
    userClassStandard,
    isTeacher,
    identity?.documentId,
    identityLoading,
  ]);

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
              console.error("Error refreshing assignments:", err)
            );
        }
      }
      // If classroom update, refresh classrooms
      else if (eventName === "classroom-update") {
        classroomService
          .getClassrooms(
            userOrgDocumentId,
            !isTeacher ? userClassStandard : null
          )
          .then((data) => setClassrooms(data))
          .catch((err) => console.error("Error refreshing classrooms:", err));
      }
    };

    const unsubscribe = subscribeToClassroomUpdates(
      userOrgDocumentId,
      handleUpdate
    );

    return () => {
      unsubscribe();
    };
  }, [userOrgDocumentId, identity?.documentId, isTeacher, userClassStandard]);

  // Filter classrooms based on search
  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const query = searchQuery.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [classrooms, searchQuery]);

  // Categorize classrooms
  const { liveClasses, upcomingClasses, allClasses } = useMemo(() => {
    const now = new Date();
    const live = filteredClassrooms.filter((c) => c.status === "live");
    const upcoming = filteredClassrooms.filter((c) => {
      if (c.status !== "scheduled") return false;
      const startDate = new Date(c.startDate);
      return startDate > now;
    });
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
      count: pendingAssignments,
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Title title="Classroom" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-heading">
              My Classroom
            </h1>
            <p className="text-gray-500 font-medium">
              {isTeacher
                ? "Manage your classes and assignments"
                : "View classes and complete assignments"}
            </p>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={handleCreateClass}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create Class
          </button>
        )}
      </div>

      {/* Live Classes Banner */}
      {liveClasses.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-lg">LIVE NOW</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveClasses.slice(0, 2).map((classroom) => (
              <div
                key={classroom._id}
                onClick={() => handleClassClick(classroom._id)}
                className="bg-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/30 transition-colors"
              >
                <h3 className="font-bold text-lg">{classroom.title}</h3>
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-600"
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
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

        {/* Tab Content */}
        <div className="p-6">
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allClasses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No classes found</p>
                    </div>
                  ) : (
                    allClasses.map((classroom) => (
                      <div
                        key={classroom._id}
                        onClick={() => handleClassClick(classroom._id)}
                        className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
                      >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
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
                              classroom.status
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

                        <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                          {classroom.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {classroom.description}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(
                              classroom.startDate || classroom.createdAt
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

                        <div className="flex items-center justify-end mt-3">
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Assignments Tab */}
              {activeTab === "assignments" && (
                <div className="space-y-4">
                  {userAssignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No assignments yet</p>
                    </div>
                  ) : (
                    userAssignments.map((assignment) => (
                      <div
                        key={assignment.documentId}
                        onClick={() =>
                          navigate(`/assignments/${assignment.documentId}`)
                        }
                        className="bg-white border border-gray-100 rounded-xl p-4 pb-6 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">
                              {assignment.title}
                            </h3>
                            {assignment.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                            {assignment.classStandards?.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Classes: {assignment.classStandards.join(", ")}
                              </p>
                            )}
                          </div>
                          <div>
                            {assignment.dueDate && (
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Due</p>
                                <p className="text-sm font-bold text-gray-600">
                                  {new Date(
                                    assignment.dueDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary bg-primary/5 rounded-lg text-xs font-bold hover:bg-primary/10 transition-colors mt-2">
                              View
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {assignment.maxScore && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm font-bold text-primary">
                              Max Score: {assignment.maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Upcoming Tab */}
              {activeTab === "upcoming" && (
                <div className="space-y-4">
                  {upcomingClasses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No upcoming classes</p>
                    </div>
                  ) : (
                    upcomingClasses.map((classroom) => (
                      <div
                        key={classroom._id}
                        className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">
                            {classroom.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {classroom.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              Starts:{" "}
                              {new Date(classroom.startDate).toLocaleString()}
                            </span>
                          </div>
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
    </div>
  );
};

export default ClassroomPage;
