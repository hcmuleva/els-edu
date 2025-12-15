import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableOption } from './SortableOption';

const QUESTION_TYPES = [
    { id: 'SC', name: 'Single Choice' },
    { id: 'MCQ', name: 'Multiple Choice' },
    { id: 'TF', name: 'Yes/No' },
    { id: 'FillInBlank', name: 'TextField' },
    { id: 'Match', name: 'Matching' },
    { id: 'DragDrop', name: 'Dropdown' },
    { id: 'Ordering', name: 'Opinion Scale' },
    { id: 'Hotspot', name: 'File Upload' },
];

export const QuestionBuilder = ({ 
    question, 
    index, 
    onChange, 
    onDelete, 
    onMoveUp, 
    onMoveDown, 
    onDuplicate,
    canMoveUp,
    canMoveDown,
    showHeader = true
}) => {
    const [showMediaUpload, setShowMediaUpload] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);

    const handleTypeChange = (newType) => {
        onChange(index, { ...question, questionType: newType, options: [] });
        setShowTypeDropdown(false);
    };

    const handleQuestionTextChange = (e) => {
        onChange(index, { ...question, questionText: e.target.value });
    };

    const handleExplanationChange = (e) => {
        onChange(index, { ...question, explanation: e.target.value });
    };

    const addOption = () => {
        const newOption = {
            id: Date.now(),
            text: '',
            isCorrect: false,
            label: String.fromCharCode(65 + (question.options?.length || 0))
        };
        onChange(index, { 
            ...question, 
            options: [...(question.options || []), newOption] 
        });
    };

    const removeOption = (optionId) => {
        // Prevent deletion if only 2 options remain (minimum for SC/MCQ)
        if (question.options?.length <= 2) {
            return; // Silently prevent deletion - minimum 2 options required
        }
        const updatedOptions = (question.options || [])
            .filter(opt => opt.id !== optionId)
            .map((opt, idx) => ({ ...opt, label: String.fromCharCode(65 + idx) }));
        onChange(index, { ...question, options: updatedOptions });
    };

    const updateOption = (optionId, field, value) => {
        const updatedOptions = (question.options || []).map(opt =>
            opt.id === optionId ? { ...opt, [field]: value } : opt
        );
        onChange(index, { ...question, options: updatedOptions });
    };

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = question.options.findIndex(opt => opt.id === active.id);
            const newIndex = question.options.findIndex(opt => opt.id === over.id);

            const reorderedOptions = arrayMove(question.options, oldIndex, newIndex);
            
            // Re-label after reordering
            const relabeledOptions = reorderedOptions.map((opt, idx) => ({
                ...opt,
                label: String.fromCharCode(65 + idx)
            }));

            onChange(index, { ...question, options: relabeledOptions });
        }
    };

    const needsOptions = ['SC', 'MCQ', 'Match', 'DragDrop'].includes(question.questionType);
    const needsYesNo = question.questionType === 'TF';

    const selectedType = QUESTION_TYPES.find(t => t.id === (question.questionType || 'SC'));

    return (
        <div className="bg-white border-b border-border/30 py-6 px-6">
            {/* Compact Header */}
            {showHeader && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                        </span>
                        <span className="text-sm font-bold text-foreground">Question {index + 1}</span>
                        
                        {/* Type Selector */}
                        <div className="relative z-20">
                            <button
                                type="button"
                                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                <span>{selectedType?.name}</span>
                                <span className="text-xs">▼</span>
                            </button>
                            
                            {showTypeDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-border/50 py-2 min-w-[200px] z-50">
                                    {QUESTION_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleTypeChange(type.id)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Difficulty Selector */}
                        <div className="relative z-20">
                            <button
                                type="button"
                                onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                                <span>{(question.difficulty || 'medium').charAt(0).toUpperCase() + (question.difficulty || 'medium').slice(1)}</span>
                                <span className="text-xs">▼</span>
                            </button>
                            
                            {showDifficultyDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-border/50 py-2 min-w-[140px] z-50">
                                    <button
                                        type="button"
                                        onClick={() => { onChange(index, { ...question, difficulty: 'easy' }); setShowDifficultyDropdown(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Easy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { onChange(index, { ...question, difficulty: 'medium' }); setShowDifficultyDropdown(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Medium
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { onChange(index, { ...question, difficulty: 'hard' }); setShowDifficultyDropdown(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Hard
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Points Input */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Pts:</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={question.points || 1}
                                onChange={(e) => onChange(index, { ...question, points: parseInt(e.target.value) || 1 })}
                                className="w-14 px-2 py-1 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Compact Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onMoveUp(index)}
                            disabled={!canMoveUp}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                            title="Move Up"
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            onClick={() => onMoveDown(index)}
                            disabled={!canMoveDown}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                            title="Move Down"
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            onClick={() => onDuplicate(index)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                            title="Duplicate"
                        >
                            ⎘
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(index)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded transition-colors text-red-600"
                            title="Delete"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Question Text */}
            <div className="mb-4">
                <label className="block text-sm font-semibold text-foreground mb-2">Question</label>
                <textarea
                    value={question.questionText || ''}
                    onChange={handleQuestionTextChange}
                    placeholder="Type your question here..."
                    className="w-full px-4 py-3 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    rows={3}
                />
            </div>

            {/* Explanation */}
            <div className="mb-4">
                <label className="block text-sm font-semibold text-foreground mb-2">Explanation <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                    value={question.explanation || ''}
                    onChange={handleExplanationChange}
                    placeholder="Add explanation or hints for this question..."
                    className="w-full px-4 py-3 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    rows={2}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-border/30 my-4"></div>

            {/* Media Upload */}
            <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showMediaUpload}
                        onChange={(e) => setShowMediaUpload(e.target.checked)}
                        className="rounded"
                    />
                    Add image or video
                </label>
            </div>

            {showMediaUpload && (
                <div className="mb-4 p-8 border-2 border-dashed border-border/50 rounded-xl text-center bg-gray-50">
                    <div className="text-blue-500 text-4xl mb-3">📁</div>
                    <p className="text-sm text-muted-foreground">
                        Drag and Drop or{' '}
                        <button type="button" className="text-primary font-medium hover:underline">
                            Choose Files
                        </button>
                    </p>
                </div>
            )}

            {/* Options Section */}
            {needsOptions && (
                <div className="mt-4">
                    <div className="border-t border-border/30 mb-4 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-foreground">Answer Options</label>
                            <button
                                type="button"
                                onClick={addOption}
                                className="flex items-center gap-1 px-3 py-1.5 text-primary bg-primary/5 hover:bg-primary/10 font-medium text-sm rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option
                            </button>
                        </div>
                    </div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={question.options.map(opt => opt.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {(question.options || []).map((option) => (
                                <SortableOption
                                    key={option.id}
                                    option={option}
                                    questionType={question.questionType}
                                    onUpdateOption={updateOption}
                                    onRemoveOption={removeOption}
                                    onSelectCorrect={(optionId) => {
                                        const updatedOptions = question.options.map(opt => ({
                                            ...opt,
                                            isCorrect: opt.id === optionId
                                        }));
                                        onChange(index, { ...question, options: updatedOptions });
                                    }}
                                    canDelete={question.options?.length > 2}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                </div>
            )}

            {/* Yes/No */}
            {needsYesNo && (
                <div className="flex gap-3 mt-4">
                    <button
                        type="button"
                        className="flex-1 py-2 text-sm rounded-lg border-2 border-primary bg-primary/5 text-primary font-medium"
                    >
                        Y Yes
                    </button>
                    <button
                        type="button"
                        className="flex-1 py-2 text-sm rounded-lg border-2 border-gray-200 text-foreground font-medium"
                    >
                        N No
                    </button>
                </div>
            )}
        </div>
    );
};
