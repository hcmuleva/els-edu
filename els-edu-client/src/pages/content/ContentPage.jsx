import React, { useState } from 'react';
import { Title, useRedirect } from 'react-admin';
import { FileQuestion, BookOpen, GraduationCap, PlusCircle } from 'lucide-react';
import { QuestionsTab } from './tabs/QuestionsTab';
import { QuizzesTab } from './tabs/QuizzesTab';
import { CoursesTab } from './tabs/CoursesTab';

// Action Button Component
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

const ContentPage = () => {
    const redirect = useRedirect();
    const [activeTab, setActiveTab] = useState('questions'); // Default to questions

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
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

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
                    <h2 className="text-xl font-bold text-gray-800">Your Library</h2>
                    <div className="flex gap-2">
                        {[
                            { id: 'questions', label: 'Questions' },
                            { id: 'quizzes', label: 'Quizzes' },
                            { id: 'courses', label: 'Courses' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 font-bold rounded-xl text-sm cursor-pointer transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-primary/10 text-primary' 
                                        : 'hover:bg-gray-50 text-gray-500'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'questions' && <QuestionsTab />}
                    {activeTab === 'quizzes' && <QuizzesTab />}
                    {activeTab === 'courses' && <CoursesTab />}
                </div>
            </div>
        </div>
    );
};

export default ContentPage;
