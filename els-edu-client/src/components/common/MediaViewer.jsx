import React, { useState, useEffect } from "react";
import { useDataProvider } from "react-admin";
import {
  PlayCircle,
  FileText,
  Image,
  File,
  Volume2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { renderDescriptionBlocks } from "../../utils/blockRenderer";

/**
 * MediaViewer - Reusable multi-purpose media player component
 *
 * Supports:
 * - YouTube videos (via youtubeurl)
 * - Images (via multimedia relation)
 * - Audio files (via multimedia relation)
 * - PDF/Documents (via multimedia relation)
 * - Text content (title + description only)
 *
 * Props:
 * - content: The content object with title, youtubeurl, multimedia, json_description, etc.
 * - showDescription: Whether to show description section (default: true)
 * - showTitle: Whether to show title (default: true)
 * - autoFetch: Whether to auto-fetch full content details (default: true)
 * - compact: Whether to use compact layout (default: false)
 * - className: Additional CSS classes
 */
const MediaViewer = ({
  content,
  showDescription = true,
  showTitle = true,
  autoFetch = true,
  compact = false,
  className = "",
}) => {
  const dataProvider = useDataProvider();
  const [contentDetails, setContentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch full content details if autoFetch is enabled
  useEffect(() => {
    const fetchDetails = async () => {
      if (!content || !autoFetch) {
        setContentDetails(content);
        return;
      }

      // If content already has full details (has json_description), skip fetch
      if (content.json_description) {
        setContentDetails(content);
        return;
      }

      try {
        setLoading(true);
        const targetId = content.documentId || content.id;
        const { data } = await dataProvider.getOne("contents", {
          id: targetId,
          meta: {
            populate: ["multimedia", "quizzes"],
          },
        });
        setContentDetails(data);
      } catch (error) {
        console.error("Error fetching content details:", error);
        setContentDetails(content);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [content, autoFetch, dataProvider]);

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

  // Determine content type and media
  const youtubeId = content?.youtubeurl
    ? getYoutubeId(content.youtubeurl)
    : null;
  const multimedia = contentDetails?.multimedia || content?.multimedia;
  const multimediaUrl = multimedia?.url;
  const multimediaMime = multimedia?.mime || "";

  const isVideo = youtubeId || multimediaMime.startsWith("video/");
  const isAudio = multimediaMime.startsWith("audio/");
  const isImage = multimediaMime.startsWith("image/");
  const isPdf = multimediaMime === "application/pdf";
  const hasMedia = isVideo || isAudio || isImage || isPdf;

  // If no content at all
  if (!content) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-64 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 ${className}`}
      >
        <FileText className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-gray-500 font-medium">No content available</p>
      </div>
    );
  }

  // Render the appropriate media player
  const renderMediaPlayer = () => {
    // YouTube Video
    if (youtubeId) {
      return (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative border border-border/50">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
            title={content.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Native Video
    if (multimediaMime.startsWith("video/") && multimediaUrl) {
      return (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative border border-border/50">
          <video
            src={multimediaUrl}
            controls
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio
    if (isAudio && multimediaUrl) {
      return (
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 flex flex-col items-center justify-center border border-border/50 shadow-sm">
          <Volume2 className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            {content.title}
          </h3>
          <audio src={multimediaUrl} controls className="w-full max-w-md">
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Image
    if (isImage && multimediaUrl) {
      return (
        <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-border/50">
          <img
            src={multimediaUrl}
            alt={content.title}
            className="w-full h-auto max-h-[600px] object-contain mx-auto"
          />
        </div>
      );
    }

    // PDF/Document
    if (isPdf && multimediaUrl) {
      return (
        <div className="bg-gray-50 rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-white border-b border-border/50">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-red-500" />
              <div>
                <h4 className="font-bold text-gray-800">{content.title}</h4>
                <p className="text-sm text-gray-500">PDF Document</p>
              </div>
            </div>
            <a
              href={multimediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open PDF
            </a>
          </div>
          <iframe
            src={`${multimediaUrl}#toolbar=1`}
            title={content.title}
            className="w-full h-[500px]"
          />
        </div>
      );
    }

    // No media - just show placeholder (will be hidden if hasMedia is false)
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Media Player - Only show if there's actual media */}
      {hasMedia && renderMediaPlayer()}

      {/* Content Info Card */}
      {(showTitle || showDescription) && (
        <div
          className={`bg-white rounded-2xl border border-border/50 shadow-sm ${
            compact ? "p-4" : "p-6"
          }`}
        >
          {/* Title */}
          {showTitle && (
            <div className="mb-4">
              <h2
                className={`font-black text-gray-800 ${
                  compact ? "text-lg" : "text-2xl"
                }`}
              >
                {content.title}
              </h2>
              {content.createdAt && (
                <p className="text-sm text-gray-400 font-medium mt-1">
                  Added on{" "}
                  {new Date(content.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {showDescription && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h3>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ) : (
                <>
                  <div
                    className={`relative overflow-hidden transition-all duration-500 ${
                      isDescriptionExpanded ? "max-h-full" : "max-h-24"
                    }`}
                  >
                    {renderDescriptionBlocks(
                      contentDetails?.json_description ||
                        content?.json_description ||
                        content?.description
                    )}

                    {/* Gradient Overlay when collapsed */}
                    {!isDescriptionExpanded && (
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaViewer;
