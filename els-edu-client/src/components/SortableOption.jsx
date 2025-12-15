import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

export const SortableOption = ({
    option,
    questionType,
    onUpdateOption,
    onRemoveOption,
    onSelectCorrect,
    canDelete,
    index
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: option.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => {
                if (questionType === 'SC') {
                    onSelectCorrect(option.id);
                }
            }}
            className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                option.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-border/30 hover:border-primary/30 hover:bg-gray-50'
            } ${isDragging ? 'shadow-lg z-50' : ''}`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </div>

            {/* Option Label */}
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                option.isCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
            }`}>
                {option.label}
            </span>

            {/* Option Text Input */}
            <input
                type="text"
                value={option.text}
                onChange={(e) => {
                    e.stopPropagation();
                    onUpdateOption(option.id, 'text', e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Type answer here..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border-0 bg-transparent focus:outline-none"
            />

            {/* Correct Answer Indicator/Button */}
            {questionType === 'MCQ' && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateOption(option.id, 'isCorrect', !option.isCorrect);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                        option.isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                    {option.isCorrect ? '✓ Correct' : 'Mark Correct'}
                </button>
            )}
            {questionType === 'SC' && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${
                    option.isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                }`}>
                    {option.isCorrect ? '✓ Correct' : 'Click to select'}
                </div>
            )}

            {/* Delete Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemoveOption(option.id);
                }}
                disabled={!canDelete}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                    !canDelete
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-red-100'
                }`}
                title={!canDelete ? 'Minimum 2 options required' : 'Remove option'}
            >
                <X className="w-4 h-4 text-red-600" />
            </button>
        </div>
    );
};
