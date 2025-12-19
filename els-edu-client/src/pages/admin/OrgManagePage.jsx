import React, { useEffect, useState, useRef } from "react";
import { Title } from "react-admin";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  BookOpen,
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit,
  UserCog,
  GraduationCap,
} from "lucide-react";
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

// Transfer List Modal for assigning courses
const TransferListModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  availableItems,
  assignedItems,
  onSave,
  loading,
  itemLabel = "name",
}) => {
  const [selected, setSelected] = useState(new Set());
  const [localAssigned, setLocalAssigned] = useState([]);
  const [localAvailable, setLocalAvailable] = useState([]);
  const [availableSearch, setAvailableSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [assignedPage, setAssignedPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLocalAssigned(assignedItems || []);
    setLocalAvailable(availableItems || []);
    setSelected(new Set());
    setAvailableSearch("");
    setAssignedSearch("");
    setAvailablePage(1);
    setAssignedPage(1);
  }, [availableItems, assignedItems, isOpen]);

  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const moveToAssigned = () => {
    const toMove = localAvailable.filter((item) =>
      selected.has(item.documentId || item.id)
    );
    setLocalAssigned([...localAssigned, ...toMove]);
    setLocalAvailable(
      localAvailable.filter((item) => !selected.has(item.documentId || item.id))
    );
    setSelected(new Set());
  };

  const moveToAvailable = () => {
    const toMove = localAssigned.filter((item) =>
      selected.has(item.documentId || item.id)
    );
    setLocalAvailable([...localAvailable, ...toMove]);
    setLocalAssigned(
      localAssigned.filter((item) => !selected.has(item.documentId || item.id))
    );
    setSelected(new Set());
  };

  // Filter and paginate
  const filteredAvailable = localAvailable.filter((item) =>
    (item[itemLabel] || item.name || "")
      .toLowerCase()
      .includes(availableSearch.toLowerCase())
  );
  const filteredAssigned = localAssigned.filter((item) =>
    (item[itemLabel] || item.name || "")
      .toLowerCase()
      .includes(assignedSearch.toLowerCase())
  );

  const paginatedAvailable = filteredAvailable.slice(
    (availablePage - 1) * pageSize,
    availablePage * pageSize
  );
  const paginatedAssigned = filteredAssigned.slice(
    (assignedPage - 1) * pageSize,
    assignedPage * pageSize
  );

  const availableTotalPages = Math.ceil(filteredAvailable.length / pageSize);
  const assignedTotalPages = Math.ceil(filteredAssigned.length / pageSize);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 h-full">
            {/* Available List */}
            <div className="flex flex-col border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="text-sm font-semibold mb-2">
                  Available ({filteredAvailable.length})
                </h3>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background"
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    setAvailablePage(1);
                  }}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px]">
                {paginatedAvailable.map((item) => (
                  <div
                    key={item.documentId || item.id}
                    onClick={() => toggleSelect(item.documentId || item.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      selected.has(item.documentId || item.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    {item[itemLabel] || item.name || item.username}
                  </div>
                ))}
                {paginatedAvailable.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items found
                  </p>
                )}
              </div>
              {availableTotalPages > 1 && (
                <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs">
                  <span>
                    {availablePage} / {availableTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setAvailablePage((p) => Math.max(1, p - 1))
                      }
                      disabled={availablePage === 1}
                      className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setAvailablePage((p) =>
                          Math.min(availableTotalPages, p + 1)
                        )
                      }
                      disabled={availablePage >= availableTotalPages}
                      className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-center gap-2">
              <button
                onClick={moveToAssigned}
                disabled={
                  ![...selected].some((id) =>
                    localAvailable.find((i) => (i.documentId || i.id) === id)
                  )
                }
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={moveToAvailable}
                disabled={
                  ![...selected].some((id) =>
                    localAssigned.find((i) => (i.documentId || i.id) === id)
                  )
                }
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Assigned List */}
            <div className="flex flex-col border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                  Assigned ({filteredAssigned.length})
                </h3>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background"
                  value={assignedSearch}
                  onChange={(e) => {
                    setAssignedSearch(e.target.value);
                    setAssignedPage(1);
                  }}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[250px] max-h-[300px]">
                {paginatedAssigned.map((item) => (
                  <div
                    key={item.documentId || item.id}
                    onClick={() => toggleSelect(item.documentId || item.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      selected.has(item.documentId || item.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    {item[itemLabel] || item.name || item.username}
                  </div>
                ))}
                {paginatedAssigned.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items assigned
                  </p>
                )}
              </div>
              {assignedTotalPages > 1 && (
                <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs">
                  <span>
                    {assignedPage} / {assignedTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
                      disabled={assignedPage === 1}
                      className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setAssignedPage((p) =>
                          Math.min(assignedTotalPages, p + 1)
                        )
                      }
                      disabled={assignedPage >= assignedTotalPages}
                      className="px-2 py-1 border rounded disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localAssigned)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Actions Dropdown Component - positioned to avoid overlap
const ActionsDropdown = ({ onEdit, onAssignCourses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-xs hover:bg-muted hover:text-primary transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-2xl py-1 z-[100]"
          style={{ transform: "translateX(0)" }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit User
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssignCourses();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Assign Courses
          </button>
        </div>
      )}
    </div>
  );
};

const OrgManagePage = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ users: 0, courses: 0 });
  const [activeTab, setActiveTab] = useState("users");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // User edit drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);

  // Org courses assignment modal
  const [orgCoursesModalOpen, setOrgCoursesModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [orgCourses, setOrgCourses] = useState([]);
  const [savingOrgCourses, setSavingOrgCourses] = useState(false);

  // User courses assignment modal
  const [userCoursesModalOpen, setUserCoursesModalOpen] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [savingUserCourses, setSavingUserCourses] = useState(false);

  // Success notification
  const [successMessage, setSuccessMessage] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = storedUser?.user_role || "STUDENT";

  const canEditUser = (targetRole) => {
    if (currentUserRole === "SUPERADMIN") return true;
    if (currentUserRole === "ADMIN")
      return targetRole !== "ADMIN" && targetRole !== "SUPERADMIN";
    if (currentUserRole === "TEACHER") return targetRole === "STUDENT";
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
    if (currentUserRole === "ADMIN")
      return roles.filter((r) => r.id !== "ADMIN" && r.id !== "SUPERADMIN");
    if (currentUserRole === "TEACHER")
      return roles.filter((r) => r.id === "STUDENT");
    return roles.filter((r) => r.id === "STUDENT");
  };

  // Fetch org details and stats
  useEffect(() => {
    if (currentUserRole !== "SUPERADMIN") {
      navigate("/");
      return;
    }

    const fetchOrgAndStats = async () => {
      if (!documentId) return;
      try {
        setLoading(true);
        setError(null);

        const orgRes = await api.get("orgs", {
          params: {
            "filters[documentId][$eq]": documentId,
            "pagination[limit]": 1,
          },
        });

        const orgData = orgRes.data?.data?.[0] || orgRes.data?.[0];
        if (!orgData) {
          setError("Organization not found");
          setLoading(false);
          return;
        }
        setOrg(orgData);

        const [usersRes, coursesRes] = await Promise.all([
          api.get("users", {
            params: {
              "pagination[limit]": 1,
              "filters[org][documentId][$eq]": documentId,
            },
          }),
          api.get("courses", {
            params: {
              "pagination[limit]": 1,
              "filters[organizations][documentId][$eq]": documentId,
            },
          }),
        ]);

        const getTotal = (res) =>
          res?.data?.meta?.pagination?.total ??
          res?.headers?.["x-total-count"] ??
          res?.data?.length ??
          0;

        setStats({ users: getTotal(usersRes), courses: getTotal(coursesRes) });
      } catch (e) {
        console.error(e);
        setError(
          e.response?.data?.error?.message ||
            e.message ||
            "Failed to load organization data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrgAndStats();
  }, [documentId, currentUserRole, navigate]);

  useEffect(() => {
    if (!org) return;
    loadTabData(activeTab, page);
  }, [activeTab, page, searchQuery, roleFilter, statusFilter, org]);

  const loadTabData = async (tab, currentPage = 1) => {
    if (!org) return;
    try {
      setLoading(true);
      setActiveTab(tab);
      let res;
      let params = {};

      if (tab === "users") {
        params = {
          start: (currentPage - 1) * pageSize,
          limit: pageSize,
          "populate[org][fields][0]": "org_name",
          "populate[org][fields][1]": "documentId",
          "filters[org][documentId][$eq]": documentId,
        };
        if (searchQuery) {
          params["filters[$or][0][username][$contains]"] = searchQuery;
          params["filters[$or][1][email][$contains]"] = searchQuery;
        }
        if (roleFilter) params["filters[user_role][$eq]"] = roleFilter;
        if (statusFilter) params["filters[user_status][$eq]"] = statusFilter;

        res = await api.get("users", { params });
        const data = res.data?.data || res.data || [];

        let userTotal = parseInt(res.headers?.["x-total-count"]);
        if (isNaN(userTotal)) {
          userTotal =
            data.length >= pageSize
              ? currentPage * pageSize + 1
              : (currentPage - 1) * pageSize + data.length;
        }
        setTotal(userTotal);

        setRows(
          data.map((u) => ({
            id: u.id,
            documentId: u.documentId,
            username: u.username,
            email: u.email,
            role: u.user_role || u.role?.name || "N/A",
            status:
              u.user_status ||
              (u.blocked ? "BLOCKED" : u.confirmed ? "APPROVED" : "PENDING"),
            experience: u.user_experience_level || "-",
            joinedAt: u.createdAt,
            organization: u.org?.org_name || u.org?.name || "-",
            raw: u,
          }))
        );
      } else if (tab === "courses") {
        params = {
          "pagination[page]": currentPage,
          "pagination[pageSize]": pageSize,
          populate: "*",
          "filters[organizations][documentId][$eq]": documentId,
        };
        if (searchQuery) params["filters[name][$contains]"] = searchQuery;
        if (statusFilter) params["filters[condition][$eq]"] = statusFilter;

        res = await api.get("courses", { params });
        const data = res.data?.data || res.data || [];
        setTotal(res.data?.meta?.pagination?.total || 0);
        setRows(
          data.map((c) => ({
            id: c.id,
            documentId: c.documentId,
            name: c.name,
            category: c.category || "-",
            subcategory: c.subcategory || "-",
            status: c.condition || "N/A",
            createdAt: c.createdAt,
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

  // Open org courses assignment modal
  const openOrgCoursesModal = async () => {
    try {
      setLoading(true);
      // Fetch all courses
      const allCoursesRes = await api.get("courses", {
        params: {
          "pagination[limit]": 200,
          "fields[0]": "name",
          "fields[1]": "documentId",
          "fields[2]": "id",
        },
      });
      const all = allCoursesRes.data?.data || allCoursesRes.data || [];

      // Fetch org courses
      const orgCoursesRes = await api.get("courses", {
        params: {
          "pagination[limit]": 200,
          "filters[organizations][documentId][$eq]": documentId,
          "fields[0]": "name",
          "fields[1]": "documentId",
          "fields[2]": "id",
        },
      });
      const assigned = orgCoursesRes.data?.data || orgCoursesRes.data || [];
      const assignedIds = new Set(assigned.map((c) => c.documentId));
      const available = all.filter((c) => !assignedIds.has(c.documentId));

      setAllCourses(available);
      setOrgCourses(assigned);
      setOrgCoursesModalOpen(true);
    } catch (e) {
      console.error(e);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Save org courses
  const saveOrgCourses = async (assignedCourses) => {
    try {
      setSavingOrgCourses(true);
      const courseDocIds = assignedCourses.map((c) => c.documentId);
      await api.put(`orgs/${documentId}`, { data: { courses: courseDocIds } });
      setOrgCoursesModalOpen(false);
      await loadTabData("courses", 1);
      setStats((prev) => ({ ...prev, courses: assignedCourses.length }));
      setSuccessMessage("Courses assigned to organization successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error?.message || "Failed to save courses");
    } finally {
      setSavingOrgCourses(false);
    }
  };

  // Open user courses assignment modal
  const openUserCoursesModal = async (user) => {
    try {
      setSelectedUser(user);
      setLoading(true);

      // Fetch org courses (available to assign)
      const orgCoursesRes = await api.get("courses", {
        params: {
          "pagination[limit]": 200,
          "filters[organizations][documentId][$eq]": documentId,
          "fields[0]": "name",
          "fields[1]": "documentId",
          "fields[2]": "id",
        },
      });
      const available = orgCoursesRes.data?.data || orgCoursesRes.data || [];

      // Fetch user subscriptions
      const subsRes = await api.get("usersubscriptions", {
        params: {
          "pagination[limit]": 200,
          "filters[users_permissions_user][id][$eq]": user.id,
          "populate[course][fields][0]": "name",
          "populate[course][fields][1]": "documentId",
          "populate[course][fields][2]": "id",
        },
      });
      const subs = subsRes.data?.data || subsRes.data || [];
      const assignedCourses = subs
        .map((s) => ({ ...s.course, subDocumentId: s.documentId }))
        .filter(Boolean);
      const assignedIds = new Set(assignedCourses.map((c) => c.documentId));
      const availableCourses = available.filter(
        (c) => !assignedIds.has(c.documentId)
      );

      setAllCourses(availableCourses);
      setUserCourses(assignedCourses);
      setUserCoursesModalOpen(true);
    } catch (e) {
      console.error(e);
      setError("Failed to load user courses");
    } finally {
      setLoading(false);
    }
  };

  // Save user courses
  const saveUserCourses = async (assignedCourses) => {
    if (!selectedUser) return;
    try {
      setSavingUserCourses(true);

      // Get current user subscriptions
      const subsRes = await api.get("usersubscriptions", {
        params: {
          "pagination[limit]": 200,
          "filters[users_permissions_user][id][$eq]": selectedUser.id,
          "populate[course][fields][0]": "documentId",
        },
      });
      const currentSubs = subsRes.data?.data || subsRes.data || [];
      const currentCourseIds = new Set(
        currentSubs.map((s) => s.course?.documentId).filter(Boolean)
      );
      const newCourseIds = new Set(assignedCourses.map((c) => c.documentId));

      // Delete removed subscriptions
      for (const sub of currentSubs) {
        if (
          sub.course?.documentId &&
          !newCourseIds.has(sub.course.documentId)
        ) {
          await api.delete(`usersubscriptions/${sub.documentId}`);
        }
      }

      // Create new subscriptions
      for (const course of assignedCourses) {
        if (!currentCourseIds.has(course.documentId)) {
          await api.post("usersubscriptions", {
            data: {
              users_permissions_user: selectedUser.id,
              course: course.documentId,
              org: documentId,
              subscription_type: "FREE",
              paymentstatus: "ACTIVE",
            },
          });
        }
      }

      setUserCoursesModalOpen(false);
      setSuccessMessage("Courses assigned to user successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.error?.message || "Failed to save user courses"
      );
    } finally {
      setSavingUserCourses(false);
    }
  };

  const renderTableHeader = () => {
    if (activeTab === "users") {
      return (
        <tr className="text-xs text-muted-foreground uppercase bg-muted/40 font-bold">
          <th className="px-4 py-3 text-left w-12">#</th>
          <th className="px-4 py-3 text-left w-1/5">User</th>
          <th className="px-4 py-3 text-left w-1/5">Contact</th>
          <th className="px-4 py-3 text-left w-24">Role</th>
          <th className="px-4 py-3 text-left w-32">Experience</th>
          <th className="px-4 py-3 text-left w-24">Joined</th>
          <th className="px-4 py-3 text-left w-24">Status</th>
          <th className="px-4 py-3 text-left sticky right-0 bg-card z-20 w-20">
            Actions
          </th>
        </tr>
      );
    }
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
          <td className="px-4 py-3 text-sm font-medium text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {row.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{row.username}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  {row.documentId?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.email}
          </td>
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-sky-300 bg-sky-50 text-sky-700 uppercase">
              {row.role}
            </span>
          </td>
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-purple-300 bg-purple-50 text-purple-700 uppercase">
              {row.experience}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "-"}
          </td>
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
          <td className="px-4 py-3 text-sm sticky right-0 bg-card z-10 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.05)]">
            {canEditUser(row.role) ? (
              <ActionsDropdown
                onEdit={() => {
                  setSelectedUser(row.raw);
                  setDrawerOpen(true);
                }}
                onAssignCourses={() => openUserCoursesModal(row.raw)}
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                -
              </span>
            )}
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
  };

  if (currentUserRole !== "SUPERADMIN") return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Title title={`${org?.org_name || "Organization"} | ELS Kids`} />

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-lg flex items-center gap-2 animate-in slide-in-from-top fade-in duration-300">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-2 hover:bg-white/20 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/orgs")}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {org?.org_name || "Loading..."}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage users and courses for this organization.
          </p>
        </div>
        {org && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">{org.org_name}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Users"
          value={stats.users}
          subtitle="In this organization"
          icon={Users}
        />
        <StatCard
          title="Courses"
          value={stats.courses}
          subtitle="Available courses"
          icon={BookOpen}
        />
      </div>

      {/* Tabs and Table */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40 gap-4">
          <div className="flex items-center gap-2">
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
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "users" && (
              <button
                onClick={() => navigate("/users/create")}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-sm transition-all"
              >
                + Add User
              </button>
            )}
            {activeTab === "courses" && (
              <button
                onClick={openOrgCoursesModal}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-sm transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Assign Courses
              </button>
            )}
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
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
              className="px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none cursor-pointer"
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

          <select
            className="px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            {activeTab === "courses" ? (
              <>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
              </>
            ) : (
              <>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="BLOCKED">Blocked</option>
              </>
            )}
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              setStatusFilter("");
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
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
                    colSpan={activeTab === "users" ? 8 : 6}
                    className="px-4 py-20 text-center"
                  >
                    <p className="text-muted-foreground">No records found</p>
                  </td>
                </tr>
              )}
              {rows.map((row, index) => renderTableRow(row, index))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.max(
              (page - 1) * pageSize + 1,
              Math.min(page * pageSize, total)
            )}{" "}
            of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border bg-background disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-3">{page}</span>
            <button
              onClick={() =>
                setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
              }
              disabled={page >= Math.ceil(total / pageSize)}
              className="p-2 rounded-lg border border-border bg-background disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Edit Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/20 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-full max-w-md bg-card border-l shadow-2xl transform transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {selectedUser && (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedUser.username}</h2>
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
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
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
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
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

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm"
                  disabled={updatingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setUpdatingUser(true);
                      await api.put(`users/${selectedUser.id}`, {
                        user_role: selectedUser.user_role,
                        user_status: selectedUser.user_status,
                        blocked: selectedUser.blocked,
                        confirmed: selectedUser.confirmed,
                      });
                      await loadTabData("users");
                      setDrawerOpen(false);
                    } catch (e) {
                      setError(
                        e.response?.data?.error?.message ||
                          "Failed to update user"
                      );
                    } finally {
                      setUpdatingUser(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                  disabled={updatingUser}
                >
                  {updatingUser ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Org Courses Modal */}
      <TransferListModal
        isOpen={orgCoursesModalOpen}
        onClose={() => setOrgCoursesModalOpen(false)}
        title="Assign Courses to Organization"
        subtitle={org?.org_name}
        availableItems={allCourses}
        assignedItems={orgCourses}
        onSave={saveOrgCourses}
        loading={savingOrgCourses}
        itemLabel="name"
      />

      {/* User Courses Modal */}
      <TransferListModal
        isOpen={userCoursesModalOpen}
        onClose={() => setUserCoursesModalOpen(false)}
        title="Assign Courses to User"
        subtitle={
          selectedUser
            ? `${selectedUser.username} (${selectedUser.documentId?.slice(
                0,
                8
              )}...)`
            : ""
        }
        availableItems={allCourses}
        assignedItems={userCourses}
        onSave={saveUserCourses}
        loading={savingUserCourses}
        itemLabel="name"
      />
    </div>
  );
};

export default OrgManagePage;
