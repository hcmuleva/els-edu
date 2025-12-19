import React from "react";
import { Upload, X, File, Video, Music, FileText } from "lucide-react";

/**
 * Reusable Media Upload Component (for images, videos, audios, files)
 * @param {Object} props
 * @param {File|File[]|string|string[]|null} props.value - Current media (File object(s) or URL string(s))
 * @param {Function} props.onChange - Callback when media changes (receives File or File[])
 * @param {Function} props.onRemove - Callback when media is removed (receives index for multiple files)
 * @param {string|string[]} props.preview - Preview URL(s) for the media
 * @param {boolean} props.multiple - Allow multiple file uploads
 * @param {string} props.accept - File types to accept (default: all media types)
 * @param {string} props.label - Label for the upload field
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional classes for the container
 */
export const MediaUpload = ({
  value,
  onChange,
  onRemove,
  preview,
  multiple = false,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx",
  label = "Media Files",
  required = false,
  className = "",
}) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (multiple) {
      onChange(files);
    } else {
      onChange(files[0]);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File className="w-10 h-10 text-gray-400" />;

    const type = file.type || "";
    if (type.startsWith("image/")) return null; // Will show preview
    if (type.startsWith("video/"))
      return <Video className="w-10 h-10 text-blue-500" />;
    if (type.startsWith("audio/"))
      return <Music className="w-10 h-10 text-purple-500" />;
    return <FileText className="w-10 h-10 text-gray-500" />;
  };

  const previews = Array.isArray(preview) ? preview : preview ? [preview] : [];
  const files = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-bold text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {previews.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {previews.map((previewUrl, index) => {
            const file = files[index];
            const isImage =
              file instanceof File
                ? file.type.startsWith("image/")
                : previewUrl &&
                  (previewUrl.includes("image") ||
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(previewUrl));

            return (
              <div
                key={index}
                className="relative w-full h-48 rounded-xl overflow-hidden group border border-border/50"
              >
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                    {getFileIcon(file)}
                    <p className="mt-2 text-sm font-medium text-gray-600">
                      {file instanceof File ? file.name : "Media File"}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onRemove(multiple ? index : null)}
                    className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Upload Area - Always show if multiple or no files yet */}
      {(multiple || previews.length === 0) && (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="mb-2 text-sm font-medium text-gray-600">
              <span className="font-bold text-primary">Click to upload</span> or
              drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? "Multiple files supported" : "Single file"}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
};
