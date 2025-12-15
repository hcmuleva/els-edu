import React, { useState } from 'react';
import {
    Create,
    SimpleForm,
    TextInput,
    SelectInput,
    NumberInput,
    BooleanInput,
    useNotify,
    useRedirect,
    Title
} from 'react-admin';
import { Plus, FileQuestion } from 'lucide-react';
import { QuestionBuilder } from '../questions/components/QuestionBuilder';
import { QuestionSelector } from '../../components/common/QuestionSelector';

export const QuizCreate = () => {
    const [questions, setQuestions] = useState([]);
    const [showQuestionSelector, setShowQuestionSelector] = useState(false);
    const notify = useNotify();
    const redirect = useRedirect();

    // Add new blank question
    const addNewQuestion = () => {
        const newQuestion = {
            id: Date.now(),
            questionText: '',
            questionType: 'SC',
            options: [],
            description: '',
            isNew: true,
        };
        setQuestions([...questions, newQuestion]);
    };

    // Add existing questions from selector
    const handleSelectQuestions = (selectedQuestions) => {
        const formattedQuestions = selectedQuestions.map(q => ({
            ...q,
            id: Date.now() + Math.random(), // Ensure unique ID for UI
            isNew: false,
            existingId: q.id, // Keep original ID for saving
        }));
        setQuestions([...questions, ...formattedQuestions]);
    };

    const updateQuestion = (index, updatedQuestion) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
    };

    const deleteQuestion = (index) => {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Title title="Create Quiz" />
            
            {/* Header */}
            <div className="bg-white border-b border-border/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Create Quiz</h1>
                        <p className="text-sm text-muted-foreground mt-1">Draft</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 rounded-xl border border-border/50 font-medium hover:bg-gray-50 transition-colors">
                            Save Update
                        </button>
                        <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                            Publish Quiz
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 p-6">
                {/* Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white rounded-2xl border border-border/50 p-4 sticky top-6">
                        <h3 className="font-bold text-foreground mb-4">Quiz Settings</h3>
                        
                        <Create redirect={false}>
                            <SimpleForm toolbar={false}>
                                <TextInput
                                    source="title"
                                    label="Quiz Title"
                                    fullWidth
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            borderRadius: '12px',
                                            fontFamily: 'inherit',
                                        }
                                    }}
                                />
                                
                                <SelectInput
                                    source="difficulty"
                                    label="Difficulty"
                                    choices={[
                                        { id: 'beginner', name: 'Beginner' },
                                        { id: 'intermediate', name: 'Intermediate' },
                                        { id: 'advanced', name: 'Advanced' }
                                    ]}
                                    defaultValue="beginner"
                                    fullWidth
                                />

                                <NumberInput
                                    source="timeLimit"
                                    label="Time Limit (min)"
                                    defaultValue={30}
                                    fullWidth
                                />

                                <NumberInput
                                    source="passingScore"
                                    label="Passing Score (%)"
                                    defaultValue={70}
                                    fullWidth
                                />

                                <BooleanInput
                                    source="isRandomized"
                                    label="Randomize Questions"
                                />
                                
                                <BooleanInput
                                    source="allowReview"
                                    label="Allow Review"
                                    defaultValue={true}
                                />
                            </SimpleForm>
                        </Create>

                        <div className="mt-6 pt-6 border-t border-border/50">
                            <div className="text-sm text-muted-foreground mb-2">Progress</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${questions.length > 0 ? 50 : 0}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold">{questions.length > 0 ? 50 : 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-9">
                    <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-6 border-b border-border/50">
                            <h2 className="text-xl font-bold text-foreground">Questions</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add questions to your quiz by creating new ones or selecting from existing questions
                            </p>
                        </div>

                        {/* Questions List */}
                        <div>
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
                                />
                            ))}
                        </div>

                        {/* Add Question Buttons */}
                        <div className="p-6 border-t border-border/50 flex gap-3">
                            <button
                                type="button"
                                onClick={addNewQuestion}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Question
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowQuestionSelector(true)}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all"
                            >
                                <FileQuestion className="w-5 h-5" />
                                Select Existing Questions
                            </button>
                        </div>

                        {questions.length === 0 && (
                            <div className="text-center py-16 px-6">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileQuestion className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="font-medium text-foreground">No questions added yet</p>
                                <p className="text-sm mt-1 text-muted-foreground">Click the buttons above to add questions to your quiz</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Question Selector Modal */}
            <QuestionSelector
                open={showQuestionSelector}
                onClose={() => setShowQuestionSelector(false)}
                onSelectQuestions={handleSelectQuestions}
                selectedIds={questions.filter(q => q.existingId).map(q => q.existingId)}
            />
        </div>
    );
};
