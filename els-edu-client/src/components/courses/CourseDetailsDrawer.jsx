import React from "react";
import {
  X,
  BookOpen,
  Layers,
  GraduationCap,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const CATEGORY_COLORS = {
  KIDS: "bg-pink-100 text-pink-700",
  PRIMARY: "bg-blue-100 text-blue-700",
  MIDDLE: "bg-purple-100 text-purple-700",
  SCHOOL: "bg-indigo-100 text-indigo-700",
  COLLEGE: "bg-cyan-100 text-cyan-700",
  OLDAGE: "bg-amber-100 text-amber-700",
  SANSKAR: "bg-orange-100 text-orange-700",
  COMPETION: "bg-red-100 text-red-700",
  PROJECT: "bg-green-100 text-green-700",
  DIY: "bg-lime-100 text-lime-700",
  EDUCATION: "bg-teal-100 text-teal-700",
};

/**
 * CourseDetailsDrawer - Slide-out drawer showing full course details
 *
 * Props:
 * - course: Course object with subjects populated
 * - isOpen: Whether drawer is open
 * - onClose: Close callback
 * - isEnrolled: Whether user is enrolled
 * - onEnroll: Enroll callback (full course)
 * - onSubjectEnroll: Enroll in specific subject callback
 */
const CourseDetailsDrawer = ({
  course,
  isOpen,
  onClose,
  isEnrolled = false,
  onEnroll,
  onSubjectEnroll,
  enrolledSubjectIds = [],
}) => {
  if (!course) return null;

  const subjectCount = course?.subjects?.length || 0;
  const topicCount = (course?.subjects || []).reduce((total, subject) => {
    return total + (subject?.topics?.length || 0);
  }, 0);

  const categoryColor =
    CATEGORY_COLORS[course?.category] || "bg-gray-100 text-gray-700";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-200 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800">Course Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Cover */}
          <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl overflow-hidden">
            {course?.cover?.url ? (
              <img
                src={course.cover.url}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-20 h-20 text-primary/30" />
              </div>
            )}

            {/* Category Badge */}
            {course?.category && (
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${categoryColor} shadow-md`}
                >
                  {course.category}
                </span>
              </div>
            )}

            {isEnrolled && (
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-green-500 text-white shadow-md">
                  ✓ ENROLLED
                </span>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">
              {course.name}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span className="font-semibold">{subjectCount} Subjects</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span className="font-semibold">{topicCount} Topics</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {course?.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{
                  __html:
                    typeof course.description === "string"
                      ? course.description
                      : "",
                }}
              />
            </div>
          )}

          {/* Subjects List */}
          {subjectCount > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Subjects Included ({subjectCount})
              </h3>
              <div className="space-y-2">
                {(course.subjects || []).map((subject) => {
                  const isSubjectEnrolled = enrolledSubjectIds.includes(
                    subject.documentId || subject.id
                  );
                  const topicsInSubject = subject?.topics?.length || 0;

                  return (
                    <div
                      key={subject.documentId || subject.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            {subject.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {topicsInSubject} topics
                          </p>
                        </div>
                      </div>

                      {isSubjectEnrolled || isEnrolled ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : onSubjectEnroll ? (
                        <button
                          onClick={() => onSubjectEnroll(subject)}
                          className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        >
                          Enroll
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
          {isEnrolled ? (
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl"
            >
              Already Enrolled - View in My Subscriptions
            </button>
          ) : (
            <button
              onClick={() => onEnroll && onEnroll(course)}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-colors"
            >
              Enroll in Full Course (FREE)
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseDetailsDrawer;
