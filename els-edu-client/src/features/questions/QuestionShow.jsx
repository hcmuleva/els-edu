import React from 'react';
import {
    Show,
    SimpleShowLayout,
    TextField,
    DateField,
    ReferenceField,
    FunctionField,
    ChipField,
    Labeled,
    useRecordContext
} from 'react-admin';

const OptionsDisplay = () => {
    const record = useRecordContext();

    if (!record || !record.options) return null;

    return (
        <div className="space-y-2">
            {record.options.map((opt, idx) => (
                <div 
                    key={idx} 
                    className={`p-3 rounded-lg border-2 ${
                        opt.isCorrect 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded font-bold text-xs ${
                            opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{opt.option || opt.text}</span>
                        {opt.isCorrect && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-bold">
                                ✓ Correct
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const CorrectAnswerDisplay = () => {
    const record = useRecordContext();
    if (!record || !record.options) return <span>-</span>;

    const correctOptions = record.options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) return <span className="text-red-600">No correct answer set</span>;

    return (
        <div className="space-y-1">
            {correctOptions.map((opt, idx) => (
                <div key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg inline-block mr-2">
                    <span className="font-bold">{opt.option || opt.text}</span>
                </div>
            ))}
        </div>
    );
};

export const QuestionShow = () => (
    <Show title="Question Details">
        <SimpleShowLayout>
            <TextField source="id" label="Question ID" />
            
            <FunctionField
                label="Question Text"
                render={record => (
                    <div className="text-lg font-semibold bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        {record.questionText || 'Untitled Question'}
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <Labeled label="Question Type">
                    <ChipField source="questionType" />
                </Labeled>

                <Labeled label="Difficulty">
                    <ChipField 
                        source="difficulty"
                        sx={{
                            '& .MuiChip-root': {
                                backgroundColor: (record) => {
                                    if (record.difficulty === 'easy') return '#10b981';
                                    if (record.difficulty === 'hard') return '#ef4444';
                                    return '#f59e0b';
                                },
                                color: 'white',
                                fontWeight: 'bold'
                            }
                        }}
                    />
                </Labeled>

                <Labeled label="Points">
                    <TextField source="points" />
                </Labeled>

                <Labeled label="Topic">
                    <ReferenceField source="topic" reference="topics" link="show" emptyText="No topic assigned">
                        <TextField source="name" />
                    </ReferenceField>
                </Labeled>
            </div>

            <Labeled label="Correct Answer(s)">
                <CorrectAnswerDisplay />
            </Labeled>

            <Labeled label="Answer Options">
                <OptionsDisplay />
            </Labeled>

            <Labeled label="Explanation">
                <FunctionField
                    render={record => (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            {record.explanation || <span className="text-gray-400 italic">No explanation provided</span>}
                        </div>
                    )}
                />
            </Labeled>

            <div className="grid grid-cols-2 gap-4">
                <Labeled label="Created At">
                    <DateField source="createdAt" showTime />
                </Labeled>

                <Labeled label="Updated At">
                    <DateField source="updatedAt" showTime />
                </Labeled>
            </div>

            <Labeled label="Creator">
                <ReferenceField source="creator" reference="users" link={false} emptyText="Unknown">
                    <TextField source="username" />
                </ReferenceField>
            </Labeled>
        </SimpleShowLayout>
    </Show>
);
