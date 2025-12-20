import React, { useState, useEffect } from "react";
import {
  useDataProvider,
  useNotify,
  useRefresh,
  useGetList,
} from "react-admin";
import {
  GraduationCap,
  Layers,
  FolderTree,
  Search,
  Link2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { TransferListModal } from "../../../components/common/TransferListModal";
import CountListModal from "../../../components/studio/CountListModal";

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${
      active
        ? "bg-white text-primary border-primary shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
        : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700"
    }`}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

// Generic Table Component for Assign Tab
const AssignTable = ({
  resource,
  title,
  columns,
  data,
  total,
  page,
  setPage,
  search,
  setSearch,
  loading,
  onAssign,
  onViewDetails,
  filters, // Add filters prop
}) => {
  return (
    <div className="bg-white rounded-b-xl rounded-tr-xl border border-border/50 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <h3 className="font-bold text-gray-800 whitespace-nowrap">{title}</h3>

        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {/* Course Filters */}
          {resource === "courses" && (
            <>
              <select
                value={filters?.category || ""}
                onChange={(e) => filters.setCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-border/50 rounded-xl bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="">All Categories</option>
                <option value="KIDS">Kids</option>
                <option value="PRIMARY">Primary</option>
                <option value="MIDDLE">Middle</option>
                <option value="SCHOOL">School</option>
                <option value="COLLEGE">College</option>
                <option value="EDUCATION">Education</option>
              </select>
              <select
                value={filters?.subcategory || ""}
                onChange={(e) => filters.setSubcategory(e.target.value)}
                className="px-3 py-2 text-sm border border-border/50 rounded-xl bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="">All Subcategories</option>
                <option value="ACADEMIC">Academic</option>
                <option value="CREATIVITY">Creativity</option>
                <option value="SOFTWARE">Software</option>
              </select>
            </>
          )}

          {/* Subject/Topic Filter */}
          {(resource === "subjects" || resource === "topics") && (
            <select
              value={filters?.grade || ""}
              onChange={(e) => filters.setGrade(e.target.value)}
              className="px-3 py-2 text-sm border border-border/50 rounded-xl bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">All Grades</option>
              <option value="PLAYSCHOOL">Playschool</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="FIRST">1st Grade</option>
              <option value="SECOND">2nd Grade</option>
              <option value="THIRD">3rd Grade</option>
              <option value="FOURTH">4th Grade</option>
              <option value="FIFTH">5th Grade</option>
              <option value="SIXTH">6th Grade</option>
              <option value="SEVENTH">7th Grade</option>
              <option value="EIGHTH">8th Grade</option>
              <option value="NINTH">9th Grade</option>
              <option value="TENTH">10th Grade</option>
              <option value="ELEVENTH">11th Grade</option>
              <option value="TWELFTH">12th Grade</option>
            </select>
          )}

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/50 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-gray-50/50">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16 text-center">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4">
                    <div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div>
                  </td>
                  {columns.map((col, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-gray-100 rounded w-24"></div>
                    </td>
                  ))}
                  <td className="p-4">
                    <div className="h-8 bg-gray-100 rounded w-8 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-12 text-center text-gray-400 font-medium"
                >
                  No items found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-4 text-sm text-gray-500 text-center">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="p-4 text-sm font-medium text-gray-700"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onAssign(row)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                      title="Assign Items"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-white">
          <span className="text-xs font-medium text-gray-500">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of{" "}
            {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 border border-border/50 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-border/50 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = Math.ceil(total / 10);
                const pages = [];
                // Simple logic: Show all if <= 7.
                // Else show 1, 2, ..., current-1, current, current+1, ..., last-1, last
                // This is simplified for reliability. Or just show 1..Total if reasonable, or use ellipsis.

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  if (page <= 4) {
                    pages.push(1, 2, 3, 4, 5, "...", totalPages);
                  } else if (page >= totalPages - 3) {
                    pages.push(
                      1,
                      "...",
                      totalPages - 4,
                      totalPages - 3,
                      totalPages - 2,
                      totalPages - 1,
                      totalPages
                    );
                  } else {
                    pages.push(
                      1,
                      "...",
                      page - 1,
                      page,
                      page + 1,
                      "...",
                      totalPages
                    );
                  }
                }

                return pages.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === "number" && setPage(p)}
                    disabled={typeof p !== "number"}
                    className={`min-w-[32px] h-[32px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                        : typeof p === "number"
                        ? "border border-border/50 hover:bg-gray-50 text-gray-700 hover:border-gray-300"
                        : "text-gray-400 cursor-default"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}
            </div>

            <button
              onClick={() => setPage((p) => (p * 10 < total ? p + 1 : p))}
              disabled={page * 10 >= total}
              className="p-1.5 border border-border/50 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.ceil(total / 10))}
              disabled={page * 10 >= total}
              className="p-1.5 border border-border/50 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AssignTab = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("assignTab.activeTab") || "courses"
  );

  useEffect(() => {
    localStorage.setItem("assignTab.activeTab", activeTab);
  }, [activeTab]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  // Modals state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [countModalOpen, setCountModalOpen] = useState(false);

  // Data for Modals
  const [modalTitle, setModalTitle] = useState("");
  const [currentParent, setCurrentParent] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [assignedItems, setAssignedItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Data for CountListModal
  const [countModalTitle, setCountModalTitle] = useState("");
  const [countModalItems, setCountModalItems] = useState([]);

  // Reset filters when switching tabs
  useEffect(() => {
    setPage(1);
    setSearch("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setGradeFilter("");
  }, [activeTab]);

  // Build Filter Object
  const queryFilter = {
    ...(search ? { q: search } : {}),
  };
  if (activeTab === "courses") {
    if (categoryFilter) queryFilter.category = categoryFilter;
    if (subcategoryFilter) queryFilter.subcategory = subcategoryFilter;
  }
  if (activeTab === "subjects") {
    if (gradeFilter) queryFilter.grade = gradeFilter;
  }
  if (activeTab === "topics") {
    // Filter topics by subject's grade if selected
    if (gradeFilter) queryFilter["subject.grade"] = gradeFilter;
  }

  // Fetch Main Table Data
  const { data, total, isPending } = useGetList(
    activeTab,
    {
      pagination: { page, perPage: 10 },
      sort: { field: "createdAt", order: "DESC" },
      filter: queryFilter,
      meta: {
        populate:
          activeTab === "courses"
            ? { subjects: { populate: "*" } }
            : activeTab === "subjects"
            ? { topics: { populate: "*" } }
            : {
                contents: { populate: "*" },
                subject: { fields: ["name"] },
              },
      },
    },
    {
      keepPreviousData: true,
    }
  );

  // Handlers for Modals
  const handleViewDetails = async (title, parent, resource) => {
    setCountModalTitle(title);
    setModalLoading(true);

    try {
      // Construct filter
      let filter = {};
      if (activeTab === "courses") {
        // Subjects of a course
        filter = { courses: parent.id };
      } else if (activeTab === "subjects") {
        // Topics of a subject
        filter = { subject: parent.id };
      } else if (activeTab === "topics") {
        // Contents of a topic
        filter = { topic: parent.id };
      }

      const { data } = await dataProvider.getList(resource, {
        pagination: { page: 1, perPage: 100 },
        sort: {
          field: resource === "contents" ? "title" : "name",
          order: "ASC",
        },
        filter: filter,
      });

      setCountModalItems(data);
      setCountModalOpen(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      notify("Error loading details", { type: "error" });
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenAssign = async (parent) => {
    setCurrentParent(parent);
    setModalLoading(true);
    setTransferModalOpen(true);

    try {
      let resource = "";
      let relationField = "";
      let assigned = [];

      if (activeTab === "courses") {
        setModalTitle(`Assign Subjects to "${parent.name}"`);
        resource = "subjects";
        relationField = "subjects";
        assigned = parent.subjects || [];
      } else if (activeTab === "subjects") {
        setModalTitle(`Assign Topics to "${parent.name}"`);
        resource = "topics";
        relationField = "topics";
        assigned = parent.topics || [];
      } else if (activeTab === "topics") {
        setModalTitle(`Assign Contents to "${parent.name}"`);
        resource = "contents";
        relationField = "contents";
        assigned = parent.contents || [];
      }

      setAssignedItems(assigned);

      // Fetch all available items
      const { data: allItems } = await dataProvider.getList(resource, {
        pagination: { page: 1, perPage: 1000 },
        sort: {
          field: resource === "contents" ? "title" : "name",
          order: "ASC",
        },
        filter: {},
      });

      // For one-to-many (Subject->Topics, Topic->Contents), items can only belong to one parent.
      // So available items are those NOT assigned to ANY parent (or allowed to be stolen?).
      // For simplified logic matching "TransferList", we usually just show ALL items minus CURRENTLY assigned.
      // If we select an item already assigned to another parent, the backend usually handles the move.
      // UI-wise:
      // - Available = All Items - Assigned Items
      const assignedIds = new Set(assigned.map((i) => i.documentId || i.id));
      const available = allItems.filter(
        (i) => !assignedIds.has(i.documentId || i.id)
      );

      setAvailableItems(available);
    } catch (error) {
      notify("Error loading data", { type: "error" });
      setTransferModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveAssignments = async (newAssignedList) => {
    if (!currentParent) return;
    setModalLoading(true);

    try {
      // Use documentId for relations if available, fallback to id
      const newIds = newAssignedList.map((i) => i.documentId || i.id);
      const resourceId = currentParent.documentId || currentParent.id;

      if (activeTab === "courses") {
        // Many-to-Many: Update parent with list of IDs
        await dataProvider.update("courses", {
          id: resourceId,
          data: { subjects: newIds },
        });
      } else if (activeTab === "subjects") {
        // One-to-Many: Subject has many Topics
        await dataProvider.update("subjects", {
          id: resourceId,
          data: { topics: newIds },
        });
      } else if (activeTab === "topics") {
        // One-to-Many: Topic has many Contents
        await dataProvider.update("topics", {
          id: resourceId,
          data: { contents: newIds },
        });
      }

      notify("Assignments types successfully saved", { type: "success" });
      setTransferModalOpen(false);
      refresh();
    } catch (error) {
      console.error(error);
      notify("Error saving assignments", { type: "error" });
    } finally {
      setModalLoading(false);
    }
  };

  // Define Columns based on Active Tab
  const getColumns = () => {
    if (activeTab === "courses") {
      return [
        { key: "name", label: "Course Name" },
        {
          key: "category",
          label: "Category",
          render: (row) => (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-bold">
              {row.category || "N/A"}
            </span>
          ),
        },
        {
          key: "subjects_count",
          label: "Assigned Subjects",
          render: (row) => (
            <button
              onClick={() =>
                handleViewDetails(`Subjects in "${row.name}"`, row, "subjects")
              }
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                {row.subjects?.length || 0}
              </div>
              Subjects
            </button>
          ),
        },
      ];
    }
    if (activeTab === "subjects") {
      return [
        { key: "name", label: "Subject Name" },
        {
          key: "grade",
          label: "Grade",
          render: (row) => (
            <span className="px-2 py-1 bg-amber-50 rounded text-xs text-amber-600 font-bold border border-amber-100">
              {row.grade || "N/A"}
            </span>
          ),
        },
        {
          key: "topics_count",
          label: "Assigned Topics",
          render: (row) => (
            <button
              onClick={() =>
                handleViewDetails(`Topics in "${row.name}"`, row, "topics")
              }
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                {row.topics?.length || 0}
              </div>
              Topics
            </button>
          ),
        },
      ];
    }
    if (activeTab === "topics") {
      return [
        { key: "name", label: "Topic Name" },
        {
          key: "subject",
          label: "Subject",
          render: (row) =>
            row.subject?.name ? (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <Layers className="w-3 h-3" />
                {row.subject.name}
              </span>
            ) : (
              "-"
            ),
        },
        {
          key: "contents_count",
          label: "Assigned Contents",
          render: (row) => (
            <button
              onClick={() =>
                handleViewDetails(`Contents in "${row.name}"`, row, "contents")
              }
              className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-bold hover:bg-purple-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                {row.contents?.length || 0}
              </div>
              Contents
            </button>
          ),
        },
      ];
    }
    return [];
  };

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex px-4 pt-2 -mb-px">
        <TabButton
          active={activeTab === "courses"}
          onClick={() => setActiveTab("courses")}
          icon={GraduationCap}
        >
          Courses
        </TabButton>
        <TabButton
          active={activeTab === "subjects"}
          onClick={() => setActiveTab("subjects")}
          icon={Layers}
        >
          Subjects
        </TabButton>
        <TabButton
          active={activeTab === "topics"}
          onClick={() => setActiveTab("topics")}
          icon={FolderTree}
        >
          Topics
        </TabButton>
      </div>

      {/* Main Table */}
      <AssignTable
        resource={activeTab}
        title={
          activeTab === "courses"
            ? "Course Subject Assignments"
            : activeTab === "subjects"
            ? "Subject Topic Assignments"
            : "Topic Content Assignments"
        }
        columns={getColumns()}
        data={data || []}
        total={total || 0}
        page={page}
        setPage={setPage}
        search={search}
        setSearch={setSearch}
        loading={isPending}
        onAssign={handleOpenAssign}
        onViewDetails={handleViewDetails}
        filters={{
          category: categoryFilter,
          setCategory: setCategoryFilter,
          subcategory: subcategoryFilter,
          setSubcategory: setSubcategoryFilter,
          grade: gradeFilter,
          setGrade: setGradeFilter,
        }}
      />

      {/* Transfer List Modal (Assigner) */}
      <TransferListModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={modalTitle}
        subtitle="Move items between lists to assign or remove them."
        availableItems={availableItems}
        assignedItems={assignedItems}
        onSave={handleSaveAssignments}
        loading={modalLoading}
        itemLabel={activeTab === "topics" ? "title" : "name"}
      />

      {/* Count List Modal (Viewer) */}
      <CountListModal
        isOpen={countModalOpen}
        onClose={() => {
          setCountModalOpen(false);
          setCountModalItems([]);
          setCountModalTitle("");
        }}
        title={countModalTitle}
        items={countModalItems}
      />
    </div>
  );
};
