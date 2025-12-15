import React, { useState, useEffect } from 'react';
import {
    useNotify,
    useRedirect,
    Title,
    useUpdate,
    useGetOne,
    Loading
} from 'react-admin';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QuestionBuilder } from './components/QuestionBuilder';

export const QuestionEdit = () => {
    const { id: documentId } = useParams();
    const notify = useNotify();
    const redirect = useRedirect();
    const [update, { isLoading: isSaving }] = useUpdate();
    const { data: questionData, isLoading } = useGetOne('questions', { id: documentId });
    const [question, setQuestion] = useState(null);

    useEffect(() => {
        if (questionData) {
            // Remove documentId from the question data to avoid sending it in the body
            const { documentId: docId, id, ...cleanData } = questionData;
            setQuestion({
                ...cleanData,
                topic: cleanData.topic && typeof cleanData.topic === 'object' 
                    ? (cleanData.topic.documentId || cleanData.topic.id) 
                    : cleanData.topic, // Handle object or scalar ID
                id: Date.now(), // Local ID for UI only
            });
        }
    }, [questionData]);

    const handleSave = async () => {
        try {
            // Validate question
            if (!question.questionText?.trim()) {
                notify('Please fill in the question text', { type: 'warning' });
                return;
            }

            // Validate correct answers for SC and MCQ
            if (['SC', 'MCQ', 'TF'].includes(question.questionType)) {
                const hasCorrectAnswer = question.options?.some(opt => opt.isCorrect);
                if (!hasCorrectAnswer) {
                    notify('Please select at least one correct answer', { type: 'warning' });
                    return;
                }
            }

            // Remove all read-only fields before saving
            const {
                id: localId,
                documentId: docId,
                createdAt,
                updatedAt,
                publishedAt,
                locale,
                createdBy,
                updatedBy,
                ...questionDataToSave
            } = question;
            
            await update('questions', { 
                id: documentId,  // Use documentId for the API call
                data: questionDataToSave,
                previousData: questionDataToSave 
            });
            
            notify('Question updated successfully!', { type: 'success' });
            
            // Redirect back to library
            setTimeout(() => {
                redirect('/my-contents');
            }, 500);
        } catch (error) {
            console.error('Error updating question:', error);
            notify('Error updating question. Please try again.', { type: 'error' });
        }
    };

    if (isLoading || !question) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Title title={`Edit Question`} />
            
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
                            <h1 className="text-2xl font-black text-foreground">Edit Question</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Modify question details and options
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
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
                            disabled={isSaving}
                            className="px-5 py-2 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border/30">
                    <QuestionBuilder
                        question={question}
                        index={0}
                        onChange={(idx, updatedQuestion) => setQuestion(updatedQuestion)}
                        onDelete={() => {}}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                        onDuplicate={() => {}}
                        canMoveUp={false}
                        canMoveDown={false}
                        showHeader={false}
                    />
                </div>
            </div>
        </div>
    );
};
