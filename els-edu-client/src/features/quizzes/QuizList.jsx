import React from "react";
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
  SelectInput,
  useRecordContext,
} from "react-admin";
import { Sparkles, Clock, Target, Layers } from "lucide-react";
import { CustomAsyncSelect } from "../../components/common/CustomAsyncSelect"; // Assuming we can use this in filters or use ReferenceInput

// Custom filter components need to be compatible with react-admin filters
// For simplicity and compatibility, we'll use standard inputs for now or wrap custom ones if needed.
// React Admin filters expect standard inputs.

const quizFilters = [
  <TextInput key="search" source="q" label="Search" alwaysOn />,
  <SelectInput
    key="type"
    source="quizType"
    label="Type"
    choices={[
      { id: "standalone", name: "Standalone Quiz" },
      { id: "kit", name: "Kit Assessment" },
      { id: "level", name: "Level Check" },
      { id: "lesson", name: "Lesson Review" },
    ]}
  />,
  <SelectInput
    key="difficulty"
    source="difficulty"
    choices={[
      { id: "beginner", name: "Beginner" },
      { id: "intermediate", name: "Intermediate" },
      { id: "advanced", name: "Advanced" },
    ]}
  />,
  // For relations like Subject/Topic in filters, we typically use ReferenceInput
  // or we can implement the custom async select if it supports the filter interface (taking source/resource)
];

const QuizStats = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <div className="flex gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1" title="Time Limit">
        <Clock className="w-3 h-3" /> {record.timeLimit}m
      </span>
      <span className="flex items-center gap-1" title="Passing Score">
        <Target className="w-3 h-3" /> {record.passingScore}%
      </span>
      <span className="flex items-center gap-1" title="Question Count">
        <Layers className="w-3 h-3" /> {record.questions?.length || 0}
      </span>
    </div>
  );
};

export const QuizList = () => (
  <List
    filters={quizFilters}
    sort={{ field: "createdAt", order: "DESC" }}
    perPage={25}
    title="Quizzes"
    empty={false} // Handle empty state if needed, or let RA handle it
  >
    <Datagrid bulkActionButtons={false} rowClick="show">
      <TextField source="id" label="ID" sortable={false} />

      <FunctionField
        label="Quiz"
        render={(record) => (
          <div>
            <div className="font-bold text-foreground">
              {record.title || "Untitled Quiz"}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-xs">
              {record.description}
            </div>
          </div>
        )}
      />

      <ChipField
        source="quizType"
        label="Type"
        sx={{
          "& .MuiChip-root": {
            fontSize: "0.75rem",
            height: "24px",
            textTransform: "capitalize",
          },
        }}
      />

      <ChipField
        source="difficulty"
        label="Difficulty"
        sx={{
          "& .MuiChip-root": {
            fontSize: "0.75rem",
            height: "24px",
            backgroundColor: (record) => {
              if (record.difficulty === "beginner") return "#10b981";
              if (record.difficulty === "advanced") return "#ef4444";
              return "#f59e0b";
            },
            color: "white",
            textTransform: "capitalize",
          },
        }}
      />

      <ReferenceField
        source="topics.id"
        reference="topics"
        label="Topic"
        link={false}
        emptyText="-"
      >
        <TextField source="name" />
      </ReferenceField>

      <ReferenceField
        source="subjects.id"
        reference="subjects"
        label="Subject"
        link={false}
        emptyText="-"
      >
        <TextField source="name" />
      </ReferenceField>

      <FunctionField label="Stats" render={() => <QuizStats />} />

      <DateField source="createdAt" label="Created" showTime />

      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);
