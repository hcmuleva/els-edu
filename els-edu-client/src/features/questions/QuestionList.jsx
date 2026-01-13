import React, { useState } from 'react';
import { 
    List, 
    Datagrid, 
    TextField, 
    DateField,
    EditButton,
    ShowButton,
    DeleteButton,
    FunctionField,
    ChipField,
    ReferenceField,
    TextInput,
    SelectInput
} from 'react-admin';
import CountListModal from '../../components/studio/CountListModal';

const questionFilters = [
    <TextInput key="search" source="q" label="Search" alwaysOn />,
    <SelectInput key="type" source="questionType" label="Type" choices={[
        { id: 'SC', name: 'Single Choice' },
        { id: 'MCQ', name: 'Multiple Choice' },
        { id: 'TF', name: 'True/False' },
    ]} />,
    <SelectInput key="difficulty" source="difficulty" choices={[
        { id: 'easy', name: 'Easy' },
        { id: 'medium', name: 'Medium' },
        { id: 'hard', name: 'Hard' },
    ]} />,
];

export const QuestionList = () => {
    const [activeCountTitle, setActiveCountTitle] = useState("");
    const [activeCountItems, setActiveCountItems] = useState([]);

    return (
        <>
            <List 
                filters={questionFilters}
                sort={{ field: 'createdAt', order: 'DESC' }}
                perPage={25}
                title="Your Library"
            >
                <Datagrid bulkActionButtons={false}>
                    <TextField source="id" label="ID" sortable={false} />
                    
                    <FunctionField 
                        label="Question" 
                        render={record => (
                            <div className="max-w-md truncate" title={record.questionText}>
                                {record.questionText || 'Untitled Question'}
                            </div>
                        )}
                    />
                    
                    <ChipField 
                        source="questionType" 
                        label="Type"
                        sx={{
                            '& .MuiChip-root': {
                                fontSize: '0.75rem',
                                height: '24px',
                            }
                        }}
                    />
                    
                    <ChipField 
                        source="difficulty" 
                        label="Difficulty"
                        sx={{
                            '& .MuiChip-root': {
                                fontSize: '0.75rem',
                                height: '24px',
                                backgroundColor: (record) => {
                                    if (record.difficulty === 'easy') return '#10b981';
                                    if (record.difficulty === 'hard') return '#ef4444';
                                    return '#f59e0b';
                                },
                                color: 'white'
                            }
                        }}
                    />
                    
                    <TextField source="points" label="Points" />
                    
                    <FunctionField 
                        label="Topics"
                        render={record => {
                            const topics = record.topics 
                                ? (Array.isArray(record.topics) ? record.topics : [record.topics])
                                : [];
                            const count = topics.length;
                            
                            return (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCountTitle(`Topics for Question #${record.id}`);
                                        setActiveCountItems(topics);
                                    }}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: count > 0 ? '#eef2ff' : '#f9fafb',
                                        border: count > 0 ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: count > 0 ? '#4f46e5' : '#9ca3af',
                                        cursor: count > 0 ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: count > 0 ? 1 : 0.6,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (count > 0) {
                                            e.target.style.backgroundColor = '#e0e7ff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (count > 0) {
                                            e.target.style.backgroundColor = '#eef2ff';
                                        }
                                    }}
                                    disabled={count === 0}
                                >
                                    {count} Topics
                                </button>
                            );
                        }}
                    />

                    <FunctionField 
                        label="Subjects"
                        render={record => {
                            const subjects = record.subjects 
                                ? (Array.isArray(record.subjects) ? record.subjects : [record.subjects])
                                : [];
                            const count = subjects.length;
                            
                            return (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCountTitle(`Subjects for Question #${record.id}`);
                                        setActiveCountItems(subjects);
                                    }}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: count > 0 ? '#f9fafb' : '#f9fafb',
                                        border: count > 0 ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: count > 0 ? '#374151' : '#9ca3af',
                                        cursor: count > 0 ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: count > 0 ? 1 : 0.6,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (count > 0) {
                                            e.target.style.backgroundColor = '#f3f4f6';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (count > 0) {
                                            e.target.style.backgroundColor = '#f9fafb';
                                        }
                                    }}
                                    disabled={count === 0}
                                >
                                    {count} Subjects
                                </button>
                            );
                        }}
                    />
                    
                    <DateField source="createdAt" label="Created" showTime />
                    
                    <ShowButton />
                    <EditButton />
                    <DeleteButton />
                </Datagrid>
            </List>

            {activeCountItems.length > 0 && (
                <CountListModal
                    isOpen={activeCountItems.length > 0}
                    title={activeCountTitle}
                    items={activeCountItems}
                    nameField="name"
                    onClose={() => {
                        setActiveCountItems([]);
                        setActiveCountTitle("");
                    }}
                />
            )}
        </>
    );
};
