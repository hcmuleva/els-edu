import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Responsive Pagination Component
 *
 * @param {number} currentPage - 1-based current page index
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes (receives new page number)
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Generate page numbers for desktop view
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Max page buttons to show

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Logic to show truncated pages (e.g., 1 ... 4 5 6 ... 10)
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 select-none">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 bg-white"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Mobile Indicator (Page X of Y) - Visible on small screens */}
      <div className="md:hidden flex items-center px-4 font-medium text-gray-700 bg-white border border-gray-200 rounded-xl h-10 text-sm">
        Page {currentPage} of {totalPages}
      </div>

      {/* Desktop Page Numbers - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-1.5">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-400 font-medium"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] h-10 px-3 rounded-xl text-sm font-semibold transition-all ${
                currentPage === page
                  ? "bg-primary-500 text-white shadow-md shadow-primary-200"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 bg-white"
        aria-label="Next Page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
