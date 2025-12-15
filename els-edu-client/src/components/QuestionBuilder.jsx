import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useDataProvider } from 'react-admin';
import { CustomSelect } from './CustomSelect';
import { CustomAsyncSelect } from './CustomAsyncSelect';
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

    const handleQuestionTextChange = (e) => {
        onChange(index, { ...question, questionText: e.target.value });
    };

    const handleExplanationChange = (e) => {
        onChange(index, { ...question, explanation: e.target.value });
    };

    const addOption = () => {
        const newOption = {
            id: Date.now(),
            option: '',
            isCorrect: false,
            multimediaId: null,
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

    // Initialize True/False options if needed
    React.useEffect(() => {
        if (question.questionType === 'TF' && (!question.options || question.options.length === 0)) {
            onChange(index, {
                ...question,
                options: [
                    { id: 1, option: 'Yes', isCorrect: false, multimediaId: null },
                    { id: 2, option: 'No', isCorrect: false, multimediaId: null }
                ]
            });
        }
    }, [question.questionType]);

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

                        {/* Question Type - Blue Theme */}
                        <CustomSelect
                            value={question.questionType}
                            onChange={(value) => onChange(index, { ...question, questionType: value, options: [] })}
                            options={QUESTION_TYPES}
                            color="blue"
                            className="z-30 min-w-[140px]"
                        />

                        {/* Difficulty - Orange Theme */}
                        <CustomSelect
                            value={question.difficulty || 'medium'}
                            onChange={(value) => onChange(index, { ...question, difficulty: value })}
                            options={[
                                { id: 'easy', name: 'Easy' },
                                { id: 'medium', name: 'Medium' },
                                { id: 'hard', name: 'Hard' },
                            ]}
                            color="orange"
                            className="z-20 min-w-[120px]"
                        />

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

            {/* Topic Reference - Body Grid */}
            <div className="mb-4">
                <CustomAsyncSelect
                    label="Topic Reference"
                    value={question.topicRef}
                    onChange={(topicId) => onChange(index, { ...question, topicRef: topicId })}
                    resource="topics"
                    optionText="name"
                    placeholder="Select topic to categorize..."
                    allowEmpty
                    helperText="Optional categorization"
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
            {needsYesNo && question.options && question.options.length >= 2 && (
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-foreground mb-3">Select Correct Answer</label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const updatedOptions = question.options.map((opt, idx) => ({
                                    ...opt,
                                    isCorrect: idx === 0 // First option (Yes) is correct
                                }));
                                onChange(index, { ...question, options: updatedOptions });
                            }}
                            className={`flex-1 py-3 text-sm rounded-lg border-2 font-medium transition-all ${
                                question.options[0]?.isCorrect
                                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                                    : 'border-gray-200 text-foreground hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-lg mr-2">✓</span> {question.options[0]?.option || 'Yes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const updatedOptions = question.options.map((opt, idx) => ({
                                    ...opt,
                                    isCorrect: idx === 1 // Second option (No) is correct
                                }));
                                onChange(index, { ...question, options: updatedOptions });
                            }}
                            className={`flex-1 py-3 text-sm rounded-lg border-2 font-medium transition-all ${
                                question.options[1]?.isCorrect
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                                    : 'border-gray-200 text-foreground hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-lg mr-2">✗</span> {question.options[1]?.option || 'No'}
                        </button>
                    </div>
                    {(question.options[0]?.isCorrect || question.options[1]?.isCorrect) && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Correct answer: <span className="font-semibold">
                                {question.options[0]?.isCorrect ? question.options[0]?.option : question.options[1]?.option}
                            </span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
