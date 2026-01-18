import React, { useState } from "react";
import {
  ListBase,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Pagination,
  Title,
  useListContext,
  FunctionField,
} from "react-admin";
import UserCharts from "./UserCharts";
import { cn } from "../../lib/utils";
import CountListModal from "../../components/studio/CountListModal";

const UserListContent = () => {
  const { data } = useListContext();
  const [activeCountTitle, setActiveCountTitle] = useState("");
  const [activeCountItems, setActiveCountItems] = useState([]);

  return (
    <>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <UserCharts />

        <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                All Employees
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all your team members in one place
              </p>
            </div>
          </div>
          <Datagrid
            bulkActionButtons={false}
            rowClick="edit"
            sx={{
              "& .RaDatagrid-headerCell": {
                backgroundColor: "#f8fafc",
                color: "#64748b",
                fontWeight: "600",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                padding: "16px",
                borderBottom: "1px solid #e2e8f0",
              },
              "& .RaDatagrid-row": {
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "#f8fafc",
                },
              },
              "& .RaDatagrid-rowCell": {
                padding: "16px",
                borderBottom: "1px solid #f1f5f9",
              },
            }}
          >
            <TextField
              source="username"
              label="Employee Name"
              fontWeight="bold"
            />
            <EmailField source="email" />
            <TextField source="role.name" label="Role" />
            <FunctionField
              label="Courses"
              render={(record) => {
                // Extract courses from usersubscriptions
                const userSubs = record.usersubscriptions || [];
                const courses = userSubs
                  .map((sub) => sub.course)
                  .filter(Boolean);
                const count = courses.length;

                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (count > 0) {
                        setActiveCountTitle(`Courses for ${record.username}`);
                        setActiveCountItems(courses);
                      }
                    }}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: count > 0 ? "#eef2ff" : "#f9fafb",
                      border:
                        count > 0 ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: count > 0 ? "#4f46e5" : "#9ca3af",
                      cursor: count > 0 ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      opacity: count > 0 ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => {
                      if (count > 0) {
                        e.target.style.backgroundColor = "#e0e7ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (count > 0) {
                        e.target.style.backgroundColor = "#eef2ff";
                      }
                    }}
                    disabled={count === 0}
                  >
                    {count} Courses
                  </button>
                );
              }}
            />
            <FunctionField
              label="Status"
              render={(record) => (
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold border",
                    record.blocked
                      ? "bg-red-50 text-red-700 border-red-200"
                      : record.confirmed
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200",
                  )}
                >
                  {record.blocked
                    ? "BLOCKED"
                    : record.confirmed
                    ? "ACTIVE"
                    : "PENDING"}
                </span>
              )}
            />
            <DateField source="createdAt" label="Joined" />
          </Datagrid>
          <Pagination rowsPerPageOptions={[10, 25, 50]} className="p-4" />
        </div>
      </div>

      {activeCountItems.length > 0 && (
        <CountListModal
          isOpen={activeCountItems.length > 0}
          title={activeCountTitle}
          items={activeCountItems}
          nameField="name"
          onClose={() => {
            setActiveCountItems([]);
            setActiveCountTitle("");
          }}
        />
      )}
    </>
  );
};

export const UserList = () => (
  <ListBase perPage={100} sort={{ field: "createdAt", order: "DESC" }}>
    <Title title="Generic HR Dashboard" />
    <UserListContent />
  </ListBase>
);
