import React from "react";
import { GraduationCap, BookOpen, AlertCircle } from "lucide-react";

/**
 * EnrollModal - Confirmation modal for enrollment
 *
 * Props:
 * - isOpen: Whether modal is open
 * - onClose: Close callback
 * - onConfirm: Confirm enrollment callback
 * - course: Course being enrolled in
 * - subject: Optional - specific subject (for single subject enrollment)
 * - loading: Whether enrollment is in progress
 */
const EnrollModal = ({
  isOpen,
  onClose,
  onConfirm,
  course,
  subject = null,
  loading = false,
}) => {
  if (!isOpen) return null;

  const isSubjectEnroll = !!subject;
  const title = isSubjectEnroll ? subject.name : course?.name;
  const subjectCount = course?.subjects?.length || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              {isSubjectEnroll ? (
                <BookOpen className="w-8 h-8" />
              ) : (
                <GraduationCap className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-xl font-black text-center">
              {isSubjectEnroll ? "Enroll in Subject" : "Enroll in Course"}
            </h2>
            <p className="text-center text-white/80 text-sm mt-1">
              FREE Enrollment
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              {title}
            </h3>

            {!isSubjectEnroll && (
              <p className="text-sm text-gray-500 text-center mb-4">
                You'll get access to all {subjectCount} subjects in this course
              </p>
            )}

            {isSubjectEnroll && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    You're enrolling in just this subject. Enroll in the full
                    course to access all subjects.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-colors disabled:opacity-50"
              >
                {loading ? "Enrolling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnrollModal;
