
import React, { useState } from 'react';
import { useRedirect, usePermissions, Title, useGetList, useGetIdentity, Loading } from 'react-admin';
import { PlusCircle, FileQuestion, BookOpen, GraduationCap, Calendar, Eye } from 'lucide-react';

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

const ContentCard = ({ item, type, onClick }) => {
    const getTitle = () => {
        if (type === 'questions') return item.questionText || 'Untitled Question';
        if (type === 'quizzes') return item.title || 'Untitled Quiz';
        if (type === 'courses') return item.name || 'Untitled Course';
    };

    const getIcon = () => {
        if (type === 'questions') return FileQuestion;
        if (type === 'quizzes') return BookOpen;
        return GraduationCap;
    };

    const Icon = getIcon();

    return (
        <div 
            onClick={onClick}
            className="group p-4 rounded-2xl border border-border/50 hover:border-primary/50 bg-white hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${
                    type === 'questions' ? 'bg-blue-50' : 
                    type === 'quizzes' ? 'bg-violet-50' : 'bg-emerald-50'
                }`}>
                    <Icon className={`w-5 h-5 ${
                        type === 'questions' ? 'text-blue-600' : 
                        type === 'quizzes' ? 'text-violet-600' : 'text-emerald-600'
                    }`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {getTitle()}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {item.createdAt && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        )}
                        {type === 'quizzes' && item.questions && (
                            <span>{item.questions.length} questions</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyContents = () => {
    const redirect = useRedirect();
    const { permissions } = usePermissions();
    const { data: identity } = useGetIdentity();
    const [activeFilter, setActiveFilter] = useState('all');

    // Get user ID for filtering
    const userId = identity?.id;

    // Fetch user's content - filtered by creator
    const { data: questions, isLoading: loadingQuestions } = useGetList('questions', {
        pagination: { page: 1, perPage: 20 },
        sort: { field: 'createdAt', order: 'DESC' },
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

    const isLoading = loadingQuestions || loadingQuizzes || loadingCourses;

    const getFilteredContent = () => {
        if (activeFilter === 'questions') return questions || [];
        if (activeFilter === 'quizzes') return quizzes || [];
        if (activeFilter === 'courses') return courses || [];
        
        // All - combine all content
        return [
            ...(questions || []).map(q => ({ ...q, type: 'questions' })),
            ...(quizzes || []).map(q => ({ ...q, type: 'quizzes' })),
            ...(courses || []).map(c => ({ ...c, type: 'courses' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const filteredContent = getFilteredContent();

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Title title="My Studio" />
            
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

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                    <h2 className="text-xl font-bold text-gray-800">Your Library</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                activeFilter === 'all' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'hover:bg-gray-50 text-gray-500'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('questions')}
                            className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                activeFilter === 'questions' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'hover:bg-gray-50 text-gray-500'
                            }`}
                        >
                            Questions
                        </button>
                        <button
                            onClick={() => setActiveFilter('quizzes')}
                            className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                activeFilter === 'quizzes' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'hover:bg-gray-50 text-gray-500'
                            }`}
                        >
                            Quizzes
                        </button>
                        <button
                            onClick={() => setActiveFilter('courses')}
                            className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                activeFilter === 'courses' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'hover:bg-gray-50 text-gray-500'
                            }`}
                        >
                            Courses
                        </button>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loading />
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <BookOpen className="w-12 h-12 text-gray-300" />
                        </div>
                        <p className="font-medium">No content found</p>
                        <p className="text-sm opacity-70 mt-1">Create your first {activeFilter === 'all' ? 'item' : activeFilter} to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredContent.map((item) => (
                            <ContentCard
                                key={`${item.type || activeFilter}-${item.id}`}
                                item={item}
                                type={item.type || activeFilter}
                                onClick={() => redirect(`/${item.type || activeFilter}/${item.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyContents;
