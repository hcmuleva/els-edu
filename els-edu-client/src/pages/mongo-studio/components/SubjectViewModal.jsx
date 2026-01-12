import React, { useState, useEffect } from "react";
import { useDataProvider } from "react-admin";
import { X, Layers, BookOpen, FileQuestion, Calendar, Loader2 } from "lucide-react";

const SubjectViewModal = ({ documentId, onClose }) => {
  const dataProvider = useDataProvider();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubject = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch subject by documentId
        const { data } = await dataProvider.getList("subjects", {
          pagination: { page: 1, perPage: 1 },
          filter: {
            documentId: { $eq: documentId },
          },
          meta: {
            populate: {
              coverpage: { fields: ["url"] },
              topics: { fields: ["documentId", "name"] },
              quizzes: { fields: ["documentId", "title"] },
            },
          },
        });

        if (data && data.length > 0) {
          setSubject(data[0]);
        } else {
          setError("Subject not found");
        }
      } catch (err) {
        console.error("Error fetching subject:", err);
        setError("Failed to load subject details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [documentId, dataProvider]);

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

  const getLevelLabel = (level) => {
    const labels = {
      1: "Level 1 - Beginner",
      2: "Level 2 - Elementary",
      3: "Level 3 - Intermediate",
      4: "Level 4 - Advanced",
      5: "Level 5 - Expert",
    };
    if (!level && level !== 0) return "Not specified";
    return labels[level] || `Level ${level}`;
  };

  if (!documentId) return null;

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
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Subject Details
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                {documentId}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-sm text-gray-500 mt-2">Document ID: {documentId}</p>
            </div>
          ) : subject ? (
            <>
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

              {/* Description */}
              {subject.description && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Description
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {subject.description}
                    </p>
                  </div>
                </div>
              )}

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
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Document ID
                  </span>
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {subject.documentId}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-border/50 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Created on{" "}
                  {subject.createdAt
                    ? new Date(subject.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SubjectViewModal;

