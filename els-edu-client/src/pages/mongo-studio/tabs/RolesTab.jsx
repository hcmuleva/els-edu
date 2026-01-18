import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const RolesTab = () => {
  const fields = [
    {
      key: "name",
      label: "Role Name",
      type: "string",
      required: true,
    },
    {
      key: "company",
      label: "Company",
      type: "mongoRelation",
      relationCollection: "companies",
      labelField: "name",
      valueField: "name", // Store company name as string, not ObjectId
      required: true,
    },
    {
      key: "domain",
      label: "Domain",
      type: "mongoRelation",
      relationCollection: "domains",
      labelField: "name",
      valueField: "name", // Store domain name as string, not ObjectId
      required: true,
    },
    {
      key: "requiredSkills",
      label: "Required Skills",
      type: "array",
      selectorType: "mongoSkills", // Use MongoDB skills multi-select
      relationCollection: "skills",
      labelField: "name",
      valueField: "name", // Store skill name as string
      required: false,
    },
  ];

  return (
    <BaseMongoTab
      collection="roles"
      fields={fields}
      title="Role"
      searchFields={["name", "company", "domain"]}
    />
  );
};

export default RolesTab;


