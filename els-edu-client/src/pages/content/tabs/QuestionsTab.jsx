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
  FileQuestion,
  Eye,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Info,
  Calendar,
  CheckCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";

const QuestionViewModal = ({ question, onClose }) => {
  if (!question) return null;

  const getTypeLabel = (type) => {
    const types = {
      SC: "Single Choice",
      MCQ: "Multiple Choice",
      TF: "True/False",
      FillInBlank: "Fill in Blank",
      Match: "Matching",
      DragDrop: "Drag & Drop",
    };
    return types[type] || type;
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
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Question Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Reviewing question content and metadata
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
          {/* Question Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Question
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">
                {question.questionText}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-8 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap w-fit">
                {getTypeLabel(question.questionType)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Difficulty
              </span>
              <span
                className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap w-fit capitalize ${
                  question.difficulty === "easy"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : question.difficulty === "hard"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-orange-100 text-orange-700 border-orange-300"
                }`}
              >
                {question.difficulty || "medium"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Points
              </span>
              <span className="font-bold text-gray-900">
                {question.points || 1}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Topic
              </span>
              <div className="font-bold text-gray-900">
                <ReferenceField
                  record={question}
                  source="topic.id"
                  reference="topics"
                  link={false}
                >
                  <TextField source="name" />
                </ReferenceField>
              </div>
            </div>
          </div>

          {/* Options Section */}
          {question.options && question.options.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Answer Options
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                  {question.options.length} options
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {question.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`
                                            relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                                            ${
                                              opt.isCorrect
                                                ? "border-emerald-500 bg-emerald-50/30"
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                            }
                                        `}
                  >
                    <div
                      className={`
                                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm transition-transform group-hover:scale-105
                                            ${
                                              opt.isCorrect
                                                ? "bg-emerald-500 text-white"
                                                : "bg-gray-100 text-gray-500"
                                            }
                                        `}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p
                        className={`font-medium ${
                          opt.isCorrect ? "text-emerald-900" : "text-gray-700"
                        }`}
                      >
                        {opt.option || opt.text}
                      </p>
                    </div>
                    {opt.isCorrect && (
                      <div className="absolute top-4 right-4 text-emerald-500">
                        <CheckCircle className="w-6 h-6 fill-emerald-100" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 mb-1">
                    Explanation
                  </h4>
                  <p className="text-indigo-800/80 text-sm leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>
              {/* Decorative blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-border/50 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
              <Calendar className="w-3 h-3" />
              Created on{" "}
              {new Date(question.createdAt).toLocaleDateString("en-US", {
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

export const QuestionsTab = () => {
  const redirect = useRedirect();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id;
  const [deleteOne] = useDelete();

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // View State
  const [viewingQuestion, setViewingQuestion] = useState(null);

  const {
    data: questions,
    total,
    isLoading,
    refetch,
  } = useGetList("questions", {
    pagination: { page, perPage },
    sort: { field: sortField, order: sortOrder },
    filter: userId ? { creator: userId } : {},
    meta: {
      populate: {
        subject: { fields: ["name"] },
        topic: { fields: ["name"] },
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
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      await deleteOne("questions", { id, previousData: {} });
      notify("Question deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting question", { type: "error" });
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
    let content = questions || [];

    if (searchQuery) {
      content = content.filter((item) =>
        item.questionText?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (difficultyFilter) {
      content = content.filter((item) => item.difficulty === difficultyFilter);
    }

    if (typeFilter) {
      content = content.filter((item) => item.questionType === typeFilter);
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
    if (difficulty === "easy")
      return "bg-green-100 text-green-700 border-green-300";
    if (difficulty === "hard") return "bg-red-100 text-red-700 border-red-300";
    return "bg-orange-100 text-orange-700 border-orange-300";
  };

  const getTypeColor = (type) => {
    if (type === "SC") return "bg-blue-100 text-blue-700 border-blue-300";
    if (type === "MCQ")
      return "bg-purple-100 text-purple-700 border-purple-300";
    if (type === "TF") return "bg-teal-100 text-teal-700 border-teal-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getTypeName = (type) => {
    const types = {
      SC: "Single Choice",
      MCQ: "Multiple Choice",
      TF: "True/False",
      FillInBlank: "Fill in Blank",
      Match: "Matching",
      DragDrop: "Drag & Drop",
    };
    return types[type] || type;
  };

  const getCorrectAnswers = (question) => {
    if (!question.options) return "-";
    const correct = question.options.filter((opt) => opt.isCorrect);
    if (correct.length === 0)
      return <span className="text-red-600 text-xs">None set</span>;
    return correct.map((opt) => opt.option || opt.text).join(", ");
  };

  return (
    <div className="space-y-6">
      {viewingQuestion && (
        <QuestionViewModal
          question={viewingQuestion}
          onClose={() => setViewingQuestion(null)}
        />
      )}

      {/* Filters */}
      <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
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
                { id: "SC", name: "Single Choice" },
                { id: "MCQ", name: "Multiple Choice" },
                { id: "TF", name: "True/False" },
                { id: "FillInBlank", name: "Fill in Blank" },
                { id: "Match", name: "Matching" },
                { id: "DragDrop", name: "Drag & Drop" },
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
                { id: "easy", name: "Easy" },
                { id: "medium", name: "Medium" },
                { id: "hard", name: "Hard" },
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

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-b-3xl">
          <Loading />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6 bg-white rounded-b-3xl">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <FileQuestion className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No questions found</p>
          <p className="text-sm opacity-70 mt-1">
            Try adjusting filters or create a new question
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[250px]">
                    Question
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Correct Answer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Topic
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
                {questions?.map((item, index) => {
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
                            className="text-sm font-bold text-gray-900 line-clamp-2"
                            title={item.questionText}
                          >
                            {item.questionText}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getTypeColor(
                            item.questionType
                          )}`}
                        >
                          {item.questionType}
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
                          {item.level || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm text-gray-600 italic max-w-xs truncate">
                          {getCorrectAnswers(item)}
                        </div>
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
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle sticky right-0 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingQuestion(item);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect("edit", "questions", itemId);
                            }}
                            className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors group/btn"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this question?"
                                )
                              ) {
                                deleteOne("questions", { id: itemId });
                                notify("Question deleted", {
                                  type: "success",
                                });
                                refetch();
                              }
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
              {Math.min(page * perPage, total || 0)} of {total || 0} questions
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
