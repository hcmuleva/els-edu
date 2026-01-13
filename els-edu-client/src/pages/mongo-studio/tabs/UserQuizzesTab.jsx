import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const UserQuizzesTab = () => {
  const fields = [
    {
      key: "userDocumentId",
      label: "User Document ID",
      type: "string",
      required: true,
    },
    {
      key: "company",
      label: "Company",
      type: "string",
    },
    {
      key: "role",
      label: "Role",
      type: "string",
    },
    {
      key: "domain",
      label: "Domain",
      type: "string",
    },
    {
      key: "skillResults",
      label: "Skill Results",
      type: "array",
      itemFields: [
        {
          key: "skillName",
          label: "Skill Name",
          type: "string",
        },
        {
          key: "questionsAttempted",
          label: "Questions Attempted",
          type: "number",
        },
        {
          key: "correctAnswers",
          label: "Correct Answers",
          type: "number",
        },
        {
          key: "percentage",
          label: "Percentage",
          type: "number",
        },
        {
          key: "actualLevel",
          label: "Actual Level",
          type: "number",
        },
      ],
    },
    {
      key: "totalQuestions",
      label: "Total Questions",
      type: "number",
    },
    {
      key: "totalCorrect",
      label: "Total Correct",
      type: "number",
    },
    {
      key: "overallPercentage",
      label: "Overall Percentage",
      type: "number",
    },
  ];

  return (
    <BaseMongoTab
      collection="userquizzes"
      fields={fields}
      title="User Quiz"
      searchFields={["company", "role", "domain"]}
    />
  );
};

export default UserQuizzesTab;



