import React, { useState } from "react";
import { X, Maximize2 } from "lucide-react";

const ImagePreview = ({ src, alt, className = "w-12 h-12" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to handle Strapi media URLs
  const getImageUrl = (url) => {
    if (!url) return "https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image";
    if (url.startsWith("http")) return url;
    return `${process.env.REACT_APP_API_URL || ""}${url}`;
  };

  const finalSrc = getImageUrl(src);

  return (
    <>
      <div
        className={`${className} relative group cursor-pointer overflow-hidden rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md`}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={finalSrc}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
          <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-y-0 right-0 left-64 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        >
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all duration-200 border border-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={finalSrc}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {alt && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-sm font-bold text-white tracking-wide uppercase">
                {alt}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImagePreview;
