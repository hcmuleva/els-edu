import React from "react";
import { Upload, X } from "lucide-react";

/**
 * Reusable Image Upload Component
 * @param {Object} props
 * @param {File|string|null} props.value - Current image (File object or URL string)
 * @param {Function} props.onChange - Callback when image changes (receives File object)
 * @param {Function} props.onRemove - Callback when image is removed
 * @param {string} props.preview - Preview URL for the image
 * @param {string} props.label - Label for the upload field
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional classes for the container
 */
export const ImageUpload = ({
  value,
  onChange,
  onRemove,
  preview,
  label = "Image",
  required = false,
  className = "",
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      onChange(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-bold text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {preview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden group border border-border/50">
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={onRemove}
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="mb-2 text-sm font-medium text-gray-600">
              <span className="font-bold text-primary">Click to upload</span> or
              drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
};
