import React, { useState, useEffect, useRef } from 'react';
import { useDataProvider } from 'react-admin';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * CustomAsyncSelect - Styled async selector that fetches data from API
 * Uses custom dropdown UI consistent with CustomSelect
 * 
 * @param {string} label - Field label
 * @param {any} value - Selected value (documentId)
 * @param {function} onChange - Change handler
 * @param {string} resource - Resource name (e.g., 'topics')
 * @param {string} optionText - Field to display (e.g., 'name')
 * @param {string} placeholder - Optional placeholder
 * @param {boolean} allowEmpty - Allow clearing selection
 * @param {boolean} disabled - Disabled state
 * @param {string} helperText - Optional helper text
 * @param {boolean} searchable - Enable search filtering
 */
export const CustomAsyncSelect = ({
    label,
    value,
    onChange,
    resource,
    optionText = 'name',
    placeholder = 'Select...',
    allowEmpty = true,
    disabled = false,
    helperText,
    searchable = true
}) => {
    const dataProvider = useDataProvider();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Fetch Data
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { data } = await dataProvider.getList(resource, {
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: optionText, order: 'ASC' },
                    filter: {},
                });
                setOptions(data);
            } catch (error) {
                console.error(`Error fetching ${resource}:`, error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [dataProvider, resource, optionText]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const filteredOptions = searchable && searchQuery
        ? options.filter(opt => 
            opt[optionText]?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const selectedOption = options.find(opt => opt.id === value);

    const handleSelect = (option) => {
        // Pass numeric ID for relation filtering
        onChange(option.id);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
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
                    bg-white
                    ${isOpen 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border/50 hover:border-primary/50'
                    }
                    ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-500' : 'text-foreground'}`}>
                    {loading ? 'Loading...' : (selectedOption ? selectedOption[optionText] : placeholder)}
                </span>
                
                <div className="flex items-center gap-2">
                    {allowEmpty && selectedOption && !disabled && (
                        <div 
                            onClick={handleClear}
                            className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Helper Text */}
            {helperText && !isOpen && (
                <p className="text-xs text-muted-foreground mt-1.5">
                    {helperText}
                </p>
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

                    {/* Options List - Max height ~6 items (6 * 40px = 240px) */}
                    <div 
                        className="overflow-y-auto p-1"
                        style={{ maxHeight: '240px' }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        w-full px-3 py-2.5 text-left text-sm rounded-lg flex items-center justify-between group transition-colors
                                        ${option.id === value 
                                            ? 'bg-primary/5 text-primary font-medium' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span>{option[optionText]}</span>
                                    {option.id === value && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                {searchQuery ? 'No results found' : 'No options available'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
