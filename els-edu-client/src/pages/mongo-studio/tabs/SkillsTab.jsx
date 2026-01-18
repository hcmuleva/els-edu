import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const SkillsTab = () => {
  const fields = [
    {
      key: "name",
      label: "Skill Name",
      type: "string",
      required: true,
    },
    {
      key: "category",
      label: "Category",
      type: "mongoRelation",
      relationCollection: "domains",
      labelField: "name",
      valueField: "name", // Store domain name as string, not ObjectId
      required: false,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
    {
      key: "subjectDocumentIds",
      label: "Subjects",
      type: "array",
      selectorType: "subjects", // Use subject selector dropdown
      required: false,
    },
    {
      key: "topicDocumentIds",
      label: "Topics",
      type: "array",
      selectorType: "topics", // Use topic selector dropdown
      required: false,
    },
  ];

  return (
    <BaseMongoTab
      collection="skills"
      fields={fields}
      title="Skill"
      searchFields={["name", "description"]}
    />
  );
};

export default SkillsTab;

