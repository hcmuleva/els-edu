import React, { useState, useEffect, useMemo } from "react";
import { useGetIdentity } from "react-admin";
import { useNavigate } from "react-router-dom";
import {
  School,
  Play,
  Clock,
  ClipboardList,
  ArrowRight,
  Loader2,
  Radio,
  Calendar,
} from "lucide-react";

/**
 * Classroom Dashboard Section
 * Shows live classes, upcoming classes, and pending assignments for the current user.
 */
import classroomService from "../../services/classroomService";

/**
 * Classroom Dashboard Section
 * Shows live classes, upcoming classes, and pending assignments for the current user.
 */
const ClassroomDashboardSection = () => {
  const { data: identity } = useGetIdentity();
  const navigate = useNavigate();

  const [liveClasses, setLiveClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userOrgDocumentId = identity?.org?.documentId;
  const userGrade = identity?.grade;

  useEffect(() => {
    if (!userOrgDocumentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch classrooms
        const allClassrooms = await classroomService.getClassrooms(
          userOrgDocumentId,
          userGrade,
        );

        // Filter by status
        const live = allClassrooms.filter((c) => c.status === "live");
        const upcoming = allClassrooms.filter((c) => c.status === "scheduled");

        setLiveClasses(live);
        setUpcomingClasses(upcoming.slice(0, 3)); // Show max 3

        // Fetch user assignments
        if (identity?.documentId) {
          const assignments = await classroomService.getUserAssignments(
            userOrgDocumentId,
            identity.documentId,
            "assigned",
          );
          setPendingAssignments(assignments);
        }
      } catch (err) {
        console.error("Error fetching classroom data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userOrgDocumentId, userGrade, identity?.documentId]);

  // Don't show section if no org
  if (!userOrgDocumentId) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Don't render if no classroom data at all
  if (
    liveClasses.length === 0 &&
    upcomingClasses.length === 0 &&
    pendingAssignments.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Live Classes Banner */}
      {liveClasses.length > 0 && (
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-red-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-lg">Live Now</span>
            </div>
          </div>
          <div className="space-y-3">
            {liveClasses.slice(0, 2).map((lc) => (
              <button
                key={lc._id}
                onClick={() => navigate(`/classroom/${lc._id}`)}
                className="w-full bg-white/15 backdrop-blur rounded-xl p-4 text-left hover:bg-white/25 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {lc.title}
                    </h3>
                    <p className="text-sm text-white/80 line-clamp-2 break-words">
                      {lc.description}
                    </p>
                  </div>
                  <Play className="w-8 h-8 text-white flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
          {liveClasses.length > 2 && (
            <button
              onClick={() => navigate("/classroom")}
              className="mt-3 text-sm font-bold text-white/90 hover:text-white flex items-center gap-1"
            >
              +{liveClasses.length - 2} more live classes
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Classroom Quick Stats */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <School className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg text-gray-900">My Classroom</h2>
          </div>
          <button
            onClick={() => navigate("/classroom")}
            className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Pending Assignments */}
          <button
            onClick={() => navigate("/classroom")}
            className="bg-gradient-to-br from-orange-50/50 to-white rounded-2xl md:rounded-xl p-4 text-center hover:shadow-md border border-orange-100/50 transition-all custom-active-scale"
          >
            <ClipboardList className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-orange-600">
              {pendingAssignments.length}
            </p>
            <p className="text-xs font-bold text-orange-700/70 uppercase">
              Pending
            </p>
          </button>

          {/* Upcoming Classes */}
          <button
            onClick={() => navigate("/classroom")}
            className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl md:rounded-xl p-4 text-center hover:shadow-md border border-blue-100/50 transition-all custom-active-scale"
          >
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-blue-600">
              {upcomingClasses.length}
            </p>
            <p className="text-xs font-bold text-blue-700/70 uppercase">
              Upcoming
            </p>
          </button>

          {/* Live Classes Count */}
          <button
            onClick={() => navigate("/classroom")}
            className="bg-gradient-to-br from-red-50/50 to-white rounded-2xl md:rounded-xl p-4 text-center hover:shadow-md border border-red-100/50 transition-all custom-active-scale col-span-2 md:col-span-1"
          >
            <Radio className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-red-600">
              {liveClasses.length}
            </p>
            <p className="text-xs font-bold text-red-700/70 uppercase">
              Live Now
            </p>
          </button>
        </div>

        {/* Upcoming Classes List */}
        {upcomingClasses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Classes
            </h3>
            <div className="space-y-2">
              {upcomingClasses.map((uc) => (
                <button
                  key={uc._id}
                  onClick={() => navigate(`/classroom/${uc._id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  {uc.thumbnail ? (
                    <img
                      src={uc.thumbnail}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                      <School className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {uc.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uc.startDate
                        ? new Date(uc.startDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Starts soon"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomDashboardSection;
