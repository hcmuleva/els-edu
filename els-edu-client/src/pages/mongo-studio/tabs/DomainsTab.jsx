import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const DomainsTab = () => {
  const fields = [
    {
      key: "name",
      label: "Domain Name",
      type: "string",
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
  ];

  return (
    <BaseMongoTab
      collection="domains"
      fields={fields}
      title="Domain"
      searchFields={["name", "description"]}
    />
  );
};

export default DomainsTab;



