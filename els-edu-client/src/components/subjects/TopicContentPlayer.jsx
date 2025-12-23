import React, { useState, useEffect, useMemo } from "react";
import { useDataProvider } from "react-admin";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { renderDescriptionBlocks } from "../../utils/blockRenderer";
import {
  PlayCircle,
  FileText,
  LayoutGrid,
  RotateCcw,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  SkipForward,
} from "lucide-react";

const TopicContentPlayer = ({ topic, onQuizStart }) => {
  const dataProvider = useDataProvider();

  // State
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentDetails, setContentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Initialize selected content
  useEffect(() => {
    if (topic?.contents && topic.contents.length > 0) {
      setSelectedContent(topic.contents[0]);
    } else {
      setSelectedContent(null);
    }
  }, [topic]);

  // Fetch full details when selected content changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedContent) {
        setContentDetails(null);
        return;
      }

      // Optimization: If the selected content already has description (e.g. fully loaded), use it
      // checking for a known field that might be missing in partial load, like 'json_description'
      // We assume simple check here.

      try {
        setLoadingDetails(true);
        // Strapi v5 uses documentId for fetching single items
        const targetId = selectedContent.documentId || selectedContent.id;
        const { data } = await dataProvider.getOne("contents", {
          id: targetId,
          meta: {
            populate: ["multimedia", "quizzes"], // Ensure quizzes are fetched
          },
        });
        setContentDetails(data);
      } catch (error) {
        console.error("Error fetching content details:", error);
        // Fallback to basic info if fetch fails
        setContentDetails(selectedContent);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedContent, dataProvider]);

  // Derived Logic: Topic Quizzes
  const topicQuizzes = topic?.quizzes || [];

  // Filter Content
  const filteredContent = useMemo(() => {
    if (!topic?.contents) return [];
    let content = topic.contents;
    if (searchQuery) {
      content = content.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return content;
  }, [topic, searchQuery]);

  // Infinite Scroll / Load More
  const visibleContent = filteredContent.slice(0, visibleCount);
  const hasMore = visibleContent.length < filteredContent.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  if (!topic || !topic.contents || topic.contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <FileText className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">
          No content available for this topic
        </p>
      </div>
    );
  }

  // Helper to extract YouTube ID
  const getYoutubeId = (url) => {
    if (!url) return null;
    try {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  const youtubeId = selectedContent
    ? getYoutubeId(selectedContent.youtubeurl)
    : null;

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Play Next Logic
  const currentIndex = selectedContent
    ? filteredContent.findIndex((c) => c.id === selectedContent.id)
    : -1;
  const nextContent =
    currentIndex >= 0 && currentIndex < filteredContent.length - 1
      ? filteredContent[currentIndex + 1]
      : null;

  const handlePlayNext = () => {
    if (nextContent) {
      setSelectedContent(nextContent);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Player & Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Player - Only show for video/media content types */}
          {(() => {
            // Determine if we should show the media player
            const contentType = selectedContent?.type;
            const hasYoutube = youtubeId;
            const hasMultimedia =
              contentDetails?.multimedia &&
              contentDetails.multimedia.length > 0;

            // Content types that need media player
            const isYoutubeType = contentType === "YOUTUBE" || hasYoutube;
            const isVideoType = contentType === "VIDEO";
            const isImageType = contentType === "IMAGE";
            const isDocumentType =
              contentType === "DOCUMENT" || contentType === "DOWNLOAD";

            // Text-only content types - don't show media player
            const isTextOnly = contentType === "TEXT" || contentType === "MD";

            // If text-only or no media at all, don't render player
            if (isTextOnly || (!hasYoutube && !hasMultimedia)) {
              return null;
            }

            // YouTube Video
            if (isYoutubeType && hasYoutube) {
              return (
                <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-video relative group border border-border/50">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                    title={selectedContent.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }

            // Native Video from multimedia
            if ((isVideoType || !contentType) && hasMultimedia) {
              const video = contentDetails.multimedia.find((m) =>
                m.mime?.startsWith("video/")
              );
              if (video) {
                return (
                  <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-video relative group border border-border/50">
                    <video
                      src={video.url}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                );
              }
            }

            // Image from multimedia
            if (isImageType && hasMultimedia) {
              const image = contentDetails.multimedia.find((m) =>
                m.mime?.startsWith("image/")
              );
              if (image) {
                return (
                  <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-sm border border-border/50">
                    <img
                      src={image.url}
                      alt={selectedContent.title}
                      className="w-full h-auto max-h-[500px] object-contain mx-auto"
                    />
                  </div>
                );
              }
            }

            // Document/PDF from multimedia
            if (isDocumentType && hasMultimedia) {
              const doc = contentDetails.multimedia.find(
                (m) =>
                  m.mime === "application/pdf" || m.mime?.includes("document")
              );
              if (doc) {
                return (
                  <div className="bg-gray-50 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-white border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {selectedContent.title}
                          </h4>
                          <p className="text-sm text-gray-500">Document</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Open Document
                      </a>
                    </div>
                    {doc.mime === "application/pdf" && (
                      <iframe
                        src={`${doc.url}#toolbar=1`}
                        title={selectedContent.title}
                        className="w-full h-[400px]"
                      />
                    )}
                  </div>
                );
              }
            }

            // Fallback - no media to show
            return null;
          })()}

          {/* Content Details */}
          {selectedContent && (
            <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 mb-1">
                    {selectedContent.title}
                  </h2>
                  {selectedContent.createdAt && (
                    <div className="text-sm text-gray-400 font-medium">
                      Added on {formatDate(selectedContent.createdAt)}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                  {nextContent && (
                    <button
                      onClick={handlePlayNext}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
                    >
                      <span>Next</span>
                      <SkipForward className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Related Quizzes - Below Title */}
              {(contentDetails?.quizzes?.length > 0 ||
                topicQuizzes.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Content Specific Quizzes */}
                  {contentDetails?.quizzes?.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => onQuizStart && onQuizStart(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg font-bold text-xs transition-colors shadow-sm shadow-violet-200"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Quiz: {quiz.title}</span>
                    </button>
                  ))}

                  {/* Topic Quizzes (Optional fallback or separate section? User asked for content quizzes) 
                      Let's keeping topic quizzes distinct or removed if content quizzes exist? 
                      The user said "only load quiz in the qontent when the quiz is assigned to the content".
                      I will render content quizzes first. I'll keep topic quizzes but visually distinct or maybe only if no content quizzes?
                      Actually, let's keep both but maybe different styling?
                      Or just render content quizzes as requested.
                  */}
                </div>
              )}

              {/* Description Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>

                {/* Description with Book Style Rendering */}
                <div
                  className={`relative overflow-hidden transition-all duration-500 ${
                    isDescriptionExpanded ? "max-h-full" : "max-h-24"
                  }`}
                >
                  {loadingDetails ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                  ) : (
                    renderDescriptionBlocks(
                      contentDetails?.json_description ||
                        selectedContent?.json_description ||
                        selectedContent?.description
                    )
                  )}

                  {/* Gradient Overlay when collapsed */}
                  {!isDescriptionExpanded && !loadingDetails && (
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Toggle Button */}
                {!loadingDetails && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="mt-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        ...more <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Up Next / Playlist (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col h-full space-y-4">
          {/* Filters Header */}
          <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Up Next
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {filteredContent.length}
                </span>
              </h3>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[400px] space-y-3 pr-2 custom-scrollbar">
            {visibleContent.map((content) => {
              const isSelected = selectedContent?.id === content.id;
              const thumbId = getYoutubeId(content.youtubeurl);
              const thumbnailUrl = thumbId
                ? `https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`
                : null;

              // Extract short description from JSON if available (first block)
              let shortDesc = "";
              if (
                content.json_description &&
                Array.isArray(content.json_description) &&
                content.json_description[0]?.children
              ) {
                shortDesc = content.json_description[0].children
                  .map((c) => c.text)
                  .join("");
              } else if (typeof content.description === "string") {
                shortDesc = content.description;
              }

              return (
                <button
                  key={content.id}
                  onClick={() => {
                    setSelectedContent(content);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-full flex gap-3 p-2 rounded-xl transition-all text-left group ${
                    isSelected
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-32 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <h4
                      className={`text-sm font-bold line-clamp-2 leading-tight mb-1 ${
                        isSelected ? "text-primary" : "text-gray-800"
                      }`}
                    >
                      {content.title}
                    </h4>

                    {shortDesc && (
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                        {shortDesc}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-100 px-1.5 py-0.5 rounded">
                        Video
                      </span>
                      {content.createdAt && (
                        <span className="text-[10px] text-gray-400">
                          • {new Date(content.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredContent.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No videos match your search.
              </div>
            )}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
              >
                Load more videos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicContentPlayer;
