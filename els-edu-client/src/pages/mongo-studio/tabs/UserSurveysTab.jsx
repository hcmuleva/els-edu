import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const UserSurveysTab = () => {
  const fields = [
    {
      key: "userDocumentId",
      label: "User Document ID",
      type: "string",
      required: true,
    },
    {
      key: "surveyType",
      label: "Survey Type",
      type: "select",
      required: true,
      options: [
        { value: "school", label: "School" },
        { value: "college", label: "College" },
        { value: "professional", label: "Professional" },
        { value: "company", label: "Company (Legacy)" },
        { value: "self", label: "Self (Legacy)" },
      ],
    },
    {
      key: "academicCategories",
      label: "Academic Categories (School)",
      type: "array",
      itemFields: [
        {
          key: "category",
          label: "Category",
          type: "string",
        },
      ],
    },
    {
      key: "learningPaths",
      label: "Learning Paths (College)",
      type: "array",
      itemFields: [
        {
          key: "path",
          label: "Path",
          type: "string",
        },
      ],
    },
    {
      key: "company",
      label: "Company (Professional)",
      type: "string",
    },
    {
      key: "domain",
      label: "Domain",
      type: "string",
    },
    {
      key: "role",
      label: "Role",
      type: "string",
    },
    {
      key: "subjects",
      label: "Subjects (School)",
      type: "array",
      itemFields: [
        {
          key: "subjectName",
          label: "Subject Name",
          type: "string",
        },
        {
          key: "category",
          label: "Category",
          type: "string",
        },
        {
          key: "selfRating",
          label: "Self Rating (1-5)",
          type: "number",
        },
      ],
    },
    {
      key: "skills",
      label: "Skills",
      type: "array",
      itemFields: [
        {
          key: "skillName",
          label: "Skill Name",
          type: "string",
        },
        {
          key: "learningPath",
          label: "Learning Path",
          type: "string",
        },
        {
          key: "selfRating",
          label: "Self Rating (1-5)",
          type: "number",
        },
      ],
    },
  ];

  return (
    <BaseMongoTab
      collection="usersurveys"
      fields={fields}
      title="User Survey"
      searchFields={["company", "role", "domain"]}
    />
  );
};

export default UserSurveysTab;
