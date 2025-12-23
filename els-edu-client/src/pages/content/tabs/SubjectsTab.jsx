import React, { useState, useEffect } from "react";
import {
  useGetList,
  useGetIdentity,
  Loading,
  useDelete,
  useNotify,
  useRedirect,
} from "react-admin";
import {
  Layers,
  Eye,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Calendar,
  RotateCcw,
  BookOpen,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";
import ImagePreview from "../../../components/studio/ImagePreview";
import CountListModal from "../../../components/studio/CountListModal";

// Helper function to get level label
const getLevelLabel = (level) => {
  const labels = {
    1: "Level 1 - Beginner",
    2: "Level 2 - Elementary",
    3: "Level 3 - Intermediate",
    4: "Level 4 - Advanced",
    5: "Level 5 - Expert",
  };
  return labels[level] || `Level ${level}`;
};

const SubjectViewModal = ({ subject, onClose }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!subject) return null;

  const getGradeLabel = (grade) => {
    const labels = {
      PLAYSCHOOL: "Play School",
      LKG: "LKG",
      UKG: "UKG",
      FIRST: "1st Grade",
      SECOND: "2nd Grade",
      THIRD: "3rd Grade",
      FOURTH: "4th Grade",
      FIFTH: "5th Grade",
      SIXTH: "6th Grade",
      SEVENTH: "7th Grade",
      EIGHTH: "8th Grade",
      NINTH: "9th Grade",
      TENTH: "10th Grade",
      ELEVENTH: "11th Grade",
      TWELFTH: "12th Grade",
      DIPLOMA: "Diploma",
      GRADUATION: "Graduation",
      POSTGRADUATION: "Post Graduation",
      PHD: "PhD",
    };
    return labels[grade] || grade;
  };

  return (
    <div
      className="fixed inset-y-0 right-0 left-64 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Subject Details
              </h2>
              {subject.description ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <p 
                    className="text-sm text-gray-500 font-medium max-w-md cursor-default"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {subject.description}
                  </p>
                  {/* Tooltip */}
                  {showTooltip && (
                    <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none animate-in fade-in duration-200">
                      <div className="whitespace-normal break-words">
                        {subject.description}
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-medium">
                  Reviewing subject information
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Cover Image */}
          {subject.coverpage && (
            <div className="rounded-2xl overflow-hidden border border-border/50">
              <img
                src={subject.coverpage.url || subject.coverpage}
                alt={subject.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Subject Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Subject Name
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">
                {subject.name}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-8 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Grade
              </span>
              <span className="font-bold text-gray-900">
                {getGradeLabel(subject.grade) || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Level
              </span>
              <span className="font-bold text-gray-900">
                {getLevelLabel(subject.level)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Topics
              </span>
              <span className="font-bold text-gray-900">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {subject.topics?.length || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quizzes
              </span>
              <span className="font-bold text-gray-900">
                <FileQuestion className="w-4 h-4 inline mr-1" />
                {subject.quizzes?.length || 0}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-border/50 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
              <Calendar className="w-3 h-3" />
              Created on{" "}
              {new Date(subject.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SubjectsTab = () => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id;
  const [deleteOne] = useDelete();

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // View State
  const [viewingSubject, setViewingSubject] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [activeCountTitle, setActiveCountTitle] = useState("");
  const [activeCountItems, setActiveCountItems] = useState([]);

  const {
    data: subjects,
    total,
    isLoading,
    refetch,
  } = useGetList("subjects", {
    pagination: { page, perPage },
    sort: { field: sortField, order: sortOrder },
    filter: userId ? { creator: userId } : {},
    meta: {
      populate: {
        coverpage: { fields: ["url"] },
        topics: { fields: ["name"] },
        quizzes: { fields: ["title"] },
        courses: { fields: ["name"] },
        approver: { fields: ["username"] },
        authoredBy: { fields: ["username"] },
      },
    },
  });

  useEffect(() => {
    if (userId) refetch();
  }, [sortField, sortOrder, userId, page]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortOrder === "ASC" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;
    try {
      await deleteOne("subjects", { id, previousData: {} });
      notify("Subject deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting subject", { type: "error" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setGradeFilter("");
    setLevelFilter("");
    setCourseFilter(null);
  };

  const getFilteredContent = () => {
    let content = subjects || [];

    if (searchQuery) {
      content = content.filter((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (gradeFilter) {
      content = content.filter((item) => item.grade === gradeFilter);
    }

    if (levelFilter) {
      content = content.filter((item) => item.level === parseInt(levelFilter));
    }

    if (courseFilter) {
      content = content.filter((item) => {
        const courses = item.courses || [];
        return courses.some((c) => {
          const cId = c?.id || c;
          return (
            cId === courseFilter ||
            (typeof cId === "object" && cId?.id === courseFilter)
          );
        });
      });
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  const gradeOptions = [
    { id: "", name: "All Grades" },
    { id: "PLAYSCHOOL", name: "Play School" },
    { id: "LKG", name: "LKG" },
    { id: "UKG", name: "UKG" },
    { id: "FIRST", name: "1st Grade" },
    { id: "SECOND", name: "2nd Grade" },
    { id: "THIRD", name: "3rd Grade" },
    { id: "FOURTH", name: "4th Grade" },
    { id: "FIFTH", name: "5th Grade" },
    { id: "SIXTH", name: "6th Grade" },
    { id: "SEVENTH", name: "7th Grade" },
    { id: "EIGHTH", name: "8th Grade" },
    { id: "NINTH", name: "9th Grade" },
    { id: "TENTH", name: "10th Grade" },
    { id: "ELEVENTH", name: "11th Grade" },
    { id: "TWELFTH", name: "12th Grade" },
    { id: "DIPLOMA", name: "Diploma" },
    { id: "GRADUATION", name: "Graduation" },
    { id: "POSTGRADUATION", name: "Post Graduation" },
    { id: "PHD", name: "PhD" },
  ];

  const levelOptions = [
    { id: "", name: "All Levels" },
    { id: "1", name: "Level 1 - Beginner" },
    { id: "2", name: "Level 2 - Elementary" },
    { id: "3", name: "Level 3 - Intermediate" },
    { id: "4", name: "Level 4 - Advanced" },
    { id: "5", name: "Level 5 - Expert" },
  ];

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0">
      {viewingSubject && (
        <SubjectViewModal
          subject={viewingSubject}
          onClose={() => setViewingSubject(null)}
        />
      )}

      <CountListModal
        isOpen={!!activeCountItems.length}
        onClose={() => {
          setActiveCountItems([]);
          setActiveCountTitle("");
        }}
        title={activeCountTitle}
        items={activeCountItems}
      />

      {/* Filters */}
      <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="w-[180px]">
            <CustomAsyncSelect
              label=""
              value={courseFilter}
              onChange={setCourseFilter}
              resource="courses"
              optionText="name"
              placeholder="Filter Course"
              allowEmpty
              searchable
            />
          </div>
          <div className="w-[180px]">
            <CustomSelect
              value={gradeFilter}
              onChange={setGradeFilter}
              options={gradeOptions}
              placeholder="All Grades"
            />
          </div>
          <div className="w-[180px]">
            <CustomSelect
              value={levelFilter}
              onChange={setLevelFilter}
              options={levelOptions}
              placeholder="All Levels"
            />
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-b-3xl min-h-[400px]">
          <Loading />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6 bg-white rounded-b-3xl min-h-[400px]">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Layers className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No subjects found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create a new subject
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-b-3xl flex flex-col min-h-0">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead className="bg-gray-50 border-b border-border/50 sticky top-0 z-20">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      <SortIcon field="id" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Cover
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Topics
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Approver
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Authored By
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider sticky right-0 z-20 bg-gray-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] w-[150px] min-w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-white">
                {filteredContent.map((item, index) => {
                  const itemId = item.documentId || item.id;
                  const displayId =
                    sortOrder === "ASC"
                      ? (page - 1) * perPage + index + 1
                      : (total || 0) - ((page - 1) * perPage + index);
                  return (
                    <tr
                      key={itemId}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {displayId}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <ImagePreview
                          src={
                            item.coverpage?.url ||
                            item.coverpage?.formats?.thumbnail?.url ||
                            item.coverpage
                          }
                          alt={item.name}
                          className="w-16 h-12"
                        />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="max-w-md">
                          <p
                            className="text-sm font-bold text-gray-900 truncate"
                            title={item.name}
                          >
                            {item.name || "Untitled Subject"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize whitespace-nowrap">
                          Grade {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="text-xs font-bold text-gray-700">
                          {getLevelLabel(item.level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Courses in ${item.name}`);
                            setActiveCountItems(item.courses || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.courses?.length || 0} Courses
                        </button>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Topics in ${item.name}`);
                            setActiveCountItems(item.topics || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.topics?.length || 0} Topics
                        </button>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Quizzes in ${item.name}`);
                            setActiveCountItems(item.quizzes || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.quizzes?.length || 0} Quizzes
                        </button>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {item.approver?.username || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {item.authoredBy?.username || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSubject(item);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect("edit", "subjects", itemId);
                            }}
                            className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors group/btn"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(itemId);
                            }}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors group/btn"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/30 bg-gray-50/30 flex items-center justify-between mt-auto">
            <p className="text-xs font-bold text-gray-500">
              Showing {(page - 1) * perPage + 1} to{" "}
              {Math.min(page * perPage, total || 0)} of {total || 0} subjects
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border/50 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.ceil((total || 0) / perPage))]
                  .map((_, i) => {
                    const p = i + 1;
                    if (
                      p === 1 ||
                      p === Math.ceil((total || 0) / perPage) ||
                      Math.abs(p - page) <= 1
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                            page === p
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-white text-gray-600 border-border/50 hover:border-primary/30"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (
                      p === 2 ||
                      p === Math.ceil((total || 0) / perPage) - 1
                    ) {
                      return (
                        <span key={p} className="text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)
                  .reduce((acc, curr, i, arr) => {
                    if (curr.type === "span" && arr[i - 1]?.type === "span")
                      return acc;
                    return [...acc, curr];
                  }, [])}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil((total || 0) / perPage)}
                className="p-2 rounded-lg border border-border/50 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
