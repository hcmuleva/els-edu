import React from 'react';
import {
    Create,
    SimpleForm,
    TextInput,
    SelectInput,
    required,
    Title
} from 'react-admin';

export const CourseCreate = () => (
    <div className="p-6">
        <Title title="Create Course" />
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-foreground font-heading">New Course</h1>
                <p className="text-muted-foreground mt-2">Create a comprehensive learning path</p>
            </div>
            
            <Create>
                <SimpleForm className="bg-card rounded-3xl border border-border/50 shadow-sm p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Course Name */}
                        <div className="md:col-span-2">
                            <TextInput
                                source="name"
                                label="Course Name"
                                fullWidth
                                validate={required()}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: '12px',
                                        fontFamily: 'inherit',
                                    }
                                }}
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <TextInput
                                source="description"
                                label="Description"
                                multiline
                                rows={4}
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: '12px',
                                        fontFamily: 'inherit',
                                    }
                                }}
                            />
                        </div>

                        {/* Category */}
                        <TextInput
                            source="category"
                            label="Category"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontFamily: 'inherit',
                                }
                            }}
                        />

                        {/* Subcategory */}
                        <TextInput
                            source="subcategory"
                            label="Subcategory"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontFamily: 'inherit',
                                }
                            }}
                        />

                        {/* Condition */}
                        <SelectInput
                            source="condition"
                            label="Status"
                            choices={[
                                { id: 'DRAFT', name: 'Draft' },
                                { id: 'REVIEW', name: 'In Review' },
                                { id: 'REJECT', name: 'Rejected' },
                                { id: 'APPROVED', name: 'Approved' },
                                { id: 'PUBLISH', name: 'Published' },
                                { id: 'RETIRED', name: 'Retired' }
                            ]}
                            defaultValue="DRAFT"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontFamily: 'inherit',
                                }
                            }}
                        />

                        {/* Privacy */}
                        <SelectInput
                            source="privacy"
                            label="Privacy"
                            choices={[
                                { id: 'PUBLIC', name: 'Public' },
                                { id: 'PRIVATE', name: 'Private' },
                                { id: 'ORG', name: 'Organization' },
                                { id: 'OPEN', name: 'Open' }
                            ]}
                            defaultValue="PRIVATE"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontFamily: 'inherit',
                                }
                            }}
                        />

                        {/* Visibility */}
                        <SelectInput
                            source="visibility"
                            label="Visibility"
                            choices={[
                                { id: 'GLOBAL', name: 'Global' },
                                { id: 'ORG', name: 'Organization' },
                                { id: 'OTHER', name: 'Other' }
                            ]}
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '12px',
                                    fontFamily: 'inherit',
                                }
                            }}
                        />
                    </div>
                </SimpleForm>
            </Create>
        </div>
    </div>
);
