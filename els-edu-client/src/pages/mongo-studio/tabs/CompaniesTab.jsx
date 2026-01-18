import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const CompaniesTab = () => {
  const fields = [
    {
      key: "name",
      label: "Company Name",
      type: "string",
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
      key: "logo",
      label: "Logo URL",
      type: "string",
    },
  ];

  return (
    <BaseMongoTab
      collection="companies"
      fields={fields}
      title="Company"
      searchFields={["name", "domain"]}
    />
  );
};

export default CompaniesTab;


