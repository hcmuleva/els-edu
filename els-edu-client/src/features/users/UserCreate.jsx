import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  PasswordInput,
} from "react-admin";

const roleChoices = [
  { id: "STUDENT", name: "Student" },
  { id: "TEACHER", name: "Teacher" },
  { id: "PARENT", name: "Parent" },
  { id: "MARKETING", name: "Marketing" },
  { id: "ADMIN", name: "Admin" },
  { id: "SUPERADMIN", name: "Super Admin" },
];

export const UserCreate = (props) => {
  const transform = (data) => {
    // Default Strapi users-permissions role id (e.g. "Authenticated").
    // Update this if your Authenticated role has a different id.
    const DEFAULT_ROLE_ID = 1;

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const orgId =
      storedUser?.org?.id ||
      storedUser?.org ||
      storedUser?.organization?.id ||
      storedUser?.organization;

    return {
      ...data,
      ...(orgId && { org: orgId }),
      role: DEFAULT_ROLE_ID,
    };
  };

  return (
    <Create {...props} transform={transform}>
      <SimpleForm>
        <TextInput source="username" label="Username" required />
        <TextInput source="email" label="Email" type="email" required />
        <PasswordInput source="password" label="Password" required />
        {/* Profile fields you mentioned; these map to user schema attributes */}
        <SelectInput
          source="gender"
          label="Gender"
          choices={[
            { id: "MALE", name: "Male" },
            { id: "FEMALE", name: "Female" },
          ]}
        />
        <TextInput source="age" label="Age" type="number" />
        <SelectInput
          source="user_experience_level"
          label="Grade / Experience"
          choices={[
            { id: "SCHOOL", name: "School" },
            { id: "COLLEGE", name: "College" },
            { id: "PROFESSIONAL", name: "Professional" },
          ]}
        />
        <SelectInput
          source="user_role"
          label="Role"
          choices={roleChoices}
          required
        />
      </SimpleForm>
    </Create>
  );
};


