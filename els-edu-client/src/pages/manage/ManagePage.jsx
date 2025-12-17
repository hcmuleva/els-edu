import React, { useEffect, useState } from "react";
import { Title } from "react-admin";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, Layers3 } from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";

const StatCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
  <div
    className={cn(
      "bg-card rounded-2xl shadow-sm border border-border/50 p-6 flex flex-col justify-between",
      "hover:shadow-lg hover:border-primary/20 transition-all duration-300 group",
      gradient
    )}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow-inner">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Overview
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-heading font-black text-foreground mb-1">
        {value}
      </h3>
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/80">{subtitle}</p>
      )}
    </div>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-full border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-background text-muted-foreground border-border hover:bg-muted"
    )}
  >
    {children}
  </button>
);

const ManagePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    orgs: { total: 0, users: 0, courses: 0 },
    courses: { total: 0, users: 0, subjects: 0 },
    subjects: { total: 0, topics: 0, quizzes: 0, questions: 0 },
  });
  const [activeTab, setActiveTab] = useState("users");
  const [rows, setRows] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user's org id from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const orgId =
          storedUser?.org?.id ||
          storedUser?.org ||
          storedUser?.organization?.id ||
          storedUser?.organization;

        const [
          orgsRes,
          coursesRes,
          subjectsRes,
          usersRes,
          topicsRes,
          quizzesRes,
          questionsRes,
        ] = await Promise.all([
          api.get("orgs", { params: { "pagination[limit]": 1 } }),
          api.get("courses", { params: { "pagination[limit]": 1 } }),
          api.get("subjects", { params: { "pagination[limit]": 1 } }),
          api.get("users", {
            params: {
              "pagination[limit]": 1,
              ...(orgId && { "filters[org][id][$eq]": orgId }),
            },
          }),
          api.get("topics", { params: { "pagination[limit]": 1 } }).catch(
            () => null
          ),
          api.get("quizzes", { params: { "pagination[limit]": 1 } }).catch(
            () => null
          ),
          api.get("questions", { params: { "pagination[limit]": 1 } }).catch(
            () => null
          ),
        ]);

        const getTotal = (res) =>
          res?.data?.meta?.pagination?.total ?? res?.data?.length ?? 0;

        const totals = {
          orgs: getTotal(orgsRes),
          courses: getTotal(coursesRes),
          subjects: getTotal(subjectsRes),
          users: getTotal(usersRes),
          topics: getTotal(topicsRes),
          quizzes: getTotal(quizzesRes),
          questions: getTotal(questionsRes),
        };

        setStats({
          orgs: {
            total: totals.orgs,
            users: totals.users,
            courses: totals.courses,
          },
          courses: {
            total: totals.courses,
            users: totals.users,
            subjects: totals.subjects,
          },
          subjects: {
            total: totals.subjects,
            topics: totals.topics,
            quizzes: totals.quizzes,
            questions: totals.questions,
          },
        });

        // Load default tab data (users) scoped to current org
        const usersListRes = await api.get("users", {
          params: {
            "pagination[page]": 1,
            "pagination[pageSize]": 10,
            ...(orgId && { "filters[org][id][$eq]": orgId }),
          },
        });
        const usersData = usersListRes.data?.data || usersListRes.data || [];
        setRows(
          usersData.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.user_role || u.role?.name || "N/A",
            status:
              u.user_status ||
              (u.blocked
                ? "BLOCKED"
                : u.confirmed
                ? "APPROVED"
                : "PENDING"),
            experience: u.user_experience_level || "-",
            joinedAt: u.createdAt,
            raw: u,
          }))
        );
      } catch (e) {
        console.error(e);
        setError(
          e.response?.data?.error?.message ||
            e.message ||
            "Failed to load manage data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const loadTabData = async (tab) => {
    try {
      setLoading(true);
      setActiveTab(tab);
      let res;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const orgId =
        storedUser?.org?.id ||
        storedUser?.org ||
        storedUser?.organization?.id ||
        storedUser?.organization;
      if (tab === "users") {
        res = await api.get("users", {
          params: {
            "pagination[page]": 1,
            "pagination[pageSize]": 10,
            ...(orgId && { "filters[org][id][$eq]": orgId }),
          },
        });
        const data = res.data?.data || res.data || [];
        setRows(
          data.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.user_role || u.role?.name || "N/A",
            status:
              u.user_status ||
              (u.blocked
                ? "BLOCKED"
                : u.confirmed
                ? "APPROVED"
                : "PENDING"),
            experience: u.user_experience_level || "-",
            joinedAt: u.createdAt,
            raw: u,
          }))
        );
      } else if (tab === "courses") {
        res = await api.get("courses", {
          params: {
            "pagination[page]": 1,
            "pagination[pageSize]": 10,
          },
        });
        const data = res.data?.data || res.data || [];
        setRows(
          data.map((c) => ({
            id: c.id,
            title: c.title,
            code: c.course_code || c.slug,
            status: c.course_status || "N/A",
            createdAt: c.createdAt,
          }))
        );
      } else if (tab === "subjects") {
        res = await api.get("subjects", {
          params: {
            "pagination[page]": 1,
            "pagination[pageSize]": 10,
          },
        });
        const data = res.data?.data || res.data || [];
        setRows(
          data.map((s) => ({
            id: s.id,
            name: s.name || s.title,
            grade: s.grade || s.level || "N/A",
            status: s.subject_status || "N/A",
            createdAt: s.createdAt,
          }))
        );
      }
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.error?.message ||
          e.message ||
          "Failed to load table data"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderTableHeader = () => {
    if (activeTab === "users") {
      return (
        <tr className="text-xs text-muted-foreground uppercase bg-muted/40">
          <th className="px-4 py-3 text-left w-1/4">Student</th>
          <th className="px-4 py-3 text-left w-1/4">Contact</th>
          <th className="px-4 py-3 text-left w-32">Role</th>
          <th className="px-4 py-3 text-left w-40">Experience</th>
          <th className="px-4 py-3 text-left w-32">Joined</th>
          <th className="px-4 py-3 text-left w-32">Status</th>
          <th className="px-4 py-3 text-left sticky right-0 bg-card z-20 w-32">
            Actions
          </th>
        </tr>
      );
    }
    if (activeTab === "courses") {
      return (
        <tr className="text-xs text-muted-foreground uppercase bg-muted/40">
          <th className="px-4 py-3 text-left">Title</th>
          <th className="px-4 py-3 text-left">Course Code</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Created At</th>
        </tr>
      );
    }
    return (
      <tr className="text-xs text-muted-foreground uppercase bg-muted/40">
        <th className="px-4 py-3 text-left">Name</th>
        <th className="px-4 py-3 text-left">Grade / Level</th>
        <th className="px-4 py-3 text-left">Status</th>
        <th className="px-4 py-3 text-left">Created At</th>
      </tr>
    );
  };

  const renderTableRow = (row) => {
    if (activeTab === "users") {
      return (
        <tr
          key={row.id}
          className="border-b border-border/40 hover:bg-muted/40"
        >
          {/* Student */}
          <td className="px-4 py-3 text-sm font-medium text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                {row.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col">
                <span>{row.username}</span>
                <span className="text-xs text-muted-foreground">@{row.id}</span>
              </div>
            </div>
          </td>
          {/* Contact */}
          <td className="px-4 py-3 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span>{row.email}</span>
            </div>
          </td>
          {/* Role */}
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-sky-300 bg-sky-50 text-sky-700">
              {row.role}
            </span>
          </td>
          {/* Experience */}
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-purple-300 bg-purple-50 text-purple-700">
              {row.experience}
            </span>
          </td>
          {/* Joined */}
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.joinedAt
              ? new Date(row.joinedAt).toLocaleDateString()
              : "-"}
          </td>
          {/* Status */}
          <td className="px-4 py-3 text-sm">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                row.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : row.status === "REJECTED" || row.status === "BLOCKED"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {row.status}
            </span>
          </td>
          {/* Actions - sticky right */}
          <td className="px-4 py-3 text-sm sticky right-0 bg-card z-10 shadow-[ -8px_0_8px_-6px_rgba(15,23,42,0.08)]">
            <button
              onClick={() => {
                setSelectedUser(row.raw);
                setDrawerOpen(true);
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted"
            >
              Actions ▾
            </button>
          </td>
        </tr>
      );
    }
    if (activeTab === "courses") {
      return (
        <tr key={row.id} className="border-b border-border/40 hover:bg-muted/40">
          <td className="px-4 py-3 text-sm font-medium text-foreground">
            {row.title}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.code || "-"}
          </td>
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {row.status}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString()
              : "-"}
          </td>
        </tr>
      );
    }
    return (
      <tr key={row.id} className="border-b border-border/40 hover:bg-muted/40">
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          {row.name}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {row.grade}
        </td>
        <td className="px-4 py-3 text-sm">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700">
            {row.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "-"}
        </td>
      </tr>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Title title="Manage | ELS Kids" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Manage learning space
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of organisations, courses, subjects and key users.
          </p>
        </div>
      </div>

      {/* Top stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Organisations"
          value={stats.orgs.total}
          subtitle={`Users: ${stats.orgs.users} • Courses: ${stats.orgs.courses}`}
          icon={Users}
        />
        <StatCard
          title="Courses"
          value={stats.courses.total}
          subtitle={`Users: ${stats.courses.users} • Subjects: ${stats.courses.subjects}`}
          icon={BookOpen}
        />
        <StatCard
          title="Subjects"
          value={stats.subjects.total}
          subtitle={`Topics: ${stats.subjects.topics} • Quizzes: ${stats.subjects.quizzes} • Questions: ${stats.subjects.questions}`}
          icon={Layers3}
        />
      </div>

      {/* Tabs and table */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40">
          <div className="flex items-center gap-2">
            <TabButton
              active={activeTab === "users"}
              onClick={() => loadTabData("users")}
            >
              Users
            </TabButton>
            <TabButton
              active={activeTab === "courses"}
              onClick={() => loadTabData("courses")}
            >
              Courses
            </TabButton>
            <TabButton
              active={activeTab === "subjects"}
              onClick={() => loadTabData("subjects")}
            >
              Subjects
            </TabButton>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "users" && (
              <button
                onClick={() => navigate("/users/create")}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                + Add User
              </button>
            )}
            {loading && (
              <span className="text-xs text-muted-foreground mr-1">
                Loading...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>{renderTableHeader()}</thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              )}
              {rows.map(renderTableRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for user details / edit */}
      <div
        className={cn(
          "fixed inset-0 z-40 pointer-events-none",
          drawerOpen && "pointer-events-auto"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/20 opacity-0 transition-opacity",
            drawerOpen && "opacity-100"
          )}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Panel */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl transform translate-x-full transition-transform duration-300",
            drawerOpen && "translate-x-0"
          )}
        >
          {selectedUser && (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-heading font-semibold">
                    {selectedUser.username}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Role
                  </h3>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                    value={selectedUser.user_role || ""}
                    onChange={(e) =>
                      setSelectedUser((prev) => ({
                        ...prev,
                        user_role: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select role</option>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="PARENT">Parent</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Status
                  </h3>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                    value={
                      selectedUser.user_status ||
                      (selectedUser.blocked
                        ? "BLOCKED"
                        : selectedUser.confirmed
                        ? "APPROVED"
                        : "PENDING")
                    }
                    onChange={(e) =>
                      setSelectedUser((prev) => ({
                        ...prev,
                        user_status: e.target.value,
                        blocked: e.target.value === "BLOCKED",
                        confirmed: e.target.value === "APPROVED",
                      }))
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted"
                  disabled={updatingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setUpdatingUser(true);
                      setError(null);
                      const payload = {
                        user_role: selectedUser.user_role,
                        user_status: selectedUser.user_status,
                        blocked: selectedUser.blocked,
                        confirmed: selectedUser.confirmed,
                      };
                      await api.put(`users/${selectedUser.id}`, payload);
                      // Refresh current tab data
                      await loadTabData("users");
                      setDrawerOpen(false);
                    } catch (e) {
                      console.error(e);
                      setError(
                        e.response?.data?.error?.message ||
                          e.message ||
                          "Failed to update user"
                      );
                    } finally {
                      setUpdatingUser(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                  disabled={updatingUser}
                >
                  {updatingUser ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePage;


