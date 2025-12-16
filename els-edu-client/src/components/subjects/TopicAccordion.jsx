import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, PlayCircle } from "lucide-react";

const TopicAccordion = ({ topic, onQuizStart }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentCount = topic?.contents?.length || 0;
  const quizCount = topic?.quizzes?.length || 0;

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-primary/30 transition-colors">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
            {topic?.icon ? (
              <span className="text-2xl">{topic.icon}</span>
            ) : (
              <FileText className="w-6 h-6 text-primary" />
            )}
          </div>

          {/* Topic Info */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-800">{topic.name}</h3>
            {topic.description && (
              <p className="text-sm text-gray-500 font-medium">
                {topic.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span>
                {contentCount} Content{contentCount !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                {quizCount} Quiz{quizCount !== 1 ? "zes" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t-2 border-gray-100 p-5 space-y-4 bg-gray-50/50">
          {/* Content Items */}
          {contentCount > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </h4>
              <div className="space-y-2">
                {topic.contents.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                        {content.title}
                      </p>
                      {content.type && (
                        <span className="text-xs text-gray-500 uppercase font-bold">
                          {content.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes */}
          {quizCount > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Quizzes
              </h4>
              <div className="space-y-2">
                {topic.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                        {quiz.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {quiz.difficulty && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                            {quiz.difficulty}
                          </span>
                        )}
                        {quiz.questions?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {quiz.questions.length} questions
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onQuizStart(quiz)}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all text-sm"
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {contentCount === 0 && quizCount === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              No content or quizzes available for this topic yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicAccordion;
