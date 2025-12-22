import React from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  SelectArrayInput,
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
    <Edit
      {...props}
      transform={(data) => ({
        ...data,
        // Ensure assigned_roles includes the primary role
        assigned_roles: [
          ...new Map(
            [...(data.assigned_roles || []), { role: data.user_role }].map(
              (item) => [item.role, item]
            )
          ).values(),
        ],
      })}
    >
      <SimpleForm>
        <TextInput source="username" label="Username" disabled />
        <TextInput source="email" label="Email" type="email" />
        <SelectInput
          source="user_role"
          label="Primary Role"
          choices={roleChoices}
        />
        <SelectArrayInput
          source="assigned_roles"
          label="Assigned Roles"
          choices={roleChoices}
          format={(v) => (Array.isArray(v) ? v.map((i) => i.role) : [])}
          parse={(v) => v.map((role) => ({ role }))}
        />
      </SimpleForm>
    </Edit>
  );
};
