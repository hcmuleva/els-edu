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
    useRecordContext,
    ReferenceArrayField,
    SingleFieldList,
    Datagrid
} from 'react-admin';
import { Title } from 'react-admin';
import { Clock, Target, Layers, Shuffle, Eye, CheckCircle } from 'lucide-react';

const QuizDetailsHeader = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{record.title}</h2>
            <p className="text-blue-700">{record.description || 'No description provided.'}</p>
        </div>
    );
};

const SettingsCard = ({ icon: Icon, label, value, color = "text-gray-700" }) => (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className={`p-2 rounded-full bg-white shadow-sm ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</div>
            <div className="font-bold text-gray-900">{value}</div>
        </div>
    </div>
);

const QuizSettings = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SettingsCard 
                icon={Clock} 
                label="Time Limit" 
                value={`${record.timeLimit} mins`} 
                color="text-blue-500"
            />
            <SettingsCard 
                icon={Target} 
                label="Pass Score" 
                value={`${record.passingScore}%`} 
                color="text-green-500"
            />
            <SettingsCard 
                icon={Layers} 
                label="Attempts" 
                value={record.maxAttempts} 
                color="text-orange-500"
            />
            <SettingsCard 
                icon={Shuffle} 
                label="Randomized" 
                value={record.isRandomized ? 'Yes' : 'No'} 
                color="text-purple-500"
            />
        </div>
    );
};

export const QuizShow = () => (
    <Show title="Quiz Details" emptyWhileLoading>
        <SimpleShowLayout className="p-6">
            <QuizDetailsHeader />
            
            <QuizSettings />

            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Labeled label="Type">
                            <ChipField source="quizType" className="capitalize" />
                        </Labeled>
                        <Labeled label="Difficulty">
                            <ChipField 
                                source="difficulty" 
                                className="capitalize"
                                sx={{
                                    '& .MuiChip-root': {
                                        backgroundColor: (record) => {
                                            if (record.difficulty === 'beginner') return '#10b981';
                                            if (record.difficulty === 'advanced') return '#ef4444';
                                            return '#f59e0b';
                                        },
                                        color: 'white'
                                    }
                                }}
                            />
                        </Labeled>
                        <Labeled label="Topic">
                            <ReferenceField source="topic.id" reference="topics" link="show" emptyText="-">
                                <TextField source="name" />
                            </ReferenceField>
                        </Labeled>
                        <Labeled label="Subject">
                            <ReferenceField source="subject.id" reference="subjects" link="show" emptyText="-">
                                <TextField source="name" />
                            </ReferenceField>
                        </Labeled>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Status</h3>
                    <div className="flex gap-4">
                        <Labeled label="Active">
                            <FunctionField render={r => (
                                <span className={`flex items-center gap-1 font-bold ${r.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {r.isActive ? <CheckCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {r.isActive ? 'Active' : 'Inactive'}
                                </span>
                            )} />
                        </Labeled>
                        <Labeled label="Review Allowed">
                            <FunctionField render={r => (
                                <span>{r.allowReview ? 'Yes' : 'No'}</span>
                            )} />
                        </Labeled>
                    </div>
                    <Labeled label="Created By">
                        <ReferenceField source="creator.id" reference="users" link={false}>
                            <TextField source="username" />
                        </ReferenceField>
                    </Labeled>
                    <Labeled label="Last Updated">
                        <DateField source="updatedAt" showTime />
                    </Labeled>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="font-bold text-lg border-b pb-2 mb-4">Questions</h3>
                <ReferenceArrayField source="questions" reference="questions">
                    <Datagrid bulkActionButtons={false} rowClick="show">
                        <TextField source="id" label="ID" width={50} />
                        <FunctionField 
                            label="Question" 
                            render={record => (
                                <div className="truncate max-w-md" title={record.questionText}>
                                    {record.questionText}
                                </div>
                            )} 
                        />
                        <ChipField source="questionType" label="Type" size="small" />
                        <ChipField 
                            source="difficulty" 
                            size="small"
                            sx={{
                                '& .MuiChip-root': {
                                    backgroundColor: (record) => {
                                        if (record.difficulty === 'easy') return '#10b981';
                                        if (record.difficulty === 'hard') return '#ef4444';
                                        return '#f59e0b';
                                    },
                                    color: 'white'
                                }
                            }}
                        />
                    </Datagrid>
                </ReferenceArrayField>
            </div>
        </SimpleShowLayout>
    </Show>
);
