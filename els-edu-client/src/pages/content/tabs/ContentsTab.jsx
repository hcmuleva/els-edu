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
  FileText,
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
  Youtube,
  Image,
  FileVideo,
  BookText,
} from "lucide-react";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";

const ContentViewModal = ({ content, onClose }) => {
  if (!content) return null;

  const getTypeIcon = (type) => {
    const icons = {
      YOUTUBE: Youtube,
      VIDEO: FileVideo,
      IMAGE: Image,
      MD: BookText,
      TEXT: FileText,
      DOCUMENT: FileText,
      DOWNLOAD: FileText,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      YOUTUBE: "text-red-600 bg-red-50",
      VIDEO: "text-purple-600 bg-purple-50",
      IMAGE: "text-blue-600 bg-blue-50",
      MD: "text-green-600 bg-green-50",
      TEXT: "text-gray-600 bg-gray-50",
      DOCUMENT: "text-orange-600 bg-orange-50",
      DOWNLOAD: "text-indigo-600 bg-indigo-50",
    };
    return colors[type] || "text-gray-600 bg-gray-50";
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${getTypeColor(content.type)}`}>
              {getTypeIcon(content.type)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Content Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Reviewing content information
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
          {/* Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Title
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">
                {content.title}
              </p>
            </div>
          </div>

          {/* YouTube URL */}
          {content.youtubeurl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  YouTube URL
                </span>
              </div>
              <a
                href={content.youtubeurl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium break-all"
              >
                {content.youtubeurl}
              </a>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-8 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </span>
              <span className="font-bold text-gray-900">{content.type}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Topic
              </span>
              <div className="font-bold text-gray-900">
                <ReferenceField
                  record={content}
                  source="topic.id"
                  reference="topics"
                  link={false}
                >
                  <TextField source="name" />
                </ReferenceField>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-border/50 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
              <Calendar className="w-3 h-3" />
              Created on{" "}
              {new Date(content.createdAt).toLocaleDateString("en-US", {
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

export const ContentsTab = () => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id;
  const [deleteOne] = useDelete();

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // View State
  const [viewingContent, setViewingContent] = useState(null);

  const {
    data: contents,
    isLoading,
    refetch,
  } = useGetList("contents", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: sortField, order: sortOrder },
    filter: userId ? { creator: userId } : {},
    meta: { populate: ["topic", "subjects", "multimedia"] },
  });

  useEffect(() => {
    if (userId) refetch();
  }, [sortField, sortOrder, userId]);

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
    if (!window.confirm("Are you sure you want to delete this content?"))
      return;
    try {
      await deleteOne("contents", { id, previousData: {} });
      notify("Content deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting content", { type: "error" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setTopicFilter(null);
    setSubjectFilter(null);
  };

  const getFilteredContent = () => {
    let content = contents || [];

    if (searchQuery) {
      content = content.filter((item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter) {
      content = content.filter((item) => item.type === typeFilter);
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
        const subjects = item.subjects || [];
        return subjects.some((s) => {
          const sId = s?.id || s;
          return (
            sId === subjectFilter ||
            (typeof sId === "object" && sId?.id === subjectFilter)
          );
        });
      });
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  const typeOptions = [
    { id: "", name: "All Types" },
    { id: "YOUTUBE", name: "YouTube" },
    { id: "VIDEO", name: "Video" },
    { id: "IMAGE", name: "Image" },
    { id: "MD", name: "Markdown" },
    { id: "TEXT", name: "Text" },
    { id: "DOCUMENT", name: "Document" },
    { id: "DOWNLOAD", name: "Download" },
  ];

  const getTypeColor = (type) => {
    const colors = {
      YOUTUBE: "bg-red-100 text-red-700 border-red-200",
      VIDEO: "bg-purple-100 text-purple-700 border-purple-200",
      IMAGE: "bg-blue-100 text-blue-700 border-blue-200",
      MD: "bg-green-100 text-green-700 border-green-200",
      TEXT: "bg-gray-100 text-gray-700 border-gray-200",
      DOCUMENT: "bg-orange-100 text-orange-700 border-orange-200",
      DOWNLOAD: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {viewingContent && (
        <ContentViewModal
          content={viewingContent}
          onClose={() => setViewingContent(null)}
        />
      )}

      {/* Filters */}
      <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="w-[180px]">
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>
          <div className="w-[180px]">
            <CustomAsyncSelect
              label=""
              value={subjectFilter}
              onChange={setSubjectFilter}
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
              placeholder="Filter Topic"
              allowEmpty
              searchable
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
        <div className="flex items-center justify-center h-64 bg-white rounded-b-3xl">
          <Loading />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6 bg-white rounded-b-3xl">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No content found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create new content
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-b-3xl">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border/50 sticky top-0 z-10">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      #<SortIcon field="id" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subjects
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
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-white">
                {filteredContent.map((item, index) => {
                  const itemId = item.documentId || item.id;
                  return (
                    <tr
                      key={itemId}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-bold text-gray-700">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="max-w-md">
                          <p
                            className="text-sm font-semibold text-gray-900 truncate"
                            title={item.title}
                          >
                            {item.title || "Untitled Content"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap text-center ${getTypeColor(
                              item.type
                            )}`}
                          >
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="text-sm text-gray-500">
                          <ReferenceField
                            record={item}
                            source="topic.id"
                            reference="topics"
                            link={false}
                          >
                            <TextField source="name" />
                          </ReferenceField>
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.subjects && item.subjects.length > 0 ? (
                            item.subjects.slice(0, 2).map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs border border-amber-100"
                              >
                                {typeof s === "object" ? s.name : s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {item.subjects && item.subjects.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{item.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingContent(item)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => redirect(`/contents/${itemId}`)}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(itemId)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
