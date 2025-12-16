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
} from "lucide-react";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomAsyncSelect } from "../../../components/common/CustomAsyncSelect";

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
              <span className="font-bold text-gray-900 capitalize">
                {quiz.quizType}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Difficulty
              </span>
              <span
                className={`font-bold capitalize inline-flex items-center px-2 py-0.5 rounded-lg w-fit text-sm ${getDifficultyColor(
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

  // Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // View State
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [viewMode, setViewMode] = useState("category"); // 'table' or 'category'

  const {
    data: quizzes,
    isLoading,
    refetch,
  } = useGetList("quizzes", {
    pagination: { page: 1, perPage: 20 },
    sort: { field: sortField, order: sortOrder },
    filter: userId ? { creator: userId } : {},
    meta: { populate: ["topic", "subject", "questions"] },
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

      {/* Filters */}
      <div className="p-6 pt-4 border-b border-border/30 bg-gray-50 rounded-t-3xl">
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
        <div className="bg-white rounded-b-3xl p-6">
          {/* View Toggle */}
          <div className="flex justify-end mb-4">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode("category")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  viewMode === "category"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Category View
              </button>
            </div>
          </div>

          {viewMode === "table" ? (
            /* Table View */
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border/50 sticky top-0 z-10">
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
                      Quiz Title
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Time (min)
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pass Score
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Active
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
                              className="text-sm font-bold text-gray-900 truncate"
                              title={item.title}
                            >
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize">
                              {item.quizType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap text-center ${getDifficultyColor(
                                item.difficulty
                              )}`}
                            >
                              {item.difficulty || "medium"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-center font-medium text-gray-700">
                          {item.timeLimit}m
                        </td>
                        <td className="px-6 py-4 align-middle text-center font-bold text-green-600">
                          {item.passingScore}%
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              item.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className="text-sm text-gray-500">
                            <ReferenceField
                              record={item}
                              source="subject.id"
                              reference="subjects"
                              link={false}
                            >
                              <TextField source="name" />
                            </ReferenceField>
                          </span>
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
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingQuiz(item)}
                              className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                              title="View Quiz"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => redirect(`/quizzes/${itemId}`)}
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
          ) : (
            /* Category View */
            <div className="space-y-6 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {(() => {
                // Group quizzes by subject, then by topic
                const grouped = {};
                filteredContent.forEach((quiz) => {
                  const subjectId =
                    quiz.subject?.id || quiz.subject || "unassigned";
                  const subjectName =
                    quiz.subject?.name || "Unassigned Subject";
                  const topicId = quiz.topic?.id || quiz.topic || "unassigned";
                  const topicName = quiz.topic?.name || "Unassigned Topic";

                  if (!grouped[subjectId]) {
                    grouped[subjectId] = {
                      name: subjectName,
                      topics: {},
                    };
                  }

                  if (!grouped[subjectId].topics[topicId]) {
                    grouped[subjectId].topics[topicId] = {
                      name: topicName,
                      quizzes: [],
                    };
                  }

                  grouped[subjectId].topics[topicId].quizzes.push(quiz);
                });

                return Object.entries(grouped).map(
                  ([subjectId, subjectData]) => (
                    <div
                      key={subjectId}
                      className="border border-border/50 rounded-2xl overflow-hidden bg-gray-50"
                    >
                      <div className="bg-gradient-to-r from-primary to-secondary p-4">
                        <h3 className="text-lg font-black text-white">
                          {subjectData.name}
                        </h3>
                        <p className="text-sm text-white/80">
                          {Object.values(subjectData.topics).reduce(
                            (sum, topic) => sum + topic.quizzes.length,
                            0
                          )}{" "}
                          quizzes
                        </p>
                      </div>
                      <div className="p-4 space-y-4">
                        {Object.entries(subjectData.topics).map(
                          ([topicId, topicData]) => (
                            <div
                              key={topicId}
                              className="bg-white rounded-xl p-4 border border-border/30"
                            >
                              <h4 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                {topicData.name}
                                <span className="text-xs text-gray-500 font-normal">
                                  ({topicData.quizzes.length})
                                </span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {topicData.quizzes.map((quiz) => {
                                  const itemId = quiz.documentId || quiz.id;
                                  return (
                                    <div
                                      key={itemId}
                                      className="bg-gray-50 border border-border/30 rounded-xl p-4 hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="text-sm font-bold text-gray-900 line-clamp-2 flex-1">
                                          {quiz.title}
                                        </h5>
                                        <span
                                          className={`inline-block w-2 h-2 rounded-full ml-2 mt-1 flex-shrink-0 ${
                                            quiz.isActive
                                              ? "bg-green-500"
                                              : "bg-red-500"
                                          }`}
                                        />
                                      </div>
                                      {quiz.description && (
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                          {quiz.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize">
                                          {quiz.quizType}
                                        </span>
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border capitalize ${getDifficultyColor(
                                            quiz.difficulty
                                          )}`}
                                        >
                                          {quiz.difficulty || "medium"}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                                        <span>⏱️ {quiz.timeLimit}m</span>
                                        <span className="font-bold text-green-600">
                                          ✓ {quiz.passingScore}%
                                        </span>
                                        <span>
                                          📝 {quiz.questions?.length || 0}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setViewingQuiz(quiz)}
                                          className="flex-1 p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-xs font-bold"
                                          title="View"
                                        >
                                          <Eye className="w-3 h-3 mx-auto" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            redirect(`/quizzes/${itemId}`)
                                          }
                                          className="flex-1 p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-xs font-bold"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3 h-3 mx-auto" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(itemId)}
                                          className="flex-1 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-bold"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3 h-3 mx-auto" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
