import React, { useState } from 'react';
import { useGetList, Loading } from 'react-admin';
import { X, Search, Check, Filter } from 'lucide-react';

export const QuestionSelector = ({ open, onClose, onSelectQuestions, selectedIds = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localSelected, setLocalSelected] = useState(selectedIds);
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const { data: questions, isLoading } = useGetList('questions', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'createdAt', order: 'DESC' },
    });

    if (!open) return null;

    const filteredQuestions = (questions || []).filter(q => {
        const matchesSearch = q.questionText?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
        const matchesType = typeFilter === 'all' || q.questionType === typeFilter;
        return matchesSearch && matchesDifficulty && matchesType;
    });

    const toggleQuestion = (questionId) => {
        if (localSelected.includes(questionId)) {
            setLocalSelected(localSelected.filter(id => id !== questionId));
        } else {
            setLocalSelected([...localSelected, questionId]);
        }
    };

    const handleConfirm = () => {
        const selected = (questions || []).filter(q => localSelected.includes(q.id));
        onSelectQuestions(selected);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-foreground">Select Existing Questions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-border/50 space-y-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    
                    {/* Filters */}
                    <div className="flex gap-3 items-center">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="SC">Single Choice</option>
                            <option value="MCQ">Multiple Choice</option>
                            <option value="TF">Yes/No</option>
                            <option value="FillInBlank">TextField</option>
                            <option value="Match">Matching</option>
                            <option value="DragDrop">Dropdown</option>
                        </select>
                    </div>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loading />
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <p>No questions found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredQuestions.map((question) => {
                                const isSelected = localSelected.includes(question.id);
                                return (
                                    <div
                                        key={question.id}
                                        onClick={() => toggleQuestion(question.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border/50 hover:border-primary/30 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground line-clamp-2">
                                                    {question.questionText || 'Untitled Question'}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    <span className="px-2 py-1 bg-secondary/10 rounded-md">
                                                        {question.questionType || 'SC'}
                                                    </span>
                                                    {question.difficulty && (
                                                        <span>{question.difficulty}</span>
                                                    )}
                                                    {question.points && (
                                                        <span>{question.points} pts</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/50 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {localSelected.length} question{localSelected.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-border/50 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={localSelected.length === 0}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
