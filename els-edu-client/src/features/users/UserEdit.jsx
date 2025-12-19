import React from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
} from "react-admin";

const roleChoices = [
  { id: "STUDENT", name: "Student" },
  { id: "TEACHER", name: "Teacher" },
  { id: "PARENT", name: "Parent" },
  { id: "MARKETING", name: "Marketing" },
  { id: "ADMIN", name: "Admin" },
  { id: "SUPERADMIN", name: "Super Admin" },
];

export const UserEdit = (props) => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput source="username" label="Username" disabled />
        <TextInput source="email" label="Email" type="email" />
        <SelectInput
          source="user_role"
          label="Role"
          choices={roleChoices}
        />
      </SimpleForm>
    </Edit>
  );
};



