import React, { useState, useEffect } from 'react';
import { useRedirect, usePermissions, Title, useGetList, useGetIdentity, Loading, useDelete, useNotify, ReferenceField, TextField } from 'react-admin';
import { PlusCircle, FileQuestion, BookOpen, GraduationCap, Calendar, Eye, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, X, CheckCircle, XCircle, Info, RotateCcw } from 'lucide-react';
import { CustomSelect } from '../../components/common/CustomSelect';
import { CustomAsyncSelect } from '../../components/common/CustomAsyncSelect';
const ActionButton = ({ icon: Icon, title, description, onClick, colorClass, bgClass }) => (
    <button 
        onClick={onClick}
        className="group relative flex flex-col items-start p-6 h-full w-full bg-white rounded-3xl border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
    >
        <div className={`absolute top-0 right-0 p-3 rounded-bl-3xl ${bgClass} opacity-50 group-hover:opacity-100 transition-opacity`}>
             <PlusCircle className={`w-6 h-6 ${colorClass}`} />
        </div>
        
        <div className={`p-4 rounded-2xl ${bgClass} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
        </div>
        
        <h3 className="text-lg font-black text-gray-800 mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
    </button>
);

const QuestionViewModal = ({ question, onClose }) => {
    if (!question) return null;

    const getDifficultyColor = (difficulty) => {
        if (difficulty === 'easy') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (difficulty === 'hard') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-orange-100 text-orange-700 border-orange-200';
    };

    const getTypeLabel = (type) => {
         const types = {
            'SC': 'Single Choice',
            'MCQ': 'Multiple Choice',
            'TF': 'True/False',
            'FillInBlank': 'Fill in Blank',
            'Match': 'Matching',
            'DragDrop': 'Drag & Drop'
        };
        return types[type] || type;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-border/50" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <FileQuestion className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Question Details</h2>
                            <p className="text-sm text-gray-500 font-medium">Reviewing question content and metadata</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Question Card */}
                    <div className="space-y-3">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-800 leading-relaxed">
                                {question.questionText}
                            </p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex flex-wrap gap-8 py-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</span>
                            <span className="font-bold text-gray-900">
                                {getTypeLabel(question.questionType)}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</span>
                            <span className="font-bold text-gray-900 capitalize">
                                {question.difficulty || 'medium'}
                            </span>
                        </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</span>
                            <span className="font-bold text-gray-900">{question.points || 1}</span>
                        </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topic</span>
                            <div className="font-bold text-gray-900">
                                <ReferenceField record={question} source="topicRef.id" reference="topics" link={false}>
                                    <TextField source="name" />
                                </ReferenceField>
                            </div>
                        </div>
                    </div>

                    {/* Options Section */}
                    {question.options && question.options.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Answer Options</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                                    {question.options.length} options
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {question.options.map((opt, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group
                                            ${opt.isCorrect 
                                                ? 'border-emerald-500 bg-emerald-50/30' 
                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm transition-transform group-hover:scale-105
                                            ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}
                                        `}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className={`font-medium ${opt.isCorrect ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                {opt.option || opt.text}
                                            </p>
                                        </div>
                                        {opt.isCorrect && (
                                            <div className="absolute top-4 right-4 text-emerald-500">
                                                <CheckCircle className="w-6 h-6 fill-emerald-100" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex items-start gap-3 relative z-10">
                                <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-900 mb-1">Explanation</h4>
                                    <p className="text-indigo-800/80 text-sm leading-relaxed">
                                        {question.explanation}
                                    </p>
                                </div>
                            </div>
                             {/* Decorative blob */}
                             <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
                        </div>
                    )}
                    
                    {/* Footer */}
                    <div className="pt-6 border-t border-border/50 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400">
                            <Calendar className="w-3 h-3" />
                             Created on {new Date(question.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

const MyContents = () => {
    const redirect = useRedirect();
    const notify = useNotify();
    const { permissions } = usePermissions();
    const { data: identity } = useGetIdentity();
    const [activeFilter, setActiveFilter] = useState('all');
    const [deleteOne] = useDelete();
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [topicFilter, setTopicFilter] = useState(null);
    const [viewingQuestion, setViewingQuestion] = useState(null);

    // Reset filters when changing views
    useEffect(() => {
        if (activeFilter !== 'all' && activeFilter !== 'questions') {
            setTypeFilter('');
            setDifficultyFilter('');
        }
    }, [activeFilter]);

    const userId = identity?.id;

    const { data: questions, isLoading: loadingQuestions, refetch: refetchQuestions } = useGetList('questions', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: sortField, order: sortOrder },
        filter: userId ? { creator: userId } : {},
    });

    const { data: quizzes, isLoading: loadingQuizzes } = useGetList('quizzes', {
        pagination: { page: 1, perPage: 20 },
        sort: { field: 'createdAt', order: 'DESC' },
        filter: userId ? { creator: userId } : {},
    });

    const { data: courses, isLoading: loadingCourses } = useGetList('courses', {
        pagination: { page: 1, perPage: 20 },
        sort: { field: 'createdAt', order: 'DESC' },
        filter: userId ? { creator: userId } : {},
    });

    useEffect(() => {
        if (userId) {
            refetchQuestions();
        }
    }, [sortField, sortOrder, userId]);

    const isLoading = loadingQuestions || loadingQuizzes || loadingCourses;

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortOrder('ASC');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortOrder === 'ASC' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await deleteOne(type, { id, previousData: {} });
            notify('Item deleted successfully', { type: 'success' });
            if (type === 'questions') refetchQuestions();
        } catch (error) {
            notify('Error deleting item', { type: 'error' });
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setTopicFilter(null);
        setTypeFilter('');
        setDifficultyFilter('');
    };

    const getFilteredContent = () => {
        let content = [];
        
        if (activeFilter === 'questions') content = questions || [];
        else if (activeFilter === 'quizzes') content = quizzes || [];
        else if (activeFilter === 'courses') content = courses || [];
        else {
            content = [
                ...(questions || []).map(q => ({ ...q, type: 'questions' })),
                ...(quizzes || []).map(q => ({ ...q, type: 'quizzes' })),
                ...(courses || []).map(c => ({ ...c, type: 'courses' }))
            ];
        }

        if (searchQuery) {
            content = content.filter(item => 
                item.questionText?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (difficultyFilter) {
            content = content.filter(item => item.difficulty === difficultyFilter);
        }

        if (typeFilter) {
            content = content.filter(item => item.questionType === typeFilter);
        }

        if (topicFilter) {
             content = content.filter(item => {
                 const tId = item.topicRef && (item.topicRef.documentId || item.topicRef.id);
                 return tId === topicFilter;
             });
        }

        return content;
    };

    const filteredContent = getFilteredContent();

    const getDifficultyColor = (difficulty) => {
        if (difficulty === 'easy') return 'bg-green-100 text-green-700 border-green-300';
        if (difficulty === 'hard') return 'bg-red-100 text-red-700 border-red-300';
        return 'bg-orange-100 text-orange-700 border-orange-300';
    };

    const getTypeColor = (type) => {
        if (type === 'SC') return 'bg-blue-100 text-blue-700 border-blue-300';
        if (type === 'MCQ') return 'bg-purple-100 text-purple-700 border-purple-300';
        if (type === 'TF') return 'bg-teal-100 text-teal-700 border-teal-300';
        return 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const getTypeName = (type) => {
        const types = {
            'SC': 'Single Choice',
            'MCQ': 'Multiple Choice',
            'TF': 'True/False',
            'FillInBlank': 'Fill in Blank',
            'Match': 'Matching',
            'DragDrop': 'Drag & Drop'
        };
        return types[type] || type;
    };

    const getCorrectAnswers = (question) => {
        if (!question.options) return '-';
        const correct = question.options.filter(opt => opt.isCorrect);
        if (correct.length === 0) return <span className="text-red-600 text-xs">None set</span>;
        return correct.map(opt => opt.option || opt.text).join(', ');
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <Title title="My Studio" />
            
            {viewingQuestion && <QuestionViewModal question={viewingQuestion} onClose={() => setViewingQuestion(null)} />}
            
            <div className="flex flex-col gap-2">
                 <h1 className="text-3xl font-black text-gray-800 font-heading">Content Studio</h1>
                 <p className="text-gray-500 font-medium">Create and manage your educational resources</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActionButton 
                    icon={FileQuestion}
                    title="New Question"
                    description="Create a single question for quizzes or practice."
                    onClick={() => redirect('/questions/create')}
                    bgClass="bg-blue-50"
                    colorClass="text-blue-600"
                />
                 <ActionButton 
                    icon={BookOpen}
                    title="New Quiz"
                    description="Assemble questions into a graded assessment."
                    onClick={() => redirect('/quizzes/create')}
                    bgClass="bg-violet-50"
                    colorClass="text-violet-600"
                />
                 <ActionButton 
                    icon={GraduationCap}
                    title="New Course"
                    description="Build a comprehensive learning path."
                    onClick={() => redirect('/courses/create')}
                    bgClass="bg-emerald-50"
                    colorClass="text-emerald-600"
                />
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
                    <h2 className="text-xl font-bold text-gray-800">Your Library</h2>
                    <div className="flex gap-2">
                        {['all', 'questions', 'quizzes', 'courses'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                    activeFilter === filter 
                                        ? 'bg-primary/10 text-primary' 
                                        : 'hover:bg-gray-50 text-gray-500'
                                }`}
                            >
                               {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-4 border-b border-border/30 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                             <CustomAsyncSelect
                                label=""
                                value={topicFilter}
                                onChange={setTopicFilter}
                                resource="topics"
                                optionText="name"
                                placeholder="Filter by Topic"
                                allowEmpty
                                searchable
                            />
                        </div>
                        {(activeFilter === 'all' || activeFilter === 'questions') && (
                            <>
                                <div className="w-[160px]">
                                    <CustomSelect
                                        value={typeFilter}
                                        onChange={setTypeFilter}
                                        options={[
                                            { id: '', name: 'All Types' },
                                            { id: 'SC', name: 'Single Choice' },
                                            { id: 'MCQ', name: 'Multiple Choice' },
                                            { id: 'TF', name: 'True/False' },
                                        ]}
                                        placeholder="All Types"
                                    />
                                </div>
                                <div className="w-[160px]">
                                    <CustomSelect
                                        value={difficultyFilter}
                                        onChange={setDifficultyFilter}
                                        options={[
                                            { id: '', name: 'All Difficulties' },
                                            { id: 'easy', name: 'Easy' },
                                            { id: 'medium', name: 'Medium' },
                                            { id: 'hard', name: 'Hard' },
                                        ]}
                                        placeholder="All Difficulties"
                                    />
                                </div>
                            </>
                        )}
                        
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loading />
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <BookOpen className="w-12 h-12 text-gray-300" />
                        </div>
                        <p className="font-medium">No content found</p>
                        <p className="text-sm opacity-70 mt-1">Create your first {activeFilter === 'all' ? 'item' : activeFilter} to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-border/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('id')}>
                                        <div className="flex items-center gap-2">ID<SortIcon field="id" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Question</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('questionType')}>
                                        <div className="flex items-center justify-center gap-2">Type<SortIcon field="questionType" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('difficulty')}>
                                        <div className="flex items-center justify-center gap-2">Difficulty<SortIcon field="difficulty" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Correct Answer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Topic</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center gap-2">Created<SortIcon field="createdAt" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 bg-white">
                                {filteredContent.map((item, index) => {
                                    const itemType = item.type || activeFilter;
                                    if (itemType !== 'questions') return null;
                                    
                                    const itemId = item.documentId || item.id;
                                    
                                    return (
                                        <tr key={itemId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 align-middle">
                                                <div className="text-sm font-bold text-gray-700">{index + 1}</div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="max-w-md">
                                                    <p className="text-sm font-semibold text-gray-900 truncate" title={item.questionText}>
                                                        {item.questionText || 'Untitled Question'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap text-center ${getTypeColor(item.questionType)}`}>
                                                        {getTypeName(item.questionType)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap text-center ${getDifficultyColor(item.difficulty)}`}>
                                                        {item.difficulty || 'medium'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="text-sm text-gray-700 max-w-xs truncate" title={getCorrectAnswers(item)}>
                                                    {getCorrectAnswers(item)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className="text-sm text-gray-500">
                                                    <ReferenceField record={item} source="topicRef.id" reference="topics" link={false}>
                                                        <TextField source="name" />
                                                    </ReferenceField>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setViewingQuestion(item)}
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => redirect(`/${itemType}/${itemId}`)}
                                                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(itemId, itemType)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyContents;
