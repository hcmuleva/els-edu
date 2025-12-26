import React, { useState, useEffect } from "react";
import {
  useGetList,
  useGetIdentity,
  Loading,
  useDelete,
  useNotify,
  ReferenceField,
  TextField,
  useRedirect,
  usePermissions,
} from "react-admin";
import {
  BookOpen,
  Eye,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";
import CountListModal from "../../../components/studio/CountListModal";

const QuizViewModal = ({ quiz, onClose }) => {
  if (!quiz) return null;

  const getDifficultyColor = (difficulty) => {
    if (difficulty === "beginner")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (difficulty === "advanced")
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-orange-100 text-orange-700 border-orange-200";
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
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Quiz Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Reviewing quiz configuration
              </p>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Quiz Title
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 leading-relaxed">
                {quiz.title}
              </p>
              {quiz.description && (
                <p className="text-gray-600 mt-2">{quiz.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize whitespace-nowrap w-fit">
                {quiz.quizType}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Difficulty
              </span>
              <span
                className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap w-fit capitalize ${getDifficultyColor(
                  quiz.difficulty
                )}`}
              >
                {quiz.difficulty || "beginner"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Time Limit
              </span>
              <span className="font-bold text-gray-900">
                {quiz.timeLimit} mins
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pass Score
              </span>
              <span className="font-bold text-green-600">
                {quiz.passingScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Subject
              </span>
              <div className="font-bold text-gray-900 text-lg">
                <ReferenceField
                  record={quiz}
                  source="subject.id"
                  reference="subjects"
                  link={false}
                >
                  <TextField source="name" />
                </ReferenceField>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Topic
              </span>
              <div className="font-bold text-gray-900 text-lg">
                <ReferenceField
                  record={quiz}
                  source="topic.id"
                  reference="topics"
                  link={false}
                >
                  <TextField source="name" />
                </ReferenceField>
              </div>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Questions
              </span>
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{quiz.questions?.length || 0}</span>
                <span className="text-sm font-medium text-gray-500">
                  questions included
                </span>
              </div>
            </div>
          </div>

          {quiz.instructions && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-blue-900 mb-1">
                Instructions
              </h4>
              <p className="text-blue-800/80 text-sm leading-relaxed">
                {quiz.instructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const QuizzesTab = () => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id;
  const [deleteOne] = useDelete();

  const { permissions } = usePermissions();
  const isSuperAdmin = permissions === "SUPERADMIN";
  const [viewMode, setViewMode] = useState("mine"); // "mine" or "all"

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // View State
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [activeCountItems, setActiveCountItems] = useState(null);
  const [activeCountTitle, setActiveCountTitle] = useState("");

  const {
    data: quizzes,
    total,
    isLoading,
    refetch,
  } = useGetList("quizzes", {
    pagination: { page, perPage },
    sort: { field: sortField, order: sortOrder },
    filter:
      userId && (!isSuperAdmin || viewMode === "mine")
        ? { creator: userId }
        : {},
    meta: {
      populate: {
        topic: { fields: ["name"] },
        subject: { fields: ["name"] },
        content: { fields: ["title"] },
        questions: { fields: ["questionText"] },
      },
    },
  });

  useEffect(() => {
    if (userId) refetch();
  }, [sortField, sortOrder, userId, page, viewMode]);

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
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await deleteOne("quizzes", { id, previousData: {} });
      notify("Quiz deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting quiz", { type: "error" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTopicFilter(null);
    setSubjectFilter(null);
    setTypeFilter("");
    setDifficultyFilter("");
  };

  const getFilteredContent = () => {
    let content = quizzes || [];

    if (searchQuery) {
      content = content.filter((item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (difficultyFilter) {
      content = content.filter((item) => item.difficulty === difficultyFilter);
    }

    if (typeFilter) {
      content = content.filter((item) => item.quizType === typeFilter);
    }

    if (topicFilter) {
      content = content.filter((item) => {
        const tId = item.topic?.id || item.topic;
        return (
          tId === topicFilter ||
          (typeof tId === "object" && tId?.id === topicFilter)
        );
      });
    }

    if (subjectFilter) {
      content = content.filter((item) => {
        const sId = item.subject?.id || item.subject;
        return (
          sId === subjectFilter ||
          (typeof sId === "object" && sId?.id === subjectFilter)
        );
      });
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  const getDifficultyColor = (difficulty) => {
    if (difficulty === "beginner")
      return "bg-green-100 text-green-700 border-green-300";
    if (difficulty === "advanced")
      return "bg-red-100 text-red-700 border-red-300";
    return "bg-orange-100 text-orange-700 border-orange-300";
  };

  return (
    <div className="space-y-6">
      {viewingQuiz && (
        <QuizViewModal
          quiz={viewingQuiz}
          onClose={() => setViewingQuiz(null)}
        />
      )}

      {activeCountItems && (
        <CountListModal
          title={activeCountTitle}
          items={activeCountItems}
          nameField="questionText"
          onClose={() => setActiveCountItems(null)}
        />
      )}

      {/* Filters */}
      <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
        <div className="flex flex-col gap-4">
          {/* View Mode Toggle for SuperAdmin */}
          {isSuperAdmin && (
            <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setViewMode("mine")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                  viewMode === "mine"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Creations
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                  viewMode === "all"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All Creations
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="w-[180px]">
              <CustomAsyncSelect
                label=""
                value={subjectFilter}
                onChange={(value) => {
                  setSubjectFilter(value);
                  setTopicFilter(null);
                }}
                resource="subjects"
                optionText="name"
                placeholder="Filter Subject"
                allowEmpty
                searchable
              />
            </div>
            <div className="w-[180px]">
              <CustomAsyncSelect
                label=""
                value={topicFilter}
                onChange={setTopicFilter}
                resource="topics"
                optionText="name"
                placeholder={
                  subjectFilter ? "Filter Topic" : "Select Subject first"
                }
                allowEmpty
                searchable
                disabled={!subjectFilter}
                filter={subjectFilter ? { subject: subjectFilter } : {}}
              />
            </div>
            <div className="w-[180px]">
              <CustomSelect
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { id: "", name: "All Types" },
                  { id: "standalone", name: "Standalone Quiz" },
                  { id: "kit", name: "Kit Assessment" },
                  { id: "level", name: "Level Check" },
                  { id: "lesson", name: "Lesson Review" },
                ]}
                placeholder="All Types"
              />
            </div>
            <div className="w-[180px]">
              <CustomSelect
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                options={[
                  { id: "", name: "All Difficulties" },
                  { id: "beginner", name: "Beginner" },
                  { id: "intermediate", name: "Intermediate" },
                  { id: "advanced", name: "Advanced" },
                ]}
                placeholder="All Difficulties"
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
      </div>

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-b-3xl">
          <Loading />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6 bg-white rounded-b-3xl">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No quizzes found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create a new quiz
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[200px]">
                    Title
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Pass %
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Content
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
                {quizzes?.map((item, index) => {
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
                        <div className="max-w-md">
                          <p
                            className="text-sm font-bold text-gray-900 line-clamp-1"
                            title={item.title}
                          >
                            {item.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize whitespace-nowrap">
                          {item.quizType}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getDifficultyColor(
                            item.difficulty
                          )}`}
                        >
                          {item.difficulty?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {item.timeLimit}m
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center text-sm font-bold text-emerald-600">
                        {item.passingScore}%
                      </td>
                      <td className="px-6 py-4 align-middle text-center text-sm font-bold text-gray-700">
                        {item.maxAttempts}
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            item.isActive
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Questions in ${item.title}`);
                            setActiveCountItems(item.questions || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.questions?.length || 0} Questions
                        </button>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {item.subject?.name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {item.topic?.name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {item.content?.title || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingQuiz(item);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect("edit", "quizzes", itemId);
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
          <div className="p-4 border-t border-border/30 bg-gray-50/30 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">
              Showing {(page - 1) * perPage + 1} to{" "}
              {Math.min(page * perPage, total || 0)} of {total || 0} quizzes
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
