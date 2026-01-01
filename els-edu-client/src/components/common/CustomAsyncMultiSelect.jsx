import React, { useState, useEffect, useRef } from "react";
import { useDataProvider } from "react-admin";
import { ChevronDown, Search, Check, X } from "lucide-react";

/**
 * CustomAsyncMultiSelect - Multi-select async dropdown with chip display
 *
 * @param {string} label - Field label
 * @param {array} value - Selected values (array of numeric IDs)
 * @param {function} onChange - Change handler receives array of IDs
 * @param {string} resource - Resource name (e.g., 'topics')
 * @param {string} optionText - Field to display (e.g., 'name')
 * @param {string} placeholder - Optional placeholder
 * @param {boolean} disabled - Disabled state
 * @param {string} helperText - Optional helper text
 * @param {boolean} searchable - Enable search filtering
 * @param {array} initialData - Initial data objects for pre-selected values
 * @param {object} filter - Filter object to pass to the API query
 * @param {number} maxSelect - Maximum number of selections allowed
 */
export const CustomAsyncMultiSelect = ({
  label,
  value = [],
  onChange,
  resource,
  optionText = "name",
  placeholder = "Select...",
  disabled = false,
  helperText,
  searchable = true,
  initialData = [],
  filter = {},
  maxSelect = null,
}) => {
  const dataProvider = useDataProvider();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Ensure value is always an array
  const selectedIds = Array.isArray(value) ? value : [];

  // Fetch Data
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const { data } = await dataProvider.getList(resource, {
          pagination: { page: 1, perPage: 100 },
          sort: { field: optionText, order: "ASC" },
          filter: filter || {},
        });

        // Merge initialData with fetched options
        let mergedOptions = data;
        if (initialData && initialData.length > 0) {
          const existingIds = new Set(
            data.map((opt) => opt.documentId || opt.id)
          );
          const missingInitial = initialData.filter(
            (item) =>
              (item.documentId || item.id) &&
              !existingIds.has(item.documentId || item.id)
          );
          if (missingInitial.length > 0) {
            mergedOptions = [...missingInitial, ...data];
          }
        }

        setOptions(mergedOptions);
      } catch (error) {
        console.error(`Error fetching ${resource}:`, error);
        if (initialData && initialData.length > 0) {
          setOptions(initialData);
        } else {
          setOptions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [dataProvider, resource, optionText, JSON.stringify(filter)]);

  // Handle initialData changes
  useEffect(() => {
    if (initialData && initialData.length > 0 && !loading) {
      setOptions((prevOptions) => {
        const existingIds = new Set(
          prevOptions.map((opt) => opt.documentId || opt.id)
        );
        const missingInitial = initialData.filter(
          (item) =>
            (item.documentId || item.id) &&
            !existingIds.has(item.documentId || item.id)
        );
        if (missingInitial.length > 0) {
          return [...missingInitial, ...prevOptions];
        }
        return prevOptions;
      });
    }
  }, [initialData, loading]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((opt) =>
          opt[optionText]?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

  const selectedOptions = options.filter((opt) =>
    selectedIds.some((id) => id == opt.documentId || id == opt.id)
  );

  const handleToggle = (option) => {
    const optionId = option.documentId || option.id;
    const isSelected = selectedIds.some((id) => id == optionId);
    let newValue;

    if (isSelected) {
      // Remove from selection
      newValue = selectedIds.filter((id) => id != optionId);
    } else {
      // Add to selection (check max limit)
      if (maxSelect && selectedIds.length >= maxSelect) {
        return; // Don't add if max reached
      }
      newValue = [...selectedIds, optionId];
    }

    onChange(newValue);
    setSearchQuery("");
  };

  const handleRemove = (optionId, e) => {
    e.stopPropagation();
    const newValue = selectedIds.filter((id) => id != optionId);
    onChange(newValue);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full px-3 py-2 text-left text-sm font-medium rounded-lg
          border transition-all duration-200 flex items-center justify-between
          bg-white min-h-[42px]
          ${
            isOpen
              ? "border-primary ring-2 ring-primary/20"
              : "border-border/50 hover:border-primary/50"
          }
          ${
            disabled || loading
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : ""
          }
        `}
      >
        <span
          className={`truncate ${
            selectedOptions.length === 0 ? "text-gray-500" : "text-foreground"
          }`}
        >
          {loading
            ? "Loading..."
            : selectedOptions.length > 0
            ? `${selectedOptions.length} selected`
            : placeholder}
        </span>

        <div className="flex items-center gap-2">
          {selectedOptions.length > 0 && !disabled && (
            <div
              onClick={handleClearAll}
              className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Helper Text */}
      {helperText && !isOpen && (
        <p className="text-xs text-muted-foreground mt-1.5">{helperText}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 rounded-lg outline-none focus:bg-gray-100 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto p-1" style={{ maxHeight: "240px" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optionId = option.documentId || option.id;
                const isSelected = selectedIds.some((id) => id == optionId);
                return (
                  <button
                    key={optionId}
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={`
                      w-full px-3 py-2.5 text-left text-sm rounded-lg flex items-center justify-between group transition-colors
                      ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{option[optionText]}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? "No results found" : "No options available"}
              </div>
            )}
          </div>

          {/* Selected Chips Display */}
          {selectedOptions.length > 0 && (
            <div className="border-t border-gray-100 p-3 bg-gray-50/50">
              <div className="flex flex-wrap gap-2 items-center">
                {selectedOptions.map((option) => {
                  const optionId = option.documentId || option.id;
                  return (
                    <div
                      key={optionId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg border border-primary/20"
                    >
                      <span>{option[optionText]}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemove(optionId, e)}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <span className="text-xs text-gray-500 font-medium ml-auto">
                  {selectedOptions.length}
                  {maxSelect ? ` / ${maxSelect}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
