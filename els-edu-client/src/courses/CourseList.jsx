
import React from 'react';
import { List, Datagrid, TextField, DateField } from 'react-admin';

export const CourseList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" label="Course Title" />
            <TextField source="level" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);
