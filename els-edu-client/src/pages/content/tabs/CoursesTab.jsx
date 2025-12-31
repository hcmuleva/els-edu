import React, { useState, useEffect, useMemo } from "react";
import {
  useGetList,
  useGetIdentity,
  Loading,
  useDelete,
  useNotify,
  useRedirect,
  usePermissions,
} from "react-admin";
import {
  GraduationCap,
  Eye,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Calendar,
  X,
  BookOpen,
  Info,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import ImagePreview from "../../../components/studio/ImagePreview";
import CountListModal from "../../../components/studio/CountListModal";
import { CustomSelect } from "../../../components/common/CustomSelect";

const CourseViewModal = ({ course, onClose }) => {
  if (!course) return null;

  // Helper to check if string contains HTML tags
  const containsHTML = (str) => {
    if (typeof str !== "string") return false;
    return /<[a-z][\s\S]*>/i.test(str);
  };

  // Helper to process HTML and ensure links open in new tabs
  const processHTML = (html) => {
    if (!html || typeof html !== "string") return html;

    // Add target="_blank" and rel="noopener noreferrer" to links that don't have them
    return html.replace(/<a\s+([^>]*?)>/gi, (match, attributes) => {
      // Check if target already exists
      if (/target\s*=/i.test(attributes)) {
        return match; // Already has target, return as is
      }
      // Add target and rel if href exists
      if (/href\s*=/i.test(attributes)) {
        return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
      }
      return match;
    });
  };

  // Helper to get cover image URL
  const getCoverImageUrl = () => {
    if (!course.cover) return null;

    // Handle different cover structures
    if (typeof course.cover === "string") {
      return course.cover;
    }

    // Strapi v5 structure: cover object with url property
    if (course.cover.url) {
      return course.cover.url;
    }

    // Try nested formats
    if (course.cover.formats?.large?.url) {
      return course.cover.formats.large.url;
    }
    if (course.cover.formats?.medium?.url) {
      return course.cover.formats.medium.url;
    }
    if (course.cover.formats?.small?.url) {
      return course.cover.formats.small.url;
    }
    if (course.cover.formats?.thumbnail?.url) {
      return course.cover.formats.thumbnail.url;
    }

    // Try data.url structure
    if (course.cover.data?.url) {
      return course.cover.data.url;
    }

    return null;
  };

  const coverImageUrl = getCoverImageUrl();

  // Helper to get description content
  const descriptionContent = useMemo(() => {
    if (!course.description) return { content: "", isHTML: false };

    // If it's already a string
    if (typeof course.description === "string") {
      const isHTML = containsHTML(course.description);
      const content = isHTML
        ? processHTML(course.description)
        : course.description;
      return { content, isHTML };
    }

    // If it's an array (blocks format), convert to markdown
    if (Array.isArray(course.description)) {
      try {
        const markdown = course.description
          .map((block) => {
            if (block.type === "paragraph" && block.children) {
              return block.children.map((child) => child.text || "").join("");
            }
            if (block.type === "heading" && block.children) {
              const level = block.level || 1;
              const prefix = "#".repeat(level) + " ";
              return (
                prefix +
                block.children.map((child) => child.text || "").join("")
              );
            }
            if (block.type === "list" && block.children) {
              return block.children
                .map((item, index) => {
                  const prefix =
                    block.format === "ordered" ? `${index + 1}. ` : "- ";
                  return (
                    prefix +
                    (item.children?.map((c) => c.text || "").join("") || "")
                  );
                })
                .join("\n");
            }
            return "";
          })
          .filter(Boolean)
          .join("\n\n");
        return { content: markdown, isHTML: false };
      } catch (e) {
        console.error("Error parsing description blocks:", e);
        return { content: "", isHTML: false };
      }
    }

    return { content: "", isHTML: false };
  }, [course.description]);

  return (
    <div
      className="fixed inset-y-0 right-0 left-64 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Course Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Reviewing course information and subjects
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
          {/* Cover Image */}
          {coverImageUrl && (
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm">
              <ImagePreview
                src={coverImageUrl}
                alt={course.name || "Course Cover"}
                className="w-full h-64"
              />
            </div>
          )}

          {/* Course Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Course Name
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-tight">
                {course.name}
              </p>
            </div>
          </div>

          {/* Description */}
          {descriptionContent.content && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    Description
                  </h4>
                  {descriptionContent.isHTML ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-600 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-gray-600 [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:hover:underline [&_a]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:space-y-1 [&_ul]:text-gray-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:space-y-1 [&_ol]:text-gray-600 [&_li]:text-gray-600 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-2 [&_strong]:font-bold [&_strong]:text-gray-900 [&_em]:italic"
                      dangerouslySetInnerHTML={{
                        __html: descriptionContent.content,
                      }}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1
                              className="text-xl font-bold text-gray-900 mt-4 mb-2"
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-lg font-bold text-gray-900 mt-3 mb-2"
                              {...props}
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3
                              className="text-base font-bold text-gray-900 mt-3 mb-1"
                              {...props}
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p
                              className="mb-2 leading-relaxed text-gray-600"
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc pl-5 mb-2 space-y-1 text-gray-600"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal pl-5 mb-2 space-y-1 text-gray-600"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="text-gray-600" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className="border-l-4 border-gray-300 pl-4 italic text-gray-500 my-2"
                              {...props}
                            />
                          ),
                          code: ({ node, ...props }) => (
                            <code
                              className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            />
                          ),
                          pre: ({ node, ...props }) => (
                            <pre
                              className="bg-gray-200 text-gray-800 p-3 rounded-lg overflow-x-auto my-3 text-sm"
                              {...props}
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong
                              className="font-bold text-gray-900"
                              {...props}
                            />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="italic" {...props} />
                          ),
                        }}
                      >
                        {descriptionContent.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Category
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 capitalize whitespace-nowrap w-fit">
                {course.category || "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Subcategory
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 capitalize whitespace-nowrap w-fit">
                {course.subcategory || "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-green-200 bg-green-50 text-green-700 capitalize whitespace-nowrap w-fit">
                {course.condition || "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Privacy
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize whitespace-nowrap w-fit">
                {course.privacy || "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Visibility
              </span>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-teal-200 bg-teal-50 text-teal-700 capitalize whitespace-nowrap w-fit">
                {course.visibility || "-"}
              </span>
            </div>
          </div>

          {/* Subjects Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Linked Subjects
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                {course.subjects?.length || 0} subjects
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.subjects?.map((subject, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 bg-white flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {subject.name || "Untitled Subject"}
                  </span>
                </div>
              ))}
              {(!course.subjects || course.subjects.length === 0) && (
                <div className="col-span-full p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <p className="text-sm text-gray-400 font-medium">
                    No subjects linked to this course
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-border/50 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
              <Calendar className="w-3 h-3" />
              Created on{" "}
              {new Date(course.createdAt).toLocaleDateString("en-US", {
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

export const CoursesTab = () => {
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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // View State
  const [viewingCourse, setViewingCourse] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [activeCountTitle, setActiveCountTitle] = useState("");
  const [activeCountItems, setActiveCountItems] = useState([]);

  const {
    data: courses,
    total,
    isLoading,
    refetch,
  } = useGetList("courses", {
    pagination: { page, perPage },
    sort: { field: sortField, order: sortOrder },
    filter:
      userId && (!isSuperAdmin || viewMode === "mine")
        ? { creator: userId }
        : {},
    meta: {
      populate: "*", // Populate all relations including cover
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
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteOne("courses", { id, previousData: {} });
      notify("Course deleted successfully", { type: "success" });
      refetch();
    } catch (error) {
      notify("Error deleting course", { type: "error" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setConditionFilter("");
    setPrivacyFilter("");
    setVisibilityFilter("");
  };

  const getFilteredContent = () => {
    let content = courses || [];

    if (searchQuery) {
      content = content.filter((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      content = content.filter((item) => item.category === categoryFilter);
    }

    if (subcategoryFilter) {
      content = content.filter(
        (item) => item.subcategory === subcategoryFilter
      );
    }

    if (conditionFilter) {
      content = content.filter((item) => item.condition === conditionFilter);
    }

    if (privacyFilter) {
      content = content.filter((item) => item.privacy === privacyFilter);
    }

    if (visibilityFilter) {
      content = content.filter((item) => item.visibility === visibilityFilter);
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  const categoryOptions = [
    { id: "", name: "All Categories" },
    { id: "KIDS", name: "Kids" },
    { id: "PRIMARY", name: "Primary" },
    { id: "MIDDLE", name: "Middle" },
    { id: "SCHOOL", name: "School" },
    { id: "COLLEGE", name: "College" },
    { id: "OLDAGE", name: "Old Age" },
    { id: "SANSKAR", name: "Sanskar" },
    { id: "COMPETION", name: "Competition" },
    { id: "PROJECT", name: "Project" },
    { id: "DIY", name: "DIY" },
    { id: "EDUCATION", name: "Education" },
  ];

  const subcategoryOptions = [
    { id: "", name: "All Subcategories" },
    { id: "CREATIVITY", name: "Creativity" },
    { id: "COMPETION", name: "Competition" },
    { id: "ACADEMIC", name: "Academic" },
    { id: "ELECTROICS", name: "Electronics" },
    { id: "SOFTWARE", name: "Software" },
    { id: "DHARM", name: "Dharm" },
    { id: "SIKSHA", name: "Siksha" },
    { id: "GYAN", name: "Gyan" },
    { id: "SOCH", name: "Soch" },
  ];

  const conditionOptions = [
    { id: "", name: "All Statuses" },
    { id: "DRAFT", name: "Draft" },
    { id: "REVIEW", name: "In Review" },
    { id: "REJECT", name: "Rejected" },
    { id: "APPROVED", name: "Approved" },
    { id: "PUBLISH", name: "Published" },
    { id: "RETIRED", name: "Retired" },
  ];

  const privacyOptions = [
    { id: "", name: "All Privacy" },
    { id: "PUBLIC", name: "Public" },
    { id: "PRIVATE", name: "Private" },
    { id: "ORG", name: "Organization" },
    { id: "OPEN", name: "Open" },
  ];

  const visibilityOptions = [
    { id: "", name: "All Visibility" },
    { id: "GLOBAL", name: "Global" },
    { id: "ORG", name: "Organization" },
    { id: "OTHER", name: "Other" },
  ];

  return (
    <div className="space-y-6">
      {viewingCourse && (
        <CourseViewModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="w-[180px]">
              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            <div className="w-[180px]">
              <CustomSelect
                value={subcategoryFilter}
                onChange={setSubcategoryFilter}
                options={subcategoryOptions}
                placeholder="All Subcategories"
              />
            </div>

            <div className="w-[180px]">
              <CustomSelect
                value={conditionFilter}
                onChange={setConditionFilter}
                options={conditionOptions}
                placeholder="All Statuses"
              />
            </div>

            <div className="w-[180px]">
              <CustomSelect
                value={privacyFilter}
                onChange={setPrivacyFilter}
                options={privacyOptions}
                placeholder="All Privacy"
              />
            </div>

            <div className="w-[180px]">
              <CustomSelect
                value={visibilityFilter}
                onChange={setVisibilityFilter}
                options={visibilityOptions}
                placeholder="All Visibility"
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
            <GraduationCap className="w-12 h-12 text-gray-300" />
          </div>
          <p className="font-medium">No courses found</p>
          <p className="text-sm opacity-70 mt-1">
            Create your first course to get started
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-b-3xl flex flex-col min-h-0">
          <div className="overflow-x-auto relative">
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
                      Course Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subcategory
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Privacy
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
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
                            // Handle Strapi v5 cover object structure
                            typeof item.cover === "string"
                              ? item.cover
                              : item.cover?.url ||
                                item.cover?.formats?.thumbnail?.url ||
                                item.cover?.formats?.small?.url ||
                                item.cover?.data?.url ||
                                null
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
                            {item.name || "Untitled Course"}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 capitalize whitespace-nowrap">
                          {item.category || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 capitalize whitespace-nowrap">
                          {item.subcategory || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="text-sm font-bold text-gray-700 capitalize">
                          {item.condition || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 bg-purple-50 text-purple-700 capitalize whitespace-nowrap">
                          {item.privacy || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold border border-teal-200 bg-teal-50 text-teal-700 capitalize whitespace-nowrap">
                          {item.visibility || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCountTitle(`Subjects in ${item.name}`);
                            setActiveCountItems(item.subjects || []);
                          }}
                          className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg border border-border/50 text-xs font-bold text-gray-600 transition-all active:scale-95"
                        >
                          {item.subjects?.length || 0} Subjects
                        </button>
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
                              setViewingCourse(item);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect("edit", "courses", itemId);
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
              {Math.min(page * perPage, total || 0)} of {total || 0} courses
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
