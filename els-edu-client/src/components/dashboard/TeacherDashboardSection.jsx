import React, { useEffect, useState } from "react";
import analyticsService from "../../services/analyticsService";
import { StatCard } from "../analytics/StatCard";
import {
  Users,
  BookOpen,
  ClipboardList,
  ArrowRight,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Award,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

const TeacherDashboardSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsService.getTeacherDashboard();
        setData(res.data);
        // Select first class by default
        if (res.data?.classes?.length > 0) {
          setSelectedClassId(res.data.classes[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading classroom data...
      </div>
    );

  if (!data)
    return (
      <div className="p-8 text-center text-gray-500">No data available</div>
    );

  // Get selected class data
  const selectedClass =
    data.classes?.find((c) => c.id === selectedClassId) || data.classes?.[0];

  // Class performance data for bar chart
  const classPerformanceData = data.classes.map((cls) => ({
    name: cls.name.length > 15 ? cls.name.substring(0, 12) + "..." : cls.name,
    avgGrade: cls.avgGrade,
    students: cls.studentCount,
  }));

  // Assignment completion data from selected class
  const assignmentStats = selectedClass?.assignmentStats || {
    completed: 0,
    submitted: 0,
    assigned: 0,
    missed: 0,
  };
  const totalAssignments = Object.values(assignmentStats).reduce(
    (a, b) => a + b,
    0,
  );

  const assignmentCompletionData = [
    { name: "Completed", value: assignmentStats.completed, color: "#10b981" },
    { name: "Submitted", value: assignmentStats.submitted, color: "#3b82f6" },
    { name: "Pending", value: assignmentStats.assigned, color: "#f59e0b" },
    { name: "Missed", value: assignmentStats.missed, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={data.stats.totalClasses}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={data.stats.totalStudents}
          icon={Users}
          color="violet"
        />
        <StatCard
          title="Active Assignments"
          value={data.stats.activeAssignments}
          icon={ClipboardList}
          color="orange"
        />
        <StatCard
          title="Avg Class Score"
          value={`${
            data.classes.length > 0
              ? Math.round(
                  data.classes.reduce((sum, c) => sum + c.avgGrade, 0) /
                    data.classes.length,
                )
              : 0
          }%`}
          icon={Trophy}
          color="emerald"
        />
      </div>

      {/* Class Selector */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Select Class</h3>
          <span className="text-sm text-gray-400">
            {data.classes.length} classes
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {data.classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedClassId === cls.id
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Class Info Banner */}
      {selectedClass && (
        <div className="bg-gradient-to-r from-primary-500 to-violet-500 p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedClass.name}</h2>
              <p className="text-white/80 text-sm mt-1">
                {selectedClass.studentCount} students • Avg Score:{" "}
                {selectedClass.avgGrade}%
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedClass.topPerformers?.length || 0}
                </p>
                <p className="text-xs text-white/70">Top Performers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedClass.needsAttention?.length || 0}
                </p>
                <p className="text-xs text-white/70">Need Attention</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Performance Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            All Classes Performance
          </h3>
          {classPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value) => [`${value}%`, "Avg Grade"]}
                />
                <Bar dataKey="avgGrade" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No class data available
            </div>
          )}
        </div>

        {/* Assignment Completion Pie Chart - Class Specific */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            Assignment Status ({selectedClass?.name.split(" ")[0]})
          </h3>
          {totalAssignments > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={assignmentCompletionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {assignmentCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No assignment data
            </div>
          )}
        </div>
      </div>

      {/* Top & Bottom Students - Class Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-800">
            <Award className="w-5 h-5" />
            Top Performers - {selectedClass?.name.split(" ")[0]}
          </h3>
          <div className="space-y-3">
            {selectedClass?.topPerformers?.length > 0 ? (
              selectedClass.topPerformers.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {student.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">
                      {student.score}%
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">No data yet</div>
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Needs Attention - {selectedClass?.name.split(" ")[0]}
          </h3>
          <div className="space-y-3">
            {selectedClass?.needsAttention?.length > 0 ? (
              selectedClass.needsAttention.map((student, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-semibold text-gray-800">
                        {student.name}
                      </span>
                      <p className="text-xs text-orange-600">{student.issue}</p>
                    </div>
                  </div>
                  <span className="text-orange-600 font-bold">
                    {student.score}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-emerald-600 py-4 font-medium">
                All students on track! 🎉
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Class List Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg mb-4">All Classes Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Class Name</th>
                <th className="pb-3 font-medium">Students</th>
                <th className="pb-3 font-medium">Avg Grade</th>
                <th className="pb-3 font-medium">Active Tasks</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.classes.length > 0 ? (
                data.classes.map((cls) => (
                  <tr
                    key={cls.id}
                    className={`group hover:bg-gray-50/50 transition-colors cursor-pointer ${
                      selectedClassId === cls.id ? "bg-primary-50/50" : ""
                    }`}
                    onClick={() => setSelectedClassId(cls.id)}
                  >
                    <td className="py-4 font-semibold text-gray-900">
                      {cls.name}
                    </td>
                    <td className="py-4 text-gray-600">{cls.studentCount}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          cls.avgGrade >= 80
                            ? "bg-green-100 text-green-700"
                            : cls.avgGrade >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cls.avgGrade}%
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">
                      {cls.activeAssignments}
                    </td>
                    <td className="py-4">
                      <span
                        className={`capitalize text-xs font-medium px-2 py-1 rounded-full border ${
                          cls.status === "live"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        {cls.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 transition-transform group-hover:translate-x-1">
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No classes found. Create a class to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardSection;
