import React from 'react';
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

export const QuestionList = () => (
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
            
            <ReferenceField 
                source="topicRef" 
                reference="topics" 
                label="Topic"
                link={false}
                emptyText="-"
            >
                <TextField source="name" />
            </ReferenceField>
            
            <DateField source="createdAt" label="Created" showTime />
            
            <ShowButton />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);
