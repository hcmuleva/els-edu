import React, { useState, useEffect } from "react";
import { useDataProvider } from "react-admin";
import { X, FolderTree, FileQuestion, Calendar, Loader2, BookOpen } from "lucide-react";

const TopicViewModal = ({ documentId, onClose }) => {
  const dataProvider = useDataProvider();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch topic by documentId
        const { data } = await dataProvider.getList("topics", {
          pagination: { page: 1, perPage: 1 },
          filter: {
            documentId: { $eq: documentId },
          },
          meta: {
            populate: {
              subjects: { fields: ["documentId", "name"] },
              quizzes: { fields: ["documentId", "title"] },
              questions: { fields: ["documentId", "question"] },
            },
          },
        });

        if (data && data.length > 0) {
          setTopic(data[0]);
        } else {
          setError("Topic not found");
        }
      } catch (err) {
        console.error("Error fetching topic:", err);
        setError("Failed to load topic details");
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [documentId, dataProvider]);

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
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              {topic?.icon ? (
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
          ) : topic ? (
            <>
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
                    Subjects
                  </span>
                  <div className="font-bold text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {topic.subjects && topic.subjects.length > 0 ? (
                        topic.subjects.map((sub) => (
                          <span
                            key={sub.id || sub.documentId}
                            className="px-2 py-1 bg-gray-100 rounded-md text-sm"
                          >
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 font-normal">
                          No subjects assigned
                        </span>
                      )}
                    </div>
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
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    {topic.questions?.length || 0}
                  </span>
                </div>
                {topic.topic_level && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Level
                    </span>
                    <span className="font-bold text-gray-900">
                      Level {topic.topic_level}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Document ID
                  </span>
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {topic.documentId}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-border/50 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Created on{" "}
                  {topic.createdAt
                    ? new Date(topic.createdAt).toLocaleDateString("en-US", {
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

export default TopicViewModal;



