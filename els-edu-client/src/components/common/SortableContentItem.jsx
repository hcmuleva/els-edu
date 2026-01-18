import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, FileText, Video } from "lucide-react";

export const SortableContentItem = ({ content, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.documentId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${
        isDragging ? "shadow-lg z-50 ring-2 ring-primary/20" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div
        className={`p-2 rounded-lg ${
          content.type === "video"
            ? "bg-red-50 text-red-500"
            : "bg-blue-50 text-blue-500"
        }`}
      >
        {content.type === "video" ? (
          <Video className="w-5 h-5" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
        {content.description && (
          <p className="text-xs text-gray-500 truncate">
            {content.description}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(content.documentId)}
        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
        title="Remove from selection"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
