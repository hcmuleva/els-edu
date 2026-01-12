import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Loader2, Check } from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";

/**
 * MongoDB Collection Multi-Select Component
 * Allows selecting multiple items from a MongoDB collection
 */
const MongoCollectionMultiSelect = ({
  collection,
  value = [],
  onChange,
  placeholder = "Select...",
  labelField = "name",
  valueField = "_id",
  required = false,
  disabled = false,
  className = "",
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Ensure value is an array
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Fetch MongoDB collection data
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/mongo-studio/${collection}`, {
          params: {
            page: 1,
            perPage: 1000,
            sortField: labelField,
            sortOrder: "ASC",
          },
        });

        const items = response.data?.data || response.data || [];
        setOptions(items);
      } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (collection) {
      fetchOptions();
    }
  }, [collection, labelField]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) => {
    const label = option[labelField] || option.name || "";
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggle = (option) => {
    const optionValue = String(option[valueField] || option._id);
    const isSelected = selectedValues.some((v) => String(v) === optionValue);

    let newValues;
    if (isSelected) {
      newValues = selectedValues.filter((v) => String(v) !== optionValue);
    } else {
      newValues = [...selectedValues, optionValue];
    }

    onChange(newValues);
  };

  const handleRemove = (valueToRemove, e) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((v) => String(v) !== String(valueToRemove));
    onChange(newValues);
  };

  const getSelectedOptions = () => {
    return options.filter((opt) => {
      const optValue = String(opt[valueField] || opt._id);
      return selectedValues.some((v) => String(v) === optValue);
    });
  };

  const selectedOptions = getSelectedOptions();

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[42px] px-3 py-2 text-left border border-border rounded-lg bg-background text-foreground",
          "flex items-center justify-between gap-2",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[24px]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => {
              const optValue = String(option[valueField] || option._id);
              const label = option[labelField] || option.name || optValue;
              return (
                <span
                  key={optValue}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded-md"
                >
                  {label}
                  {!required && (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-primary/70"
                      onClick={(e) => handleRemove(optValue, e)}
                    />
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = String(option[valueField] || option._id);
                const optionLabel = option[labelField] || option.name || optionValue;
                const isSelected = selectedValues.some((v) => String(v) === optionValue);

                return (
                  <div
                    key={optionValue}
                    onClick={() => handleToggle(option)}
                    className={cn(
                      "px-3 py-2 cursor-pointer text-sm transition-colors flex items-center gap-2",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {optionLabel}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MongoCollectionMultiSelect;

