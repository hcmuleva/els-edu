
import React from 'react';
import { List, Datagrid, TextField, DateField } from 'react-admin';

export const QuestionList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="question_text" label="Question" />
            <TextField source="type" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);
