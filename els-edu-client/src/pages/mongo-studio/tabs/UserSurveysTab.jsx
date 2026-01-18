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
        { value: "company", label: "Company" },
        { value: "self", label: "Self" },
      ],
    },
    {
      key: "company",
      label: "Company",
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



