import React, { useMemo } from "react";
import { useShowController, useRedirect, Title, Loading } from "react-admin";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Youtube,
  Image as ImageIcon,
  Video,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export const ContentShow = () => {
  const { id } = useParams();
  const redirect = useRedirect();

  const { record, isLoading } = useShowController({
    resource: "contents",
    id,
    meta: { populate: ["topic", "subjects", "multimedia", "creator"] },
  });

  // Helper to extract text from blocks for Markdown
  const descriptionMarkdown = useMemo(() => {
    if (!record?.json_description || !Array.isArray(record.json_description))
      return "";
    return record.json_description
      .map((block) => {
        if (block.type === "paragraph" && block.children) {
          return block.children.map((child) => child.text).join("");
        }
        return "";
      })
      .join("\n\n");
  }, [record]);

  if (isLoading) return <Loading />;
  if (!record) return null;

  const getIcon = () => {
    switch (record.type) {
      case "YOUTUBE":
        return <Youtube className="w-5 h-5 text-red-600" />;
      case "IMAGE":
        return <ImageIcon className="w-5 h-5 text-blue-600" />;
      case "VIDEO":
        return <Video className="w-5 h-5 text-purple-600" />;
      case "DOWNLOAD":
        return <Download className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Title title={`Content: ${record.title}`} />

      {/* Header */}
      <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => redirect("/my-contents")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to My Contents"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {record.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  {getIcon()}
                  {record.type}
                </span>
                <span className="text-xs text-gray-500">
                  • Added on {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => redirect(`/contents/${id}`)}
              className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm"
            >
              Edit Content
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border/30 pb-2">
                Description
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                {descriptionMarkdown ? (
                  <ReactMarkdown>{descriptionMarkdown}</ReactMarkdown>
                ) : (
                  <p className="italic text-gray-400">
                    No description provided.
                  </p>
                )}
              </div>
            </div>

            {/* Media Preview */}
            {record.type === "YOUTUBE" && record.youtubeurl && (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-1 overflow-hidden">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${
                      record.youtubeurl.split("v=")[1]?.split("&")[0]
                    }`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {record.multimedia && record.multimedia.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border/30 pb-2">
                  Attached Media
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {record.multimedia.map((file, idx) => (
                    <div
                      key={idx}
                      className="group relative border rounded-xl overflow-hidden bg-gray-50"
                    >
                      {file.mime?.startsWith("image/") ? (
                        <img
                          src={`${
                            import.meta.env.VITE_API_URL ||
                            "http://localhost:1337"
                          }${file.url}`}
                          alt={file.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 flex flex-col items-center justify-center p-4 text-center">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs font-medium text-gray-600 truncate w-full">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <a
                        href={`${
                          import.meta.env.VITE_API_URL ||
                          "http://localhost:1337"
                        }${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Download className="w-6 h-6" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Relations
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Topic
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm font-semibold text-gray-900">
                      {record.topic?.name || "No Topic"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Subject
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {record.subjects && record.subjects.length > 0 ? (
                      record.subjects.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100"
                        >
                          {typeof s === "object" ? s.name : s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No subjects</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Creator
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                      {record.creator?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {record.creator?.username || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
