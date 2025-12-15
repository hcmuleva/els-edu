import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect - Reusable custom styled dropdown
 * Supports "colorful" mode for headers and "default" mode for forms
 * 
 * @param {string} label - Trigger label / prefix
 * @param {any} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} options - Array of { id, name } objects
 * @param {string} placeholder - Placeholder text
 * @param {string} color - Color theme ('default', 'blue', 'orange', 'green')
 * @param {string} error - Error message
 * @param {boolean} disabled - Disabled state
 */
export const CustomSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    color = 'default',
    error,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    const selectedOption = options.find(opt => opt.id === value);

    // Color Configurations
    const colorStyles = {
        default: {
            button: 'bg-white border border-border/50 text-foreground hover:border-primary/50',
            active: 'ring-2 ring-primary/20 border-primary',
            text: 'text-foreground',
            badge: 'bg-gray-100 text-gray-700'
        },
        blue: {
            button: 'bg-blue-50 border border-transparent text-blue-700 hover:bg-blue-100',
            active: 'ring-2 ring-blue-500/20',
            text: 'text-blue-700',
            badge: 'bg-blue-100 text-blue-700'
        },
        orange: {
            button: 'bg-orange-50 border border-transparent text-orange-700 hover:bg-orange-100',
            active: 'ring-2 ring-orange-500/20',
            text: 'text-orange-700',
            badge: 'bg-orange-100 text-orange-700'
        },
        green: {
            button: 'bg-emerald-50 border border-transparent text-emerald-700 hover:bg-emerald-100',
            active: 'ring-2 ring-emerald-500/20',
            text: 'text-emerald-700',
            badge: 'bg-emerald-100 text-emerald-700'
        }
    };

    const currentStyle = colorStyles[color] || colorStyles.default;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all w-full justify-between
                    ${currentStyle.button}
                    ${isOpen ? currentStyle.active : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'border-red-500 bg-red-50 text-red-600' : ''}
                `}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 opacity-70 ${isOpen ? 'rotate-180' : ''} transition-transform flex-shrink-0`} />
            </button>

            {/* Error Message */}
            {error && (
                <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium whitespace-nowrap">
                    {error}
                </span>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute top-full left-0 mt-1 min-w-[180px] w-full bg-white rounded-xl shadow-xl border border-border/50 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 overflow-y-auto"
                    style={{ maxHeight: '240px' }} // Limit to ~6 items
                >
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full px-4 py-2 text-left text-sm flex items-center justify-between group transition-colors
                                ${option.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            {option.name}
                            {option.id === value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
