import React, { useState } from 'react';
import {
    useNotify,
    useRedirect,
    Title,
    useCreate,
    useGetIdentity
} from 'react-admin';
import { Plus, ArrowLeft } from 'lucide-react';
import { QuestionBuilder } from './components/QuestionBuilder';

export const QuestionCreate = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const [create, { isLoading }] = useCreate();
    const { data: identity } = useGetIdentity();
    const [questions, setQuestions] = useState([{
        id: Date.now(),
        questionText: '',
        questionType: 'SC',
        options: [
            { id: Date.now(), text: '', isCorrect: false, label: 'A' },
            { id: Date.now() + 1, text: '', isCorrect: false, label: 'B' }
        ],
        explanation: '',
        difficulty: 'medium',
        points: 1,
    }]);

    const addQuestion = () => {
        setQuestions([...questions, {
            id: Date.now(),
            questionText: '',
            questionType: 'SC',
            options: [
                { id: Date.now(), text: '', isCorrect: false, label: 'A' },
                { id: Date.now() + 1, text: '', isCorrect: false, label: 'B' }
            ],
            explanation: '',
        }]);
    };

    const updateQuestion = (index, updatedQuestion) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
    };

    const deleteQuestion = (index) => {
        if (questions.length === 1) {
            notify('At least one question is required', { type: 'warning' });
            return;
        }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const moveQuestion = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;
        
        const newQuestions = [...questions];
        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
        setQuestions(newQuestions);
    };

    const duplicateQuestion = (index) => {
        const questionToDuplicate = { ...questions[index], id: Date.now() };
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, questionToDuplicate);
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        try {
            // Validate questions
            const invalidQuestions = questions.filter(q => !q.questionText?.trim());
            if (invalidQuestions.length > 0) {
                notify('Please fill in all question texts', { type: 'warning' });
                return;
            }

            // Validate correct answers for SC and MCQ
            for (const question of questions) {
                if (['SC', 'MCQ'].includes(question.questionType)) {
                    const hasCorrectAnswer = question.options?.some(opt => opt.isCorrect);
                    if (!hasCorrectAnswer) {
                        notify('Please select at least one correct answer for all questions', { type: 'warning' });
                        return;
                    }
                }
            }

            // Save all questions
            const savePromises = questions.map(question => {
                const { id, ...questionData } = question; // Remove local ID
                // Add creator field
                questionData.creator = identity?.id;
                return create('questions', { data: questionData });
            });

            await Promise.all(savePromises);
            
            notify(
                questions.length > 1 
                    ? `${questions.length} questions saved successfully!` 
                    : 'Question saved successfully!', 
                { type: 'success' }
            );
            
            // Redirect to My Studio
            setTimeout(() => {
                redirect('/my-contents');
            }, 500);
        } catch (error) {
            console.error('Error saving questions:', error);
            notify('Error saving questions. Please try again.', { type: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Title title="Create Question" />
            
            {/* Header */}
            <div className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={() => redirect('/my-contents')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to My Contents"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Create Question
                            </h1>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                {questions.length} question{questions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={addQuestion}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg"
                            title="Add another question"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => redirect('/my-contents')}
                            className="px-5 py-2 rounded-lg border border-border/50 font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : `Save ${questions.length > 1 ? 'All' : 'Question'}`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border/30">
                    {questions.map((question, index) => (
                        <QuestionBuilder
                            key={question.id}
                            question={question}
                            index={index}
                            onChange={updateQuestion}
                            onDelete={deleteQuestion}
                            onMoveUp={(i) => moveQuestion(i, 'up')}
                            onMoveDown={(i) => moveQuestion(i, 'down')}
                            onDuplicate={duplicateQuestion}
                            canMoveUp={index > 0}
                            canMoveDown={index < questions.length - 1}
                            showHeader={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
