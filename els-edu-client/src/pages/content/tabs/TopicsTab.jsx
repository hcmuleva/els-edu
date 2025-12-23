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
} from "react-admin";
import {
  FolderTree,
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
  FileQuestion,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";
import CountListModal from "../../../components/studio/CountListModal";

const TopicViewModal = ({ topic, onClose }) => {
  if (!topic) return null;

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
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              {topic.icon ? (
                <span className="text-3xl">{topic.icon}</span>
              ) : (
                <FolderTree className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Topic Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Reviewing topic information
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
          {/* Topic Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Topic Name
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{topic.name}</p>
            </div>
          </div>

          {/* Description */}
          {topic.description && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Description
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {topic.description}
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-8 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Subject
              </span>
              <div className="font-bold text-gray-900">
                <ReferenceField
                  record={topic}
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
                Quizzes
              </span>
              <span className="font-bold text-gray-900">
                <FileQuestion className="w-4 h-4 inline mr-1" />
                {topic.quizzes?.length || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Questions
              </span>
              <span className="font-bold text-gray-900">
                {topic.questions?.length || 0}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-border/50 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
              <Calendar className="w-3 h-3" />
              Created on{" "}
              {new Date(topic.createdAt).toLocaleDateString("en-US", {
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

export const TopicsTab = () => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id;
  const [deleteOne] = useDelete();

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // View State
  const [viewingTopic, setViewingTopic] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [activeCountTitle, setActiveCountTitle] = useState("");
  const [activeCountItems, setActiveCountItems] = useState([]);

  const {
    data: topics,
    total,
    isLoading,
    refetch,
  } = useGetList("topics", {
    pagination: { page, perPage },
    sort: { field: sortField, order: sortOrder },
    filter: userId ? { creator: userId } : {},
    meta: {
      populate: {
        subject: { fields: ["name"] },
        quizzes: { fields: ["title"] },
        contents: { fields: ["title"] },
        questions: { fields: ["questionText"] },
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
    if (!window.confirm("Are you sure you want to delete this topic?")) return;
    try {
      await deleteOne("topics", { id, previousData: {} });
      notify("Topic deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting topic", { type: "error" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCourseFilter(null);
    setSubjectFilter(null);
  };

  const getFilteredContent = () => {
    let content = topics || [];

    if (searchQuery) {
      content = content.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
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

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0">
      {viewingTopic && (
        <TopicViewModal
          topic={viewingTopic}
          onClose={() => setViewingTopic(null)}
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
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="w-[200px]">
            <CustomAsyncSelect
              label=""
              value={courseFilter}
              onChange={(value) => {
                setCourseFilter(value);
                setSubjectFilter(null);
              }}
              resource="courses"
              optionText="name"
              placeholder="Filter Course"
              allowEmpty
              searchable
            />
          </div>
          <div className="w-[200px]">
            <CustomAsyncSelect
              label=""
              value={subjectFilter}
              onChange={setSubjectFilter}
              resource="subjects"
              optionText="name"
              placeholder={
                courseFilter ? "Filter Subject" : "Select Course first"
              }
              allowEmpty
              searchable
              disabled={!courseFilter}
              filter={courseFilter ? { courses: courseFilter } : {}}
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
            <FolderTree className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No topics found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create a new topic
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
                    Icon
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contents
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
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl shadow-sm border border-indigo-100/50">
                          {item.icon || "📁"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="max-w-md">
                          <p
                            className="text-sm font-bold text-gray-900 truncate"
                            title={item.name}
                          >
                            {item.name || "Untitled Topic"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <p
                          className="text-xs text-gray-500 line-clamp-2 max-w-xs"
                          title={item.description}
                        >
                          {item.description || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-block max-w-[150px] truncate text-[10px] font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md border border-indigo-100">
                          {item.subject?.name || "-"}
                        </span>
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
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Contents in ${item.name}`);
                            setActiveCountItems(item.contents || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.contents?.length || 0} Contents
                        </button>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTopic(item);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect("edit", "topics", itemId);
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
              {Math.min(page * perPage, total || 0)} of {total || 0} topics
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
