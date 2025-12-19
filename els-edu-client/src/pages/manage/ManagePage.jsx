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
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
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

  // Role management
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = storedUser?.user_role || "STUDENT";

  const canEditUser = (targetRole) => {
    if (currentUserRole === "SUPERADMIN") return true;
    if (currentUserRole === "ADMIN") {
      return targetRole !== "ADMIN" && targetRole !== "SUPERADMIN";
    }
    if (currentUserRole === "TEACHER") {
      return targetRole === "STUDENT";
    }
    return false;
  };

  const getAvailableRoles = () => {
    const roles = [
      { id: "STUDENT", name: "Student" },
      { id: "TEACHER", name: "Teacher" },
      { id: "PARENT", name: "Parent" },
      { id: "MARKETING", name: "Marketing" },
      { id: "ADMIN", name: "Admin" },
      { id: "SUPERADMIN", name: "Super Admin" },
    ];

    if (currentUserRole === "SUPERADMIN") return roles;
    if (currentUserRole === "ADMIN") {
      return roles.filter((r) => r.id !== "ADMIN" && r.id !== "SUPERADMIN");
    }
    if (currentUserRole === "TEACHER") {
      return roles.filter((r) => r.id === "STUDENT");
    }
    return roles.filter((r) => r.id === "STUDENT");
  };
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);

  // Org filter - for SUPERADMIN can select any org, others use their org
  const canSelectOrg = currentUserRole === "SUPERADMIN";
  const currentUserOrgId = storedUser?.org?.id || storedUser?.org || null;
  const [orgs, setOrgs] = useState([]);
  const [orgFilter, setOrgFilter] = useState(""); // documentId or empty for "all"
  const [loadingOrgs, setLoadingOrgs] = useState(false);

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
          api
            .get("topics", { params: { "pagination[limit]": 1 } })
            .catch(() => null),
          api
            .get("quizzes", { params: { "pagination[limit]": 1 } })
            .catch(() => null),
          api
            .get("questions", { params: { "pagination[limit]": 1 } })
            .catch(() => null),
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

        // Initial stats loaded. Data will be fetched by loadTabData triggered by useEffect.
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

  useEffect(() => {
    loadTabData(activeTab, page);
  }, [activeTab, page, searchQuery, roleFilter, statusFilter, orgFilter]);

  // Fetch orgs for SUPERADMIN org selector
  useEffect(() => {
    if (canSelectOrg) {
      setLoadingOrgs(true);
      api
        .get("orgs", {
          params: {
            "pagination[limit]": 100,
            "fields[0]": "id",
            "fields[1]": "org_name",
            "fields[2]": "documentId",
          },
        })
        .then((res) => {
          const orgData = res.data?.data || res.data || [];
          setOrgs(orgData);
        })
        .catch((err) => {
          console.error("Error fetching orgs:", err);
          setOrgs([]);
        })
        .finally(() => {
          setLoadingOrgs(false);
        });
    }
  }, [canSelectOrg]);

  const loadTabData = async (tab, currentPage = 1) => {
    try {
      setLoading(true);
      setActiveTab(tab);
      let res;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      // Determine which org to filter by
      let filterOrgId = null;
      if (canSelectOrg) {
        // SUPERADMIN can select org - use orgFilter if set
        if (orgFilter) {
          // orgFilter is documentId, find the numeric id from orgs list
          const selectedOrg = orgs.find((o) => o.documentId === orgFilter);
          filterOrgId = selectedOrg?.id || null;
        }
        // If no org selected, SUPERADMIN sees all users (filterOrgId stays null)
      } else {
        // Non-SUPERADMIN users see only their org
        filterOrgId =
          storedUser?.org?.id ||
          storedUser?.org ||
          storedUser?.organization?.id ||
          storedUser?.organization;
      }

      let params = {};

      if (tab === "users") {
        params = {
          start: (currentPage - 1) * pageSize,
          limit: pageSize,
          // Populate org with only needed fields
          "populate[org][fields][0]": "org_name",
          "populate[org][fields][1]": "documentId",
        };
        // Apply org filter if set
        if (filterOrgId) {
          params["filters[org][id][$eq]"] = filterOrgId;
        }
        if (searchQuery) {
          params["filters[$or][0][username][$contains]"] = searchQuery;
          params["filters[$or][1][email][$contains]"] = searchQuery;
        }
        if (roleFilter) params["filters[user_role][$eq]"] = roleFilter;
        if (statusFilter) params["filters[user_status][$eq]"] = statusFilter;

        res = await api.get("users", { params });
        const data = res.data?.data || res.data || [];

        // Accurate total count logic for users
        let userTotal = parseInt(res.headers?.["x-total-count"]);
        if (isNaN(userTotal)) {
          // Heuristic if header is missing
          userTotal =
            data.length >= pageSize
              ? currentPage * pageSize + 1
              : (currentPage - 1) * pageSize + data.length;
        }
        setTotal(userTotal);

        setRows(
          data.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.user_role || u.role?.name || "N/A",
            status:
              u.user_status ||
              (u.blocked ? "BLOCKED" : u.confirmed ? "APPROVED" : "PENDING"),
            experience: u.user_experience_level || "-",
            joinedAt: u.createdAt,
            organization: u.org?.org_name || u.org?.name || "-",
            orgDocumentId: u.org?.documentId || null,
            raw: u,
          }))
        );
      } else {
        // Standard Strapi pagination for courses and subjects
        params = {
          "pagination[page]": currentPage,
          "pagination[pageSize]": pageSize,
          populate: "*",
        };

        if (tab === "courses") {
          if (searchQuery) params["filters[name][$contains]"] = searchQuery; // Changed title to name
          if (statusFilter) params["filters[condition][$eq]"] = statusFilter; // Changed course_status to condition

          res = await api.get("courses", { params });
          const data = res.data?.data || res.data || [];
          setTotal(res.data?.meta?.pagination?.total || 0);
          setRows(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              category: c.category || "-",
              subcategory: c.subcategory || "-",
              status: c.condition || "N/A",
              createdAt: c.createdAt,
            }))
          );
        } else if (tab === "subjects") {
          if (searchQuery) params["filters[name][$contains]"] = searchQuery;
          // Subjects don't seem to have a status in the JSON provided, but keeping statusFilter for now if user needs it
          // if (statusFilter) params["filters[subject_status][$eq]"] = statusFilter;

          res = await api.get("subjects", { params });
          const data = res.data?.data || res.data || [];
          setTotal(res.data?.meta?.pagination?.total || 0);
          setRows(
            data.map((s) => ({
              id: s.id,
              name: s.name,
              grade: s.grade || "-",
              level: s.level || "-",
              createdAt: s.createdAt,
            }))
          );
        }
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
        <tr className="text-xs text-muted-foreground uppercase bg-muted/40 font-bold">
          <th className="px-4 py-3 text-left w-12">#</th>
          <th className="px-4 py-3 text-left w-1/5">Student</th>
          <th className="px-4 py-3 text-left w-1/5">Organization</th>
          <th className="px-4 py-3 text-left w-1/5">Contact</th>
          <th className="px-4 py-3 text-left w-24">Role</th>
          <th className="px-4 py-3 text-left w-32">Experience</th>
          <th className="px-4 py-3 text-left w-24">Joined</th>
          <th className="px-4 py-3 text-left w-24">Status</th>
          <th className="px-4 py-3 text-left sticky right-0 bg-card z-20 w-32">
            Actions
          </th>
        </tr>
      );
    }
    if (activeTab === "courses") {
      return (
        <tr className="text-xs text-muted-foreground uppercase bg-muted/40 font-bold">
          <th className="px-4 py-3 text-left w-12">#</th>
          <th className="px-4 py-3 text-left w-1/4">Name</th>
          <th className="px-4 py-3 text-left">Category</th>
          <th className="px-4 py-3 text-left">Subcategory</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Created At</th>
        </tr>
      );
    }
    return (
      <tr className="text-xs text-muted-foreground uppercase bg-muted/40 font-bold">
        <th className="px-4 py-3 text-left w-12">#</th>
        <th className="px-4 py-3 text-left w-1/4">Name</th>
        <th className="px-4 py-3 text-left">Grade</th>
        <th className="px-4 py-3 text-left">Level</th>
        <th className="px-4 py-3 text-left">Created At</th>
      </tr>
    );
  };

  const renderTableRow = (row, index) => {
    const rowNumber = (page - 1) * pageSize + index + 1;
    if (activeTab === "users") {
      return (
        <tr
          key={row.id}
          className="border-b border-border/40 hover:bg-muted/40 transition-colors"
        >
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {rowNumber}
          </td>
          {/* Student */}
          <td className="px-4 py-3 text-sm font-medium text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {row.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{row.username}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  ID: {row.id}
                </span>
              </div>
            </div>
          </td>
          {/* Organization */}
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.organization}
          </td>
          {/* Contact */}
          <td className="px-4 py-3 text-sm text-muted-foreground">
            <div className="flex flex-col">
              <span>{row.email}</span>
            </div>
          </td>
          {/* Role */}
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-sky-300 bg-sky-50 text-sky-700 uppercase">
              {row.role}
            </span>
          </td>
          {/* Experience */}
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-purple-300 bg-purple-50 text-purple-700 uppercase">
              {row.experience}
            </span>
          </td>
          {/* Joined */}
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "-"}
          </td>
          {/* Status */}
          <td className="px-4 py-3 text-sm">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase",
                row.status === "APPROVED" || row.status === "ACTIVE"
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
          <td className="px-4 py-3 text-sm sticky right-0 bg-card z-10 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.05)]">
            {canEditUser(row.role) ? (
              <button
                onClick={() => {
                  setSelectedUser(row.raw);
                  setDrawerOpen(true);
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:bg-muted hover:text-primary transition-all shadow-sm"
              >
                Actions ▾
              </button>
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 px-3">
                Read Only
              </span>
            )}
          </td>
        </tr>
      );
    }
    if (activeTab === "courses") {
      return (
        <tr
          key={row.id}
          className="border-b border-border/40 hover:bg-muted/40 transition-colors"
        >
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {rowNumber}
          </td>
          <td className="px-4 py-3 text-sm font-semibold text-foreground">
            {row.name}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.category}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.subcategory}
          </td>
          <td className="px-4 py-3 text-sm">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase",
                row.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : row.status === "DRAFT" || row.status === "REVIEW"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {row.status}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
          </td>
        </tr>
      );
    }
    return (
      <tr
        key={row.id}
        className="border-b border-border/40 hover:bg-muted/40 transition-colors"
      >
        <td className="px-4 py-3 text-sm text-muted-foreground">{rowNumber}</td>
        <td className="px-4 py-3 text-sm font-semibold text-foreground">
          {row.name}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{row.grade}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{row.level}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
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
            {storedUser?.org?.org_name ? (
              <>
                Organization:{" "}
                <span className="font-semibold text-primary">
                  {storedUser.org.org_name}
                </span>{" "}
                •{" "}
              </>
            ) : null}
            Overview of organisations, courses, subjects and key users.
          </p>
        </div>
        {storedUser?.org?.org_name && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
            <Layers3 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">
              {storedUser.org.org_name}
            </span>
          </div>
        )}
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
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <TabButton
              active={activeTab === "users"}
              onClick={() => {
                setActiveTab("users");
                setPage(1);
              }}
            >
              Users
            </TabButton>
            <TabButton
              active={activeTab === "courses"}
              onClick={() => {
                setActiveTab("courses");
                setPage(1);
              }}
            >
              Courses
            </TabButton>
            <TabButton
              active={activeTab === "subjects"}
              onClick={() => {
                setActiveTab("subjects");
                setPage(1);
              }}
            >
              Subjects
            </TabButton>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "users" &&
              (currentUserRole === "ADMIN" ||
                currentUserRole === "SUPERADMIN") && (
                <button
                  onClick={() => navigate("/users/create")}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-sm transition-all"
                >
                  + Add User
                </button>
              )}
            {loading && (
              <span className="text-xs text-muted-foreground font-medium animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </div>

        {/* Filters Area */}
        <div className="px-6 py-4 border-b border-border/40 bg-card/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {activeTab === "users" && (
            <select
              className="px-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="PARENT">Parent</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}

          {/* Org selector - SUPERADMIN only */}
          {activeTab === "users" && canSelectOrg && (
            <select
              className="px-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer"
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setPage(1);
              }}
              disabled={loadingOrgs}
            >
              <option value="">
                {loadingOrgs ? "Loading orgs..." : "All Organizations"}
              </option>
              {orgs.map((org) => (
                <option key={org.documentId || org.id} value={org.documentId}>
                  {org.org_name || org.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="px-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status / Condition</option>
            {activeTab === "courses" ? (
              <>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
              </>
            ) : (
              <>
                <option value="APPROVED">Approved / Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="BLOCKED">Blocked</option>
                <option value="REJECTED">Rejected</option>
              </>
            )}
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              setStatusFilter("");
              setOrgFilter("");
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left sm:text-center"
          >
            Reset Filters
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full text-left">
            <thead>{renderTableHeader()}</thead>
            <tbody className="divide-y divide-border/40">
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      activeTab === "users"
                        ? 9
                        : activeTab === "courses"
                        ? 6
                        : 5
                    }
                    className="px-4 py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="font-medium">
                        No records found matching your filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setRoleFilter("");
                          setStatusFilter("");
                        }}
                        className="text-primary hover:underline text-sm font-semibold"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row, index) => renderTableRow(row, index))}
            </tbody>
          </table>
        </div>

        {/* Pagination control */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            <span className="text-foreground">{(page - 1) * pageSize + 1}</span>{" "}
            to{" "}
            <span className="text-foreground">
              {Math.min(page * pageSize, total)}
            </span>{" "}
            of <span className="text-foreground">{total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => {
                const pageNum = i + 1;
                // Show current page, first, last, and neighbors
                const totalPages = Math.ceil(total / pageSize);
                const isVisible =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - page) <= 2;

                if (!isVisible) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <span
                        key={pageNum}
                        className="text-muted-foreground px-1"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      page === pageNum
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground font-medium"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
              }
              disabled={page >= Math.ceil(total / pageSize)}
              className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
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
                    {getAvailableRoles().map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
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
