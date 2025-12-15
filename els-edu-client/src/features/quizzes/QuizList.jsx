
import React from 'react';
import { List, Datagrid, TextField, DateField } from 'react-admin';

export const QuizList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" label="Title" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);
