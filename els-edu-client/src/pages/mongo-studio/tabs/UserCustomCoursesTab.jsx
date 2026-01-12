import React from "react";
import BaseMongoTab from "./BaseMongoTab";

const UserCustomCoursesTab = () => {
  const fields = [
    {
      key: "userDocumentId",
      label: "User Document ID",
      type: "string",
      required: true,
    },
    {
      key: "name",
      label: "Course Name",
      type: "string",
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        "KIDS",
        "PRIMARY",
        "MIDDLE",
        "SCHOOL",
        "COLLEGE",
        "OLDAGE",
        "SANSKAR",
        "COMPETION",
        "PROJECT",
        "DIY",
        "EDUCATION",
      ],
    },
    {
      key: "subcategory",
      label: "Subcategory",
      type: "select",
      options: [
        "CREATIVITY",
        "COMPETION",
        "ACADEMIC",
        "ELECTROICS",
        "SOFTWARE",
        "DHARM",
        "SIKSHA",
        "GYAN",
        "SOCH",
      ],
    },
    {
      key: "subjectDocumentIds",
      label: "Subjects",
      type: "array",
      selectorType: "subjects", // Use subject selector dropdown
      required: false,
    },
    {
      key: "cover",
      label: "Cover URL",
      type: "string",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["ACTIVE", "INACTIVE", "COMPLETED", "PAUSED"],
    },
    {
      key: "progress",
      label: "Progress (%)",
      type: "number",
      min: 0,
      max: 100,
    },
  ];

  return (
    <BaseMongoTab
      collection="userCustomCourses"
      fields={fields}
      title="Custom Course"
      searchFields={["name", "description"]}
    />
  );
};

export default UserCustomCoursesTab;

