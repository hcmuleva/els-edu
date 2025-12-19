import React, { useState } from "react";
import { X, Search, Info } from "lucide-react";

const CountListModal = ({
  isOpen = true,
  title,
  items = [],
  nameField = "name",
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Don't render the modal if isOpen is false
  if (!isOpen) return null;

  if (!items) return null;

  const filteredItems = items.filter((item) =>
    (item[nameField] || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-y-0 right-0 left-64 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-border/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 font-medium">
              {items.length} items total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-50 p-4 rounded-full mb-3">
                <Search className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">No items found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                    <Info className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 truncate">
                    {item[nameField] || "Untitled Item"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 text-center bg-gray-50/50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
            End of List
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountListModal;
